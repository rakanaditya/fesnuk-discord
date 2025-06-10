const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

const ownerID = "628205121704296458"; // ID Owner
const eventChannelId = "1380933517546094713"; // ID Channel tujuan

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createevent')
    .setDescription('📅 Buat event Facebook (hanya owner)')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Judul event')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Deskripsi event')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Tanggal event (YYYY-MM-DD)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('URL gambar event (opsional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // 🔹 Cegah interaksi kadaluarsa

    const userId = interaction.user.id;
    if (userId !== ownerID) {
      return interaction.editReply({ content: "❌ Hanya owner yang bisa membuat event." });
    }

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const date = interaction.options.getString('date');
    const imageUrl = interaction.options.getString('image');

    // 🔹 Buat embed event
    const embed = new EmbedBuilder()
      .setColor("Gold")
      .setTitle(`📅 Event: ${title}`)
      .setDescription(description)
      .addFields({ name: "📆 Tanggal", value: date })
      .setFooter({ text: `Dibuat oleh 👑 ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    const eventChannel = interaction.guild.channels.cache.get(eventChannelId);
    if (!eventChannel) {
      return interaction.editReply({ content: "❌ Channel event tidak ditemukan." });
    }

    await eventChannel.send({ embeds: [embed] });

    // 🔹 Simpan event ke database untuk referensi
    db.run(`INSERT INTO events (title, description, date, owner_id) VALUES (?, ?, ?, ?)`,
      [title, description, date, ownerID],
      (err) => {
        if (err) {
          console.error('❌ Error saving event:', err.message);
        }
      });

    // 🔹 Kirim notifikasi hanya ke owner (tanpa duplikasi)
    db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [ownerID, `📅 Event baru dibuat: **${title}** pada ${date}!`],
      (err) => {
        if (err) console.error(`❌ Error saving notification for owner:`, err.message);
      });

    interaction.editReply({ content: "✅ Event berhasil dibuat dan dikirim ke channel!" });
  }
};
