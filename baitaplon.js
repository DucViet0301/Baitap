
CREATE DATABASE TEST3;

-- I. Tạo bảng
-- 1. Bảng khách hàng
CREATE TABLE dbo.Customer (
    CustomerId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    Email NVARCHAR(200) NULL,
    Phone NVARCHAR(50) NULL,
    Address NVARCHAR(500) NULL,
    CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    IsActive BIT NOT NULL DEFAULT (1)
);
-- 2. Bảng khảo sát
CREATE TABLE dbo.Survey (
    SurveyId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(300) NOT NULL,             -- Tiêu đề
    Description NVARCHAR(MAX) NULL,           -- Mô tả
    StartDate DATE NULL,                      -- Ngày bắt đầu
    EndDate DATE NULL,                        -- Ngày kết thúc
    IsActive BIT NOT NULL DEFAULT (1),        -- Đang hoạt động?
    CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
-- 3. Bảng câu hỏi
CREATE TABLE dbo.Question (
    QuestionId INT IDENTITY(1,1) PRIMARY KEY,
    SurveyId INT NOT NULL,                     -- FK -> Survey
    Content NVARCHAR(1000) NOT NULL,           -- Nội dung câu hỏi
    QuestionType NVARCHAR(20) NOT NULL,        -- 'CHOICE' | 'TEXT' | 'YESNO' | 'RATING'
    IsRequired BIT NOT NULL DEFAULT (0),       -- Bắt buộc trả lời?
    CONSTRAINT FK_Question_Survey FOREIGN KEY (SurveyId) 
        REFERENCES dbo.Survey(SurveyId)
);
-- 4. Bảng lựa chọn
CREATE TABLE dbo.Choice (
    ChoiceId INT IDENTITY(1,1) PRIMARY KEY,
    QuestionId INT NOT NULL,                   -- FK -> Question
    ChoiceText NVARCHAR(500) NOT NULL,         -- Nội dung lựa chọn
    Value DECIMAL(5,2) NULL,                   -- Hỗ trợ giá trị số, ví dụ: 1.00, 4.50, 10.00
    SortOrder INT NOT NULL DEFAULT (0),
    CONSTRAINT FK_Choice_Question FOREIGN KEY (QuestionId) 
        REFERENCES dbo.Question(QuestionId)
);
-- 5. Bảng phiếu trả lời
CREATE TABLE dbo.SurveyResponse (
    ResponseId INT IDENTITY(1,1) PRIMARY KEY,
    SurveyId INT NOT NULL,
    CustomerId INT NOT NULL,
    RespondedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Response_Survey FOREIGN KEY (SurveyId) 
        REFERENCES dbo.Survey(SurveyId),
    CONSTRAINT FK_Response_Customer FOREIGN KEY (CustomerId) 
        REFERENCES dbo.Customer(CustomerId)
);
-- 6. Bảng câu trả lời chi tiết
CREATE TABLE dbo.SurveyAnswer (
    AnswerId INT IDENTITY(1,1) PRIMARY KEY,
    ResponseId INT NOT NULL,                   -- FK -> SurveyResponse
    QuestionId INT NOT NULL,                   -- FK -> Question
    ChoiceId INT NULL,                         -- Nếu chọn từ bảng Choice
    TextAnswer NVARCHAR(MAX) NULL,             -- Nếu trả lời tự do
    CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Answer_Response FOREIGN KEY (ResponseId) 
        REFERENCES dbo.SurveyResponse(ResponseId) ON DELETE CASCADE,
    CONSTRAINT FK_Answer_Question FOREIGN KEY (QuestionId) 
        REFERENCES dbo.Question(QuestionId),
    CONSTRAINT FK_Answer_Choice FOREIGN KEY (ChoiceId) 
        REFERENCES dbo.Choice(ChoiceId)
);

-- II. Stored Procedure 
GO
-- Tạo proc lấy ra tổng số người đã tham gia khảo sát 
CREATE PROC SpThongKeSoNguoiThamGia
AS
    SELECT COUNT(DISTINCT CustomerId) AS N'Số người đã tham gia khảo sát' FROM SurveyResponse

GO

-- Tạo proc lấy ra các khảo sát vẫn đang còn hoạt động
CREATE PROC SpKhaoSatDangHoatDong
AS
    SELECT * FROM Survey WHERE IsActive = 1

GO

--- Bảng dùng để nhận câu trả lời từ hệ thống

CREATE TYPE AnswerTable AS TABLE 
(
    QuestionId INT NOT NULL,
    ChoiceId INT NULL,
    TextAnswer NVARCHAR(MAX) NULL
)

GO
-- Tạo proc với transaction khi người tham gia nạp khảo sát
CREATE PROC SpNapKhaoSat
    @SurveyID int,
    @CustomerID int,
    @Answers AnswerTable READONLY
AS
BEGIN TRY
 BEGIN TRAN

    DECLARE @ResponseId INT

-- Kiểm tra xem có câu hỏi nào bắt buộc trả lời nhưng chưa trả lời hay không
    IF EXISTS(
    SELECT 1 FROM @Answers a RIGHT JOIN dbo.Question q ON a.QuestionId = q.QuestionId 
    WHERE q.SurveyId = @SurveyID AND q.IsRequired = 1 
    AND a.ChoiceId IS NULL AND a.TextAnswer IS NULL
)
BEGIN
    ROLLBACK TRAN;
    RAISERROR(N'Có câu hỏi bắt buộc chưa được trả lời', 16, 1) ;
END
    INSERT INTO SurveyResponse(SurveyId, CustomerId) 
    VALUES(@SurveyID, @CustomerID)

    SET @ResponseId = SCOPE_IDENTITY()

-- Insert vào bảng survey answer các câu trả lời mà người tham gia khảo sát đã trả lời
    INSERT INTO SurveyAnswer(ResponseId, QuestionId, ChoiceId, TextAnswer)
    SELECT @ResponseId, QuestionID, ChoiceID, TextAnswer FROM @Answers

    COMMIT TRAN
END TRY
    
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;
        THROW;
END CATCH
GO

DECLARE @Answers AnswerTable;

INSERT INTO @Answers (QuestionId, ChoiceId, TextAnswer)
VALUES 
(1, 1, null),
(4, 1, 1),
(5, 1, 1),
(6, 1, 1),
(7, 1, 1),
(8, 1, 1),
(9, 1, 1),
(10, 1, 1),
(11, 1, 1);

-- Gọi thủ tục nạp khảo sát
EXEC dbo.SpNapKhaoSat 
    @SurveyID = 1, 
    @CustomerID = 1, 
    @Answers = @Answers;
GO
-- 1 .SpThemKhachHang: thêm khách hàng mới.
CREATE PROCEDURE dbo.SpThemKhachHang
    @FullName NVARCHAR(200),
    @Email NVARCHAR(200) = NULL,
    @Phone NVARCHAR(50) = NULL,
    @Address NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra email trùng (nếu có nhập)
    IF (@Email IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Customer WHERE Email = @Email))
    BEGIN
        RAISERROR(N'Email đã tồn tại trong hệ thống.', 16, 1);
        RETURN;
    END;

    -- Kiểm tra số điện thoại trùng (nếu có nhập)
    IF (@Phone IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Customer WHERE Phone = @Phone))
    BEGIN
        RAISERROR(N'Số điện thoại đã tồn tại trong hệ thống.', 16, 1);
        RETURN;
    END;

    -- Thêm khách hàng mới
    INSERT INTO dbo.Customer (FullName, Email, Phone, Address)
    VALUES (@FullName, @Email, @Phone, @Address);

    -- Trả về ID của khách hàng vừa thêm
    SELECT SCOPE_IDENTITY() AS NewCustomerId;
END;
EXEC dbo.SpThemKhachHang 
    @FullName = N'Nguyễn Văn A',
    @Email = N'vana@example.com',
    @Phone = N'0912345679',
    @Address = N'Hà Nội';
GO
-- 2. SpThemKhaoSat: tạo khảo sát mới (tiêu đề, mô tả, ngày bắt đầu, ngày kết thúc, trạng thái).
CREATE PROCEDURE dbo.SpThemKhaoSat
    @Title NVARCHAR(300),
    @Description NVARCHAR(MAX) = NULL,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Kiểm tra ngày tháng hợp lệ (nếu nhập cả 2)
        IF (@StartDate IS NOT NULL AND @EndDate IS NOT NULL AND @EndDate < @StartDate)
        BEGIN
            RAISERROR(N'Ngày kết thúc không được nhỏ hơn ngày bắt đầu.', 16, 1);
            RETURN;
        END;

        -- Thêm khảo sát mới
        INSERT INTO dbo.Survey (Title, Description, StartDate, EndDate, IsActive)
        VALUES (@Title, @Description, @StartDate, @EndDate, @IsActive);

        -- Trả về SurveyId vừa thêm
        SELECT SCOPE_IDENTITY() AS NewSurveyId;
    END TRY
    BEGIN CATCH
        -- Xử lý lỗi
        DECLARE @ErrMsg NVARCHAR(4000), @ErrSeverity INT;
        SELECT @ErrMsg = ERROR_MESSAGE(), @ErrSeverity = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSeverity, 1);
    END CATCH
END;
EXEC dbo.SpThemKhaoSat 
    @Title = N'Khảo sát mức độ hài lòng dịch vụ',
    @Description = N'Khảo sát ý kiến khách hàng về dịch vụ hỗ trợ.',
    @StartDate = '2025-10-01',
    @EndDate = '2025-10-18',
    @IsActive = 1;
GO
-- 3. SpThemCauHoi: thêm câu hỏi vào khảo sát (kèm loại câu hỏi).
CREATE PROCEDURE dbo.SpThemCauHoi
    @SurveyId INT,
    @Content NVARCHAR(1000),
    @QuestionType NVARCHAR(20),   -- 'CHOICE' | 'TEXT' | 'YESNO' | 'RATING'
    @IsRequired BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Kiểm tra khảo sát có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM dbo.Survey WHERE SurveyId = @SurveyId)
        BEGIN
            RAISERROR(N'Khảo sát không tồn tại.', 16, 1);
            RETURN;
        END;

        -- Kiểm tra loại câu hỏi hợp lệ
        IF @QuestionType NOT IN ('CHOICE', 'TEXT', 'YESNO', 'RATING')
        BEGIN
            RAISERROR(N'Loại câu hỏi không hợp lệ. Chỉ chấp nhận: CHOICE, TEXT, YESNO, RATING.', 16, 1);
            RETURN;
        END;

        -- Thêm câu hỏi
        INSERT INTO dbo.Question (SurveyId, Content, QuestionType, IsRequired)
        VALUES (@SurveyId, @Content, @QuestionType, @IsRequired);

        -- Trả về QuestionId vừa thêm
        SELECT SCOPE_IDENTITY() AS NewQuestionId;
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000), @ErrSeverity INT;
        SELECT @ErrMsg = ERROR_MESSAGE(), @ErrSeverity = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSeverity, 1);
    END CATCH
END;
EXEC dbo.SpThemCauHoi
    @SurveyId = 1,
    @Content = N'Bạn có hài lòng với dịch vụ của chúng tôi không?',
    @QuestionType = 'YESNO',
    @IsRequired = 1;
GO
-- 4.SpThemLuaChon: thêm lựa chọn cho một câu hỏi.
CREATE PROCEDURE dbo.SpThemLuaChon
    @QuestionId INT,
    @ChoiceText NVARCHAR(500),
    @Value DECIMAL(5,2) = NULL,   -- Có thể dùng cho rating hoặc thang điểm
    @SortOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Kiểm tra câu hỏi có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM dbo.Question WHERE QuestionId = @QuestionId)
        BEGIN
            RAISERROR(N'Câu hỏi không tồn tại.', 16, 1);
            RETURN;
        END;

        -- Kiểm tra loại câu hỏi có cho phép lựa chọn không
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.Question 
            WHERE QuestionId = @QuestionId 
              AND QuestionType IN ('CHOICE', 'RATING')
        )
        BEGIN
            RAISERROR(N'Chỉ được thêm lựa chọn cho câu hỏi loại CHOICE hoặc RATING.', 16, 1);
            RETURN;
        END;

        -- Thêm lựa chọn mới
        INSERT INTO dbo.Choice (QuestionId, ChoiceText, Value, SortOrder)
        VALUES (@QuestionId, @ChoiceText, @Value, @SortOrder);

        -- Trả về ChoiceId vừa thêm
        SELECT SCOPE_IDENTITY() AS NewChoiceId;
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000), @ErrSeverity INT;
        SELECT @ErrMsg = ERROR_MESSAGE(), @ErrSeverity = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSeverity, 1);
    END CATCH
END;
EXEC dbo.SpThemLuaChon
    @QuestionId = 5,
    @ChoiceText = N'Không',
    @Value = 0,
    @SortOrder = 2;
GO
-- 5. SpTraLoiKhaoSat: lưu phiếu trả lời của khách hàng (tự động insert vào PhieuTraLoi và ChiTietTraLoi).
CREATE PROCEDURE dbo.SpTraLoiKhaoSat
    @SurveyId INT,
    @CustomerId INT,
    @Answers NVARCHAR(MAX)   -- JSON chứa danh sách câu trả lời
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra survey tồn tại
        IF NOT EXISTS (SELECT 1 FROM dbo.Survey WHERE SurveyId = @SurveyId)
        BEGIN
            RAISERROR(N'Khảo sát không tồn tại.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Kiểm tra khách hàng tồn tại
        IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE CustomerId = @CustomerId)
        BEGIN
            RAISERROR(N'Khách hàng không tồn tại.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Thêm phiếu trả lời (SurveyResponse)
        INSERT INTO dbo.SurveyResponse (SurveyId, CustomerId)
        VALUES (@SurveyId, @CustomerId);

        DECLARE @NewResponseId INT = SCOPE_IDENTITY();

        -- Insert chi tiết câu trả lời từ JSON
        INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer)
        SELECT 
            @NewResponseId,
            Answer.QuestionId,
            Answer.ChoiceId,
            Answer.TextAnswer
        FROM OPENJSON(@Answers)
        WITH (
            QuestionId INT,
            ChoiceId INT ,
            TextAnswer NVARCHAR(MAX) 
        ) AS Answer;

        COMMIT TRANSACTION;

        -- Trả về ResponseId
        SELECT @NewResponseId AS NewResponseId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000), @ErrSeverity INT;
        SELECT @ErrMsg = ERROR_MESSAGE(), @ErrSeverity = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSeverity, 1);
    END CATCH
END;
DECLARE @json NVARCHAR(MAX) = N'
[
  { "QuestionId": 5, "ChoiceId": 1, "TextAnswer": null },
  { "QuestionId": 1, "ChoiceId": null, "TextAnswer": "Nguyễn Văn B" }
]';

EXEC dbo.SpTraLoiKhaoSat
    @SurveyId = 1,
    @CustomerId = 1,
    @Answers = @json;
GO
-- 6.SpCapNhatTrangThaiKhaoSat: cập nhật trạng thái (active, closed).
CREATE PROCEDURE dbo.SpCapNhatTrangThaiKhaoSat
    @SurveyId INT,
    @IsActive BIT   -- 1 = Đang hoạt động, 0 = Đóng/Ngừng
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Kiểm tra khảo sát có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM dbo.Survey WHERE SurveyId = @SurveyId)
        BEGIN
            RAISERROR(N'Khảo sát không tồn tại.', 16, 1);
            RETURN;
        END;

        -- Cập nhật trạng thái
        UPDATE dbo.Survey
        SET IsActive = @IsActive
        WHERE SurveyId = @SurveyId;

        -- Trả kết quả
        SELECT @SurveyId AS SurveyId, @IsActive AS NewStatus;
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000), @ErrSeverity INT;
        SELECT @ErrMsg = ERROR_MESSAGE(), @ErrSeverity = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSeverity, 1);
    END CATCH
END;
-- Đóng khảo sát có ID = 1
EXEC dbo.SpCapNhatTrangThaiKhaoSat 
    @SurveyId = 1,
    @IsActive = 0;

-- Mở lại khảo sát ID = 1
EXEC dbo.SpCapNhatTrangThaiKhaoSat 
    @SurveyId = 1,
    @IsActive = 1;
GO
-- 7.SpThongKeSoNguoiThamGia: trả về số khách hàng đã tham gia khảo sát.
CREATE PROCEDURE dbo.SpThongKeSoNguoiDaThamGia
    @SurveyId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        @SurveyId AS SurveyId,
        COUNT(DISTINCT CustomerId) AS SoNguoiThamGia
    FROM dbo.SurveyResponse
    WHERE SurveyId = @SurveyId;
END;
EXEC dbo.SpThongKeSoNguoidaThamGia @SurveyId = 1;
GO
-- 8.SpTyLeLuaChon: tính tỷ lệ phần trăm chọn từng đáp án trong một câu hỏi.
Drop PROCEDURE dbo.SpTyLeLuaChon;
CREATE PROCEDURE dbo.SpTyLeLuaChon
    @QuestionId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Tổng số câu trả lời (có chọn đáp án)
    DECLARE @TotalResponses INT;

    SELECT @TotalResponses = COUNT(*)
    FROM dbo.SurveyAnswer
    WHERE QuestionId = @QuestionId AND ChoiceId IS NOT NULL;

    -- Nếu chưa có câu trả lời thì trả về 0%
    IF @TotalResponses = 0
    BEGIN
        SELECT 
            c.ChoiceId,
            c.ChoiceText,
            5 AS SoLanChon,
            0.0 AS TyLePhanTram
        FROM dbo.Choice c
        WHERE c.QuestionId = @QuestionId;
        RETURN;
    END;

    -- Trả về số lượt chọn và tỷ lệ %
    SELECT 
        c.ChoiceId,
        c.ChoiceText,
        COUNT(a.ChoiceId) AS SoLanChon,
        CAST(COUNT(a.ChoiceId) * 100.0 / @TotalResponses AS DECIMAL(5,2)) AS TyLePhanTram
    FROM dbo.Choice c
    LEFT JOIN dbo.SurveyAnswer a 
        ON c.ChoiceId = a.ChoiceId
    WHERE c.QuestionId = @QuestionId
    GROUP BY c.ChoiceId, c.ChoiceText;
END;
EXEC dbo.SpTyLeLuaChon @QuestionId = 7;
GO
-- 9.SpXuatKetQuaTheoKhachHang: trả về danh sách câu trả lời của một khách hàng cụ thể.
CREATE PROCEDURE dbo.SpXuatKetQuaTheoKhachHang
    @SurveyId INT,
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        c.CustomerId,
        c.FullName,
        s.SurveyId,
        s.Title AS SurveyTitle,
        q.QuestionId,
        q.Content AS QuestionContent,
        q.QuestionType,
        ISNULL(ch.ChoiceText, sa.TextAnswer) AS TraLoi,
        sa.CreatedAt AS ThoiGianTraLoi
    FROM dbo.SurveyResponse r
    INNER JOIN dbo.Customer c 
        ON r.CustomerId = c.CustomerId
    INNER JOIN dbo.Survey s 
        ON r.SurveyId = s.SurveyId
    INNER JOIN dbo.SurveyAnswer sa 
        ON r.ResponseId = sa.ResponseId
    INNER JOIN dbo.Question q 
        ON sa.QuestionId = q.QuestionId
    LEFT JOIN dbo.Choice ch 
        ON sa.ChoiceId = ch.ChoiceId
    WHERE r.SurveyId = @SurveyId
      AND r.CustomerId = @CustomerId
    ORDER BY sa.CreatedAt, q.QuestionId;
END;
EXEC dbo.SpXuatKetQuaTheoKhachHang @SurveyId = 1, @CustomerId = 1;
GO
-- III. Function
-- Tạo func tính tỷ lệ phần trăm lựa chọn từng đáp án trong 1 câu hỏi 
CREATE FUNCTION FnTinhTyLe
(   @MaCH int,
    @MaLC int
)
    RETURNS DECIMAL(5,2)
AS
BEGIN
     DECLARE @TongLuaChon int
     DECLARE @CountChoice int 

     SELECT @TongLuaChon = COUNT(*) FROM SurveyAnswer 
     WHERE QuestionId = @MaCH

     SELECT @CountChoice = COUNT(*) FROM SurveyAnswer
     WHERE QuestionId = @MaCH AND ChoiceId = @MaLC

     IF @TongLuaChon = 0
        RETURN 0

     RETURN CAST(@CountChoice * 100.0 / @TongLuaChon AS DECIMAL(5,2));
END

SELECT dbo.FnTinhTyLe(5,1) AS TyLe;
SELECT dbo.FnTinhTyLe(9, 4) AS TyLe;

-- Tạo func tính số câu hỏi trong bảng khảo sát 
CREATE FUNCTION FnTinhSoCauHoi(@MaKS int)
    RETURNS int
AS
BEGIN
    RETURN (SELECT COUNT(*) FROM Question WHERE SurveyId = @MaKS)
END

GO
SELECT dbo.FnTinhSoCauHoi(1) AS CauHoi;
-- Tạo func tính số người đã trả lời 
CREATE FUNCTION FnTinhSoNguoiTraLoi(@MaKS int)
    RETURNS int
AS
BEGIN
    RETURN (SELECT COUNT(DISTINCT CustomerId) FROM SurveyResponse 
    WHERE SurveyId = @MaKS)
END
SELECT dbo.FnTinhSoNguoiTraLoi(1) AS SoNg;
GO

-- Tạo func kiểm tra 1 khảo sát còn hoạt động hay không
CREATE FUNCTION FnKiemTraThoiHanKhaoSat(@MaKS int)
    RETURNS Nvarchar(5)
AS
BEGIN
    DECLARE @Result nvarchar(5)
    
    IF EXISTS (SELECT 1 FROM Survey WHERE SurveyId = @MaKS AND (EndDate IS NULL OR GETDATE() < EndDate))
        SET @Result = 'TRUE' -- Còn hạn
    ELSE
        SET @Result = 'FALSE' -- Hết hạn

    RETURN @Result
END 
SELECT dbo.FnKiemTraThoiHanKhaoSat(1) AS TG;
-- IV. Trigger
-- 1. Kiểm tra ngày khảo sát
IF OBJECT_ID('TrgCheckNgayKhaoSat', 'TR') IS NOT NULL
    DROP TRIGGER TrgCheckNgayKhaoSat;
GO

CREATE TRIGGER TrgCheckNgayKhaoSat
ON dbo.SurveyAnswer
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra khảo sát còn hạn hay không
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN dbo.SurveyResponse r ON i.ResponseId = r.ResponseId
        JOIN dbo.Survey s ON r.SurveyId = s.SurveyId
        WHERE s.EndDate IS NOT NULL 
          AND s.EndDate < CAST(GETDATE() AS DATE)
    )
    BEGIN
        RAISERROR (N'Khảo sát đã hết hạn, không thể thêm câu trả lời!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO


--2. Sửa trigger ghi log trả lời để tránh vòng lặp
--Ghi log mỗi khi khách hàng trả lời
CREATE TABLE dbo.AnswerLog (
    LogId INT IDENTITY(1,1) PRIMARY KEY,
    AnswerId INT NOT NULL,
    ResponseId INT NOT NULL,
    QuestionId INT NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('TrgLogTraLoi', 'TR') IS NOT NULL
    DROP TRIGGER TrgLogTraLoi;
GO

CREATE TRIGGER TrgLogTraLoi
ON dbo.SurveyAnswer
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Ngăn kích hoạt lặp lại nhiều lần trong cùng chuỗi trigger
    IF TRIGGER_NESTLEVEL() > 1 RETURN;

    INSERT INTO dbo.AnswerLog (AnswerId, ResponseId, QuestionId, CreatedAt)
    SELECT i.AnswerId, i.ResponseId, i.QuestionId, i.CreatedAt
    FROM inserted i;
END;
GO

-- 3. Giữ nguyên các trigger khác, không cần thay đổi

-- Trigger ngăn xóa câu hỏi có trả lời
IF OBJECT_ID('TrgKhongXoaCauHoiDaCoTraLoi', 'TR') IS NOT NULL
    DROP TRIGGER TrgKhongXoaCauHoiDaCoTraLoi;
GO

CREATE TRIGGER TrgKhongXoaCauHoiDaCoTraLoi
ON dbo.Question
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted d
        JOIN dbo.SurveyAnswer a ON d.QuestionId = a.QuestionId
    )
    BEGIN
        RAISERROR (N'Không thể xóa câu hỏi đã có người trả lời!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    DELETE q
    FROM dbo.Question q
    JOIN deleted d ON q.QuestionId = d.QuestionId;
END;
GO

-- Trigger tự động cập nhật trạng thái khảo sát khi hết hạn
IF OBJECT_ID('TrgTuDongCapNhatTrangThaiKhaoSat', 'TR') IS NOT NULL
    DROP TRIGGER TrgTuDongCapNhatTrangThaiKhaoSat;
GO

CREATE TRIGGER TrgTuDongCapNhatTrangThaiKhaoSat
ON dbo.Survey
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE s
    SET IsActive = 0
    FROM dbo.Survey s
    JOIN inserted i ON s.SurveyId = i.SurveyId
    WHERE s.EndDate IS NOT NULL 
      AND s.EndDate < CAST(GETDATE() AS DATE);
END;
GO
-- V. Index
-- Bảng survey response 
-- Index theo khảo sát (để lấy danh sách câu trả lời của 1 khảo sát)
CREATE NONCLUSTERED INDEX IX_SurveyResponse_SurveyId
ON dbo.SurveyResponse (SurveyId);

-- Index kết hợp SurveyId + CustomerId (tìm phiếu trả lời của khách hàng trong 1 khảo sát)
CREATE NONCLUSTERED INDEX IX_SurveyResponse_Survey_Customer
ON dbo.SurveyResponse (SurveyId, CustomerId);

--Bảng surveyanswer 
-- Index theo ResponseId (lấy toàn bộ câu trả lời của 1 phiếu)
CREATE NONCLUSTERED INDEX IX_SurveyAnswer_ResponseId
ON dbo.SurveyAnswer (ResponseId);

-- Index theo QuestionId (tính tỷ lệ trả lời 1 câu hỏi)
CREATE NONCLUSTERED INDEX IX_SurveyAnswer_QuestionId
ON dbo.SurveyAnswer (QuestionId);

-- Index kết hợp QuestionId + ChoiceId (thống kê số người chọn 1 lựa chọn)
CREATE NONCLUSTERED INDEX IX_SurveyAnswer_Question_Choice
ON dbo.SurveyAnswer (QuestionId, ChoiceId);

--Bảng question 
CREATE NONCLUSTERED INDEX IX_Question_SurveyId
ON dbo.Question (SurveyId);

-- Bảng choice 
CREATE NONCLUSTERED INDEX IX_Choice_QuestionId
ON dbo.Choice (QuestionId);

-- Bảng Customer 
-- Tìm kiếm nhanh theo email
CREATE NONCLUSTERED INDEX IX_Customer_Email
ON dbo.Customer (Email);

-- Tìm kiếm nhanh theo số điện thoại
CREATE NONCLUSTERED INDEX IX_Customer_Phone
ON dbo.Customer (Phone);
-- VI. Insert Into 
INSERT INTO dbo.Customer (FullName, Email, Phone, Address) VALUES
(N'Nguyễn Văn An', 'nguyenvanan@gmail.com', '0912345678', N'12 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội'),
(N'Trần Thị Hoa', 'tranthihoa@yahoo.com', '0987654321', N'25 Nguyễn Huệ, Quận 1, TP Hồ Chí Minh'),
(N'Lê Văn Minh', 'levanminh@gmail.com', '0934567890', N'8 Trần Phú, Hải Châu, Đà Nẵng'),
(N'Phạm Thị Hương', 'phamthihuong@outlook.com', '0972345678', N'56 Hai Bà Trưng, Hoàn Kiếm, Hà Nội'),
(N'Hoàng Văn Nam', 'hoangvannam@gmail.com', '0367890123', N'101 Lê Lợi, Ngô Quyền, Hải Phòng'),
(N'Đỗ Thị Mai', 'dothimai@gmail.com', '0881234567', N'22 Pasteur, Quận 3, TP Hồ Chí Minh'),
(N'Bùi Văn Long', 'buivanlong@yahoo.com', '0918765432', N'77 Hùng Vương, Ba Đình, Hà Nội'),
(N'Ngô Thị Lan', 'ngothilan@gmail.com', '0356789012', N'35 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng'),
(N'Vũ Văn Quang', 'vuvanqang@outlook.com', '0945678901', N'11 Điện Biên Phủ, Bình Thạnh, TP Hồ Chí Minh'),
(N'Đặng Thị Hồng', 'dangthihong@gmail.com', '0923456789', N'42 Trường Chinh, Thanh Xuân, Hà Nội'),
(N'Nguyễn Văn Tuấn', 'nguyenvantuan@gmail.com', '0912233445', N'19 Nguyễn Du, Hai Bà Trưng, Hà Nội'),
(N'Trần Văn Dũng', 'tranvandung@yahoo.com', '0378899001', N'88 Lê Văn Sỹ, Phú Nhuận, TP Hồ Chí Minh'),
(N'Lê Thị Thảo', 'lethithao@gmail.com', '0903344556', N'23 Phan Đình Phùng, Hải Châu, Đà Nẵng'),
(N'Phạm Văn Cường', 'phamvancuong@gmail.com', '0933344556', N'54 Nguyễn Thái Học, Hoàn Kiếm, Hà Nội'),
(N'Hoàng Thị Hà', 'hoangthiha@outlook.com', '0399988776', N'67 Lý Thái Tổ, Quận 10, TP Hồ Chí Minh'),
(N'Đỗ Văn Sơn', 'dovanson@gmail.com', '0966677889', N'29 Hòa Bình, Ninh Kiều, Cần Thơ'),
(N'Bùi Thị Nhung', 'buithinhung@gmail.com', '0912121212', N'12 Bạch Đằng, Hồng Bàng, Hải Phòng'),
(N'Ngô Văn Phúc', 'ngovanphuc@gmail.com', '0988123456', N'91 Nguyễn Chí Thanh, Đống Đa, Hà Nội'),
(N'Vũ Thị Trang', 'vuthitrang@gmail.com', '0977334455', N'35 Võ Văn Tần, Quận 3, TP Hồ Chí Minh'),
(N'Đặng Văn Lợi', 'dangvanloi@yahoo.com', '0388112233', N'44 Phan Chu Trinh, Hải Châu, Đà Nẵng'),
(N'Nguyễn Thị Thu', 'nguyenthithu@gmail.com', '0911002200', N'17 Cầu Giấy, Cầu Giấy, Hà Nội'),
(N'Trần Văn Quý', 'tranvanquy@gmail.com', '0933888999', N'66 Nguyễn Trãi, Thanh Xuân, Hà Nội'),
(N'Lê Thị Yến', 'lethiyen@gmail.com', '0905566778', N'5 Điện Biên Phủ, Quận Bình Thạnh, TP Hồ Chí Minh'),
(N'Phạm Văn Hậu', 'phamvanhau@gmail.com', '0977445566', N'72 Nguyễn Hữu Thọ, Hải Châu, Đà Nẵng'),
(N'Hoàng Thị Vân', 'hoangthivan@gmail.com', '0366778899', N'9 Tôn Đức Thắng, Hoàn Kiếm, Hà Nội'),
(N'Đỗ Văn Thành', 'dovanthanh@gmail.com', '0923344556', N'81 Lê Duẩn, Quận 1, TP Hồ Chí Minh'),
(N'Bùi Thị Ngọc', 'buithingoc@yahoo.com', '0944556677', N'14 Trần Hưng Đạo, Hồng Bàng, Hải Phòng'),
(N'Ngô Văn Toàn', 'ngovantoan@gmail.com', '0918899776', N'55 Nguyễn Văn Cừ, Long Biên, Hà Nội'),
(N'Vũ Văn Khánh', 'vuvankhanh@gmail.com', '0988776655', N'20 Lê Thánh Tôn, Quận 1, TP Hồ Chí Minh'),
(N'Đặng Thị Mai', 'dangthimai@gmail.com', '0906778899', N'10 Trần Cao Vân, Hải Châu, Đà Nẵng'),
(N'Nguyễn Văn Khoa', 'nguyenvankhoa@gmail.com', '0977889900', N'21 Láng Hạ, Đống Đa, Hà Nội'),
(N'Trần Thị Phương', 'tranthiphuong@gmail.com', '0935667788', N'8 Nguyễn Thông, Quận 3, TP Hồ Chí Minh'),
(N'Lê Văn Hải', 'levanhai@gmail.com', '0914556677', N'65 Bạch Đằng, Hải Châu, Đà Nẵng'),
(N'Phạm Thị Loan', 'phamthiloan@yahoo.com', '0966001122', N'44 Kim Mã, Ba Đình, Hà Nội'),
(N'Hoàng Văn Tài', 'hoangvantai@gmail.com', '0377889900', N'9 Nguyễn Công Trứ, Quận 1, TP Hồ Chí Minh'),
(N'Đỗ Thị Quyên', 'dothiquyen@gmail.com', '0922334455', N'31 Trần Hưng Đạo, Ninh Kiều, Cần Thơ'),
(N'Bùi Văn Phát', 'buivanphat@gmail.com', '0912349988', N'74 Nguyễn Du, Hồng Bàng, Hải Phòng'),
(N'Ngô Thị Hạnh', 'ngothihanh@gmail.com', '0933445566', N'15 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng'),
(N'Vũ Văn Bình', 'vuvanbinh@gmail.com', '0988771122', N'88 Trần Khát Chân, Hai Bà Trưng, Hà Nội'),
(N'Đặng Thị Nga', 'dangthinga@gmail.com', '0915667788', N'27 Hoàng Diệu, Quận 4, TP Hồ Chí Minh'),
(N'Nguyễn Văn Hùng', 'nguyenvanhung@gmail.com', '0977889911', N'5 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội'),
(N'Trần Văn Kiên', 'tranvankien@gmail.com', '0922113344', N'53 Nguyễn Trãi, Thanh Xuân, Hà Nội'),
(N'Lê Thị Thuỷ', 'lethithuy@gmail.com', '0366778890', N'19 Nguyễn Đình Chiểu, Quận 3, TP Hồ Chí Minh'),
(N'Phạm Văn Bình', 'phamvanbinh@gmail.com', '0944667788', N'24 Điện Biên Phủ, Hải Châu, Đà Nẵng'),
(N'Hoàng Thị Liên', 'hoangthilien@gmail.com', '0918776655', N'17 Cửa Bắc, Ba Đình, Hà Nội'),
(N'Đỗ Văn Phong', 'dovanphong@gmail.com', '0388990011', N'66 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội'),
(N'Bùi Thị Hằng', 'buithihang@gmail.com', '0901122334', N'42 Nguyễn Thái Học, Quận 1, TP Hồ Chí Minh'),
(N'Ngô Văn Hòa', 'ngovanhoa@gmail.com', '0977112233', N'19 Bạch Đằng, Hải Châu, Đà Nẵng'),
(N'Vũ Thị Minh', 'vuthiminh@gmail.com', '0914455667', N'25 Lạc Long Quân, Tây Hồ, Hà Nội'),
(N'Đặng Văn Hạnh', 'dangvanhanh@gmail.com', '0933998877', N'31 Nguyễn Văn Cừ, Long Biên, Hà Nội')
;

-- 1. Tạo khảo sát
INSERT INTO dbo.Survey (Title, Description, StartDate, EndDate) VALUES 
(N'Khảo sát 2025', N'Khảo sát khách hàng', '2025-10-01', '2025-10-18'),
(N'Khảo sát mức độ hài lòng của khách hàng năm 2023', 
 N'Khảo sát ý kiến khách hàng về chất lượng dịch vụ và sản phẩm trong năm 2023.', 
 '2023-01-10', '2023-02-10');


-- 2. Nhập câu hỏi theo thứ tự: Họ tên, Email, SĐT, Độ tuổi, Giới tính, Nơi sống
INSERT INTO dbo.Question (SurveyId, Content, QuestionType, IsRequired) VALUES
(1, N'Họ và tên', 'TEXT', 1),
(1, N'Email', 'TEXT', 0),
(1, N'Số điện thoại', 'TEXT', 0),
(1, N'Độ tuổi', 'CHOICE', 1),
(1, N'Giới tính', 'CHOICE', 1),
(1, N'Bạn sống ở đâu', 'TEXT', 1),
(1, N'Bạn biết đến sản phẩm/dịch vụ của chúng tôi từ đâu?', 'CHOICE', 1),
(1, N'Bạn đã sử dụng sản phẩm/dịch vụ của chúng tôi bao lâu?', 'CHOICE', 1),
(1, N'Bạn đánh giá mức độ hài lòng chung về sản phẩm/dịch vụ (1–5)?', 'RATING', 1),
(1, N'Bạn có sẵn sàng giới thiệu sản phẩm/dịch vụ cho người khác không?', 'YESNO', 1),
(1, N'Giá cả sản phẩm/dịch vụ so với chất lượng', 'CHOICE', 1),
(1, N'Bạn thích điều gì nhất ở sản phẩm/dịch vụ của chúng tôi?', 'TEXT', 0),
(1, N'Theo bạn, chúng tôi cần cải thiện điều gì để phục vụ tốt hơn?', 'TEXT', 0),
(1, N'Bạn có góp ý nào khác về trải nghiệm sử dụng?', 'TEXT', 0),
(1, N'Bạn mong muốn dịch vụ chăm sóc khách hàng cải thiện ra sao?', 'TEXT', 0),
(1, N'Bạn có thể mô tả bằng một vài từ khóa cảm nhận chung về sản phẩm/dịch vụ?', 'TEXT', 0);


-- 3. Nhập các lựa chọn cho câu hỏi CHOICE và RATING
INSERT INTO dbo.Choice (QuestionId, ChoiceText, Value, SortOrder) VALUES
-- Độ tuổi (QuestionId = 4)
(4, N'Dưới 18', 1, 1),
(4, N'18–25', 2, 2),
(4, N'26–35', 3, 3),
(4, N'36–50', 4, 4),
(4, N'Trên 50', 5, 5),

-- Giới tính (QuestionId = 5)
(5, N'Nam', 1, 1),
(5, N'Nữ', 2, 2),
(5, N'Khác', 3, 3),

-- Biết đến từ đâu (QuestionId = 7)
(7, N'Mạng xã hội', 1, 1),
(7, N'Bạn bè giới thiệu', 2, 2),
(7, N'Quảng cáo online', 3, 3),
(7, N'Khác', 4, 4),

-- Đã sử dụng bao lâu (QuestionId = 8)
(8, N'Dưới 1 tháng', 1, 1),
(8, N'1–6 tháng', 2, 2),
(8, N'6–12 tháng', 3, 3),
(8, N'Trên 1 năm', 4, 4),

-- Mức độ hài lòng (QuestionId = 9)
(9, N'1 (Rất không hài lòng)', 1, 1),
(9, N'2 (Không hài lòng)', 2, 2),
(9, N'3 (Bình thường)', 3, 3),
(9, N'4 (Hài lòng)', 4, 4),
(9, N'5 (Rất hài lòng)', 5, 5),

-- Giới thiệu sản phẩm (QuestionId = 10)
(10, N'Có', 1, 1),
(10, N'Không', 2, 2),

-- Giá cả (QuestionId = 11)
(11, N'Quá cao', 1, 1),
(11, N'Hợp lý', 2, 2),
(11, N'Rẻ', 3, 3);


-- 4. Dữ liệu phản hồi khách hàng
INSERT INTO dbo.SurveyResponse (SurveyId, CustomerId, RespondedAt)
VALUES
(1, 1, '2025-09-01 08:15:00'),
(1, 2, '2025-09-02 09:30:00');

DISABLE TRIGGER TrgCheckNgayKhaoSat ON SurveyAnswer;
ENABLE TRIGGER TrgCheckNgayKhaoSat ON SurveyAnswer;
-- 5. Câu trả lời của người dùng
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
-- Người 1
(1, 1, NULL, N'Nguyễn Văn A', '2025-10-10 08:20:00'),
(1, 2, NULL, N'a@gmail.com', '2025-10-10 08:20:00'),
(1, 3, NULL, N'0912345678', '2025-10-10 08:20:00'),
(1, 4, 2, NULL, '2025-10-10 08:20:00'),
(1, 5, 1, NULL, '2025-10-10 08:20:00'),
(1, 6, NULL, N'Hà Nội', '2025-10-10 08:20:00'),
(1, 7, 1, NULL, '2025-10-10 08:21:00'),
(1, 8, 2, NULL, '2025-10-10 08:21:00'),
(1, 9, 4, NULL, '2025-10-10 08:21:00'),
(1, 10, 1, NULL, '2025-10-10 08:22:00'),
(1, 11, 2, NULL, '2025-10-10 08:22:00'),
(1, 12, NULL, N'Sản phẩm ổn định, dễ sử dụng', '2025-10-10 08:23:00'),
(1, 13, NULL, N'Nên thêm nhiều ưu đãi hơn', '2025-10-10 08:23:00'),
(1, 14, NULL, N'Không có góp ý thêm', '2025-10-10 08:23:00'),
(1, 15, NULL, N'Hỗ trợ nhanh hơn nữa', '2025-10-10 08:24:00'),
(1, 16, NULL, N'Tốt, thân thiện, tiện lợi', '2025-10-10 08:25:00'),

-- Người 2
(2, 1, NULL, N'Trần Thị B', '2025-10-11 09:35:00'),
(2, 2, NULL, N'b@gmail.com', '2025-10-11 09:35:00'),
(2, 3, NULL, N'0987654321', '2025-10-11 09:35:00'),
(2, 4, 3, NULL, '2025-10-11 09:35:00'),
(2, 5, 2, NULL, '2025-10-11 09:35:00'),
(2, 6, NULL, N'Hà Tĩnh', '2025-10-11 09:35:00'),
(2, 7, 2, NULL, '2025-10-11 09:36:00'),
(2, 8, 3, NULL, '2025-10-11 09:36:00'),
(2, 9, 5, NULL, '2025-10-11 09:36:00'),
(2, 10, 1, NULL, '2025-10-11 09:37:00'),
(2, 11, 3, NULL, '2025-10-11 09:37:00'),
(2, 12, NULL, N'Dịch vụ thân thiện', '2025-10-11 09:38:00'),
(2, 13, NULL, N'Tốc độ xử lý đơn hàng', '2025-10-11 09:38:00'),
(2, 14, NULL, N'Ứng dụng nên có chế độ tối', '2025-10-11 09:39:00'),
(2, 15, NULL, N'Chăm sóc khách hàng thường xuyên hơn', '2025-10-11 09:39:00'),
(2, 16, NULL, N'Nhanh, rẻ, tiện lợi', '2025-10-11 09:40:00');

-- Thêm các phản hồi mới vào bảng SurveyResponse
INSERT INTO dbo.SurveyResponse (SurveyId, CustomerId, RespondedAt)
VALUES
(1, 3, '2025-10-12 10:15:00'),
(1, 4, '2025-10-12 11:20:00'),
(1, 5, '2025-10-12 14:30:00'),
(1, 6, '2025-10-13 08:45:00'),
(1, 7, '2025-10-13 09:50:00'),
(1, 8, '2025-10-13 13:15:00'),
(1, 9, '2025-10-14 08:30:00'),
(1, 10, '2025-10-14 10:45:00'),
(1, 11, '2025-10-14 15:20:00'),
(1, 12, '2025-10-15 09:00:00'),
(1, 13, '2025-10-15 11:30:00'),
(1, 14, '2025-10-15 14:15:00');

-- Tắt trigger để có thể insert dữ liệu quá khứ
DISABLE TRIGGER TrgCheckNgayKhaoSat ON SurveyAnswer;

-- Câu trả lời của Phạm Thị Q (ResponseId = 3)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(3, 1, NULL, N'Phạm Thị Q', '2025-10-12 10:16:00'),
(3, 2, NULL, N'q.pham@example.com', '2025-10-12 10:16:00'),
(3, 3, NULL, N'0912000111', '2025-10-12 10:16:00'),
(3, 4, 3, NULL, '2025-10-12 10:17:00'),
(3, 5, 2, NULL, '2025-10-12 10:17:00'),
(3, 6, NULL, N'Đà Nẵng', '2025-10-12 10:17:00'),
(3, 7, 2, NULL, '2025-10-12 10:18:00'),
(3, 8, 2, NULL, '2025-10-12 10:18:00'),
(3, 9, 5, NULL, '2025-10-12 10:18:00'),
(3, 10, 1, NULL, '2025-10-12 10:19:00'),
(3, 11, 2, NULL, '2025-10-12 10:19:00'),
(3, 12, NULL, N'Sản phẩm tốt', '2025-10-12 10:20:00'),
(3, 13, NULL, N'Thêm khuyến mãi', '2025-10-12 10:20:00'),
(3, 14, NULL, N'Ứng dụng hơi chậm', '2025-10-12 10:21:00'),
(3, 15, NULL, N'Chat nhanh hơn', '2025-10-12 10:21:00'),
(3, 16, NULL, N'Tiện lợi, ổn định', '2025-10-12 10:22:00');

-- Câu trả lời của Đỗ Văn R (ResponseId = 4)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(4, 1, NULL, N'Đỗ Văn R', '2025-10-12 11:21:00'),
(4, 2, NULL, N'r.do@example.com', '2025-10-12 11:21:00'),
(4, 3, NULL, N'0934111222', '2025-10-12 11:21:00'),
(4, 4, 4, NULL, '2025-10-12 11:22:00'),
(4, 5, 1, NULL, '2025-10-12 11:22:00'),
(4, 6, NULL, N'Thanh Hóa', '2025-10-12 11:22:00'),
(4, 7, 1, NULL, '2025-10-12 11:23:00'),
(4, 8, 4, NULL, '2025-10-12 11:23:00'),
(4, 9, 4, NULL, '2025-10-12 11:23:00'),
(4, 10, 1, NULL, '2025-10-12 11:24:00'),
(4, 11, 2, NULL, '2025-10-12 11:24:00'),
(4, 12, NULL, N'Uy tín', '2025-10-12 11:25:00'),
(4, 13, NULL, N'Thêm ưu đãi khách hàng lâu năm', '2025-10-12 11:25:00'),
(4, 14, NULL, N'Giao diện hơi rối', '2025-10-12 11:26:00'),
(4, 15, NULL, N'CSKH gọi điện', '2025-10-12 11:26:00'),
(4, 16, NULL, N'Tin tưởng, quen dùng', '2025-10-12 11:27:00');

-- Câu trả lời của Nguyễn Thị S (ResponseId = 5)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(5, 1, NULL, N'Nguyễn Thị S', '2025-10-12 14:31:00'),
(5, 2, NULL, N's.nguyen@example.com', '2025-10-12 14:31:00'),
(5, 3, NULL, N'0903222333', '2025-10-12 14:31:00'),
(5, 4, 2, NULL, '2025-10-12 14:32:00'),
(5, 5, 2, NULL, '2025-10-12 14:32:00'),
(5, 6, NULL, N'Quảng Bình', '2025-10-12 14:32:00'),
(5, 7, 3, NULL, '2025-10-12 14:33:00'),
(5, 8, 1, NULL, '2025-10-12 14:33:00'),
(5, 9, 3, NULL, '2025-10-12 14:33:00'),
(5, 10, 2, NULL, '2025-10-12 14:34:00'),
(5, 11, 1, NULL, '2025-10-12 14:34:00'),
(5, 12, NULL, N'Thiết kế đẹp', '2025-10-12 14:35:00'),
(5, 13, NULL, N'Giảm giá sinh viên', '2025-10-12 14:35:00'),
(5, 14, NULL, N'Khó đăng nhập', '2025-10-12 14:36:00'),
(5, 15, NULL, N'Chatbot hỗ trợ', '2025-10-12 14:36:00'),
(5, 16, NULL, N'Đẹp nhưng đắt', '2025-10-12 14:37:00');

-- Câu trả lời của Hoàng Văn T (ResponseId = 6)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(6, 1, NULL, N'Hoàng Văn T', '2025-10-13 08:46:00'),
(6, 2, NULL, N't.hoang@example.com', '2025-10-13 08:46:00'),
(6, 3, NULL, N'0914333444', '2025-10-13 08:46:00'),
(6, 4, 3, NULL, '2025-10-13 08:47:00'),
(6, 5, 1, NULL, '2025-10-13 08:47:00'),
(6, 6, NULL, N'Hà Nội', '2025-10-13 08:47:00'),
(6, 7, 4, NULL, '2025-10-13 08:48:00'),
(6, 8, 3, NULL, '2025-10-13 08:48:00'),
(6, 9, 2, NULL, '2025-10-13 08:48:00'),
(6, 10, 2, NULL, '2025-10-13 08:49:00'),
(6, 11, 1, NULL, '2025-10-13 08:49:00'),
(6, 12, NULL, N'Uy tín', '2025-10-13 08:50:00'),
(6, 13, NULL, N'Giảm phí ship', '2025-10-13 08:50:00'),
(6, 14, NULL, N'App hay lỗi', '2025-10-13 08:51:00'),
(6, 15, NULL, N'Hotline 24/7', '2025-10-13 08:51:00'),
(6, 16, NULL, N'Tốt nhưng đắt', '2025-10-13 08:52:00');

-- Câu trả lời của Trần Thị U (ResponseId = 7)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(7, 1, NULL, N'Trần Thị U', '2025-10-13 09:51:00'),
(7, 2, NULL, N'u.tran@example.com', '2025-10-13 09:51:00'),
(7, 3, NULL, N'0935444555', '2025-10-13 09:51:00'),
(7, 4, 2, NULL, '2025-10-13 09:52:00'),
(7, 5, 2, NULL, '2025-10-13 09:52:00'),
(7, 6, NULL, N'Nam Định', '2025-10-13 09:52:00'),
(7, 7, 1, NULL, '2025-10-13 09:53:00'),
(7, 8, 2, NULL, '2025-10-13 09:53:00'),
(7, 9, 5, NULL, '2025-10-13 09:53:00'),
(7, 10, 1, NULL, '2025-10-13 09:54:00'),
(7, 11, 3, NULL, '2025-10-13 09:54:00'),
(7, 12, NULL, N'Giá tốt', '2025-10-13 09:55:00'),
(7, 13, NULL, N'Chăm sóc khách hàng tốt hơn', '2025-10-13 09:55:00'),
(7, 14, NULL, N'Chưa nhiều sản phẩm', '2025-10-13 09:56:00'),
(7, 15, NULL, N'Chat nhanh hơn', '2025-10-13 09:56:00'),
(7, 16, NULL, N'Giá rẻ, hài lòng', '2025-10-13 09:57:00');

-- Câu trả lời của Lê Văn V (ResponseId = 8)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(8, 1, NULL, N'Lê Văn V', '2025-10-13 13:16:00'),
(8, 2, NULL, N'v.le@example.com', '2025-10-13 13:16:00'),
(8, 3, NULL, N'0905666777', '2025-10-13 13:16:00'),
(8, 4, 3, NULL, '2025-10-13 13:17:00'),
(8, 5, 1, NULL, '2025-10-13 13:17:00'),
(8, 6, NULL, N'Hải Phòng', '2025-10-13 13:17:00'),
(8, 7, 2, NULL, '2025-10-13 13:18:00'),
(8, 8, 4, NULL, '2025-10-13 13:18:00'),
(8, 9, 4, NULL, '2025-10-13 13:18:00'),
(8, 10, 1, NULL, '2025-10-13 13:19:00'),
(8, 11, 2, NULL, '2025-10-13 13:19:00'),
(8, 12, NULL, N'Chăm sóc tốt', '2025-10-13 13:20:00'),
(8, 13, NULL, N'Giao hàng nhanh', '2025-10-13 13:20:00'),
(8, 14, NULL, N'Ít tính năng', '2025-10-13 13:21:00'),
(8, 15, NULL, N'Zalo hỗ trợ', '2025-10-13 13:21:00'),
(8, 16, NULL, N'Ổn, dễ dùng', '2025-10-13 13:22:00');

-- Câu trả lời của Phùng Thị W (ResponseId = 9)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(9, 1, NULL, N'Phùng Thị W', '2025-10-14 08:31:00'),
(9, 2, NULL, N'w.phung@example.com', '2025-10-14 08:31:00'),
(9, 3, NULL, N'0936777888', '2025-10-14 08:31:00'),
(9, 4, 2, NULL, '2025-10-14 08:32:00'),
(9, 5, 2, NULL, '2025-10-14 08:32:00'),
(9, 6, NULL, N'TP. HCM', '2025-10-14 08:32:00'),
(9, 7, 1, NULL, '2025-10-14 08:33:00'),
(9, 8, 1, NULL, '2025-10-14 08:33:00'),
(9, 9, 5, NULL, '2025-10-14 08:33:00'),
(9, 10, 1, NULL, '2025-10-14 08:34:00'),
(9, 11, 3, NULL, '2025-10-14 08:34:00'),
(9, 12, NULL, N'Nhiều khuyến mãi', '2025-10-14 08:35:00'),
(9, 13, NULL, N'Thêm sản phẩm', '2025-10-14 08:35:00'),
(9, 14, NULL, N'Lỗi đăng nhập', '2025-10-14 08:36:00'),
(9, 15, NULL, N'Chat 24/7', '2025-10-14 08:36:00'),
(9, 16, NULL, N'Tiện lợi, giá rẻ', '2025-10-14 08:37:00');

-- Câu trả lời của Vũ Văn X (ResponseId = 10)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(10, 1, NULL, N'Vũ Văn X', '2025-10-14 10:46:00'),
(10, 2, NULL, N'x.vu@example.com', '2025-10-14 10:46:00'),
(10, 3, NULL, N'0917888999', '2025-10-14 10:46:00'),
(10, 4, 4, NULL, '2025-10-14 10:47:00'),
(10, 5, 1, NULL, '2025-10-14 10:47:00'),
(10, 6, NULL, N'Nghệ An', '2025-10-14 10:47:00'),
(10, 7, 4, NULL, '2025-10-14 10:48:00'),
(10, 8, 3, NULL, '2025-10-14 10:48:00'),
(10, 9, 3, NULL, '2025-10-14 10:48:00'),
(10, 10, 2, NULL, '2025-10-14 10:49:00'),
(10, 11, 1, NULL, '2025-10-14 10:49:00'),
(10, 12, NULL, N'Uy tín', '2025-10-14 10:50:00'),
(10, 13, NULL, N'Giảm giá nhiều hơn', '2025-10-14 10:50:00'),
(10, 14, NULL, N'Không đồng bộ web/app', '2025-10-14 10:51:00'),
(10, 15, NULL, N'CSKH nhanh', '2025-10-14 10:51:00'),
(10, 16, NULL, N'Ổn nhưng đắt', '2025-10-14 10:52:00');

-- Câu trả lời của Nguyễn Thị Y (ResponseId = 11)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(11, 1, NULL, N'Nguyễn Thị Y', '2025-10-14 15:21:00'),
(11, 2, NULL, N'y.nguyen@example.com', '2025-10-14 15:21:00'),
(11, 3, NULL, N'0978999000', '2025-10-14 15:21:00'),
(11, 4, 3, NULL, '2025-10-14 15:22:00'),
(11, 5, 2, NULL, '2025-10-14 15:22:00'),
(11, 6, NULL, N'Cần Thơ', '2025-10-14 15:22:00'),
(11, 7, 2, NULL, '2025-10-14 15:23:00'),
(11, 8, 2, NULL, '2025-10-14 15:23:00'),
(11, 9, 4, NULL, '2025-10-14 15:23:00'),
(11, 10, 1, NULL, '2025-10-14 15:24:00'),
(11, 11, 2, NULL, '2025-10-14 15:24:00'),
(11, 12, NULL, N'Nhân viên nhiệt tình', '2025-10-14 15:25:00'),
(11, 13, NULL, N'Mở thêm chi nhánh', '2025-10-14 15:25:00'),
(11, 14, NULL, N'Khó sử dụng app', '2025-10-14 15:26:00'),
(11, 15, NULL, N'Chat video', '2025-10-14 15:26:00'),
(11, 16, NULL, N'Thân thiện', '2025-10-14 15:27:00');

-- Câu trả lời của Ngô Văn Z (ResponseId = 12)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(12, 1, NULL, N'Ngô Văn Z', '2025-10-15 09:01:00'),
(12, 2, NULL, N'z.ngo@example.com', '2025-10-15 09:01:00'),
(12, 3, NULL, N'0938000111', '2025-10-15 09:01:00'),
(12, 4, 2, NULL, '2025-10-15 09:02:00'),
(12, 5, 1, NULL, '2025-10-15 09:02:00'),
(12, 6, NULL, N'Hà Nội', '2025-10-15 09:02:00'),
(12, 7, 3, NULL, '2025-10-15 09:03:00'),
(12, 8, 1, NULL, '2025-10-15 09:03:00'),
(12, 9, 2, NULL, '2025-10-15 09:03:00'),
(12, 10, 2, NULL, '2025-10-15 09:04:00'),
(12, 11, 1, NULL, '2025-10-15 09:04:00'),
(12, 12, NULL, N'Mẫu mã ổn', '2025-10-15 09:05:00'),
(12, 13, NULL, N'Cần thêm tính năng', '2025-10-15 09:05:00'),
(12, 14, NULL, N'Lỗi thanh toán', '2025-10-15 09:06:00'),
(12, 15, NULL, N'Chatbot AI', '2025-10-15 09:06:00'),
(12, 16, NULL, N'Đẹp nhưng chậm', '2025-10-15 09:07:00');

-- Câu trả lời của Phạm Thị AA (ResponseId = 13)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(13, 1, NULL, N'Phạm Thị AA', '2025-10-15 11:31:00'),
(13, 2, NULL, N'aa.pham@example.com', '2025-10-15 11:31:00'),
(13, 3, NULL, N'0912111001', '2025-10-15 11:31:00'),
(13, 4, 3, NULL, '2025-10-15 11:32:00'),
(13, 5, 2, NULL, '2025-10-15 11:32:00'),
(13, 6, NULL, N'Huế', '2025-10-15 11:32:00'),
(13, 7, 2, NULL, '2025-10-15 11:33:00'),
(13, 8, 2, NULL, '2025-10-15 11:33:00'),
(13, 9, 5, NULL, '2025-10-15 11:33:00'),
(13, 10, 1, NULL, '2025-10-15 11:34:00'),
(13, 11, 2, NULL, '2025-10-15 11:34:00'),
(13, 12, NULL, N'Dịch vụ tốt', '2025-10-15 11:35:00'),
(13, 13, NULL, N'Thêm ưu đãi', '2025-10-15 11:35:00'),
(13, 14, NULL, N'App hơi chậm', '2025-10-15 11:36:00'),
(13, 15, NULL, N'Chat nhanh', '2025-10-15 11:36:00'),
(13, 16, NULL, N'Tiện lợi', '2025-10-15 11:37:00');

-- Câu trả lời của Đỗ Văn BB (ResponseId = 14)
INSERT INTO dbo.SurveyAnswer (ResponseId, QuestionId, ChoiceId, TextAnswer, CreatedAt)
VALUES
(14, 1, NULL, N'Đỗ Văn BB', '2025-10-15 14:16:00'),
(14, 2, NULL, N'bb.do@example.com', '2025-10-15 14:16:00'),
(14, 3, NULL, N'0938222333', '2025-10-15 14:16:00'),
(14, 4, 4, NULL, '2025-10-15 14:17:00'),
(14, 5, 1, NULL, '2025-10-15 14:17:00'),
(14, 6, NULL, N'Hà Nam', '2025-10-15 14:17:00'),
(14, 7, 1, NULL, '2025-10-15 14:18:00'),
(14, 8, 4, NULL, '2025-10-15 14:18:00'),
(14, 9, 4, NULL, '2025-10-15 14:18:00'),
(14, 10, 1, NULL, '2025-10-15 14:19:00'),
(14, 11, 2, NULL, '2025-10-15 14:19:00'),
(14, 12, NULL, N'Uy tín', '2025-10-15 14:20:00'),
(14, 13, NULL, N'Ưu đãi khách hàng cũ', '2025-10-15 14:20:00'),
(14, 14, NULL, N'App hơi rối', '2025-10-15 14:21:00'),
(14, 15, NULL, N'CSKH gọi điện', '2025-10-15 14:21:00'),
(14, 16, NULL, N'Tin tưởng', '2025-10-15 14:22:00');

-- Bật lại trigger
ENABLE TRIGGER TrgCheckNgayKhaoSat ON SurveyAnswer;

