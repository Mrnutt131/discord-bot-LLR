import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

// สั่งเปิดบอทพร้อมกำหนด Intents ให้รับรู้เรื่องสมาชิกในเซิร์ฟเวอร์ (GuildMembers)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers // สำคัญมาก! สิทธิ์ตัวนี้ใช้สำหรับตรวจจับคนเข้าเซิร์ฟ
    ]
});

client.once(Events.ClientReady, readyClient => {
    console.log(`🌴 บอทต้อนรับออนไลน์แล้วในชื่อ: ${readyClient.user.tag}`);
});

// ตรวจจับเมื่อมีคนกดเข้าเซิร์ฟเวอร์มาใหม่
client.on(Events.GuildMemberAdd, async member => {
    try {
        // ดึงไอดีช่องต้อนรับจากไฟล์ .env
        const welcomeChannelId = process.env.CHANNEL_WELCOME;
        const channel = await member.guild.channels.fetch(welcomeChannelId);

        if (!channel) return console.log('❌ หาช่องต้อนรับไม่เจอ เช็ก ID ในไฟล์ .env อีกรอบครับ');

        // ข้อความต้อนรับสไตล์คอมมูนิตี้ริมหาด พร้อมเมนชันแท็กชื่อผู้ใช้คนนั้น (<@${member.id}>)
        const welcomeMessage = `🌴🌊 WELCOME TO LOMLAYRAK — ยินดีต้อนรับคุณ <@${member.id}> สู่คอมมูนิตี้ริมหาดอย่างเป็นทางการ ขอให้มีความสุขกับช่วงเวลาพักผ่อนที่นี่ครับ ✨🌴`;

        // ส่งข้อความลงห้องต้อนรับ
        await channel.send(welcomeMessage);
       // console.log(`ส่งข้อความต้อนรับคุณ ${member.user.tag} เรียบร้อย!`);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่งข้อความต้อนรับ:', error);
    }
});

// ล็อกอินด้วย Token บอทต้อนรับโดยเฉพาะ
client.login(process.env.TOKEN_WELCOME);