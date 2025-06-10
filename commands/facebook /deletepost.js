const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletepost')
    .setDescription('🗑️ Hapus postingan Facebook')
    .addStringOption(option =>
      option.setName('post_id')
        .setDescription('ID postingan yang ingin dihapus')
        .setRequired(true)
    ),

  async execute(interaction) {
    const postId = interaction.options.getString('post_id');
    const postChannelId = '1380933517546094713';

    const postChannel = interaction.guild.channels.cache.get(postChannelId);
    if (!postChannel) return interaction.reply({ content: '❌ Channel tidak ditemukan.', ephemeral: true });

    const postMessage = await postChannel.messages.fetch(postId).catch(() => null);
    if (!postMessage) return interaction.reply({ content: '❌ Postingan tidak ditemukan.', ephemeral: true });

    await postMessage.delete();
    interaction.reply({ content: '✅ Postingan telah dihapus!', ephemeral: true });
  }
};
