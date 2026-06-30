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

// ข้อความตอบกลับเวลามีคนโพสต์ผลงาน
const replyMessages = [
    // โทนชื่นชมทั่วไป
    'ว้าว! บอบบี้ขอชมเลยนะ ผลงานสวยมากกก 🎨✨',
    'โอ้โห ฝีมือดีมากกก บอบบี้ดูแล้วต้องหยุดเลย 🔥',
    'สวยจนบอบบี้ใจละลายเลยอะ 💖',
    'นี่มันงานศิลปะชัดๆ บอบบี้ขอปรบมือให้! 🖌️✨',
    'ปังมากกก บอบบี้รักผลงานนี้เลย 💕',
    'เก่งมากกกก สุดยอด! บอบบี้ขอบอกว่าประทับใจสุดๆ 🤩',
    'รูปนี้สวยจนบอบบี้ต้องแอบส่องนานๆ 👀💖',
    'ขอบคุณที่แชร์ผลงานสวยๆ นะ บอบบี้ดีใจมากเลย 🌈',

    // โทนกวนๆ ขี้เล่น
    'เฮ้ย! นี่วาดเองจริงดิ บอบบี้ไม่เชื่อ มือคนหรือมือเทพ 😳',
    'บอบบี้ขอยืมรูปนี้ไปตั้งวอลเปเปอร์หน่อยได้ป่ะ 😏',
    'เก่งจนบอบบี้อิจฉา วาดไม่เป็นเลยอ่ะ 🥲🎨',
    'อะ! หยุดอยู่ตรงนั้นนะ บอบบี้จะมายืนปรบมือให้ 👏🔥',
    'ห้ามเก่งขนาดนี้นะ บอบบี้เขินแทน 😳💕',
    'รูปนี้ทำบอบบี้ลืมหายใจไปแป๊บนึง 😮‍💨✨',

    // โทนอบอุ่น ให้กำลังใจ
    'ขอบคุณที่ตั้งใจวาดมานะ บอบบี้เห็นความตั้งใจเลย 🥹💖',
    'พัฒนาขึ้นเรื่อยๆ เลยนะ บอบบี้ภูมิใจในตัวเธอ 🌟',
    'ทุกเส้นมีความหมาย บอบบี้ดูแล้วซึ้งใจเลย 🎨💕',
    'ศิลปินตัวจริงต้องคนนี้แหละ บอบบี้ยกนิ้วให้เลย 👍✨',
    'บอบบี้เชื่อในฝีมือเธอเสมอนะ สู้ๆ 💪🎨',

    // โทนสั้น กระชับ
    'สวยมากกก! 😍🎨',
    'เทพ! 🔥✨',
    'น่ารักจัง 💕',
    'ปังสุดๆ 💯',
    'ชอบมากเลย! 🖌️💖',
    'โดนใจบอบบี้สุดๆ 🤩',

    // โทนแซวนิดๆ น่ารักๆ
    'เดี๋ยวก่อน... บอบบี้ขอเซฟรูปนี้แอบๆ นะ 🤫📸',
    'แบบนี้สิที่เรียกว่าผลงานชั้นเทพ บอบบี้ยอมแพ้ 🙇‍♂️✨',
    'บอบบี้ว่าเธอควรเปิดร้านขายภาพได้แล้วนะเนี่ย 💰🎨',
    'รูปสวยจนบอบบี้ลืมจะพิมพ์อะไรไปเลย... เอาเป็นว่าเทพ 🔥',
    'ใครสอนวาดเนี่ย บอบบี้ขอไปเรียนด้วยคนนะ 😆🖌️'
];

const statusList = [
    { name: '🌈 ชมผลงานอาร์ตใน LOMLAYRAK', type: ActivityType.Watching },
    { name: '🎨 ดื่มด่ำกับผลงานสวยๆ', type: ActivityType.Watching },
    { name: '❤️ คัดเลือกหัวใจให้ศิลปิน', type: ActivityType.Playing },
    { name: '🖌️ แอบดูคนวาดรูปเก่งๆ', type: ActivityType.Watching },
    { name: '💖 ใจบางไปกับรูปพวกนี้', type: ActivityType.Watching }
];

client.once(Events.ClientReady, (c) => {
    console.log(`[Guardian] พร้อมปฏิบัติการในนาม ${c.user.tag}`);

    const setRandomStatus = () => {
        const randomStatus = statusList[Math.floor(Math.random() * statusList.length)];
        client.user.setActivity(randomStatus.name, { type: randomStatus.type });
    };

    setRandomStatus();
    setInterval(setRandomStatus, 60000);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.FANART_CHANNEL_ID) return;

    // ตรวจสอบว่ามีรูปภาพแนบมาด้วย (เช็คเฉพาะไฟล์ที่เป็นรูปจริงๆ)
    const hasImage = message.attachments.some(att =>
        att.contentType?.startsWith('image/')
    );

    if (hasImage) {
        try {
            // React อีโมจิแบบสุ่ม
            const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
            await message.react(randomEmoji);

            // Reply ข้อความชมแบบสุ่ม
            const randomReply = replyMessages[Math.floor(Math.random() * replyMessages.length)];
            await message.reply({
                content: randomReply,
                allowedMentions: { repliedUser: false } // ไม่ปิงเจ้าของข้อความ (เปลี่ยนเป็น true ถ้าอยากให้ปิง)
            });
        } catch (error) {
            console.error('[Guardian] เกิดข้อผิดพลาดในการ Reaction/Reply:', error);
        }
    }
});

if (!process.env.FANART_TOKEN) {
    console.error("❌ ไม่พบ FANART_TOKEN ในไฟล์ .env");
} else {
    client.login(process.env.FANART_TOKEN);
}
