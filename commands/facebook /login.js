const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const db = require('../../db');

// Tambahkan daftar owner di awal
const OWNER_IDS = ['628205121704296458']; // Ganti dengan ID pemilik bot

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('🔑 Login ke akun Facebook dengan password atau kode backup.')
    .addStringOption(option =>
      option.setName('password')
        .setDescription('Masukkan password kamu')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('backup_code')
        .setDescription('Gunakan kode backup jika lupa password')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const inputPassword = interaction.options.getString('password');
      const inputBackupCode = interaction.options.getString('backup_code');

      db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, row) => {
        if (err) {
          console.error(`[LOGIN] Database error: ${err.message}`);
          return interaction.reply({ content: '❌ Terjadi kesalahan pada database.', ephemeral: true });
        }

        if (!row) {
          return interaction.reply({ content: '❌ Kamu belum terdaftar.', ephemeral: true });
        }

        if (row.login === 'iya') {
          return interaction.reply({ content: '✅ Kamu sudah login.', ephemeral: true });
        }

        let match = false;

        try {
          if (inputPassword) {
            match = await bcrypt.compare(inputPassword, row.password);
          }
        } catch (error) {
          console.error(`[LOGIN] Error comparing password: ${error.message}`);
          return interaction.reply({ content: '❌ Terjadi kesalahan saat memverifikasi password.', ephemeral: true });
        }

        if (!match && inputBackupCode) {
          try {
            const backupFilePath = path.join(__dirname, '../../backup/users_backup.json');
            if (!fs.existsSync(backupFilePath)) {
              return interaction.reply({ content: '❌ Tidak ada file backup yang tersedia.', ephemeral: true });
            }

            const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
            const userBackup = backupData.find(u => u.id === userId);

            if (userBackup && userBackup.password === inputBackupCode) {
              match = true;
            }
          } catch (error) {
            console.error(`[LOGIN] Error processing backup code: ${error.message}`);
            return interaction.reply({ content: '❌ Terjadi kesalahan saat memverifikasi kode backup.', ephemeral: true });
          }
        }

        if (!match) {
          return interaction.reply({ content: '❌ Password atau kode backup salah.', ephemeral: true });
        }

        // Tambahkan role dengan pengecekan owner
        try {
          const role = interaction.guild.roles.cache.find(r => r.name === 'facebook');
          if (!role || !role.editable) {
            if (OWNER_IDS.includes(userId)) {
              await interaction.member.roles.add(role);
            } else {
              return interaction.reply({ content: '❌ Role `facebook` tidak bisa diberikan.', ephemeral: true });
            }
          } else {
            await interaction.member.roles.add(role);
          }
        } catch (error) {
          console.error(`[LOGIN] Error assigning role: ${error.message}`);
          return interaction.reply({ content: '❌ Gagal memberikan role.', ephemeral: true });
        }

        // Update login status
        db.run(`UPDATE users SET login = 'iya' WHERE id = ?`, [userId], (err) => {
          if (err) {
            console.error(`[LOGIN] Error updating login status: ${err.message}`);
            return interaction.reply({ content: '❌ Terjadi kesalahan saat memperbarui status login.', ephemeral: true });
          }
        });

        const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('System Facebook Logging')
          .addFields(
            { name: 'Username', value: interaction.user.username, inline: true },
            { name: 'Status', value: 'iya', inline: true },
            { name: 'User ID', value: userId }
          )
          .setTimestamp();

        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'log-fb');
        if (logChannel) {
          try {
            logChannel.send({ embeds: [embed] });
          } catch (error) {
            console.error(`[LOGIN] Error sending log message: ${error.message}`);
          }
        }

        interaction.reply({ content: `✅ Selamat datang, ${interaction.user.tag}!`, ephemeral: true });

        // Simpan backup terbaru
        try {
          const backupFilePath = path.join(__dirname, '../../backup/users_backup.json');
          db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
              console.error(`[LOGIN] Error fetching users for backup: ${err.message}`);
            } else {
              fs.writeFileSync(backupFilePath, JSON.stringify(rows, null, 2));
              console.log('✅ Backup otomatis berhasil diperbarui.');
            }
          });
        } catch (error) {
          console.error(`[LOGIN] Error saving backup file: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`[LOGIN] Unexpected error: ${error.message}`);
      interaction.reply({ content: '❌ Terjadi kesalahan tak terduga.', ephemeral: true });
    }
  }
};
