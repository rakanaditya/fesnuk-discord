const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Manage your Facebook-style profile.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your profile or another user’s.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Select a user')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setbio')
                .setDescription('Set your bio.')
                .addStringOption(option =>
                    option.setName('bio')
                        .setDescription('Enter your bio')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setprofile')
                .setDescription('Set your profile picture.')
                .addStringOption(option =>
                    option.setName('image_url')
                        .setDescription('Provide an image URL')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // Check if user is registered & logged in
        const userData = await new Promise(resolve => {
            db.get(`SELECT login FROM users WHERE id = ?`, [userId], (err, row) => {
                resolve(row);
            });
        });

        if (!userData) {
            return interaction.reply({ content: '❌ You need to register first using `/register`.', ephemeral: true });
        }

        if (['setbio', 'setprofile'].includes(subcommand) && userData.login !== 'iya') {
            return interaction.reply({ content: '❌ You must log in first using `/login`.', ephemeral: true });
        }

        if (subcommand === 'view') {
            const user = interaction.options.getUser('target') || interaction.user;

            db.get(`SELECT * FROM users WHERE id = ?`, [user.id], async (err, row) => {
                if (!row) {
                    return interaction.reply({ content: '❌ User has not registered yet.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`${user.username}'s Profile`)
                    .setColor('#0077ff')
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setImage(row.profile_picture || user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .addFields(
                        { name: 'Username', value: user.username, inline: true },
                        { name: 'Bio', value: row.bio || 'No bio set.', inline: false },
                        { name: 'User ID', value: user.id, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                await interaction.reply({ embeds: [embed] });
            });

        } else if (subcommand === 'setbio') {
            const bio = interaction.options.getString('bio');
            db.run(`UPDATE users SET bio = ? WHERE id = ?`, [bio, userId]);
            await interaction.reply({ content: `✅ Bio updated: **${bio}**`, ephemeral: true });

        } else if (subcommand === 'setprofile') {
            const imageUrl = interaction.options.getString('image_url');
            db.run(`UPDATE users SET profile_picture = ? WHERE id = ?`, [imageUrl, userId]);
            await interaction.reply({ content: '✅ Profile picture updated!', ephemeral: true });
        }
    },
};
