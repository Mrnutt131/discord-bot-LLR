import 'dotenv/config';
import { 
    Client, 
    Events, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags,
    EmbedBuilder 
} from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ตัวแปรสำหรับเก็บข้อมูล Timer ของแต่ละห้องตั๋ว
const ticketTimers = new Map();

// ดึงเวลา Timeout จาก .env (ถ้าไม่มีจะปรับให้อัตโนมัติที่ 10 นาที)
const TIMEOUT_DURATION = parseInt(process.env.TICKET_TIMEOUT) || 600000;

// 🆔 ใส่ ID ยศแอดมิน/สต๊าฟที่พี่ให้มาโดยตรง
const ADMIN_ROLE_ID = '1507972493456179230'; 

client.once(Events.ClientReady, async readyClient => {
    console.log(`👷 บอทช่วยเหลือ v2.1 (ล็อคสิทธิ์ Owner + ยศเฉพาะ) ออนไลน์แล้ว: ${readyClient.user.tag}`);
});

// ฟังก์ชันสำหรับเริ่มนับถอยหลังปิดห้อง
function startTicketTimeout(channel) {
    if (ticketTimers.has(channel.id)) {
        clearTimeout(ticketTimers.get(channel.id));
    }

    const timer = setTimeout(async () => {
        try {
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('⚠️ ระบบปิดห้องอัตโนมัติ')
                .setDescription('เนื่องจากห้องช่วยเหลือนี้ไม่มีการเคลื่อนไหวหรือพิมพ์ข้อความใดๆ เกินเวลาที่กำหนด ระบบจะทำการปิดและลบช่องนี้โดยอัตโนมัติภายใน **5 วินาที** ครับ')
                .setTimestamp();

            await channel.send({ embeds: [timeoutEmbed] });
            
            setTimeout(async () => {
                await channel.delete().catch(() => null);
                ticketTimers.delete(channel.id);
            }, 5000);

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการลบห้องอัตโนมัติ:', error);
        }
    }, TIMEOUT_DURATION);

    ticketTimers.set(channel.id, timer);
}

// คำสั่งสร้างข้อความเริ่มระบบ Support (!setup)
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        // 🔒 เช็กว่าคนพิมพ์ใช่เจ้าของเซิร์ฟเวอร์ (Server Owner) ไหม ถ้าไม่ใช่...บอทจะเมินทันที
        if (message.author.id !== message.guild.ownerId) {
            return; 
        }

        const button = new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('📩 ติดต่อทีมงาน / แจ้งปัญหา')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const setupEmbed = new EmbedBuilder()
            .setColor('#00adb5')
            .setTitle('🌴 LOMLAYRAK SUPPORT SYSTEM 🌊')
            .setDescription('หากคุณต้องการติดต่อแอดมิน แจ้งปัญหาภายในเซิร์ฟเวอร์ หรือสอบถามข้อมูลเพิ่มเติม สามารถคลิกที่ปุ่มด้านล่างเพื่อเปิดห้องตั๋วคุยส่วนตัวกับทีมงานได้เลยครับ!')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Lomlayrak Community', iconURL: message.guild.iconURL() })
            .setTimestamp();

        await message.channel.send({
            embeds: [setupEmbed],
            components: [row]
        });
        
        await message.delete().catch(() => null);
        return;
    }

    if (message.channel.name && message.channel.name.startsWith('ticket-')) {
        startTicketTimeout(message.channel);
    }
});

client.once(Events.ClientReady, async readyClient => {
    console.log(`👷 บอทช่วยเหลือ LOMLAYRAK ออนไลน์แล้ว: ${readyClient.user.tag}`);

    // ระบบตั้งสถานะบอท (Activity)
    setInterval(() => {
        client.user.setActivity('🛡️ดูแลช่วยเหลือทุกคนใน LOMLAYR AK', { type: ActivityType.Watching }); 
    }, 60000);
});

// ตรวจจับเมื่อมีคนมากดปุ่ม
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        const channelName = `ticket-${member.user.username}`.toLowerCase();
        const existingChannel = guild.channels.cache.find(ch => ch.name === channelName);

        if (existingChannel) {
            return await interaction.reply({ 
                content: `❌ คุณมีห้องช่วยเหลือเปิดอยู่แล้วที่นี่ครับ: <#${existingChannel.id}>`, 
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            // ตั้งค่าสิทธิ์ขั้นต้น (ปิดคนทั่วไป, เปิดให้คนแจ้ง)
            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                },
                {
                    // 🛠️ ให้สิทธิ์ยศแอดมินที่กำหนด มองเห็นและตอบในห้องตั๋วนี้ได้ด้วย
                    id: ADMIN_ROLE_ID,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ];

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: process.env.CATEGORY_TICKET,
                permissionOverwrites: permissionOverwrites,
            });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 ปิดห้องนี้')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            const ticketEmbed = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle('📩 ห้องติดต่อทีมงานส่วนตัว')
                .setDescription(`👋 ยินดีต้อนรับคุณ <@${member.id}> สู่ศูนย์ช่วยเหลือริมหาดครับ\n\nกรุณาพิมพ์รายละเอียดเรื่องที่ต้องการให้ทีมงานช่วยเหลือทิ้งไว้ได้เลยครับ เดี๋ยวจะมีแอดมินเข้ามาดูแลในอีกสักครู่ ✨`)
                .addFields(
                    { name: '👤 ผู้เปิดตั๋ว', value: `<@${member.id}>`, inline: true },
                    { name: '⏱️ ระบบลบห้องอัตโนมัติ', value: 'หากไม่มีใครพิมพ์คุยกันในห้องนี้เลย ห้องจะปิดตัวลงเอง', inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'หากคุยเสร็จสิ้นแล้ว สามารถกดปุ่มด้านล่างเพื่อปิดห้องได้ครับ' })
                .setTimestamp();

            // 🛠️ เปลี่ยนการแท็กเป็น ID ยศที่กำหนดเรียบร้อย แท็กเด้งรอบเดียวสวยๆ ไม่ซ้อนกัน
            await ticketChannel.send({
                content: `<@${member.id}> | ทีมงาน <@&${ADMIN_ROLE_ID}>`, 
                embeds: [ticketEmbed],
                components: [row]
            });

            await interaction.editReply({ content: `✅ สร้างช่องช่วยเหลือส่วนตัวสำเร็จแล้ว! คลิกไปที่นี่ได้เลยครับ: <#${ticketChannel.id}>` });

            startTicketTimeout(ticketChannel);
            
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการสร้างห้อง:', error);
            await interaction.editReply({ content: '❌ ไม่สามารถสร้างห้องได้ กรุณาเช็กความถูกต้องของข้อมูลระบบครับ' });
        }
    }

    if (interaction.customId === 'close_ticket') {
        if (ticketTimers.has(interaction.channelId)) {
            clearTimeout(ticketTimers.get(interaction.channelId));
            ticketTimers.delete(interaction.channelId);
        }

        const closeEmbed = new EmbedBuilder()
            .setColor('#ffa502')
            .setDescription('🔒 รับทราบครับ! กำลังปิดและลบช่องช่วยเหลือนี้ภายใน **5 วินาที**...');

        await interaction.reply({ embeds: [closeEmbed] });
        
        setTimeout(async () => {
            await interaction.channel.delete().catch(() => null);
        }, 5000);
    }
});

client.login(process.env.TOKEN_HELPER);
