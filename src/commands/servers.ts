import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { Command, CommandCategory, EMBED_COLORS } from '../types/discord';
import { CraftyClient, ReactionManager } from '../services';
import { getLogger, formatUptime, formatBytes, formatPercentage } from '../utils';
import { ServerStatus } from '../types/crafty';

const logger = getLogger();

export const serversCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Lista todos os servidores do Crafty com seus IDs e status atuais'),
  
  category: CommandCategory.SERVER,
  cooldown: 15,

  async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    try {
      const craftyClient = new CraftyClient();
      
      // Test connection first
      const isConnected = await craftyClient.testConnection();
      if (!isConnected) {
        const errorEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setTitle('❌ Erro de Conexão')
          .setDescription('Não foi possível conectar ao Crafty Controller. Verifique a configuração.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Get all servers
      const servers = await craftyClient.getServers();
      
      if (servers.length === 0) {
        const noServersEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.WARNING)
          .setTitle('⚠️ Nenhum Servidor Encontrado')
          .setDescription('Não há servidores Minecraft configurados no Crafty Controller.')
          .setTimestamp();

        await interaction.editReply({ embeds: [noServersEmbed] });
        return;
      }

      // Create main embed
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle('🖥️ Servidores do Crafty Controller')
        .setDescription(`**Total de servidores:** ${servers.length}`)
        .setFooter({ 
          text: `Solicitado por ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Get stats for all servers to determine their status
      const serversWithStats = await Promise.all(
        servers.map(async (server) => {
          try {
            const stats = await craftyClient.getServerStats(server.server_id);
            return { server, stats };
          } catch (error) {
            // If we can't get stats, assume server is stopped
            return { server, stats: null };
          }
        })
      );

      // Group servers by status based on stats
      const serversByStatus = serversWithStats.reduce((acc, { server, stats }) => {
        let status = ServerStatus.UNKNOWN;
        
        if (stats) {
          status = stats.running ? ServerStatus.RUNNING : 
                   stats.crashed ? ServerStatus.CRASHED :
                   stats.waiting_start ? ServerStatus.STARTING :
                   ServerStatus.STOPPED;
        } else {
          status = ServerStatus.STOPPED;
        }

        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push({ server, stats });
        return acc;
      }, {} as Record<string, Array<{ server: any, stats: any }>>);

      // Add fields for each status group
      Object.entries(serversByStatus).forEach(([status, serverList]) => {
        const statusEmoji = getStatusEmoji(status as ServerStatus);
        const statusName = getStatusDisplayName(status as ServerStatus);
        
        const serverListText = serverList.map(({ server, stats }) => {
          const playersText = stats ? `${stats.online}/${stats.max}` : 'N/A';
          const uptimeText = stats && stats.running ? `Started: ${stats.started}` : 'Não iniciado';
          const portText = server.server_port ? `:${server.server_port}` : '';
          
          return `• **${server.server_name}** (ID: \`${server.server_id}\`)\n  🌐 ${server.server_ip}${portText} | 👥 ${playersText} jogadores | ⏱️ ${uptimeText}`;
        }).join('\n\n');

        embed.addFields({
          name: `${statusEmoji} ${statusName} (${serverList.length})`,
          value: serverListText,
          inline: false
        });
      });

      // Add summary field
      const runningCount = serversByStatus[ServerStatus.RUNNING]?.length || 0;
      const stoppedCount = serversByStatus[ServerStatus.STOPPED]?.length || 0;
      const otherCount = servers.length - runningCount - stoppedCount;

      const summaryText = [
        `🟢 **Executando:** ${runningCount}`,
        `🔴 **Parados:** ${stoppedCount}`,
        `🟡 **Outros:** ${otherCount}`
      ].join(' | ');

      embed.addFields({
        name: '📊 Resumo',
        value: summaryText,
        inline: false
      });

      const reply = await interaction.editReply({ embeds: [embed] });
      logger.info(`Servers command executed by ${interaction.user.tag} - Found ${servers.length} servers`);

      // Add interactive reactions for server management
      const reactionManager = (client as any).reactionManager as ReactionManager;
      if (reactionManager && servers.length > 0) {
        // Add general server management reactions
        const actions = [
          { emoji: '🔄', action: 'refresh_status', description: 'Atualizar lista de servidores' },
          { emoji: '📊', action: 'show_summary', description: 'Ver resumo detalhado' }
        ];

        await reactionManager.addReactions(
          reply,
          actions,
          interaction.user.id,
          undefined, // No specific server
          10 // 10 minutes expiration
        );

        // Add help text about reactions
        const helpEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.INFO)
          .setTitle('🎮 Controles de Lista')
          .setDescription('Clique nas reações para gerenciar a lista:')
          .addFields(
            actions.map(action => ({
              name: action.emoji,
              value: action.description,
              inline: true
            }))
          )
          .setFooter({ text: 'Para controlar um servidor específico, use /status [server_id]' })
          .setTimestamp();

        await interaction.followUp({ embeds: [helpEmbed], ephemeral: true });
      }

    } catch (error: any) {
      logger.error('Servers command failed:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setTitle('❌ Erro')
        .setDescription(`Falha ao listar servidores: ${error.message || 'Erro desconhecido'}`)
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

function getStatusDisplayName(status: ServerStatus): string {
  const names = {
    [ServerStatus.RUNNING]: 'Executando',
    [ServerStatus.STOPPED]: 'Parado',
    [ServerStatus.STARTING]: 'Iniciando',
    [ServerStatus.STOPPING]: 'Parando',
    [ServerStatus.CRASHED]: 'Crashado',
    [ServerStatus.UNKNOWN]: 'Desconhecido',
  };
  return names[status] || 'Desconhecido';
}
