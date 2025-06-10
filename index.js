const fs = require('node:fs');
const path = require('node:path');
global.ReadableStream = require('stream/web').ReadableStream;
const express = require('express');
const axios = require('axios');
const quickhook = require('quick.hook');
const moment = require('moment');



const { Client, Collection, GatewayIntentBits, Events, ActivityType, Partials, REST, Routes, AttachmentBuilder  } = require('discord.js');
const { clientId, guildId, token, prefix } = require('./config.json'); //client id bot/ guild id server/ token bot/ prefix ra!
const backupScheduler = require('./backupScheduler'); // backup data

const wait = require('node:timers/promises').setTimeout;
const cron = require('node-cron');
const { exec } = require('child_process');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers, // Pastikan intent ini ada untuk akses daftar anggota
    ],
    partials: Object.values(Partials),
});


client.commands = new Collection();
client.cooldowns = new Collection();
client.messageCommands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

commandFolders.forEach(folder => {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    commandFiles.forEach(file => {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (!command.data || !command.execute) {
            return console.warn(`[WARNING] Missing "data" or "execute" in ${filePath}`);
        }

        client.commands.set(command.data.name, command);
        client.messageCommands.set(command.data.name, command);
    });
});

const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).filter(file => file.endsWith('.js')).forEach(file => {
    const event = require(path.join(eventsPath, file));
    client[event.once ? 'once' : 'on'](event.name, (...args) => event.execute(...args));
});

// Backup Scheduler
setInterval(() => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
        backupScheduler.manualBackup();
    }
}, 60 * 1000);

// Rate Limit Cooldown
const applyCooldown = (interaction, command) => {
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.data.name) || new Collection();
    const cooldownAmount = (command.cooldown ?? 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
            return interaction.reply({
                content: `Cooldown active for \`${command.data.name}\`. Try again <t:${Math.round(expirationTime / 1000)}:R>.`,
                ephemeral: true
            });
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    client.cooldowns.set(command.data.name, timestamps);
};


// Slash Command Handler
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Pastikan fungsi cooldown ada sebelum digunakan
    if (typeof applyCooldown === 'function') {
        applyCooldown(interaction, command);
    }

    try {
        await command.execute(interaction);
        console.log(`Menjalankan command: ${interaction.commandName}`);
    } catch (error) {
        console.error(error);

        // Pastikan menangani error dengan pengecekan `deferred`
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: '❌ Error saat menjalankan perintah!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Error saat menjalankan perintah!', ephemeral: true });
        }
    }
});


// Message Command Handler
client.on('messageCreate', message => {
    if (message.author.bot) return; // Abaikan pesan dari bot

    const allowedGuildId = '798751181508837376'; // Ganti dengan ID server Rakan Aditya Community

    if (message.guild?.id !== allowedGuildId) {
        return message.channel.send('⚠️ Bot ini hanya dapat digunakan di **Rakan Aditya Community**.\nJoin server di sini: https://discord.gg/qjnSUrv3aa');
    }

    const args = message.content.slice(prefix.length).split(' ');
    const command = args[0];

    if (client.messageCommands.has(command)) {
        client.messageCommands.get(command).execute(message);
    }
});

client.on('guildCreate', async guild => {
    const allowedGuildId = '798751181508837376'; // ID server Rakan Aditya Community
    const inviteLink = 'https://discord.gg/qjnSUrv3aa'; // Link invite server

    if (guild.id !== allowedGuildId) {
        try {
            const owner = await client.users.fetch(guild.ownerId); // Mengambil data user owner

            // Kirim DM ke owner server
            await owner.send(`⚠️ **Peringatan Sistem** ⚠️\n\nBot ini hanya bisa digunakan di **Rakan Aditya Community**.\n\nSilakan join di sini: ${inviteLink}`);

            console.log(`✅ DM dikirim ke owner: ${owner.tag}`);

            await guild.leave(); // Keluar dari server setelah peringatan
        } catch (error) {
            console.error(`❌ Gagal mengirim DM ke owner:`, error);
        }
    }
});

// Status Rotation
const status = [
    { name: "Rakan Aditya Playing Ngoding 2025", type: ActivityType.Playing },
    { name: "Rakan Aditya Nonton Anime", type: ActivityType.Watching },
    { name: "Rakan Aditya Listening Music Spotify", type: ActivityType.Listening },
    { name: "Streaming on Twitch", type: ActivityType.Streaming, url: 'https://www.twitch.tv/rakanaditya' }
];

let index = 0;
setInterval(() => {
    client.user.setActivity(status[index]);
    index = (index + 1) % status.length;
}, 10000);

// Deploy Slash Commands
(async () => {
    try {
        console.log(`Started refreshing ${client.commands.size} application (/) commands.`);
        await new REST().setToken(token).put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: [...client.commands.values()].map(cmd => cmd.data.toJSON()) }
        );
        console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

// Database Connection
(async () => {
    try {
      //  await mongoose.connect(mongodb, { keepAlive: true });
     //   console.log('✅ Connected to DB.');
        client.login(token);
    } catch (error) {
       // console.error(`❌ DB Connection Error: ${error}`);
    }
})();
