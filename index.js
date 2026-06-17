import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

client.on(Events.ClientReady, readyClient => {
    console.log(`✅ Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});

client.once(Events.ClientReady, (c) => {
    console.log(`📢 บอทประกาศข่าวสาร (Broadcaster) ออนไลน์แล้ว: ${c.user.tag}`);

    // ระบบตั้งสถานะบอท: ใช้ Playing (กำลังประกาศ) หรือ Listening (ฟังประกาศ)
    setInterval(() => {
        client.user.setActivity('📣 ฉันจะประกาศข่าวสารสำคัญของ LOMLAYRAK เอง', { type: ActivityType.Playing }); 
    }, 60000);
});

client.login(process.env.TOKEN);
