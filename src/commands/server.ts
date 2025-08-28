import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command, CommandCategory, EMBED_COLORS } from '../types/discord';
import { CraftyClient, ReactionManager } from '../services';
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
        targetServerId = servers[0].server_id;
        serverName = servers[0].server_name;
      } else {
        const serverInfo = await craftyClient.getServerInfo(targetServerId);
        serverName = serverInfo.server_name;
      }

      // Ensure targetServerId is not null at this point
      if (!targetServerId) {
        throw new Error('No server ID available');
      }

      // Check if action requires confirmation
      const requiresConfirmation = ['restart', 'kill'].includes(subcommand);
      
      if (requiresConfirmation) {
        await requestConfirmation(interaction, client, subcommand, targetServerId, serverName);
        return;
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

      const reply = await interaction.editReply({ embeds: [successEmbed] });

      logger.info(`Server ${subcommand} command executed successfully`, {
        serverId: targetServerId,
        serverName,
        user: interaction.user.tag,
        guild: interaction.guild?.name
      });

      // Add interactive reactions for continued management
      const reactionManager = (client as any).reactionManager as ReactionManager;
      if (reactionManager) {
        // Get current server stats to determine available actions
        const serverStats = await craftyClient.getServerStats(targetServerId);
        const actions = ReactionManager.getServerActionReactions(serverStats.running);
        
        await reactionManager.addReactions(
          reply,
          actions,
          interaction.user.id,
          targetServerId,
          10 // 10 minutes expiration
        );
      }

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

/**
 * Request confirmation for critical actions
 */
async function requestConfirmation(
  interaction: ChatInputCommandInteraction,
  client: Client,
  action: string,
  serverId: string,
  serverName: string
): Promise<void> {
    const actionEmojis: Record<string, string> = {
      restart: '🔄',
      kill: '💀'
    };

    const actionTexts: Record<string, string> = {
      restart: 'reiniciar',
      kill: 'forçar parada (kill)'
    };

    const warningMessages: Record<string, string> = {
      restart: 'Esta ação irá reiniciar o servidor, desconectando todos os jogadores temporariamente.',
      kill: '⚠️ **ATENÇÃO**: Esta ação irá forçar a parada do servidor, podendo causar corrupção de dados!'
    };

    const confirmationEmbed = new EmbedBuilder()
      .setColor(action === 'kill' ? EMBED_COLORS.ERROR : EMBED_COLORS.WARNING)
      .setTitle(`${actionEmojis[action]} Confirmação Necessária`)
      .setDescription(`Você está prestes a **${actionTexts[action]}** o servidor:`)
      .addFields(
        {
          name: '🖥️ Servidor',
          value: `**${serverName}** (\`${serverId}\`)`,
          inline: false
        },
        {
          name: '⚠️ Aviso',
          value: warningMessages[action],
          inline: false
        },
        {
          name: '🎮 Confirmação',
          value: 'Clique em ✅ para confirmar ou ❌ para cancelar',
          inline: false
        }
      )
      .setFooter({ text: 'Esta confirmação expira em 30 segundos' })
      .setTimestamp();

    const confirmationReply = await interaction.editReply({ embeds: [confirmationEmbed] });

    // Add confirmation reactions
    const reactionManager = (client as any).reactionManager as ReactionManager;
    if (reactionManager) {
      const confirmationActions = ReactionManager.getConfirmationReactions();
      
      // Store the action context for later execution
      const actionContext = {
        action,
        serverId,
        serverName,
        originalInteraction: interaction
      };

      // Store in reaction manager context (extend the context)
      (reactionManager as any).pendingActions = (reactionManager as any).pendingActions || new Map();
      (reactionManager as any).pendingActions.set(confirmationReply.id, actionContext);

      await reactionManager.addReactions(
        confirmationReply,
        confirmationActions,
        interaction.user.id,
        serverId,
        0.5 // 30 seconds expiration
      );
    }
}
