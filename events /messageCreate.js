const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Pastikan bot tidak membalas pesan sendiri
    if (message.author.bot) return;

    const keywords = [
      "siapa pembuat bot ini?",
      "siapa pembuat bot ini? <@1380868700688613416>",
      "bot ini dibuat oleh siapa? <@1380868700688613416>",
      "siapa developer bot ini? <@1380868700688613416>",
      "bot discord ini siapa yang buat? <@1380868700688613416>"
    ];

    // Periksa apakah pesan pengguna mengandung kata kunci
    if (keywords.some(keyword => message.content.toLowerCase().includes(keyword))) {
      message.reply("🤖 Bot ini dibuat dan dikembangkan oleh **Rakan Aditya**!");
    }
  },


};
