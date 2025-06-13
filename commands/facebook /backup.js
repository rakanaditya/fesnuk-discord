const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../db'); // Pastikan path sudah benar

const OWNER_ID = '628205121704296458'; // ID Developer

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('🔐 Backup data user dari database ke file JSON (owner only).'),

  async execute(interaction) {
    try {
      // Cek apakah pengguna adalah Owner
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({ content: '❌ Kamu tidak memiliki izin untuk menjalankan perintah ini.', flags: 64 });
      }

      await interaction.deferReply({ flags: 64 });

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

      // Ambil data dari database
      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Simpan ke file JSON
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));

      // Tanggapan sukses tanpa mengirim file
      await interaction.editReply({
        content: `✅ Backup berhasil disimpan di server dengan nama file \`${fileName}\`.`,
      });

    } catch (error) {
      console.error(`[BACKUP] Terjadi kesalahan: ${error.message}\nStack Trace: ${error.stack}`);
      return interaction.editReply({ content: `❌ Terjadi kesalahan: ${error.message}`, flags: 64 });
    }
  }
};
