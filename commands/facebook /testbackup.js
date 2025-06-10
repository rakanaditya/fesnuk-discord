const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../db'); // Pastikan path database sudah benar

const OWNER_ID = '628205121704296458'; // ID Developer

module.exports = {
  category: 'developer',
  data: new SlashCommandBuilder()
    .setName('testbackup')
    .setDescription('🔧 Menjalankan backup database secara manual (test).'),

  async execute(interaction) {
    // Cek apakah user adalah Owner
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ Kamu tidak memiliki izin untuk menjalankan perintah ini.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const now = new Date();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const day = String(now.getDate()).padStart(2, '0');
    const monthName = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const formattedDate = `${day}-${monthName}-${year}`;
    const fileName = `backup_${formattedDate}.json`;

    const backupDir = path.join(__dirname, '../../backup');
    const archiveDir = path.join(backupDir, 'archive', `${monthName}-${year}`);

    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

    const filePath = path.join(archiveDir, fileName);

    db.all('SELECT * FROM users', [], async (err, rows) => {
      if (err) {
        console.error('[TESTBACKUP] Gagal mengambil data:', err);
        return interaction.editReply('❌ Gagal membuat backup.');
      }

      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));

      const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'log-fb-admin');
      if (!logChannel) {
        return interaction.editReply('❌ Channel `#log-fb-admin` tidak ditemukan.');
      }

      const file = new AttachmentBuilder(filePath);

      try {
        await logChannel.send({
          content: `📦 **Backup Manual** (${formattedDate})`,
          files: [file],
        });

        await interaction.editReply(`✅ Backup berhasil dan dikirim ke #log-fb-admin.`);
      } catch (err) {
        console.error('[TESTBACKUP] Gagal mengirim file:', err);
        await interaction.editReply('❌ Gagal mengirim file ke channel.');
      }
    });
  },
};
