import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ครอบด้วยฟังก์ชัน async เพื่อให้ใช้คำสั่ง await ด้านล่างได้โดยไม่เออเรอร์
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // ตรวจสอบให้มั่นใจว่าในไฟล์ .env มี CLIENT_ID ด้วยนะครับ
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), 
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();