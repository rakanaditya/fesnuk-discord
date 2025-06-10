const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sharepost')
    .setDescription('🔗 Bagikan postingan Facebook')
    .addStringOption(option =>
      option.setName('post_id')
        .setDescription('ID postingan yang ingin dibagikan')
        .setRequired(true)
    ),

  async execute(interaction) {
    const postId = interaction.options.getString('post_id');
    const postChannelId = '1381909232529575987';

    const postChannel = interaction.guild.channels.cache.get(postChannelId);
    if (!postChannel) return interaction.reply({ content: '❌ Channel tidak ditemukan.', ephemeral: true });

    const postMessage = await postChannel.messages.fetch(postId).catch(() => null);
    if (!postMessage) return interaction.reply({ content: '❌ Postingan tidak ditemukan.', ephemeral: true });

    // Ambil ID pemilik postingan dari footer embed
    const embedData = postMessage.embeds[0];
    if (!embedData) return interaction.reply({ content: '❌ Postingan tidak valid.', ephemeral: true });

    const ownerTag = embedData.footer?.text?.replace('Diposting oleh ', '').trim();
    const ownerUser = postChannel.guild.members.cache.find(m => m.user.tag === ownerTag);
    if (!ownerUser) return interaction.reply({ content: '❌ Pemilik postingan tidak ditemukan.', ephemeral: true });

    interaction.reply({ content: `🔁 **${interaction.user.tag} membagikan sebuah postingan!**\n🔗 [Klik di sini untuk melihat](https://discord.com/channels/${interaction.guild.id}/${postChannelId}/${postId})`, ephemeral: false });

    // ✨ Simpan notifikasi untuk pemilik postingan
    db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [ownerUser.id, `🔁 **${interaction.user.username}** telah membagikan postinganmu!`],
      (err) => {
        if (err) console.error('❌ Error saving notification:', err.message);
      });
  }
};
