require('dotenv').config();

const line = require('@line/bot-sdk');

const util = require('util');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');
const FormData = require('form-data');


const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'image')));

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
};
// 
const noUnserstand = [
    'ขอโทษค่ะ หนูไม่เข้าใจค่ะ ลองใหม่อีกครั้งได้มั้ยคะ 🥲',
    'กรุณาลองใหม่ค่ะ 🙏',
    'บ่เข้าใจเด้อ',
    'ลองใหม่อีกครั้งนะคะ',
    'กรุณาลองอีกทีค่ะ'
]
const Config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

const _client = new line.Client(Config);

async function handleEvents(event) {
    console.log(event.type);
}


app.post('/v1/webhook', (req, res) => {
    const events = req.body.events;
    
    events.forEach(event => {
        const replyToken = event.replyToken;
        const userMessage = event.message.text;
        const userID = event.source.userId;
      
        if (event.type === 'message' && event.message.type === 'text') {
            // ! เงื่อนไขสำหรับข้อความ
            axios.get(`https://api.line.me/v2/bot/profile/${userID}`, { headers: headers })
            .then(response => {
                
                if (userMessage === 'สวัสดี' || userMessage === 'สวัสดีค่ะ' || userMessage === 'สวัสดีครับ') {
                    replyMessage(replyToken, `สวัสดีคะ คุณ ${response.data.displayName} มีอะไรให้ช่วยมั้ยค่ะ 🙏`, userID);
                }else if (userMessage === 'สบายดีไหม' || userMessage === 'สบายดีไหมคะ' || userMessage === 'สบายดีไหมครับ') {
                    replyMessage(replyToken, `หนูสบายดีค่ะ ขอบคุณที่ถามค่ะ 🙏`, userID)
                } else if (userMessage === 'ขอบคุณ' || userMessage === 'ขอบคุณค่ะ' || userMessage === 'ขอบคุณครับ') {
                    replyMessage(replyToken, `ยินดีค่ะ มีอะไรให้ช่วยอีกมั้ยคะ 🙏`, userID);
                } else if (userMessage === 'ดี' || userMessage === 'ดีค่ะ' || userMessage === 'ดีครับ' || userMessage === 'ดีจ้า' || userMessage === 'D จร้า' || userMessage === 'D คับ' || userMessage === 'D ครับ' || userMessage === 'D ค่ะ' || userMessage === 'D จ้า') {
                    replyMessage(replyToken, `ดีค่ะ มีอะไรให้ช่วยมั้ยคะ 🙏`, userID);
                } else if (userMessage === 'ขอความช่วยเหลือ' || userMessage === 'ขอความช่วยเหลือค่ะ' || userMessage === 'ขอความช่วยเหลือครับ') {
                    replyMessage(replyToken, `สวัสดีค่ะ มีอะไรให้ช่วยมั้ยคะ 🙏\nหากต้องการให้ดูเมนูอาหารเเละประเมิณเเคลสามารถส่งรูปภาพมาได้เลยค่ะ`, userID);
                } else if (userMessage === 'เพิ่ม' || userMessage === 'เพิ่มเมนู' || userMessage === 'เพิ่มเมนูอาหาร') {
                    replyMessage(replyToken, `สวัสดีค่ะ สามารถส่งรูปภาพเมนูอาหารมาได้เลยค่ะ 🙏`, userID);
                }
                else {
                    const no_unDerstand = noUnserstand[Math.floor(Math.random() * noUnserstand.length)];
                    console.log(no_unDerstand);
                    replyMessage(replyToken, `${no_unDerstand}  `, userID);
                }
            })
            .catch(error => {
                console.log('Error sending message:', error);
            });
           
        } else if (event.type === 'message' && event.message.type === 'image') {
            // ! เงื่อนไขสำหรับรูปภาพ
            replyImage(replyToken, event.message.id, userID);
            

        }
    });
    res.sendStatus(200);
});

function replyMessage(replyToken, message, userID) {
    
    
    const body = {
        replyToken: replyToken,
        messages: [{
            type: 'text',
            text: message
        }]
    };

    axios.post('https://api.line.me/v2/bot/message/reply', body, { headers: headers })
        .then(response => {
            console.log('Message sent successfully '+userID);
            // saveUserToDatabase(userID);
        })
        .catch(error => {
            console.log('Error sending message:', error);
        });
        
   
}


async function replyImage(replyToken, imageId) {
    const downloadPath = path.join(__dirname, 'image', `${imageId}.jpg`);
    const pipelineSync = util.promisify(pipeline);

    try {
        const stream = await _client.getMessageContent(imageId);
        const folderDownload = fs.createWriteStream(downloadPath);
        await pipelineSync(stream, folderDownload);

        const form = new FormData();
        form.append('image', fs.createReadStream(downloadPath));

        const response = await axios.post('http://127.0.0.1:5000/process', form, {
            headers: {
                ...form.getHeaders(),
            },
            responseType: 'arraybuffer',
        });

        const processedImagePath = path.join(__dirname, 'image', `${imageId}_processed.jpg`);
        fs.writeFileSync(processedImagePath, response.data);

        const body = {
            replyToken: replyToken,
            messages: [
                {
                    type: "image",
                    originalContentUrl: `https://ee23-58-11-26-134.ngrok-free.app/${imageId}_processed.jpg`,
                    previewImageUrl: `https://ee23-58-11-26-134.ngrok-free.app/${imageId}_processed.jpg`
                },
                {
                    type: 'text',
                    text: '[ระบบ] อยู่ในช่วงพัฒนา'
                },
            ]
        };

        axios.post('https://api.line.me/v2/bot/message/reply', body, { headers: headers })
            .then(response => {
                console.log('Image reply sent successfully');
            })
            .catch(error => {
                console.log('Error sending image reply:', error);
            });

    } catch (error) {
        console.log('Error processing image:', error.message);
    }
}

function precessImage(imageURL) {
    
    console.log('Process image :', imageURL);
    
}
function saveUserToDatabase(userID) {
    console.log('Save user to database :', userID);
}



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});