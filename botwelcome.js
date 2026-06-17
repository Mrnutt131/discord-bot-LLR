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
    // 🥥 หมวดต้อนรับแบบอบอุ่น
    "ขอบคุณที่ทิ้งความเหนื่อยล้าไว้ข้างหลัง แล้วมาพักผ่อนที่หาดของเรานะครับ! 🥥✨",
    "เราดีใจมากที่คุณล่องเรือมาเจอกับครอบครัวชาว LOMLAYRAK ของเรา! 🌻🏝️",
    "ยินดีต้อนรับสู่ก้าวแรกที่ LOMLAYRAK ขอให้เป็นช่วงเวลาที่แสนพิเศษนะครับ! 🌞🌊",
    
    // 🏖️ หมวดชวนทำกิจกรรม
    "เตรียมตัวให้พร้อม แล้วไปดำดิ่งกับกิจกรรมสุดจี๊ดในเซิร์ฟเวอร์ได้เลยครับ! 🏖️🍹",
    "หาดนี้มีกิจกรรมรออยู่เพียบ อย่าลืมเปิดแจ้งเตือนไว้ จะได้ไม่พลาดประกาศเด็ดๆ ครับ! 🔔🏄‍♂️",
    "พร้อมแล้วก็แวะไปแนะนำตัวที่ห้องพูดคุย ให้เพื่อนๆ ได้ทักทายกันหน่อยนะครับ! 🗣️✨",
    
    // 🌊 หมวดบรรยากาศชิลล์ๆ
    "ขอให้มีความสุขกับบรรยากาศสุดชิลล์เหมือนนั่งฟังเสียงคลื่นกระทบฝั่งครับ! 🐚🎐",
    "สงสัยตรงไหนไม่ต้องเกรงใจครับ ทักถามเพื่อนๆ ในหาดได้เลย ทุกคนยินดีต้อนรับ! 🤝💙",
    "ที่นี่ไม่มีอะไรนอกจากความสนุกและความเป็นกันเอง ขอให้มีความสุขนะครับ! 🐬🐚",
    "สูดลมหายใจเข้าลึกๆ แล้วมาปล่อยใจไปกับคอมมูนิตี้สุดอบอุ่นของเรากัน! 🌬️🏖️",
    "ถ้าอยากหาเพื่อนคุยหรือมีเรื่องปรึกษา ชาวหาดเราพร้อมซัพพอร์ตเสมอครับ! 🦀🧡",
    "ทิ้งเรื่องเครียดไว้ที่อื่น แล้วมาเติมพลังงานบวกไปพร้อมกันที่หาดนี้เลย! 🌅💫",
    "มีเพื่อนใหม่เข้ามาอีกคนแล้ว! หวังว่าคุณจะชอบที่นี่เหมือนกับพวกเรานะ! 🌊🧉",
    "ไม่ว่าวันนี้จะเหนื่อยแค่ไหน มานั่งเล่นที่หาด LOMLAYRAK ให้สบายใจได้เลย! ⛵✨",
    "ยินดีต้อนรับสู่พื้นที่แห่งความสุข ที่นี่มีแต่รอยยิ้มและมิตรภาพรอคุณอยู่! 😊🌴"
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
        
        // ปรับรูปแบบข้อความให้เป็นบรรทัดเดียวตามสไตล์ในภาพ image_4641a8.png
        const welcomeMessage = `🌴🌊 WELCOME TO LOMLAYRAK — ยินดีต้อนรับคุณ <@${member.id}> ${randomQuote}`;

        await channel.send(welcomeMessage);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่งข้อความต้อนรับ:', error);
    }
});

client.login(process.env.TOKEN_WELCOME);
