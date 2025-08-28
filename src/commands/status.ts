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
        serverStats = await craftyClient.getServerStats(serverInfo.server_id);
      }

      // Determine server status from stats
      const serverStatus = serverStats.running ? ServerStatus.RUNNING : 
                          serverStats.crashed ? ServerStatus.CRASHED :
                          serverStats.waiting_start ? ServerStatus.STARTING :
                          ServerStatus.STOPPED;

      // Create status embed
      const statusEmoji = getStatusEmoji(serverStatus);
      const statusColor = getStatusColor(serverStatus);

      const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(`${statusEmoji} ${serverInfo.server_name}`)
        .setDescription(`**Status:** ${serverStatus.toUpperCase()}`)
        .addFields(
          {
            name: '📊 Server Info',
            value: [
              `**Type:** ${serverInfo.type}`,
              `**Executable:** ${serverInfo.executable}`,
              `**Version:** ${serverStats.version}`,
              `**Address:** ${serverInfo.server_ip}:${serverInfo.server_port}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '👥 Players',
            value: [
              `**Online:** ${serverStats.online}/${serverStats.max}`,
              `**Usage:** ${formatPercentage(serverStats.online, serverStats.max)}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '⏱️ Uptime',
            value: serverStats.running ? `Started: ${serverStats.started}` : 'Not running',
            inline: true
          },
          {
            name: '💾 Resources',
            value: [
              `**CPU:** ${serverStats.cpu.toFixed(1)}%`,
              `**Memory:** ${serverStats.mem} (${serverStats.mem_percent}%)`,
              `**World Size:** ${serverStats.world_size}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '🌐 Network',
            value: [
              `**Port:** ${serverStats.server_port}`,
              `**Ping:** ${serverStats.int_ping_results}`,
              `**Description:** ${serverStats.desc}`,
            ].join('\n'),
            inline: true
          },
          {
            name: '🆔 Server ID',
            value: serverInfo.server_id,
            inline: true
          }
        )
        .setFooter({ 
          text: `Requested by ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      logger.info(`Status command executed for server ${serverInfo.server_id} by ${interaction.user.tag}`);

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
