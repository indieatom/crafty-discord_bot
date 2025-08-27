import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command, CommandCategory, EMBED_COLORS } from '../types/discord';
import { CraftyClient } from '../services';
import { getLogger } from '../utils';

const logger = getLogger();

export const serverCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Control Minecraft server (start, stop, restart)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Start the Minecraft server')
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Server ID (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stop')
        .setDescription('Stop the Minecraft server')
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Server ID (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('restart')
        .setDescription('Restart the Minecraft server')
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Server ID (optional)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('kill')
        .setDescription('Force kill the Minecraft server (emergency use only)')
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Server ID (optional)')
            .setRequired(false)
        )
    ),
  
  category: CommandCategory.SERVER,
  permissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 15,

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    try {
      const subcommand = interaction.options.getSubcommand();
      const serverId = interaction.options.getString('server');
      const craftyClient = new CraftyClient();
      
      // Test connection
      const isConnected = await craftyClient.testConnection();
      if (!isConnected) {
        const errorEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('❌ Connection Error')
          .setDescription('Unable to connect to Crafty Controller.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Get server info
      let targetServerId = serverId;
      let serverName = 'Server';

      if (!targetServerId) {
        const servers = await craftyClient.getServers();
        if (servers.length === 0) {
          const noServersEmbed = new EmbedBuilder()
            .setColor(EMBED_COLORS.WARNING)
            .setTitle('⚠️ No Servers Found')
            .setDescription('No Minecraft servers are configured.')
            .setTimestamp();

          await interaction.editReply({ embeds: [noServersEmbed] });
          return;
        }
        targetServerId = servers[0].id;
        serverName = servers[0].name;
      } else {
        const serverInfo = await craftyClient.getServerInfo(targetServerId);
        serverName = serverInfo.name;
      }

      // Execute the action
      let actionText = '';
      let actionEmoji = '';

      switch (subcommand) {
        case 'start':
          await craftyClient.startServer(targetServerId);
          actionText = 'started';
          actionEmoji = '▶️';
          break;
        
        case 'stop':
          await craftyClient.stopServer(targetServerId);
          actionText = 'stopped';
          actionEmoji = '⏹️';
          break;
        
        case 'restart':
          await craftyClient.restartServer(targetServerId);
          actionText = 'restarted';
          actionEmoji = '🔄';
          break;
        
        case 'kill':
          await craftyClient.killServer(targetServerId);
          actionText = 'force killed';
          actionEmoji = '💀';
          break;
        
        default:
          throw new Error('Unknown subcommand');
      }

      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle(`${actionEmoji} Server ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`)
        .setDescription(`**${serverName}** has been ${actionText} successfully.`)
        .addFields(
          {
            name: '🆔 Server ID',
            value: targetServerId,
            inline: true
          },
          {
            name: '👤 Executed by',
            value: interaction.user.username,
            inline: true
          },
          {
            name: '⚡ Action',
            value: subcommand.toUpperCase(),
            inline: true
          }
        )
        .setFooter({ 
          text: 'Server action completed', 
          iconURL: client.user?.displayAvatarURL() 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

      logger.info(`Server ${subcommand} command executed successfully`, {
        serverId: targetServerId,
        serverName,
        user: interaction.user.tag,
        guild: interaction.guild?.name
      });

    } catch (error: any) {
      logger.error('Server command failed:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setTitle('❌ Server Action Failed')
        .setDescription(`Failed to execute server command: ${error.message || 'Unknown error'}`)
        .addFields(
          {
            name: '🔧 Possible Solutions',
            value: [
              '• Check Crafty Controller connection',
              '• Verify server ID is correct',
              '• Ensure proper permissions are set',
              '• Check server logs for more details'
            ].join('\n')
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
