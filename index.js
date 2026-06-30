import 'dotenv/config';
import { Client, Events, GatewayIntentBits, ActivityType } from 'discord.js';

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

client.once(Events.ClientReady, async (c) => {
    console.log(`📢 บอทออนไลน์แล้ว: ${c.user.tag}`);

    client.user.setActivity('📣ประกาศข่าวสาร LOMLAYRAK', { type: ActivityType.Playing });
    setInterval(() => {
        client.user.setActivity('📣ประกาศข่าวสาร LOMLAYRAK', { type: ActivityType.Playing }); 
    }, 60000);

    // ลงทะเบียนคำสั่งแบบแยกชัดเจน
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
            description: 'สร้างโหวต',
            options: [
                { name: 'channel', description: 'ห้องที่ต้องการส่ง', type: 7, required: true },
                { name: 'question', description: 'หัวข้อโหวต', type: 3, required: true },
                { name: 'file', description: 'แนบรูปภาพประกอบโหวต', type: 11, required: false }
            ]
        }
    ]);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // --- คำสั่งประกาศข่าวสาร ---
    if (interaction.commandName === 'broadcast') {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const message = interaction.options.getString('message');
        const file = interaction.options.getAttachment('file');

        const content = `**📢 ${title.toUpperCase()}**\n\n${message}`;
        await channel.send({ content: content, files: file ? [file] : [] });
        await interaction.reply({ content: '✅ ประกาศส่งแล้ว!', ephemeral: true });
    }

    // --- คำสั่งโหวต ---
    if (interaction.commandName === 'poll') {
        const channel = interaction.options.getChannel('channel');
        const question = interaction.options.getString('question');
        const file = interaction.options.getAttachment('file');

        const content = `**📊 หัวข้อโหวต:**\n${question}\n\n(✅ เห็นด้วย / ❌ ไม่เห็นด้วย)`;
        const pollMsg = await channel.send({ content: content, files: file ? [file] : [] });
        
        await pollMsg.react('✅');
        await pollMsg.react('❌');
        await interaction.reply({ content: '✅ สร้างโหวตเรียบร้อย!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
