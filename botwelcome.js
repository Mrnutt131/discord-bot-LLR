import 'dotenv/config';
import { Client, Events, GatewayIntentBits, ActivityType } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// รายการข้อความต้อนรับแบบสุ่ม
const welcomeQuotes = [
    "ขอบคุณที่เลือกเดินทางมาพักผ่อนที่หาดแห่งนี้ของเรานะครับ! 🥥✨",
    "เตรียมตัวให้พร้อม แล้วไปสนุกกับกิจกรรมในเซิร์ฟเวอร์เราได้เลยครับ! 🏖️🍹",
    "ขอให้การเริ่มต้นที่นี่ เป็นช่วงเวลาที่ดีที่สุดของคุณนะครับ! 🌞🌊",
    "หากมีข้อสงสัยอะไร ถามคนในเซิร์ฟเวอร์ได้เลย ทุกคนเป็นมิตรมากครับ! 🤝💙",
    "ขอให้มีความสุขกับบรรยากาศสุดชิลล์ใน LOMLAYRAK แห่งนี้ครับ! 🐚🎐",
    "เราดีใจมากที่คุณเลือกมาเป็นส่วนหนึ่งของครอบครัวเราครับ! 🌻🏝️",
    "พร้อมแล้วก็ไปแนะนำตัวให้เพื่อนๆ รู้จักกันได้เลย! 🗣️✨",
    "มีกิจกรรมสนุกๆ ให้ทำเพียบเลย อย่าลืมติดตามประกาศจากแอดมินนะครับ! 🔔🏄‍♂️"
];

client.once(Events.ClientReady, (c) => {
    console.log(`🌴 บอทต้อนรับออนไลน์แล้วในชื่อ: ${c.user.tag}`);

    // ตั้งค่า Activity ให้อัปเดตทุกๆ 1 นาที
    setInterval(() => {
        client.user.setActivity('🌴ยินดีต้อนรับทุกคนสู่หาด LOMLAYRAK', { type: ActivityType.Watching });
    }, 60000);
});

client.on(Events.GuildMemberAdd, async member => {
    try {
        const welcomeChannelId = process.env.CHANNEL_WELCOME;
        const channel = await member.guild.channels.fetch(welcomeChannelId);

        if (!channel) return console.log('❌ หาช่องต้อนรับไม่เจอ เช็ก ID ในไฟล์ .env อีกรอบครับ');

        // สุ่มข้อความ
        const randomQuote = welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)];
        
        // รูปแบบข้อความแบบเต็ม
        const welcomeMessage = `🌴🌊 **WELCOME TO LOMLAYRAK** 🌊🌴\n\nยินดีต้อนรับคุณ <@${member.id}> สู่คอมมูนิตี้ริมหาดอย่างเป็นทางการครับ! ✨\n\n${randomQuote}\n\n------------------\n*ขอให้มีความสุขกับช่วงเวลาพักผ่อนที่นี่นะครับ 🐚💙*`;

        await channel.send(welcomeMessage);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่งข้อความต้อนรับ:', error);
    }
});

client.login(process.env.TOKEN_WELCOME);
