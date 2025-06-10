const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../db'); // Ganti sesuai path database SQLite kamu

module.exports = {
  category: 'developer',
  data: new SlashCommandBuilder()
    .setName('testbackup')
    .setDescription('🔧 Menjalankan backup database secara manual (test).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Kamu tidak memiliki izin untuk menjalankan perintah ini.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    db.all('SELECT * FROM users', [], async (err, rows) => {
      if (err) {
        console.error('[TESTBACKUP] Gagal mengambil data:', err);
        return interaction.editReply('❌ Gagal membuat backup.');
      }

      const formattedBackup = rows.map(row => JSON.stringify(row, null, 2)).join('\n');

      const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'log-fb-admin');
      if (!logChannel) {
        return interaction.editReply('❌ Channel `#log-fb-admin` tidak ditemukan.');
      }

      try {
        await logChannel.send(`📦 **Backup Manual**\n\`\`\`${formattedBackup}\`\`\``);
        await interaction.editReply('✅ Backup berhasil dan dikirim ke #log-fb-admin.');
      } catch (err) {
        console.error('[TESTBACKUP] Gagal mengirim pesan:', err);
        await interaction.editReply('❌ Gagal mengirim pesan ke channel.');
      }
    });
  },
};
