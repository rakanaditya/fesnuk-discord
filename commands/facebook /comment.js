const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comment')
    .setDescription('💬 Beri komentar pada postingan Facebook')
    .addStringOption(option =>
      option.setName('post_id')
        .setDescription('ID postingan')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Isi komentar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('URL gambar (opsional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const postId = interaction.options.getString('post_id');
    const message = interaction.options.getString('message');
    const imageUrl = interaction.options.getString('image');
    const postChannelId = '1380933517546094713';
    const ownerID = "628205121704296458"; // ID owner tetap ada

    const postChannel = interaction.guild.channels.cache.get(postChannelId);
    if (!postChannel) return interaction.reply({ content: '❌ Channel tidak ditemukan.', ephemeral: true });

    const postMessage = await postChannel.messages.fetch(postId).catch(() => null);
    if (!postMessage) return interaction.reply({ content: '❌ Postingan tidak ditemukan.', ephemeral: true });

    // Ambil ID pemilik postingan dari footer embed
    const embedData = postMessage.embeds[0];
    if (!embedData) return interaction.reply({ content: '❌ Postingan tidak valid.', ephemeral: true });

    const ownerTag = embedData.footer?.text?.replace('Diposting oleh ', '').trim();
    const ownerUser = postChannel.guild.members.cache.find(m => m.user.tag === ownerTag);
    const ownerId = ownerUser ? ownerUser.id : ownerID; // Jika pemilik postingan tidak ditemukan, gunakan owner ID tetap

    // Buat embed untuk komentar
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle(`💬 Komentar dari ${interaction.user.tag}`)
      .setDescription(message)
      .setFooter({ text: `Komentar pada postingan ID: ${postId}` })
      .setTimestamp();

    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    await postChannel.send({ embeds: [embed] });

    // ✨ Simpan notifikasi untuk pemilik postingan
    db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [ownerId, `💬 **${interaction.user.username}** mengomentari postinganmu: "${message.substring(0, 50)}..."`],
      (err) => {
        if (err) console.error('❌ Error saving notification:', err.message);
      });

    interaction.reply({ content: '✅ Komentar berhasil dikirim!', ephemeral: true });
  }
};
