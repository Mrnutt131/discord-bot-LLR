import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const reactions = ['❤️', '🎨', '✨', '🔥', '💖', '🤩', '💯', '🖌️', '💕', '😻'];

const statusList = [
    { name: '🌈 ชมผลงานอาร์ตใน LOMLAYRAK', type: ActivityType.Watching },
    { name: '🎨 ดื่มด่ำกับผลงานสวยๆ', type: ActivityType.Watching },
    { name: '❤️ คัดเลือกหัวใจให้ศิลปิน', type: ActivityType.Playing },
    { name: '🖌️ แอบดูคนวาดรูปเก่งๆ', type: ActivityType.Watching },
    { name: '💖 ใจบางไปกับรูปพวกนี้', type: ActivityType.Watching }
];

client.once(Events.ClientReady, (c) => {
    console.log(`[Guardian] พร้อมปฏิบัติการในนาม ${c.user.tag}`);

    // ตั้งค่าสถานะเริ่มต้นทันที
    const setRandomStatus = () => {
        const randomStatus = statusList[Math.floor(Math.random() * statusList.length)];
        client.user.setActivity(randomStatus.name, { type: randomStatus.type });
    };

    setRandomStatus();
    setInterval(setRandomStatus, 60000);
});

client.on(Events.MessageCreate, async (message) => {
    // ตรวจสอบเงื่อนไขห้องและผู้ส่ง
    if (message.author.bot) return;
    if (message.channel.id !== process.env.FANART_CHANNEL_ID) return;

    // ตรวจสอบว่ามีรูปภาพแนบมาด้วย
    if (message.attachments.size > 0) {
        try {
            const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
            await message.react(randomEmoji);
        } catch (error) {
            console.error('[Guardian] เกิดข้อผิดพลาดในการ Reaction:', error);
        }
    }
});

// ตรวจสอบว่ามี Token หรือไม่ก่อน login
if (!process.env.FANART_TOKEN) {
    console.error("❌ ไม่พบ FANART_TOKEN ในไฟล์ .env");
} else {
    client.login(process.env.FANART_TOKEN);
}
