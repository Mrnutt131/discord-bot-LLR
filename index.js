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
        const title = interaction.options.getString('title');
        const message = interaction.options.getString('message');
        const attachment = interaction.options.getAttachment('file');

        // ตรวจสอบว่าส่งไปห้องข้อความใช่หรือไม่
        if (!channel.isTextBased()) {
            return interaction.reply({ content: '❌ เลือกได้เฉพาะช่องข้อความเท่านั้น!', ephemeral: true });
        }

        // สร้าง Embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(message)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({ text: 'LOMLAYRAK System' });

        const options = { embeds: [embed] };

        // ถ้ามีไฟล์แนบมาด้วย
        if (attachment) {
            embed.setImage(`attachment://${attachment.name}`);
            options.files = [attachment];
        }

        try {
            await channel.send(options);
            await interaction.reply({ content: `✅ ส่งประกาศไปที่ ${channel} เรียบร้อยแล้ว!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการส่งประกาศ', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
