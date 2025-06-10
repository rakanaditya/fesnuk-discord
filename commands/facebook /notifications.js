const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notifications')
    .setDescription('🔔 Lihat notifikasi terbaru Facebook (global)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // 🔹 Cegah interaksi kadaluarsa

    const userId = interaction.user.id;

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, userRow) => {
      if (!userRow) {
        return interaction.editReply({ content: "❌ Kamu harus terdaftar untuk melihat notifikasi." });
      }

      // 🔹 Perbaiki query agar tidak mengambil event dua kali
      db.all(`
        SELECT message FROM notifications 
        WHERE user_id = ? 
        OR user_id IN (SELECT user_id FROM friends WHERE friend_name = ?)
        OR user_id IN (SELECT user_id FROM posts WHERE user_id = ?)
        OR user_id IN (SELECT user_id FROM comments WHERE user_id = ?)
        ORDER BY id DESC LIMIT 5
      `, [userId, userRow.username, userId, userId], (err, notifications) => {
        if (err) {
          console.error('❌ Error fetching notifications:', err.message);
          return interaction.editReply({ content: "❌ Terjadi kesalahan saat mengambil notifikasi." });
        }

        if (!notifications.length) {
          return interaction.editReply({ content: "📭 Tidak ada notifikasi baru dari orang lain." });
        }

        const notificationList = notifications.map(n => `📢 ${n.message}`).join("\n");
        const embed = new EmbedBuilder()
          .setColor("Gold")
          .setTitle("🔔 Notifikasi Facebook (Global)")
          .setDescription(notificationList)
          .setFooter({ text: `Diminta oleh ${interaction.user.tag}` })
          .setTimestamp();

        interaction.editReply({ embeds: [embed] });
      });
    });
  }
};
