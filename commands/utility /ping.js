const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
    cooldown: 5,
	  data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
  //  .addStringOption(option => option.setName('ping')//buat pilihan
//	.setRequired(true)),
	async execute(message, args, client) {
        message.channel.send('Pinging...').then(sentMessage => {
            sentMessage.edit(`Pong! Latency is ${sentMessage.createdTimestamp - message.createdTimestamp}ms.`);
        });
    },
};
