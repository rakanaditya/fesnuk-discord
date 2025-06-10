const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../db'); // Pastikan path database sudah benar

const OWNER_ID = '628205121704296458'; // ID Developer

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('🔐 Backup data user dari database ke file JSON (owner only).'),

  async execute(interaction) {
    try {
      // Cek apakah pengguna adalah Owner
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({ content: '❌ Kamu tidak memiliki izin untuk menjalankan perintah ini.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      // Format tanggal
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const fileName = `backup_${formattedDate}.json`;

      // Pastikan direktori backup ada
      const backupDir = path.join(__dirname, '../../backup');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

      const filePath = path.join(backupDir, fileName);

      // Ambil data dari database dengan async/await
      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Simpan ke file JSON
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));

      // Baca file sebagai Buffer untuk AttachmentBuilder
      const fileBuffer = fs.readFileSync(filePath);
      const file = new AttachmentBuilder(fileBuffer, { name: fileName });

      await interaction.editReply({
        content: `✅ Backup berhasil dibuat dengan nama \`${fileName}\`.`,
        files: [file],
      });

    } catch (error) {
      console.error(`[BACKUP] Terjadi kesalahan: ${error.message}`);
      return interaction.editReply({ content: '❌ Terjadi kesalahan saat membuat backup.', ephemeral: true });
    }
  }
};
