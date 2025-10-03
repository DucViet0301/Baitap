require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Lưu phản hồi khách hàng vào MongoDB, đảm bảo là khách đó đã trả lời đầy đủ tất cả câu hỏi trong khảo sát
async function submitSurveyResponse(customerResponse) {
  try {
    await client.connect();
    const db = client.db('quanlikhaosatkhachhang');

  
    const surveys = db.collection('survey');  
    const responses = db.collection('responses');

    const session = client.startSession();

    await session.withTransaction(async () => {
      const surveyId = new ObjectId(customerResponse.surveyId);

 
      const survey = await surveys.findOne({ _id: surveyId }, { session });

      if (!survey) throw new Error('❌ Không tìm thấy khảo sát.');


      const questionIds = survey.questions.map(q => q.id);


      const answeredIds = Object.keys(customerResponse.answers);


      const missingQuestions = questionIds.filter(qId => !answeredIds.includes(qId));

      if (missingQuestions.length > 0) {
        throw new Error(`❌ Bạn chưa trả lời hết câu hỏi (${missingQuestions.join(', ')})!`);
      }

      
      await responses.insertOne(
        {
          surveyId,
          answers: customerResponse.answers,
          createdAt: new Date()
        },
        { session }
      );

      console.log('✅ Phản hồi đã được lưu thành công!');
    });
  } catch (error) {
    console.error('🚨 Lỗi:', error.message);
  } finally {
    await client.close();       
  }
}


submitSurveyResponse({
  surveyId: '68efd0d340bd75d4e244153a',
  answers: {
    "quest 1": "Nguyễn Văn A",
      "quest 2": "a@gmail.com",
      "quest 3": "0912345678",
      "quest 4": 2,
      "quest 5": 1,
      "quest 6": "Hà Nội",
      "quest 7": 1,
      "quest 8": 2,
      "quest 9": 4,
      "quest 10": 1,
      "quest 11": 2,
      "quest 12": "Sản phẩm ổn định, dễ sử dụng",
      "quest 13": "Nên thêm nhiều ưu đãi hơn",
      "quest 14": "Không có góp ý thêm",
      "quest 15": "Hỗ trợ nhanh hơn nữa",
      "quest 16": "Tốt, thân thiện, tiện lợi"
  }
});

//Bắt buộc khách hàng phải trả lời câu hỏi “quest 1” và “quest 6”.
//Câu trả lời cho “quest 9” phải là số (number).
// async function submitSurveyResponse(customerResponse) {
//   try {
//     await client.connect();
//     const db = client.db('quanlikhaosatkhachhang');
//     const surveys = db.collection('survey');
//     const responses = db.collection('responses');

//     const session = client.startSession();

//     await session.withTransaction(async () => {
//       const surveyId = new ObjectId(customerResponse.surveyId);

//       const survey = await surveys.findOne({ _id: surveyId }, { session });
//       if (!survey) throw new Error('❌ Không tìm thấy khảo sát.');

//       const questionIds = survey.questions.map(q => q.id);
//       const answeredIds = Object.keys(customerResponse.answers);
//       const missingQuestions = questionIds.filter(qId => !answeredIds.includes(qId));
//       if (missingQuestions.length > 0) {
//         throw new Error(`❌ Bạn chưa trả lời hết câu hỏi (${missingQuestions.join(', ')})!`);
//       }

//       if (!customerResponse.answers["quest 1"] || !customerResponse.answers["quest 6"]) {
//         throw new Error("❌ Bạn phải trả lời cả câu hỏi 'quest 1' và 'quest 6'!");
//       }


//       const quest9 = customerResponse.answers["quest 9"];
//       if (isNaN(Number(quest9))) {
//         throw new Error("❌ Câu hỏi 'quest 9' phải là một số!");
//       }

//       await responses.insertOne(
//         {
//           surveyId,
//           answers: customerResponse.answers,
//           createdAt: new Date()
//         },
//         { session }
//       );

//       console.log("✅ Phản hồi đã được lưu thành công!");
//     });

//   } catch (error) {
//     console.error("🚨 Lỗi:", error.message);
//   } finally {
//     await client.close();
//   }
// }

// submitSurveyResponse({
//   surveyId: '68efd0d340bd75d4e244153a',
//   answers: {
//     "quest 1": "Nguyễn Văn A",
//       "quest 2": "a@gmail.com",
//       "quest 3": "0912345678",
//       "quest 4": 2,
//       "quest 5": 1,
//       "quest 6": "Hà Nội",
//       "quest 7": 1,
//       "quest 8": 2,
//       "quest 9": 4,
//       "quest 10": 1,
//       "quest 11": 2,
//       "quest 12": "Sản phẩm ổn định, dễ sử dụng",
//       "quest 13": "Nên thêm nhiều ưu đãi hơn",
//       "quest 14": "Không có góp ý thêm",
//       "quest 15": "Hỗ trợ nhanh hơn nữa",
//       "quest 16": "Tốt, thân thiện, tiện lợi"
//   }
// });
