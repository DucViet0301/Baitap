use quanlikhaosatkhachhang
db.createCollection('survey')
db.survey.insertMany([
  {
    title: 'Khảo sát mức độ hài lòng khách hàng',
    description: 'Thu thập phản hồi của khách hàng để cải thiện sản phẩm và dịch vụ',
    questions: [
      { id: 'quest 1', text: 'Họ và tên', type: 'text' },
      { id: 'quest 2', text: 'Email', type: 'text' },
      { id: 'quest 3', text: 'Số điện thoại', type: 'text' },
      { id: 'quest 4',
        text: 'Độ tuổi',
        type: 'single_choice',
        options: ['Dưới 18', '18–25', '26–35', '36–50', 'Trên 50'] },
      {
        id: 'quest 5',
        text: 'Giới tính',
        type: 'single_choice',
        options: ['Nam', 'Nữ', 'Khác']
      },
      {
        id: 'quest 6', text: 'Bạn sống ở đâu', type: 'text' 
      },
      {
        id: 'quest 7',
        text: 'Bạn biết đến sản phẩm/dịch vụ của chúng tôi từ đâu?',
        type: 'single_choice',
        options: ['Mạng xã hội', 'Bạn bè giới thiệu', 'Quảng cáo online', 'Khác']
      },
      {
        id: 'quest 8',
        text: 'Bạn đã sử dụng sản phẩm/dịch vụ của chúng tôi bao lâu?',
        type: 'single_choice',
        options: ['Dưới 1 tháng', '1–6 tháng', '6–12 tháng', 'Trên 1 năm']
      },
      {
        id: 'quest 9',
        text: 'Bạn đánh giá mức độ hài lòng chung về sản phẩm/dịch vụ (1–5)?',
        type: 'rating',
        options: ['1', '2', '3', '4', '5']
      },
      {
        id: 'quest 10',
        text: 'Bạn có sẵn sàng giới thiệu sản phẩm/dịch vụ cho người khác không?',
        type: 'single_choice',
        options: ['Có', 'Không']
      },
      {
        id: 'quest 11',
        text: 'Giá cả sản phẩm/dịch vụ so với chất lượng',
        type: 'single_choice',
        options: ['Quá cao', 'Hợp lý', 'Rẻ']
      },
      { id: 'quest 12', text: 'Bạn thích điều gì nhất ở sản phẩm/dịch vụ của chúng tôi?', type: 'text' },
      { id: 'quest 13', text: 'Theo bạn, chúng tôi cần cải thiện điều gì để phục vụ tốt hơn?', type: 'text' },
      { id: 'quest 14', text: 'Bạn có góp ý nào khác về trải nghiệm sử dụng?', type: 'text' },
      { id: 'quest 15', text: 'Bạn mong muốn dịch vụ chăm sóc khách hàng cải thiện ra sao?', type: 'text' },
      { id: 'quest 16', text: 'Bạn có thể mô tả bằng một vài từ khóa cảm nhận chung về sản phẩm/dịch vụ?', type: 'text' }
    ],
    createdAt: new Date()
  }
]);
db.createCollection('responses')
db.responses.insertMany([
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Nguyễn Văn A","quest 2":"a@gmail.com","quest 3":"0912345678","quest 4":2,"quest 5":1,"quest 6": "Hà Nội","quest 7":1,"quest 8":2,"quest 9":4,"quest 10":1,"quest 11":2,"quest 12":"Sản phẩm ổn định, dễ sử dụng","quest 13":"Nên thêm nhiều ưu đãi hơn","quest 14":"Không có góp ý thêm","quest 15":"Hỗ trợ nhanh hơn nữa","quest 16":"Tốt, thân thiện, tiện lợi"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Trần Thị B","quest 2":"b@gmail.com","quest 3":"0987654321","quest 4":3,"quest 5":2,"quest 6":"Hà Tĩnh","quest 7":2,"quest 8":3,"quest 9":5,"quest 10":1,"quest 11":3,"quest 12":"Dịch vụ thân thiện","quest 13":"Tốc độ xử lý đơn hàng","quest 14":"Ứng dụng nên có chế độ tối","quest 15":"Chăm sóc khách hàng thường xuyên hơn","quest 16":"Nhanh, rẻ, tiện lợi"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Phạm Thị Q","quest 2":"q.pham@example.com","quest 3":"0912000111","quest 4":3,"quest 5":2,"quest 6": "Đà Nẵng" ,"quest 7":2,"quest 8":2,"quest 9":5,"quest 10":1,"quest 11":2,"quest 12":"Sản phẩm tốt","quest 13":"Thêm khuyến mãi","quest 14":"Ứng dụng hơi chậm","quest 15":"Chat nhanh hơn","quest 16":"Tiện lợi, ổn định"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Đỗ Văn R","quest 2":"r.do@example.com","quest 3":"0934111222","quest 4":4,"quest 5":1,"quest 6":"Thanh Hoa","quest 7":1,"quest 8":4,"quest 9":4,"quest 10":1,"quest 11":2,"quest 12":"Uy tín","quest 13":"Thêm ưu đãi khách hàng lâu năm","quest 14":"Giao diện hơi rối","quest 15":"CSKH gọi điện","quest 16":"Tin tưởng, quen dùng"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Nguyễn Thị S","quest 2":"s.nguyen@example.com","quest 3":"0903222333","quest 4":2,"quest 5":2,"quest 6":"Quảng Bình","quest 7":3,"quest 8":1,"quest 9":3,"quest 10":2,"quest 11":1,"quest 12":"Thiết kế đẹp","quest 13":"Giảm giá sinh viên","quest 14":"Khó đăng nhập","quest 15":"Chatbot hỗ trợ","quest 16":"Đẹp nhưng đắt"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Hoàng Văn T","quest 2":"t.hoang@example.com","quest 3":"0914333444","quest 4":3,"quest 5":1,"quest 6":"Hà Nội","quest 7":4,"quest 8":3,"quest 9":2,"quest 10":2,"quest 11":1,"quest 12":"Uy tín","quest 13":"Giảm phí ship","quest 14":"App hay lỗi","quest 15":"Hotline 24/7","quest 16":"Tốt nhưng đắt"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Trần Thị U","quest 2":"u.tran@example.com","quest 3":"0935444555","quest 4":2,"quest 5":2,"quest 6":"Nam Định","quest 7":1,"quest 8":2,"quest 9":5,"quest 10":1,"quest 11":3,"quest 12":"Giá tốt","quest 13":"Chăm sóc khách hàng tốt hơn","quest 14":"Chưa nhiều sản phẩm","quest 15":"Chat nhanh hơn","quest 16":"Giá rẻ, hài lòng"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Lê Văn V","quest 2":"v.le@example.com","quest 3":"0905666777","quest 4":3,"quest 5":1,"quest 6":"Hải Phòng","quest 7":2,"quest 8":4,"quest 9":4,"quest 10":1,"quest 11":2,"quest 12":"Chăm sóc tốt","quest 13":"Giao hàng nhanh","quest 14":"Ít tính năng","quest 15":"Zalo hỗ trợ","quest 16":"Ổn, dễ dùng"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Phùng Thị W","quest 2":"w.phung@example.com","quest 3":"0936777888","quest 4":2,"quest 5":2,"quest 6":"TP. HCM","quest 7":1,"quest 8":1,"quest 9":5,"quest 10":1,"quest 11":3,"quest 12":"Nhiều khuyến mãi","quest 13":"Thêm sản phẩm","quest 14":"Lỗi đăng nhập","quest 15":"Chat 24/7","quest 16":"Tiện lợi, giá rẻ"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Vũ Văn X","quest 2":"x.vu@example.com","quest 3":"0917888999","quest 4":4,"quest 5":1,"quest 6":"Nghệ An","quest 7":4,"quest 8":3,"quest 9":3,"quest 10":2,"quest 11":1,"quest 12":"Uy tín","quest 13":"Giảm giá nhiều hơn","quest 14":"Không đồng bộ web/app","quest 15":"CSKH nhanh","quest 16":"Ổn nhưng đắt"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Nguyễn Thị Y","quest 2":"y.nguyen@example.com","quest 3":"0978999000","quest 4":3,"quest 5":2,"quest 6":"Cần Thơ","quest 7":2,"quest 8":2,"quest 9":4,"quest 10":1,"quest 11":2,"quest 12":"Nhân viên nhiệt tình","quest 13":"Mở thêm chi nhánh","quest 14":"Khó sử dụng app","quest 15":"Chat video","quest 16":"Thân thiện"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Ngô Văn Z","quest 2":"z.ngo@example.com","quest 3":"0938000111","quest 4":2,"quest 5":1,"quest 6":"Hà Nội","quest 7":3,"quest 8":1,"quest 9":2,"quest 10":2,"quest 11":1,"quest 12":"Mẫu mã ổn","quest 13":"Cần thêm tính năng","quest 14":"Lỗi thanh toán","quest 15":"Chatbot AI","quest 16":"Đẹp nhưng chậm"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Phạm Thị AA","quest 2":"aa.pham@example.com","quest 3":"0912111001","quest 4":3,"quest 5":2,"quest 6":"Huế","quest 7":2,"quest 8":2,"quest 9":5,"quest 10":1,"quest 11":2,"quest 12":"Dịch vụ tốt","quest 13":"Thêm ưu đãi","quest 14":"App hơi chậm","quest 15":"Chat nhanh","quest 16":"Tiện lợi"},createdAt:new Date()},
{surveyId:ObjectId('68d54977c198d53a0efd9e39'),answers:{"quest 1":"Đỗ Văn BB","quest 2":"bb.do@example.com","quest 3":"0938222333","quest 4":4,"quest 5":1,"quest 6":"Hà Nam","quest 7":1,"quest 8":4,"quest 9":4,"quest 10":1,"quest 11":2,"quest 12":"Uy tín","quest 13":"Ưu đãi khách hàng cũ","quest 14":"App hơi rối","quest 15":"CSKH gọi điện","quest 16":"Tin tưởng"},createdAt:new Date()},

])
//Tạo index
db.responses.createIndex({ "answers.quest 4": 1 });
db.responses.createIndex({ 
  "answers.quest 12": "text",
  "answers.quest 13": "text"
});
// Đếm số khách hàng đánh giá tốt trở lên
db.responses.aggregate([
  {
    $match: {
      "answers.quest 9": { $in: [4, 5] }
    }
  },
  {
    $count: "totalGoodReviews"
  }
]);

// Đếm tổng số khách hàng đến từ Hà Nội
db.responses.aggregate([
  {
    $match: {
      "answers.quest 6": "Hà Nội"
    }
  },
  {
    $count: "total_customers"
  }
])

// Đếm khách hàng sẵn sàng giới thiệu (quest 10 = "Có")
db.responses.aggregate([
  {
    $match: {
      "answers.quest 10": 1 
    }
  },
  {
    $count: "total_willing_to_recommend"
  }
]);
// Đếm khách hàng độ tuổi 18-25
db.responses.aggregate([
  {
    $match: {
      "answers.quest 4": 2
    }
  },
  {
    $count: "total_age_18_25"
  }
]);

// Đếm khách hàng đánh giá giá hợp lý
db.responses.aggregate([
  {
    $match: {
      "answers.quest 11": 1
    }
  },
  {
    $count: "total_fair_price"
  }
])
//  Tìm từ khóa xuất hiện nhiều trong quest 12
db.responses.aggregate([
  {
    $match: {
      "answers.quest 12": { $exists: true, $ne: "" }
    }
  },
  {
    $project: {
      words: {
        $split: [{ $toLower: "$answers.quest 12" }, " "]
      }
    }
  },
  {
    $unwind: "$words"
  },
  {
    $group: {
      _id: "$words",
      count: { $sum: 1 }
    }
  },
  {
    $match: {
      _id: { $nin: ["", "của", "và", "cho", "với", "là", "có", "được"] }
    }
  },
  {
    $sort: { count: -1 }
  },
  {
    $limit: 20
  }
])
// Lấy góp ý từ khách hàng đánh giá thấp (1-3 sao)
db.responses.aggregate([
  {
    $match: {
      "answers.quest 9": { $in: [1 ,2, 3] },
      "answers.quest 13": { $exists: true, $ne: "" }
    }
  },
  {
    $project: {
      rating: "$answers.quest 9",
      improvement: "$answers.quest 13"
    }
  },
  {
    $sort: { rating: 1 }
  }
])


