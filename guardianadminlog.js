// ============================================================
// 🛡️ Admin Log Receiver — รับ log จาก Roblox แล้วส่ง Discord
// 
// ติดตั้ง: npm install discord.js express dotenv
// รัน:     node guardian-adminlog.js
//
// .env ต้องมี:
//   TOKEN_GUARDIAN=your_bot_token
//   CHANNEL_ADMIN_LOG=channel_id_สำหรับ_admin_log
//   LOG_SERVER_PORT=3001        (optional, default 3001)
//   ALLOWED_GAME_ID=your_game_id  (optional, กรองเฉพาะเกมของคุณ)
// ============================================================

import 'dotenv/config';
import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import express from 'express';

// ── Discord Client ──────────────────────────────────────────
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ── Express Server ──────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '10kb' }));  // จำกัดขนาด payload

// ── Config ──────────────────────────────────────────────────
const PORT        = parseInt(process.env.LOG_SERVER_PORT) || 3001;
const CHANNEL_ID  = process.env.CHANNEL_ADMIN_LOG;
const ALLOWED_GAME = process.env.ALLOWED_GAME_ID;  // ถ้าตั้งไว้จะกรองเฉพาะ gameId นี้

// ── Rate limit (กัน spam) ────────────────────────────────────
// Map: `${gameId}_${senderId}_${cmdName}` -> timestamp
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 1500;

function isRateLimited(key) {
    const now = Date.now();
    const last = rateLimitMap.get(key);
    if (last && (now - last) < RATE_LIMIT_MS) return true;
    rateLimitMap.set(key, now);
    // ล้าง entry เก่าออกเพื่อกันหน่วยความจำรั่ว
    setTimeout(() => rateLimitMap.delete(key), RATE_LIMIT_MS * 2);
    return false;
}

// ── Validator ────────────────────────────────────────────────
function isValidPayload(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.senderName !== 'string') return false;
    if (typeof data.senderId   !== 'number') return false;
    if (typeof data.cmdName    !== 'string') return false;
    if (data.senderName.length > 50)         return false;
    if (data.cmdName.length    > 30)         return false;
    return true;
}

// ── Sanitize text (กัน embed injection) ─────────────────────
function safe(text, maxLen = 200) {
    if (!text) return '—';
    return String(text)
        .replace(/`/g, "'")
        .replace(/\*/g, "\\*")
        .replace(/~/g, "\\~")
        .replace(/_/g, "\\_")
        .substring(0, maxLen);
}

// ── สร้าง Profile URL Roblox ────────────────────────────────
function robloxProfileUrl(userId) {
    return `https://www.roblox.com/users/${userId}/profile`;
}
function robloxGameUrl(placeId, jobId) {
    if (jobId) return `https://www.roblox.com/games/${placeId}?privateServerLinkCode=${jobId}`;
    return `https://www.roblox.com/games/${placeId}`;
}

// ── Format timestamp ──────────────────────────────────────────
function formatTimestamp(unixSecs) {
    return `<t:${unixSecs}:F>`;   // Discord timestamp full format
}

// ── Endpoint รับ log ─────────────────────────────────────────
app.post('/admin-log', async (req, res) => {
    // 1. ตรวจสอบ payload
    const data = req.body;
    if (!isValidPayload(data)) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    // 2. กรอง gameId (ถ้าตั้งค่าไว้)
    if (ALLOWED_GAME && data.gameId !== ALLOWED_GAME) {
        return res.status(403).json({ error: 'Unauthorized game' });
    }

    // 3. Rate limit
    const rlKey = `${data.gameId}_${data.senderId}_${data.cmdName}`;
    if (isRateLimited(rlKey)) {
        return res.status(429).json({ error: 'Rate limited' });
    }

    // 4. ส่ง embed ไป Discord
    try {
        const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
        if (!channel) {
            console.error('[AdminLog] ไม่พบ channel:', CHANNEL_ID);
            return res.status(500).json({ error: 'Channel not found' });
        }

        // ── สร้าง embed ────────────────────────────────────────
        const embed = new EmbedBuilder()
            .setColor(data.color || 0x95A5A6)
            .setTitle(`${data.emoji || '🔧'} Admin Command Used`)
            .setTimestamp(data.timestamp ? new Date(data.timestamp * 1000) : new Date())
            .setFooter({
                text: `PlaceID: ${safe(data.placeId, 20)} • GameID: ${safe(data.gameId, 20)}`
            });

        // ── Sender ────────────────────────────────────────────
        embed.addFields({
            name: '👮 ผู้ใช้คำสั่ง',
            value: [
                `**Username:** [${safe(data.senderName)}](${robloxProfileUrl(data.senderId)})`,
                `**User ID:** \`${data.senderId}\``,
                `**Tier:** ${safe(data.senderTier, 30)}`,
            ].join('\n'),
            inline: true,
        });

        // ── Command ───────────────────────────────────────────
        embed.addFields({
            name: '⌨️ คำสั่ง',
            value: [
                `**Command:** \`${safe(data.cmdName, 30)}\``,
                `**พิมพ์ว่า:** \`${safe(data.rawCmd, 30)}\``,
                data.extra ? `**Extra:** ${safe(data.extra, 100)}` : '',
            ].filter(Boolean).join('\n'),
            inline: true,
        });

        // ── spacer ────────────────────────────────────────────
        embed.addFields({ name: '\u200B', value: '\u200B', inline: false });

        // ── Targets ───────────────────────────────────────────
        const targetDisplay = data.targetStr && data.targetStr !== '—'
            ? data.targetStr
            : '*(ไม่มีเป้าหมาย / broadcast)*';

        embed.addFields({
            name: '🎯 เป้าหมาย',
            value: safe(targetDisplay, 900),
            inline: false,
        });

        // ── Server link ───────────────────────────────────────
        embed.addFields({
            name: '🔗 ลิงก์เซิร์ฟเวอร์',
            value: `[เข้าเกม](${robloxGameUrl(data.placeId, data.jobId)}) • JobID: \`${safe(data.jobId, 40)}\``,
            inline: false,
        });

        await channel.send({ embeds: [embed] });
        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error('[AdminLog] Error sending embed:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Bot Ready ────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
    console.log(`[AdminLog] Bot พร้อมแล้ว: ${c.user.tag}`);
    app.listen(PORT, () => {
        console.log(`[AdminLog] HTTP Server ฟังที่ port ${PORT}`);
    });
});

client.login(process.env.TOKEN_GUARDIAN);