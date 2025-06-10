const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('postfb')
    .setDescription('📢 Memposting ke Facebook')
    .addStringOption(option =>
      option.setName('content')
        .setDescription('Isi postingan kamu')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('URL gambar (opsional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // 🔹 Mencegah interaksi kadaluarsa

    const userId = interaction.user.id;
    const content = interaction.options.getString('content');
    const imageUrl = interaction.options.getString('image');
    const postChannelId = '1381909232529575987';
    const ownerID = "628205121704296458"; // ID owner bot

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], async (err, row) => {
      if (!row || row.login !== 'iya') {
        return interaction.editReply({ content: '❌ Kamu harus login terlebih dahulu.' });
      }

      const isOwner = userId === ownerID;
      const embedColor = isOwner ? 'Gold' : 'Blue';
      const userTag = isOwner ? `👑 ${interaction.user.tag}` : interaction.user.tag;

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`📢 Postingan Facebook Palsu`)
        .setDescription(content)
        .setFooter({ text: `Diposting oleh ${userTag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      if (imageUrl) {
        embed.setImage(imageUrl);
      }

      const postChannel = interaction.guild.channels.cache.get(postChannelId);
      if (!postChannel) {
        return interaction.editReply({ content: '❌ Channel untuk posting tidak ditemukan.' });
      }

      const postMessage = await postChannel.send({ embeds: [embed] });

      const reactions = ['👍', '❤️', '🤗', '😂', '😮', '😢', '😡'];
      for (const reaction of reactions) {
        await postMessage.react(reaction);
      }

      db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
        [userId, `📝 **${interaction.user.username}** membuat postingan baru: "${content.substring(0, 50)}..."`],
        (err) => {
          if (err) console.error('❌ Error saving notification:', err.message);
        });

      interaction.editReply({ content: '✅ Postingan berhasil dikirim!' });
    });
  }
};
