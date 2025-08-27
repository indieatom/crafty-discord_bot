import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { Command, CommandCategory } from '../types/discord';
import { getLogger } from '../utils';

const logger = getLogger();

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong! and shows latency information'),
  
  category: CommandCategory.UTILITY,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    const sent = await interaction.reply({ 
      content: 'Pinging...', 
      fetchReply: true 
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    await interaction.editReply({
      content: `🏓 **Pong!**\n` +
               `📡 **Latency:** ${latency}ms\n` +
               `💓 **API Latency:** ${apiLatency}ms\n` +
               `⏱️ **Uptime:** ${Math.floor(client.uptime! / 1000)}s`
    });

    logger.debug(`Ping command executed - Latency: ${latency}ms, API: ${apiLatency}ms`);
  }
};
