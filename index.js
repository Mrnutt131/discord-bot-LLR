import 'dotenv/config';
import { Client, Events, GatewayIntentBits, ActivityType, EmbedBuilder, AttachmentBuilder } from 'discord.js';

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

client.once(Events.ClientReady, async (c) => {
    console.log(`📢 บอทออนไลน์แล้ว: ${c.user.tag}`);

    // ตั้งค่าสถานะบอท
    client.user.setActivity('📣ประกาศข่าวสารสำคัญของ LOMLAYRAK', { type: ActivityType.Playing });
    setInterval(() => {
        client.user.setActivity('📣ประกาศข่าวสารสำคัญของ LOMLAYRAK', { type: ActivityType.Playing }); 
    }, 60000);

    // ลงทะเบียนคำสั่ง Slash Command (แบบ Global)
    await client.application.commands.set([
        {
            name: 'broadcast',
            description: 'ประกาศข่าวสารพร้อมรูปภาพ/ไฟล์แนบ',
            options: [
                { name: 'channel', description: 'เลือกห้องที่ต้องการส่ง', type: 7, required: true }, // 7 = Channel
                { name: 'title', description: 'หัวข้อประกาศ', type: 3, required: true }, // 3 = String
                { name: 'message', description: 'รายละเอียดประกาศ', type: 3, required: true },
                { name: 'file', description: 'เลือกไฟล์หรือรูปภาพจากเครื่อง', type: 11, required: false } // 11 = Attachment
            ]
        }
    ]);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'broadcast') {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        const attachment = interaction.options.getAttachment('file');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: '❌ เลือกได้เฉพาะช่องข้อความเท่านั้น!', ephemeral: true });
        }

        // เตรียมข้อมูลส่งแบบธรรมดา
        let options = {
            content: message // ส่งแค่ข้อความธรรมดา
        };

        // ถ้ามีไฟล์แนบ ก็แค่ใส่เข้าไปใน options.files
        if (attachment) {
            options.files = [attachment];
        }

        try {
            await channel.send(options); // ส่งแบบธรรมดา
            await interaction.reply({ content: `✅ ส่งประกาศไปที่ ${channel} เรียบร้อยแล้ว!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการส่งประกาศ', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
