const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('🔗 Mendapatkan tautan undangan bot'),

  async execute(interaction) {
    const clientId = interaction.client.user.id; // ID bot otomatis diambil
    const permissions = interaction.options.getString('permissions') || '18152980344438'; // Default tanpa izin khusus
    const inviteURL = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

    await interaction.reply(`🔗 **Undang bot ke servermu dengan izin yang dipilih!**\n[Klik di sini](${inviteURL})`);
  }
};
