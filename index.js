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
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'image')));

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
};

const greetings = ['สวัสดี', 'สวัสดีค่ะ', 'สวัสดีครับ'];
const wellbeing = ['สบายดีไหม', 'สบายดีไหมคะ', 'สบายดีไหมครับ'];
const thanks = ['ขอบคุณ', 'ขอบคุณค่ะ', 'ขอบคุณครับ'];
const good = ['ดี', 'ดีค่ะ', 'ดีครับ', 'ดีจ้า', 'D จร้า', 'D คับ', 'D ครับ', 'D ค่ะ', 'D จ้า'];
const helpRequests = ['ขอความช่วยเหลือ', 'ขอความช่วยเหลือค่ะ', 'ขอความช่วยเหลือครับ'];
const addMenu = ['เพิ่ม', 'เพิ่มเมนู', 'เพิ่มเมนูอาหาร'];
const noUnderstand = ['ขอโทษค่ะ หนูไม่เข้าใจค่ะ ลองใหม่อีกครั้งได้มั้ยคะ 🥲','กรุณาลองใหม่ค่ะ 🙏','บ่เข้าใจเด้อ','ลองใหม่อีกครั้งนะคะ','กรุณาลองอีกทีค่ะ']

const Config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

const _client = new line.Client(Config);


async function handleEvents(event) {
    console.log(event.type);
}

app.get('/', (req, res) => {
    res.send('Jay Line bot api is running💻');
});


app.post('/v1/webhook', async (req, res) => {
    if (!events) return res.status(400).send('Bad Request');
    console.log('Webhook Called');
    console.log(req.body.events);
    const events = req.body.events; 
    console.log("Events : ", events);
    events.forEach(event => {
        const replyToken = event.replyToken;
        const userMessage = event.message.text;
        const userID = event.source.userId;
      
        if (event.type === 'message' && event.message.type === 'text') {
            console.log('User ID :', userID);
            console.log('User Message :', userMessage);
            console.log('Replay Token :', replyToken);  
            // เปลี่ยน Logic ตรงนี้
            try {
                
                axios.get(`https://api.line.me/v2/bot/profile/${userID}`, { headers: headers })
                .then(response => {
                    console.log('User Profile :', response.data);
                    let replyText = '';
                    if (greetings.includes(userMessage)) {
                        replyText = `สวัสดีคะ คุณ ${response.data.displayName} มีอะไรให้ช่วยมั้ยค่ะ 🙏`;
                    } else if (wellbeing.includes(userMessage)) {
                        replyText = 'หนูสบายดีค่ะ ขอบคุณที่ถามค่ะ 🙏';
                    } else if (thanks.includes(userMessage)) {
                        replyText = 'ยินดีค่ะ มีอะไรให้ช่วยอีกมั้ยคะ 🙏';
                    } else if (good.includes(userMessage)) {
                        replyText = 'ดีค่ะ มีอะไรให้ช่วยมั้ยคะ 🙏';
                    } else if (helpRequests.includes(userMessage)) {
                        replyText = 'สวัสดีค่ะ มีอะไรให้ช่วยมั้ยคะ 🙏\nหากต้องการให้ดูเมนูอาหารเเละประเมิณเเคลสามารถส่งรูปภาพมาได้เลยค่ะ';
                    } else if (addMenu.includes(userMessage)) {
                        replyText = 'สวัสดีค่ะ สามารถส่งรูปภาพเมนูอาหารมาได้เลยค่ะ 🙏';
                    } else {
                        replyText = noUnderstand[Math.floor(Math.random() * noUnderstand.length)];
                    }
                    replyMessage(replyToken, replyText, userID);
                })
                .catch(error => {
                    console.log('Error sending message:', error);
                });
               
            } catch (error) {
                console.log('Error sending message:', error.message);
            }
        } else if (event.type === 'message' && event.message.type === 'image') {
            // ! เงื่อนไขสำหรับรูปภาพ
            precessImage(replyToken, event.message.id, userID);
            

        }
    });
    res.sendStatus(200);
});

async function replyMessage(replyToken, message, userID) {
    console.log('ReplyMessage Called');
    console.log('User ID :', userID);
    console.log('Reply Message :', message);
    try {
        const body = {
            replyToken: replyToken,
            messages: [{
                type: 'text',
                text: message
            }]
        };
        
        const result = await axios.post('https://api.line.me/v2/bot/message/reply', body, 
            { 
                headers: headers 
            })
            if (result.status === 200) {
                console.log(result.data);
            }else {
                console.log('Error sending message:', result.data);
            }
    } catch (error) {
        console.log('Error sending message:', error.message);
    }
    
}

function replyImage(replyToken, imageId) {


    try {
       
      
        const body = {
            replyToken: replyToken,
            messages: [
                {
                    type: "flex",
                    altText: "This is a Flex Message",
                    contents: {
                        type: "bubble",
                        hero: {
                            type: "image",
                            url: `${process.env.DOMAIN}/${imageId}_processed.jpg`,
                            size: "full",
                            aspectRatio: "20:13",
                            aspectMode: "cover",
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "นี้คือรูปภาพจาก openCV",
                                    weight: "bold",
                                    size: "xl",
                                },
                                {
                                    type: "text",
                                    text: "[ระบบ] : อยู่ในช่วงพัฒนา",
                                    margin: "md",
                                },
                            ],
                        },
                        footer: {
                            type: "box",
                            layout: "vertical",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "button",
                                    style: "primary",
                                    height: "sm",
                                    action: {
                                        type: "uri",
                                        label: "View Image",
                                        uri: `${process.env.DOMAIN}/${imageId}_processed.jpg`,
                                    },
                                },
                            ],
                            flex: 0,
                        },
                    },
                },
                {
                    type: "image",
                    originalContentUrl: `${process.env.DOMAIN}/${imageId}_processed.jpg`,
                    previewImageUrl: `${process.env.DOMAIN}/${imageId}_processed.jpg`
                },
            ],
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

async function precessImage(replyToken, imageId) {
    const downloadPath = path.join(__dirname, 'image', `${imageId}.jpg`);
    const pipelineSync = util.promisify(pipeline);

    try {
        const stream = await _client.getMessageContent(imageId);
        const folderDownload = fs.createWriteStream(downloadPath);
        await pipelineSync(stream, folderDownload);

        const form = new FormData();
        form.append('image', fs.createReadStream(downloadPath));

        const response = await axios.post(`http://127.0.0.1:5000/process`, form, {
            headers: {
                ...form.getHeaders(),
            },
            responseType: 'arraybuffer',
        });

        const processedImagePath = path.join(__dirname, 'image', `${imageId}_processed.jpg`);
        fs.writeFileSync(processedImagePath, response.data);

        // Send processed image to user
        replyImage(replyToken, imageId);

    } catch (error) {
        console.log('Error processing image:', error.message);
    }

   
    
}
function saveUserToDatabase(userID) {
    console.log('Save user to database :', userID);
}



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Jay] JS : Running on http://localhost:${PORT}`);
});

module.exports = app;