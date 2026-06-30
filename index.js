import 'dotenv/config';
import { Client, Events, GatewayIntentBits, ActivityType } from 'discord.js';

// กำหนด Intent ให้ครอบคลุมการตรวจสอบยศ
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] 
});

// ใส่ ID ยศที่อนุญาตให้ใช้งานที่นี่
const ALLOWED_ROLE_IDS = ['ID_ยศ_1', 'ID_ยศ_2']; 

client.once(Events.ClientReady, async (c) => {
    console.log(`📢 บอทออนไลน์แล้ว: ${c.user.tag}`);

    client.user.setActivity('📣ประกาศข่าวสาร LOMLAYRAK', { type: ActivityType.Playing });
    setInterval(() => {
        client.user.setActivity('📣ประกาศข่าวสาร LOMLAYRAK', { type: ActivityType.Playing }); 
    }, 60000);

    // ลงทะเบียนคำสั่ง
    await client.application.commands.set([
        {
            name: 'broadcast',
            description: 'ประกาศข่าวสารทั่วไป',
            options: [
                { name: 'channel', description: 'ห้องที่ต้องการส่ง', type: 7, required: true },
                { name: 'title', description: 'หัวข้อประกาศ', type: 3, required: true },
                { name: 'message', description: 'เนื้อหา', type: 3, required: true },
                { name: 'file', description: 'แนบรูปภาพ', type: 11, required: false }
            ]
        },
        {
            name: 'poll',
            description: 'สร้างโหวตแบบหลายตัวเลือก',
            options: [
                { name: 'channel', description: 'ห้องที่ต้องการส่ง', type: 7, required: true },
                { name: 'question', description: 'หัวข้อโหวต', type: 3, required: true },
                ...Array.from({ length: 10 }, (_, i) => ({
                    name: `option${i + 1}`,
                    description: `ตัวเลือกที่ ${i + 1}`,
                    type: 3,
                    required: i < 2
                })),
                { name: 'file', description: 'แนบรูปภาพ', type: 11, required: false }
            ]
        }
    ]);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // ตรวจสอบสิทธิ์ยศ
    const hasPermission = interaction.member.roles.cache.some(r => ALLOWED_ROLE_IDS.includes(r.id));
    if (!hasPermission) {
        return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
    }

    // --- ประกาศข่าวสาร ---
    if (interaction.commandName === 'broadcast') {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const message = interaction.options.getString('message');
        const file = interaction.options.getAttachment('file');

        await channel.send({ content: `**📢 ${title.toUpperCase()}**\n\n${message}`, files: file ? [file] : [] });
        await interaction.reply({ content: '✅ ประกาศส่งแล้ว!', ephemeral: true });
    }

    // --- สร้างโหวต ---
    if (interaction.commandName === 'poll') {
        const channel = interaction.options.getChannel('channel');
        const question = interaction.options.getString('question');
        const file = interaction.options.getAttachment('file');
        
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        let pollContent = `**📊 หัวข้อโหวต:**\n${question}\n\n`;
        let optionsList = [];

        for (let i = 1; i <= 10; i++) {
            const opt = interaction.options.getString(`option${i}`);
            if (opt) {
                pollContent += `${emojis[i - 1]} ${opt}\n`;
                optionsList.push(emojis[i - 1]);
            }
        }

        const pollMsg = await channel.send({ content: pollContent, files: file ? [file] : [] });
        for (const emoji of optionsList) await pollMsg.react(emoji);
        
        await interaction.reply({ content: '✅ สร้างโหวตเรียบร้อย!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
