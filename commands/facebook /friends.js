const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('friend')
    .setDescription('👥 Kelola daftar teman Facebook')
    .addSubcommand(subcommand =>
      subcommand.setName('add')
        .setDescription('➕ Tambahkan teman')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Nama pengguna yang ingin ditambahkan')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('delete')
        .setDescription('❌ Hapus teman')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Nama teman yang ingin dihapus')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('🔹 Melihat daftar teman')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // 🔹 Cegah interaksi kadaluarsa

    const userId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'list') {
      db.all(`SELECT friend_name FROM friends WHERE user_id = ?`, [userId], (err, friends) => {
        if (err) {
          console.error('❌ Error fetching friends:', err.message);
          return interaction.editReply({ content: "❌ Kesalahan saat mengambil daftar teman." });
        }
        if (!friends.length) {
          return interaction.editReply({ content: "😕 Kamu belum memiliki teman." });
        }

        const friendList = friends.map(f => `- ${f.friend_name}`).join("\n");
        const embed = new EmbedBuilder()
          .setColor("Blue")
          .setTitle("👥 Daftar Teman Facebook")
          .setDescription(friendList)
          .setFooter({ text: `Diminta oleh ${interaction.user.tag}` })
          .setTimestamp();

        interaction.editReply({ embeds: [embed] });
      });
    }

    if (subcommand === 'add') {
      const friendName = interaction.options.getString('username');

      db.get(`SELECT * FROM users WHERE username = ?`, [friendName], (err, friendRow) => {
        if (!friendRow) {
          return interaction.editReply({ content: `❌ Pengguna **${friendName}** tidak ditemukan.` });
        }

        db.get(`SELECT friend_name FROM friends WHERE user_id = ? AND friend_name = ?`, [userId, friendName], (err, existingFriend) => {
          if (existingFriend) {
            return interaction.editReply({ content: `⚠️ Kamu sudah berteman dengan **${friendName}**.` });
          }

          db.run(`INSERT INTO friends (user_id, friend_name) VALUES (?, ?)`, [userId, friendName], (err) => {
            if (err) return interaction.editReply({ content: "❌ Gagal menambahkan teman." });

            // ✨ Simpan notifikasi bahwa seseorang telah ditambahkan sebagai teman
            db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
              [friendRow.id, `👥 **${interaction.user.username}** telah menambahkanmu sebagai teman!`],
              (err) => {
                if (err) console.error('❌ Error saving notification:', err.message);
              });

            interaction.editReply({ content: `✅ **${friendName}** telah ditambahkan ke daftar temanmu!` });
          });
        });
      });
    }

    if (subcommand === 'delete') {
      const friendName = interaction.options.getString('username');

      db.run(`DELETE FROM friends WHERE user_id = ? AND friend_name = ?`, [userId, friendName], (err) => {
        if (err) {
          console.error('❌ Error deleting friend:', err.message);
          return interaction.editReply({ content: "❌ Gagal menghapus teman." });
        }

        // ✨ Simpan notifikasi bahwa seseorang telah dihapus dari daftar teman
        db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
          [userId, `❌ Kamu telah menghapus **${friendName}** dari daftar temanmu.`],
          (err) => {
            if (err) console.error('❌ Error saving notification:', err.message);
          });

        interaction.editReply({ content: `❌ **${friendName}** telah dihapus dari daftar temanmu.` });
      });
    }
  }
};
