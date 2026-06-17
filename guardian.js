import 'dotenv/config';
import { Client, Events, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import fs from 'fs';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

const BAD_WORDS = JSON.parse(fs.readFileSync('./badwords.json', 'utf-8'));
const WARN_ROLES = { 1: "ผู้กระทำผิดระดับต้น", 2: "ผู้กระทำผิดระดับกลาง", 3: "ผู้กระทำผิดร้ายแรง" };
const RESET_TIMES = { 1: 3 * 60 * 60 * 1000, 2: 16 * 60 * 60 * 1000, 3: 48 * 60 * 60 * 1000 };

// userId -> { count, type: 'warn' | 'timeout', resetTimeout }
const userViolations = new Map();

function normalize(text) {
    return text.toLowerCase()
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/5/g, 's').replace(/@/g, 'a')
        .replace(/(.)\1+/g, '$1$1')
        .replace(/[^a-zA-Z0-9ก-๙]/g, "");
}

// ---- หายศแบบเช็ค error ชัดเจน ไม่เงียบเมื่อหาไม่เจอ ----
function findRoleByName(guild, roleName) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
        console.error(`[Guardian] ไม่พบยศชื่อ "${roleName}" ในเซิร์ฟเวอร์ "${guild.name}" — ตรวจสอบว่าสร้างยศนี้ไว้แล้ว และชื่อตรงกับ WARN_ROLES เป๊ะๆ (รวมเว้นวรรค)`);
    }
    return role;
}

// ---- ลบยศเตือนทั้งหมดออกจากสมาชิก ----
async function clearAllWarnRoles(member) {
    for (const rName of Object.values(WARN_ROLES)) {
        const role = member.guild.roles.cache.find(r => r.name === rName);
        if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(err =>
                console.error(`[Guardian] ลบยศ "${rName}" ไม่สำเร็จ:`, err.message)
            );
        }
    }
}

// ---- คืนสภาพสมาชิกให้ปกติ: ล้างชื่อเล่น + ลบยศ ----
async function resetMember(guild, userId, expectedCount) {
    const memberToReset = await guild.members.fetch(userId).catch(() => null);
    if (!memberToReset) {
        userViolations.delete(userId);
        return null;
    }

    const currentData = userViolations.get(userId);
    // กันรีเซ็ตผิดรอบ ถ้า count เปลี่ยนไปแล้ว (ทำผิดซ้ำระหว่างรอ) ไม่ต้องรีเซ็ต
    if (!currentData || currentData.count !== expectedCount) return null;

    await memberToReset.setNickname(null).catch(err =>
        console.error('[Guardian] รีเซ็ตชื่อเล่นไม่สำเร็จ:', err.message)
    );
    await clearAllWarnRoles(memberToReset);
    userViolations.delete(userId);
    return memberToReset;
}

async function getWarningMessage(count, member, flaggedWord) {
    let warningText = "";
    switch (count) {
        case 1: warningText = `สวัสดีครับคุณ ${member.displayName} เราตรวจพบว่าคุณใช้คำว่า **"${flaggedWord}"** ซึ่งขัดต่อกฎ "Keep it Chill" ของเราครับ`; break;
        case 2: warningText = `พบการละเมิดกฎซ้ำครับ คุณใช้คำว่า **"${flaggedWord}"** ซึ่งไม่เหมาะสม สถานะของคุณถูกปรับเป็น **${WARN_ROLES[2]}**`; break;
        case 3: warningText = `คำเตือนครั้งสุดท้าย! พบคำว่า **"${flaggedWord}"** สถานะของคุณตอนนี้คือ **${WARN_ROLES[3]}** โปรดระมัดระวังการใช้ภาษาด้วยครับ`; break;
        case 4: warningText = `เนื่องจากคุณยังใช้คำต้องห้าม **"${flaggedWord}"** ระบบจึงจำเป็นต้อง Timeout คุณ 3 นาทีครับ`; break;
    }
    return `🌊 **LOMLAYRAK STUDIO'Z: ระบบดูแลความสงบ** 🌊\n\n${warningText}\n\n📖 อ่านกฎระเบียบเพิ่มเติมได้ที่: <#1507967587424931960>\n------------------\n*รักษาน้ำใจและบรรยากาศดีๆ ไว้ด้วยกันนะครับ 🐚💙*`;
}

// ---- วิเคราะห์เจตนาให้สมเหตุสมผลขึ้น ----
// เกณฑ์เดิม (ความยาวข้อความ) ไม่สัมพันธ์กับเจตนาเลย เปลี่ยนเป็นพิจารณาจาก:
// - สัดส่วนคำหยาบต่อความยาวข้อความทั้งหมด (คำหยาบเป็นส่วนใหญ่ของข้อความ = เจตนาชัด)
// - จำนวนคำหยาบที่พบในข้อความเดียว (พบมากกว่า 1 คำ = เจตนาชัด)
// - ข้อความที่มีแต่คำหยาบ/สัญลักษณ์ซ้ำๆ (เช่น spam คำเดียวซ้ำๆ) = เจตนาชัด
function analyzeIntent(rawContent, flaggedWord, allFoundWords) {
    const trimmed = rawContent.trim();
    const cleanLength = normalize(trimmed).length;
    const wordRatio = cleanLength > 0 ? flaggedWord.length / cleanLength : 0;

    if (allFoundWords.length > 1) {
        return { isIntentional: true, status: `⚠️ เจตนาชัดเจน (พบคำต้องห้าม ${allFoundWords.length} คำในข้อความเดียว)` };
    }
    if (wordRatio >= 0.5) {
        return { isIntentional: true, status: "⚠️ เจตนาชัดเจน (คำต้องห้ามเป็นส่วนใหญ่ของข้อความ)" };
    }
    if (cleanLength <= flaggedWord.length + 3) {
        return { isIntentional: true, status: "⚠️ เจตนาชัดเจน (ข้อความสั้น มีแต่คำต้องห้ามแทบทั้งหมด)" };
    }
    return { isIntentional: false, status: "🔍 ตรวจสอบเพิ่มเติม (คำต้องห้ามปรากฏในข้อความยาว อาจไม่ได้ตั้งใจ)" };
}

// ระบบคืนชื่อเดิม + ลบยศ เมื่อพ้นโทษ Timeout ของ Discord (ตรงนี้ดูแลเฉพาะเคส "ติด timeout จริง")
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()) {
        const data = userViolations.get(newMember.id);
        // ดูแลเฉพาะ record ที่มาจากการ timeout เท่านั้น ไม่ไปยุ่งกับ record ประเภท "warn" ที่มี setTimeout ของตัวเองอยู่แล้ว
        if (data && data.type === 'timeout') {
            if (data.resetTimeout) clearTimeout(data.resetTimeout);
            const member = await resetMember(newMember.guild, newMember.id, data.count);
            if (member) {
                member.send("✅ ครบกำหนด Timeout แล้วครับ ชื่อเล่นและสถานะของคุณถูกรีเซ็ตเรียบร้อย").catch(() => {});
            }
        }
    }
});

async function sendAuditLog(member, reason, action, count, flaggedWord = "ไม่ระบุ", summaryStatus = "ไม่ได้ระบุ") {
    const channelId = process.env.CHANNEL_LOG;
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const embed = {
        color: summaryStatus.includes("⚠️") ? 0xff4500 : 0x00d4ff,
        title: "🌊 LOMLAYRAK: ระบบรักษาความสงบ (Audit Log) 🐚",
        thumbnail: { url: member.user.displayAvatarURL({ dynamic: true, size: 256 }) },
        fields: [
            { name: "👤 ผู้กระทำผิด", value: `${member.user.tag}\n(ID: ${member.id})`, inline: true },
            { name: "🔢 ครั้งที่", value: `${count}`, inline: true },
            { name: "📊 การวิเคราะห์", value: summaryStatus, inline: false },
            { name: "🚫 คำที่ตรวจพบ", value: `||${flaggedWord}||`, inline: true },
            { name: "⚙️ การกระทำ", value: action, inline: true },
            { name: "📝 ข้อความต้นฉบับ", value: reason.substring(0, 1020), inline: false },
            { name: "⏰ เวลา", value: new Date().toLocaleString('th-TH') }
        ],
        footer: { text: "ดูแลความสงบด้วยระบบ LOMLAYRAK Guardian" }
    };
    await channel.send({ embeds: [embed] });
}

client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild || !message.member) return;

    const isStaff = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const linkRegex = /(discord|dsc)\s?(\.|dot)\s?(gg|io|me)\/\w+/gi;

    if (linkRegex.test(message.content) && !isStaff) {
        await message.delete();
        await sendAuditLog(message.member, "ส่งลิงก์ภายนอก", "ลบข้อความ", 0, "Link", "⚠️ ตรวจพบลิงก์ภายนอก");
        return message.channel.send(`⚠️ ${message.member.toString()} ห้ามส่งลิงก์ภายนอกครับ!`);
    }

    const cleanContent = normalize(message.content);
    const foundWords = BAD_WORDS.filter(word => cleanContent.includes(word));

    if (foundWords.length > 0) {
        await message.delete();
        handleViolation(message, foundWords[0], foundWords);
    }
});

async function handleViolation(message, flaggedWord, allFoundWords) {
    const member = message.member;
    const userId = member.id;
    const guild = message.guild;

    let data = userViolations.get(userId) || { count: 0, type: 'warn', resetTimeout: null };

    // ถ้ามี timer รออยู่จากการละเมิดครั้งก่อน ให้ยกเลิกก่อน เพราะกำลังจะตั้ง timer ใหม่ทับ
    if (data.resetTimeout) clearTimeout(data.resetTimeout);

    data.count += 1;
    const { isIntentional, status: summaryStatus } = analyzeIntent(message.content, flaggedWord, allFoundWords);

    // ลบยศเดิมออกก่อนเสมอ (กันยศซ้อนกันหลายระดับ)
    await clearAllWarnRoles(member);

    const dmMessage = await getWarningMessage(data.count, member, flaggedWord);

    if (data.count <= 3) {
        data.type = 'warn';
        const roleName = WARN_ROLES[data.count];
        const newName = `${member.displayName.replace(/\s\(.*?\)/g, '')} (${roleName})`;

        await member.setNickname(newName).catch(err =>
            console.error('[Guardian] ตั้งชื่อเล่นไม่สำเร็จ:', err.message)
        );

        const role = findRoleByName(guild, roleName);
        if (role) {
            await member.roles.add(role).catch(err =>
                console.error(`[Guardian] เพิ่มยศ "${roleName}" ไม่สำเร็จ:`, err.message)
            );
        } else {
            message.channel.send(`⚠️ แอดมิน: ไม่พบยศ "${roleName}" ในเซิร์ฟเวอร์ กรุณาสร้างยศนี้ก่อนครับ`);
        }

        message.channel.send(`🚫 ${member.toString()} คุณทำผิดกฎครั้งที่ ${data.count} สถานะ: **${roleName}**`);
        member.send(dmMessage).catch(() => {});

        // ตั้ง timer ใหม่ และเก็บ reference ไว้เพื่อสามารถ clear ได้ถ้าทำผิดซ้ำก่อนหมดเวลา
        data.resetTimeout = setTimeout(async () => {
            const resetData = userViolations.get(userId);
            if (resetData && resetData.count === data.count) {
                const memberToReset = await resetMember(guild, userId, data.count);
                if (memberToReset) {
                    message.channel.send(`✅ ${memberToReset.toString()} พ้นโทษแล้วครับ และชื่อเล่น/ยศถูกรีเซ็ตแล้วครับ`);
                }
            }
        }, RESET_TIMES[data.count]);

        userViolations.set(userId, data);
        await sendAuditLog(member, message.content, `เปลี่ยนสถานะเป็น ${roleName}`, data.count, flaggedWord, summaryStatus);
    } else {
        data.type = 'timeout';
        userViolations.set(userId, data);

        await member.timeout(3 * 60 * 1000, "ทำผิดกฎครบ 4 ครั้ง").catch(err =>
            console.error('[Guardian] Timeout สมาชิกไม่สำเร็จ:', err.message)
        );
        message.channel.send(`🛑 ${member.toString()} โดน Timeout 3 นาที เนื่องจากทำผิดกฎซ้ำครับ`);
        member.send(dmMessage).catch(() => {});
        await sendAuditLog(member, message.content, "โดน Timeout 3 นาที", data.count, flaggedWord, summaryStatus);

        // กันเหนียว: เผื่อ GuildMemberUpdate ไม่ trigger (เช่น บอทรีสตาร์ทระหว่างนั้น) ตั้ง fallback timer ไว้ด้วย
        data.resetTimeout = setTimeout(async () => {
            const resetData = userViolations.get(userId);
            if (resetData && resetData.count === data.count && resetData.type === 'timeout') {
                await resetMember(guild, userId, data.count);
            }
        }, 3 * 60 * 1000 + 5000);
    }
}

client.once(Events.ClientReady, (c) => {
    console.log(`[Guardian] พร้อมปฏิบัติการในนาม ${c.user.tag}`);

    setInterval(() => {
        // ใส่ 🛡️ หรืออิโมจิอื่นๆ ที่คุณชอบได้เลย
        client.user.setActivity('🛡️กำลังดูแลความสงบ LOMLAYRAK', { type: 3 }); 
    }, 60000);
});

client.login(process.env.TOKEN_GUARDIAN);
// node guardian.js