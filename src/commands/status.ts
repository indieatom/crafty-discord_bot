import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { Command, CommandCategory, EMBED_COLORS } from '../types/discord';
import { CraftyClient } from '../services';
import { getLogger, formatUptime, formatBytes, formatPercentage } from '../utils';
import { ServerStatus } from '../types/crafty';

const logger = getLogger();

export const statusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Shows the current status of the Minecraft server')
    .addStringOption(option =>
      option.setName('server')
        .setDescription('Server ID (optional, uses default if not specified)')
        .setRequired(false)
    ),
  
  category: CommandCategory.SERVER,
  cooldown: 10,

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    try {
      const serverId = interaction.options.getString('server');
      const craftyClient = new CraftyClient();
      
      // Test connection first
      const isConnected = await craftyClient.testConnection();
      if (!isConnected) {
        const errorEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('❌ Connection Error')
          .setDescription('Unable to connect to Crafty Controller. Please check the configuration.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      let serverInfo;
      let serverStats;

      if (serverId) {
        // Get specific server
        serverInfo = await craftyClient.getServerInfo(serverId);
        serverStats = await craftyClient.getServerStats(serverId);
      } else {
        // Get first available server
        const servers = await craftyClient.getServers();
        if (servers.length === 0) {
          const noServersEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.WARNING)
            .setTitle('⚠️ No Servers Found')
            .setDescription('No Minecraft servers are configured in Crafty Controller.')
            .setTimestamp();

          await interaction.editReply({ embeds: [noServersEmbed] });
          return;
        }

        serverInfo = servers[0];
        serverStats = await craftyClient.getServerStats(serverInfo.id);
      }

      // Create status embed
      const statusEmoji = getStatusEmoji(serverInfo.status);
      const statusColor = getStatusColor(serverInfo.status);

      const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(`${statusEmoji} ${serverInfo.name}`)
        .setDescription(`**Status:** ${serverInfo.status.toUpperCase()}`)
        .addFields(
          {
            name: '📊 Server Info',
            value: [
              `**Type:** ${serverInfo.type}`,
              `**Version:** ${serverInfo.version}`,
              `**Address:** ${serverInfo.ip}:${serverInfo.port}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '👥 Players',
            value: [
              `**Online:** ${serverInfo.players.online}/${serverInfo.players.max}`,
              `**Usage:** ${formatPercentage(serverInfo.players.online, serverInfo.players.max)}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '⏱️ Uptime',
            value: serverInfo.uptime > 0 ? formatUptime(serverInfo.uptime) : 'Not running',
            inline: true
          },
          {
            name: '💾 Resources',
            value: [
              `**CPU:** ${serverStats.cpu_usage.toFixed(1)}%`,
              `**Memory:** ${formatBytes(serverStats.memory_usage)}/${formatBytes(serverStats.memory_total)}`,
              `**Disk:** ${formatBytes(serverStats.disk_usage)}/${formatBytes(serverStats.disk_total)}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '🌐 Network',
            value: [
              `**In:** ${formatBytes(serverStats.network_in)}`,
              `**Out:** ${formatBytes(serverStats.network_out)}`,
              `**TPS:** ${serverStats.tps?.toFixed(1) || 'N/A'}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '🆔 Server ID',
            value: serverInfo.id,
            inline: true
          }
        )
        .setFooter({ 
          text: `Requested by ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logger.info(`Status command executed for server ${serverInfo.id} by ${interaction.user.tag}`);

    } catch (error: any) {
      logger.error('Status command failed:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setTitle('❌ Error')
        .setDescription(`Failed to get server status: ${error.message || 'Unknown error'}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

function getStatusEmoji(status: ServerStatus): string {
  const emojis = {
    [ServerStatus.RUNNING]: '🟢',
    [ServerStatus.STOPPED]: '🔴',
    [ServerStatus.STARTING]: '🟡',
    [ServerStatus.STOPPING]: '🟡',
    [ServerStatus.CRASHED]: '💥',
    [ServerStatus.UNKNOWN]: '❓',
  };
  return emojis[status] || '❓';
}

function getStatusColor(status: ServerStatus): number {
  const colors = {
    [ServerStatus.RUNNING]: EMBED_COLORS.SUCCESS,
    [ServerStatus.STOPPED]: EMBED_COLORS.ERROR,
    [ServerStatus.STARTING]: EMBED_COLORS.WARNING,
    [ServerStatus.STOPPING]: EMBED_COLORS.WARNING,
    [ServerStatus.CRASHED]: EMBED_COLORS.ERROR,
    [ServerStatus.UNKNOWN]: EMBED_COLORS.INFO,
  };
  return colors[status] || EMBED_COLORS.INFO;
}
