require('dotenv').config();
const { Client, GatewayIntentBits, Events, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// รายการอิโมจิสำหรับ Reaction
const reactions = ['❤️', '🎨', '✨', '🔥', '💖', '🤩', '💯', '🖌️', '💕', '😻'];

// รายการสถานะสำหรับการสุ่ม
const statusList = [
    { name: '🌈ชมผลงานอาร์ตใน LOMLAYRAK', type: ActivityType.Watching },
    { name: '🎨ดื่มด่ำกับผลงานสวยๆ', type: ActivityType.Watching },
    { name: '❤️คัดเลือกหัวใจให้ศิลปิน', type: ActivityType.Playing },
    { name: '🖌️แอบดูคนวาดรูปเก่งๆ', type: ActivityType.Watching },
    { name: '💖ใจบางไปกับรูปพวกนี้', type: ActivityType.Watching }
];

client.once(Events.ClientReady, (c) => {
    console.log(`[Guardian] พร้อมปฏิบัติการในนาม ${c.user.tag}`);

    // สุ่มสถานะทุก 1 นาที
    setInterval(() => {
        const randomStatus = statusList[Math.floor(Math.random() * statusList.length)];
        client.user.setActivity(randomStatus.name, { type: randomStatus.type });
    }, 60000);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.channel.id !== process.env.FANART_CHANNEL_ID || message.author.bot) return;

    // ตรวจสอบว่ามีรูปภาพในข้อความ
    if (message.attachments.size > 0) {
        try {
            // สุ่มอิโมจิ 1 ตัว
            const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
            await message.react(randomEmoji);
        } catch (error) {
            console.error('Error reacting:', error);
        }
    }
});

client.login(process.env.FANART_TOKEN);
