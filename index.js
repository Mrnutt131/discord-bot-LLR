import 'dotenv/config';
import { Client, Events, GatewayIntentBits, ActivityType, PermissionFlagsBits } from 'discord.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ใส่ ID ยศที่อนุญาตให้ใช้งานที่นี่
const ALLOWED_ROLE_IDS = ['1507970908743270583', '1507972049124069427'];

// ใส่ Guild ID เพื่อให้คำสั่งอัปเดตเร็ว (ไม่ต้องรอ global sync นานสุด 1 ชม.)
// ถ้าไม่ใส่ จะลงทะเบียนแบบ global แทน
const GUILD_ID = process.env.GUILD_ID || null;

function hasPermission(interaction) {
    if (!interaction.member || !interaction.member.roles) return false;
    return interaction.member.roles.cache.some(r => ALLOWED_ROLE_IDS.includes(r.id));
}

client.once(Events.ClientReady, async (c) => {
    console.log(`📢 บอทออนไลน์แล้ว: ${c.user.tag}`);

    client.user.setActivity('📣ประกาศข่าวสาร LOMLAYRAK', { type: ActivityType.Playing });
    setInterval(() => {
        client.user.setActivity('📣ประกาศข่าวสาร LOMLAYRAK', { type: ActivityType.Playing });
    }, 60000);

    const commands = [
        {
            name: 'broadcast',
            description: 'ประกาศข่าวสารทั่วไป',
            options: [
                { name: 'channel', description: 'ห้องที่ต้องการส่ง', type: 7, required: true },
                { name: 'title', description: 'หัวข้อประกาศ', type: 3, required: true },
                { name: 'message', description: 'เนื้อหา', type: 3, required: true },
                { name: 'file', description: 'แนบรูปภาพ', type: 11, required: false },
                { name: 'mention_everyone', description: 'แท็ก @everyone ด้วยหรือไม่', type: 5, required: false }
            ]
        },
        {
            name: 'poll',
            description: 'สร้างโหวตแบบ Discord Poll (กดปุ่มโหวตได้จริง)',
            options: [
                { name: 'channel', description: 'ห้องที่ต้องการส่ง', type: 7, required: true },
                { name: 'question', description: 'หัวข้อโหวต', type: 3, required: true },
                ...Array.from({ length: 10 }, (_, i) => ({
                    name: `option${i + 1}`,
                    description: `ตัวเลือกที่ ${i + 1}`,
                    type: 3,
                    required: i < 2
                })),
                {
                    name: 'duration_hours',
                    description: 'ระยะเวลาเปิดโหวต (ชั่วโมง, ค่าเริ่มต้น 24)',
                    type: 4,
                    required: false,
                    min_value: 1,
                    max_value: 768
                },
                {
                    name: 'multiselect',
                    description: 'ให้เลือกได้มากกว่า 1 ตัวเลือกหรือไม่ (ค่าเริ่มต้น: เลือกได้แค่ 1)',
                    type: 5,
                    required: false
                }
            ]
        },
        {
            name: 'announce-schedule',
            description: 'ตั้งเวลาส่งประกาศล่วงหน้า',
            options: [
                { name: 'channel', description: 'ห้องที่ต้องการส่ง', type: 7, required: true },
                { name: 'minutes', description: 'จำนวนนาทีก่อนส่ง (เช่น 10)', type: 4, required: true, min_value: 1, max_value: 1440 },
                { name: 'title', description: 'หัวข้อประกาศ', type: 3, required: true },
                { name: 'message', description: 'เนื้อหา', type: 3, required: true }
            ]
        },
        {
            name: 'clear',
            description: 'ลบข้อความในห้องนี้',
            options: [
                { name: 'amount', description: 'จำนวนข้อความที่ต้องการลบ (1-100)', type: 4, required: true, min_value: 1, max_value: 100 }
            ]
        },
        {
            name: 'lock',
            description: 'ล็อกห้องนี้ไม่ให้สมาชิกทั่วไปพิมพ์ได้'
        },
        {
            name: 'unlock',
            description: 'ปลดล็อกห้องนี้ให้พิมพ์ได้ตามปกติ'
        },
        {
            name: 'remind',
            description: 'ตั้งเตือนความจำในห้องนี้',
            options: [
                { name: 'minutes', description: 'จำนวนนาทีก่อนเตือน', type: 4, required: true, min_value: 1, max_value: 1440 },
                { name: 'message', description: 'ข้อความเตือน', type: 3, required: true }
            ]
        }
    ];

    try {
        if (GUILD_ID) {
            // ป้องกันคำสั่งซ้ำซ้อน: ล้างคำสั่ง global เก่าทิ้งก่อนเสมอ
            // (เผื่อเคยรันแบบ global มาก่อนหน้านี้แล้วเปลี่ยนมาใช้ guild)
            const existingGlobal = await client.application.commands.fetch();
            if (existingGlobal.size > 0) {
                await client.application.commands.set([]);
                console.log(`🧹 ล้างคำสั่ง global เก่าทิ้งแล้ว (${existingGlobal.size} คำสั่ง) เพื่อป้องกันคำสั่งซ้ำ`);
            }

            const guild = await client.guilds.fetch(GUILD_ID);
            const result = await guild.commands.set(commands);
            console.log(`✅ ลงทะเบียนคำสั่งสำเร็จ (guild): ${result.map(c => c.name).join(', ')}`);
        } else {
            const result = await client.application.commands.set(commands);
            console.log(`✅ ลงทะเบียนคำสั่งสำเร็จ (global, อาจใช้เวลาถึง 1 ชม. กว่าจะ sync): ${result.map(c => c.name).join(', ')}`);
        }
    } catch (err) {
        console.error('❌ ลงทะเบียนคำสั่งล้มเหลว:', err);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (!hasPermission(interaction)) {
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้', ephemeral: true });
        }

        // --- ประกาศข่าวสาร ---
        if (interaction.commandName === 'broadcast') {
            const channel = interaction.options.getChannel('channel');
            const title = interaction.options.getString('title');
            const message = interaction.options.getString('message');
            const file = interaction.options.getAttachment('file');
            const mentionEveryone = interaction.options.getBoolean('mention_everyone');

            const prefix = mentionEveryone ? '@everyone\n' : '';
            await channel.send({
                content: `${prefix}**📢 ${title.toUpperCase()}**\n\n${message}`,
                files: file ? [file] : []
            });
            await interaction.reply({ content: '✅ ประกาศส่งแล้ว!', ephemeral: true });
        }

        // --- สร้างโหวต (Discord Native Poll) ---
        if (interaction.commandName === 'poll') {
            const channel = interaction.options.getChannel('channel');
            const question = interaction.options.getString('question');
            const durationHours = interaction.options.getInteger('duration_hours') ?? 24;
            const multiselect = interaction.options.getBoolean('multiselect') ?? false;

            const answers = [];
            for (let i = 1; i <= 10; i++) {
                const opt = interaction.options.getString(`option${i}`);
                if (opt) {
                    answers.push({ text: opt });
                }
            }

            await channel.send({
                poll: {
                    question: { text: question },
                    answers: answers,
                    duration: durationHours,
                    allowMultiselect: multiselect
                }
            });

            await interaction.reply({ content: '✅ สร้างโหวตเรียบร้อย!', ephemeral: true });
        }

        // --- ตั้งเวลาประกาศล่วงหน้า ---
        if (interaction.commandName === 'announce-schedule') {
            const channel = interaction.options.getChannel('channel');
            const minutes = interaction.options.getInteger('minutes');
            const title = interaction.options.getString('title');
            const message = interaction.options.getString('message');

            await interaction.reply({ content: `✅ ตั้งเวลาประกาศใน ${minutes} นาทีแล้ว`, ephemeral: true });

            setTimeout(async () => {
                try {
                    await channel.send({ content: `**📢 ${title.toUpperCase()}**\n\n${message}` });
                } catch (err) {
                    console.error('❌ ส่งประกาศตามเวลาล้มเหลว:', err);
                }
            }, minutes * 60 * 1000);
        }

        // --- ลบข้อความ ---
        if (interaction.commandName === 'clear') {
            const amount = interaction.options.getInteger('amount');
            await interaction.deferReply({ ephemeral: true });
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.editReply({ content: `✅ ลบข้อความแล้ว ${deleted.size} ข้อความ` });
        }

        // --- ล็อก/ปลดล็อกห้อง ---
        if (interaction.commandName === 'lock' || interaction.commandName === 'unlock') {
            const lock = interaction.commandName === 'lock';
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: lock ? false : null
            });
            await interaction.reply({ content: lock ? '🔒 ล็อกห้องนี้แล้ว' : '🔓 ปลดล็อกห้องนี้แล้ว', ephemeral: true });
        }

        // --- ตั้งเตือนความจำ ---
        if (interaction.commandName === 'remind') {
            const minutes = interaction.options.getInteger('minutes');
            const message = interaction.options.getString('message');
            const channel = interaction.channel;
            const user = interaction.user;

            await interaction.reply({ content: `⏰ ตั้งเตือนแล้ว จะแจ้งใน ${minutes} นาที`, ephemeral: true });

            setTimeout(async () => {
                try {
                    await channel.send({ content: `⏰ <@${user.id}> ถึงเวลาแล้ว: ${message}` });
                } catch (err) {
                    console.error('❌ ส่งการเตือนล้มเหลว:', err);
                }
            }, minutes * 60 * 1000);
        }

    } catch (err) {
        console.error(`❌ เกิดข้อผิดพลาดในคำสั่ง /${interaction.commandName}:`, err);
        const errorMsg = { content: '⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMsg).catch(() => {});
        } else {
            await interaction.reply(errorMsg).catch(() => {});
        }
    }
});

client.login(process.env.TOKEN);
