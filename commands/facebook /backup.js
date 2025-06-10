const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../db'); // Ganti dengan path database SQLite kamu

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('🔐 Backup data user dari database ke file JSON (admin only).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Cek permission admin
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Kamu tidak punya izin Administrator.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // Format tanggal
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    const fileName = `backup_${formattedDate}.json`;

    const backupDir = path.join(__dirname, '../../backup');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const filePath = path.join(backupDir, fileName);

    // Ambil data dari database
    db.all('SELECT * FROM users', [], async (err, rows) => {
      if (err) {
        console.error('[BACKUP] Gagal membaca database:', err);
        return interaction.editReply({ content: '❌ Gagal membaca database.' });
      }

      // Tulis file backup
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));

      const file = new AttachmentBuilder(filePath);

      await interaction.editReply({
        content: `✅ Backup berhasil dibuat dengan nama \`${fileName}\`.`,
        files: [file],
      });
    });
  }
};
