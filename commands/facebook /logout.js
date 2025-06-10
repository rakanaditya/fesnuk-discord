const { SlashCommandBuilder,EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logout')
    .setDescription('Logout dari akun Facebook'),

  async execute(interaction) {
    const userId = interaction.user.id;

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, row) => {
      if (err) {
        console.error(err);
        return interaction.reply({ content: '❌ Terjadi kesalahan saat mengakses database.', ephemeral: true });
      }

      if (!row) {
        return interaction.reply({ content: '❌ Kamu belum terdaftar. Gunakan `/register`.', ephemeral: true });
      }

      if (row.login !== 'iya') {
        return interaction.reply({ content: '⚠️ Kamu belum login.', ephemeral: true });
      }

      // Hapus role "facebook" jika ada
      const role = interaction.guild.roles.cache.find(r => r.name === 'facebook');
      if (role && interaction.member.roles.cache.has(role.id)) {
        try {
          await interaction.member.roles.remove(role);
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Gagal menghapus role.', ephemeral: true });
        }
      }

      // Update status login jadi "tidak"
      db.run(`UPDATE users SET login = 'tidak' WHERE id = ?`, [userId], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return interaction.reply({ content: '❌ Gagal logout.', ephemeral: true });
        }
              const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('System Facebook Logging')
        .addFields(
          { name: 'Username', value: interaction.user.username, inline: true },
          { name: 'Status', value: 'tidak', inline: true },
          { name: 'User ID', value: userId }
        )
        .setTimestamp();

      const log = interaction.guild.channels.cache.find(ch => ch.name === 'log-fb');
      if (log) log.send({ embeds: [embed] });

        interaction.reply({ content: '✅ Kamu berhasil logout dari akun Facebook palsu.', ephemeral: true });
      });
    });
  }
};
