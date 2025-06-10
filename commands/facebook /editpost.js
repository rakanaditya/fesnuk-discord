const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editpost')
    .setDescription('📝 Edit postingan Facebook')
    .addStringOption(option =>
      option.setName('post_id')
        .setDescription('ID postingan yang ingin diedit')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('new_content')
        .setDescription('Konten baru untuk postingan')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('new_image')
        .setDescription('URL gambar baru (opsional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const postId = interaction.options.getString('post_id');
    const newContent = interaction.options.getString('new_content');
    const newImageUrl = interaction.options.getString('new_image');
    const postChannelId = '1380933517546094713';

    const postChannel = interaction.guild.channels.cache.get(postChannelId);
    if (!postChannel) return interaction.reply({ content: '❌ Channel tidak ditemukan.', ephemeral: true });

    const postMessage = await postChannel.messages.fetch(postId).catch(() => null);
    if (!postMessage) return interaction.reply({ content: '❌ Postingan tidak ditemukan.', ephemeral: true });

    const embed = EmbedBuilder.from(postMessage.embeds[0]);
    if (!embed) return interaction.reply({ content: '❌ Postingan tidak bisa diedit.', ephemeral: true });

    // Mengupdate konten jika ada perubahan
    if (newContent) embed.setDescription(newContent);

    // Mengupdate gambar jika diberikan
    if (newImageUrl) embed.setImage(newImageUrl);

    await postMessage.edit({ embeds: [embed] });

    interaction.reply({ content: '✅ Postingan telah diperbarui!', ephemeral: true });
  }
};
