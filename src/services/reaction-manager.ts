import { 
  Message, 
  MessageReaction, 
  PartialMessage,
  PartialMessageReaction,
  User,
  PartialUser,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType 
} from 'discord.js';
import { CraftyClient } from './crafty-client';
import { getLogger } from '../utils';
import { EMBED_COLORS } from '../types/discord';

const logger = getLogger();

export interface ReactionAction {
  emoji: string;
  action: string;
  description: string;
  permission?: string;
  cooldown?: number;
  serverId?: string;
}

export interface ReactionContext {
  messageId: string;
  userId: string;
  serverId?: string;
  actions: ReactionAction[];
  expiresAt: Date;
}

export class ReactionManager {
  private contexts = new Map<string, ReactionContext>();
  private cooldowns = new Map<string, number>();
  private client: Client;
  private pendingActions = new Map<string, any>();

  constructor(client: Client) {
    this.client = client;
    this.setupCleanupTimer();
  }

  /**
   * Add reactions to a message and register actions
   */
  async addReactions(
    message: Message,
    actions: ReactionAction[],
    userId: string,
    serverId?: string,
    expirationMinutes: number = 10
  ): Promise<void> {
    try {
      // Add reactions to message
      for (const action of actions) {
        await message.react(action.emoji);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Store context
      const context: ReactionContext = {
        messageId: message.id,
        userId,
        serverId,
        actions,
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000)
      };

      this.contexts.set(message.id, context);

      logger.debug(`Added reactions to message ${message.id} for user ${userId}`, {
        actions: actions.map(a => `${a.emoji} ${a.action}`)
      });

    } catch (error) {
      logger.error('Failed to add reactions:', error);
    }
  }

  /**
   * Handle reaction events
   */
  async handleReaction(
    reaction: MessageReaction | PartialMessageReaction, 
    user: User | PartialUser, 
    type: 'add' | 'remove'
  ): Promise<void> {
    // Ensure reaction and message are fully fetched
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        logger.error('Failed to fetch partial reaction:', error);
        return;
      }
    }

    if (reaction.message.partial) {
      try {
        await reaction.message.fetch();
      } catch (error) {
        logger.error('Failed to fetch partial message:', error);
        return;
      }
    }
    // Fetch user if partial
    if (user.partial) {
      try {
        await user.fetch();
      } catch (error) {
        logger.error('Failed to fetch partial user:', error);
        return;
      }
    }

    // Ignore bot reactions and reaction removals
    if (user.bot || type === 'remove') return;

    const context = this.contexts.get(reaction.message.id);
    if (!context) return;

    // Check if reaction is expired
    if (new Date() > context.expiresAt) {
      this.contexts.delete(reaction.message.id);
      return;
    }

    // Check if user is authorized
    if (context.userId !== user.id) {
      // Remove reaction from unauthorized user
      try {
        await reaction.users.remove(user.id);
      } catch (error) {
        logger.debug('Could not remove reaction from unauthorized user');
      }
      return;
    }

    // Find matching action
    const action = context.actions.find(a => a.emoji === reaction.emoji.name);
    if (!action) return;

    // Check cooldown
    const cooldownKey = `${user.id}-${action.action}`;
    const now = Date.now();
    const lastUsed = this.cooldowns.get(cooldownKey) || 0;
    const cooldownTime = (action.cooldown || 5) * 1000;

    if (now - lastUsed < cooldownTime) {
      const remaining = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
      logger.debug(`User ${user.tag} is on cooldown for ${remaining}s`);
      
      // Remove reaction
      try {
        await reaction.users.remove(user.id);
      } catch (error) {
        logger.debug('Could not remove reaction due to cooldown');
      }
      return;
    }

    // Set cooldown
    this.cooldowns.set(cooldownKey, now);

    // Execute action (cast types since we've fetched them)
    await this.executeAction(reaction as MessageReaction, user as User, action, context);

    // Remove reaction after action
    try {
      await reaction.users.remove(user.id);
    } catch (error) {
      logger.debug('Could not remove reaction after action');
    }
  }

  /**
   * Execute the reaction action
   */
  private async executeAction(
    reaction: MessageReaction,
    user: User,
    action: ReactionAction,
    context: ReactionContext
  ): Promise<void> {
    // Ensure message is fetched
    const message = reaction.message;
    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) {
        logger.error('Failed to fetch partial message in executeAction:', error);
        return;
      }
    }
    try {
      const craftyClient = new CraftyClient();

      logger.info(`Executing reaction action: ${action.action} by ${user.tag}`);

      switch (action.action) {
        case 'start_server':
          if (context.serverId) {
            await this.executeServerAction(craftyClient, 'start', context.serverId, reaction.message, user);
          }
          break;

        case 'stop_server':
          if (context.serverId) {
            await this.executeServerAction(craftyClient, 'stop', context.serverId, reaction.message, user);
          }
          break;

        case 'restart_server':
          if (context.serverId) {
            await this.executeServerAction(craftyClient, 'restart', context.serverId, reaction.message, user);
          }
          break;

        case 'refresh_status':
          if (context.serverId) {
            await this.refreshServerStatus(craftyClient, context.serverId, reaction.message, user);
          }
          break;

        case 'show_players':
          if (context.serverId) {
            await this.showOnlinePlayers(craftyClient, context.serverId, reaction.message, user);
          }
          break;

        case 'show_summary':
          await this.showServerSummary(craftyClient, reaction.message, user);
          break;

        case 'show_servers_list':
          await this.showServersList(craftyClient, reaction.message, user);
          break;

        case 'quick_status':
          await this.showQuickStatus(craftyClient, reaction.message, user);
          break;

        case 'refresh_menu':
          await this.refreshMenu(craftyClient, reaction.message, user);
          break;

        case 'show_help':
          await this.showHelp(reaction.message, user);
          break;

        case 'confirm_action':
          await this.handleConfirmation(reaction.message, user, 'confirmed');
          break;

        case 'cancel_action':
          await this.handleConfirmation(reaction.message, user, 'cancelled');
          break;

        default:
          logger.warn(`Unknown reaction action: ${action.action}`);
      }

    } catch (error) {
      logger.error(`Error executing reaction action ${action.action}:`, error);
      
      // Send error message
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setTitle('❌ Erro na Ação')
        .setDescription(`Falha ao executar ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        .setTimestamp();

      try {
        await reaction.message.reply({ embeds: [errorEmbed] });
      } catch (replyError) {
        logger.error('Could not send error message:', replyError);
      }
    }
  }

  /**
   * Execute server actions
   */
  private async executeServerAction(
    craftyClient: CraftyClient,
    action: 'start' | 'stop' | 'restart',
    serverId: string,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const actionEmojis = {
      start: '▶️',
      stop: '⏹️', 
      restart: '🔄'
    };

    const actionTexts = {
      start: 'iniciado',
      stop: 'parado',
      restart: 'reiniciado'
    };

    // Get server info
    const serverInfo = await craftyClient.getServerInfo(serverId);

    // Execute action
    switch (action) {
      case 'start':
        await craftyClient.startServer(serverId);
        break;
      case 'stop':
        await craftyClient.stopServer(serverId);
        break;
      case 'restart':
        await craftyClient.restartServer(serverId);
        break;
    }

    // Create success embed
    const successEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle(`${actionEmojis[action]} Servidor ${actionTexts[action].charAt(0).toUpperCase() + actionTexts[action].slice(1)}`)
      .setDescription(`**${serverInfo.server_name}** foi ${actionTexts[action]} com sucesso via reação!`)
      .addFields(
        {
          name: '👤 Executado por',
          value: user.username,
          inline: true
        },
        {
          name: '⚡ Ação',
          value: action.toUpperCase(),
          inline: true
        }
      )
      .setTimestamp();

    await message.reply({ embeds: [successEmbed] });
  }

  /**
   * Refresh server status
   */
  private async refreshServerStatus(
    craftyClient: CraftyClient,
    serverId: string,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const serverInfo = await craftyClient.getServerInfo(serverId);
    const serverStats = await craftyClient.getServerStats(serverId);

    const statusEmoji = serverStats.running ? '🟢' : '🔴';
    const statusText = serverStats.running ? 'EXECUTANDO' : 'PARADO';

    const embed = new EmbedBuilder()
      .setColor(serverStats.running ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
      .setTitle(`🔄 Status Atualizado - ${serverInfo.server_name}`)
      .setDescription(`**Status:** ${statusEmoji} ${statusText}`)
      .addFields(
        {
          name: '👥 Jogadores',
          value: `${serverStats.online}/${serverStats.max}`,
          inline: true
        },
        {
          name: '💾 CPU',
          value: `${serverStats.cpu.toFixed(1)}%`,
          inline: true
        },
        {
          name: '🧠 Memória',
          value: `${serverStats.mem_percent}%`,
          inline: true
        }
      )
      .setFooter({ text: `Atualizado por ${user.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  /**
   * Show online players
   */
  private async showOnlinePlayers(
    craftyClient: CraftyClient,
    serverId: string,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const serverInfo = await craftyClient.getServerInfo(serverId);
    const serverStats = await craftyClient.getServerStats(serverId);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.INFO)
      .setTitle(`👥 Jogadores Online - ${serverInfo.server_name}`)
      .setDescription(`**${serverStats.online}/${serverStats.max}** jogadores conectados`)
      .addFields(
        {
          name: '🌐 Endereço do Servidor',
          value: `${serverInfo.server_ip}:${serverInfo.server_port}`,
          inline: true
        },
        {
          name: '⏱️ Uptime',
          value: serverStats.running ? `Iniciado em: ${serverStats.started}` : 'Servidor não está executando',
          inline: true
        }
      )
      .setFooter({ text: `Solicitado por ${user.username}` })
      .setTimestamp();

    // Add interactive reactions for this message too
    const replyMessage = await message.reply({ embeds: [embed] });
    
    if (serverStats.running) {
      await this.addReactions(replyMessage, [
        { emoji: '🔄', action: 'refresh_status', description: 'Atualizar status' },
        { emoji: '⏹️', action: 'stop_server', description: 'Parar servidor' }
      ], user.id, serverId);
    }
  }

  /**
   * Handle confirmation actions
   */
  private async handleConfirmation(
    message: Message | PartialMessage,
    user: User,
    result: 'confirmed' | 'cancelled'
  ): Promise<void> {
    const pendingAction = this.pendingActions.get(message.id);
    
    if (result === 'confirmed' && pendingAction) {
      // Execute the pending action
      try {
        await this.executeConfirmedAction(pendingAction, message, user);
      } catch (error) {
        logger.error('Failed to execute confirmed action:', error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('❌ Erro na Execução')
          .setDescription(`Falha ao executar ação confirmada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
          .setTimestamp();

        await message.reply({ embeds: [errorEmbed] });
      }
    } else {
      // Action was cancelled
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle('❌ Ação Cancelada')
        .setDescription(`Ação cancelada por ${user.username}`)
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    }
    
    // Clean up
    this.contexts.delete(message.id);
    this.pendingActions.delete(message.id);
  }

  /**
   * Execute confirmed action
   */
  private async executeConfirmedAction(
    pendingAction: any,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const { action, serverId, serverName } = pendingAction;
    const craftyClient = new CraftyClient();

    let actionText = '';
    let actionEmoji = '';

    switch (action) {
      case 'restart':
        await craftyClient.restartServer(serverId);
        actionText = 'reiniciado';
        actionEmoji = '🔄';
        break;
      
      case 'kill':
        await craftyClient.killServer(serverId);
        actionText = 'forçadamente parado';
        actionEmoji = '💀';
        break;
      
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // Create success embed
    const successEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle(`${actionEmoji} Servidor ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`)
      .setDescription(`**${serverName}** foi ${actionText} com sucesso!`)
      .addFields(
        {
          name: '🆔 Server ID',
          value: serverId,
          inline: true
        },
        {
          name: '👤 Executado por',
          value: user.username,
          inline: true
        },
        {
          name: '⚡ Ação',
          value: action.toUpperCase(),
          inline: true
        }
      )
      .setFooter({ 
        text: 'Ação confirmada e executada', 
        iconURL: this.client.user?.displayAvatarURL() 
      })
      .setTimestamp();

    const reply = await message.reply({ embeds: [successEmbed] });

    // Add interactive reactions for continued management
    const serverStats = await craftyClient.getServerStats(serverId);
    const actions = ReactionManager.getServerActionReactions(serverStats.running);
    
    await this.addReactions(
      reply,
      actions,
      user.id,
      serverId,
      10 // 10 minutes expiration
    );

    logger.info(`Confirmed server ${action} command executed successfully`, {
      serverId,
      serverName,
      user: user.tag,
    });
  }

  /**
   * Show comprehensive server summary
   */
  private async showServerSummary(
    craftyClient: CraftyClient,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const servers = await craftyClient.getServers();
    
    if (servers.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle('⚠️ Nenhum Servidor')
        .setDescription('Não há servidores para mostrar resumo.')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    // Get stats for all servers
    const serversWithStats = await Promise.all(
      servers.slice(0, 5).map(async (server) => { // Limit to 5 servers to avoid embed limits
        try {
          const stats = await craftyClient.getServerStats(server.server_id);
          return { server, stats };
        } catch (error) {
          return { server, stats: null };
        }
      })
    );

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.INFO)
      .setTitle('📊 Resumo Detalhado dos Servidores')
      .setDescription('Status atual de todos os servidores:')
      .setFooter({ text: `Solicitado por ${user.username}` })
      .setTimestamp();

    let totalPlayers = 0;
    let runningServers = 0;

    serversWithStats.forEach(({ server, stats }) => {
      const status = stats ? (stats.running ? '🟢 Online' : '🔴 Offline') : '❓ Desconhecido';
      const players = stats ? `${stats.online}/${stats.max}` : 'N/A';
      const cpu = stats ? `${stats.cpu.toFixed(1)}%` : 'N/A';
      const memory = stats ? `${stats.mem_percent}%` : 'N/A';

      if (stats && stats.running) {
        runningServers++;
        totalPlayers += stats.online;
      }

      embed.addFields({
        name: `${server.server_name}`,
        value: [
          `**Status:** ${status}`,
          `**Jogadores:** ${players}`,
          `**CPU:** ${cpu} | **Mem:** ${memory}`,
          `**ID:** \`${server.server_id}\``
        ].join('\n'),
        inline: true
      });
    });

    // Add summary
    embed.addFields({
      name: '📈 Resumo Geral',
      value: [
        `🖥️ **Servidores Online:** ${runningServers}/${servers.length}`,
        `👥 **Total de Jogadores:** ${totalPlayers}`,
        `📊 **Taxa de Uso:** ${((runningServers / servers.length) * 100).toFixed(1)}%`
      ].join('\n'),
      inline: false
    });

    if (servers.length > 5) {
      embed.addFields({
        name: '⚠️ Aviso',
        value: `Mostrando apenas os primeiros 5 de ${servers.length} servidores.`,
        inline: false
      });
    }

    await message.reply({ embeds: [embed] });
  }

  /**
   * Show servers list (simplified for menu)
   */
  private async showServersList(
    craftyClient: CraftyClient,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const servers = await craftyClient.getServers();
    
    if (servers.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle('⚠️ Nenhum Servidor')
        .setDescription('Não há servidores configurados.')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle('📋 Lista de Servidores')
      .setDescription(`**Total:** ${servers.length} servidores encontrados`)
      .setTimestamp();

    // Add server list (limit to avoid embed size issues)
    servers.slice(0, 10).forEach((server, index) => {
      embed.addFields({
        name: `${index + 1}. ${server.server_name}`,
        value: `**ID:** \`${server.server_id}\`\n**IP:** ${server.server_ip}:${server.server_port}`,
        inline: true
      });
    });

    if (servers.length > 10) {
      embed.addFields({
        name: '⚠️ Mais servidores',
        value: `E mais ${servers.length - 10} servidores... Use /servers para ver todos.`,
        inline: false
      });
    }

    await message.reply({ embeds: [embed] });
  }

  /**
   * Show quick status of first available server
   */
  private async showQuickStatus(
    craftyClient: CraftyClient,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const servers = await craftyClient.getServers();
    
    if (servers.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setTitle('⚠️ Nenhum Servidor')
        .setDescription('Não há servidores para mostrar status.')
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      return;
    }

    const server = servers[0];
    const stats = await craftyClient.getServerStats(server.server_id);
    
    const statusEmoji = stats.running ? '🟢' : '🔴';
    const statusText = stats.running ? 'ONLINE' : 'OFFLINE';

    const embed = new EmbedBuilder()
      .setColor(stats.running ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
      .setTitle(`⚡ Status Rápido - ${server.server_name}`)
      .setDescription(`**Status:** ${statusEmoji} ${statusText}`)
      .addFields(
        {
          name: '👥 Jogadores',
          value: `${stats.online}/${stats.max}`,
          inline: true
        },
        {
          name: '⚡ Recursos',
          value: `CPU: ${stats.cpu.toFixed(1)}% | Mem: ${stats.mem_percent}%`,
          inline: true
        },
        {
          name: '🆔 Server ID',
          value: server.server_id,
          inline: true
        }
      )
      .setFooter({ text: `Status solicitado por ${user.username}` })
      .setTimestamp();

    const reply = await message.reply({ embeds: [embed] });

    // Add control reactions
    const actions = ReactionManager.getServerActionReactions(stats.running);
    await this.addReactions(
      reply,
      actions,
      user.id,
      server.server_id,
      10
    );
  }

  /**
   * Refresh the menu with updated information
   */
  private async refreshMenu(
    craftyClient: CraftyClient,
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const servers = await craftyClient.getServers();
    let runningCount = 0;
    
    // Quick check of running servers
    for (const server of servers.slice(0, 5)) {
      try {
        const stats = await craftyClient.getServerStats(server.server_id);
        if (stats.running) runningCount++;
      } catch (error) {
        // Ignore errors for quick refresh
      }
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle('🔄 Menu Atualizado')
      .setDescription('Informações atualizadas com sucesso!')
      .addFields(
        {
          name: '📊 Status Atualizado',
          value: [
            `🖥️ **Servidores Totais:** ${servers.length}`,
            `🟢 **Servidores Online:** ${runningCount}`,
            `🔴 **Servidores Offline:** ${servers.length - runningCount}`,
            `⏱️ **Última Atualização:** ${new Date().toLocaleString('pt-BR')}`
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: `Atualizado por ${user.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  /**
   * Show help information
   */
  private async showHelp(
    message: Message | PartialMessage,
    user: User
  ): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.INFO)
      .setTitle('❓ Ajuda - Sistema de Reações Interativas')
      .setDescription('Como usar o sistema de controle por emojis:')
      .addFields(
        {
          name: '🎮 Comandos Principais',
          value: [
            '`/menu` - Menu interativo principal',
            '`/status [server_id]` - Status com controles',
            '`/servers` - Lista com resumo interativo',
            '`/server [action] [server_id]` - Ações diretas'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎯 Reações Comuns',
          value: [
            '🔄 - Atualizar/Reiniciar',
            '▶️ - Iniciar servidor',
            '⏹️ - Parar servidor',
            '👥 - Ver jogadores online',
            '📊 - Resumo detalhado',
            '✅❌ - Confirmar/Cancelar ações'
          ].join('\n'),
          inline: false
        },
        {
          name: '⚠️ Dicas Importantes',
          value: [
            '• Apenas quem executou o comando pode usar as reações',
            '• Reações expiram automaticamente',
            '• Ações críticas pedem confirmação',
            '• Use comandos diretos para automação',
            '• Verifique permissões se algo não funcionar'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔐 Segurança',
          value: [
            '• Restart e Kill pedem confirmação',
            '• Cooldown entre ações',
            '• Logs de todas as ações',
            '• Controle de permissões por cargo'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: `Ajuda solicitada por ${user.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  /**
   * Clean up expired contexts
   */
  private setupCleanupTimer(): void {
    setInterval(() => {
      const now = new Date();
      for (const [messageId, context] of this.contexts.entries()) {
        if (now > context.expiresAt) {
          this.contexts.delete(messageId);
          logger.debug(`Cleaned up expired reaction context for message ${messageId}`);
        }
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Get common server action reactions
   */
  static getServerActionReactions(isRunning: boolean): ReactionAction[] {
    const actions: ReactionAction[] = [
      { emoji: '🔄', action: 'refresh_status', description: 'Atualizar status' }
    ];

    if (isRunning) {
      actions.push(
        { emoji: '⏹️', action: 'stop_server', description: 'Parar servidor' },
        { emoji: '🔄', action: 'restart_server', description: 'Reiniciar servidor' },
        { emoji: '👥', action: 'show_players', description: 'Ver jogadores' }
      );
    } else {
      actions.push(
        { emoji: '▶️', action: 'start_server', description: 'Iniciar servidor' }
      );
    }

    return actions;
  }

  /**
   * Get confirmation reactions
   */
  static getConfirmationReactions(): ReactionAction[] {
    return [
      { emoji: '✅', action: 'confirm_action', description: 'Confirmar' },
      { emoji: '❌', action: 'cancel_action', description: 'Cancelar' }
    ];
  }

  /**
   * Remove context and reactions for a message
   */
  async removeContext(messageId: string): Promise<void> {
    this.contexts.delete(messageId);
  }
}
