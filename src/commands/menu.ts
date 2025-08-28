import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { Command, CommandCategory, EMBED_COLORS } from '../types/discord';
import { CraftyClient, ReactionManager } from '../services';
import { getLogger } from '../utils';

const logger = getLogger();

export const menuCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Menu interativo para controle completo dos servidores Minecraft'),
  
  category: CommandCategory.SERVER,
  cooldown: 5,

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
          .setDescription('Não foi possível conectar ao Crafty Controller.')
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Get servers count for menu
      const servers = await craftyClient.getServers();
      const serversCount = servers.length;
      const runningCount = await getRunningServersCount(craftyClient, servers);

      // Create interactive menu embed
      const menuEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.INFO)
        .setTitle('🎮 Menu Interativo do Crafty Controller')
        .setDescription('Use as reações abaixo para navegar e controlar seus servidores:')
        .addFields(
          {
            name: '📊 Status Atual',
            value: [
              `🖥️ **Servidores Totais:** ${serversCount}`,
              `🟢 **Servidores Online:** ${runningCount}`,
              `🔴 **Servidores Offline:** ${serversCount - runningCount}`
            ].join('\n'),
            inline: false
          },
          {
            name: '🎛️ Controles Disponíveis',
            value: [
              '📋 **Lista de Servidores** - Ver todos os servidores',
              '📊 **Resumo Detalhado** - Status completo de todos',
              '⚡ **Status Rápido** - Status do primeiro servidor',
              '🔄 **Atualizar Menu** - Recarregar informações',
              '❓ **Ajuda** - Guia de comandos'
            ].join('\n'),
            inline: false
          },
          {
            name: '⏱️ Informações',
            value: [
              '• As reações expiram em 15 minutos',
              '• Apenas quem executou o comando pode usar',
              '• Use `/status [id]` para controles específicos',
              '• Use `/server [ação] [id]` para ações diretas'
            ].join('\n'),
            inline: false
          }
        )
        .setFooter({ 
          text: `Menu solicitado por ${interaction.user.username}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

      const reply = await interaction.editReply({ embeds: [menuEmbed] });

      // Add interactive menu reactions
      const reactionManager = (client as any).reactionManager as ReactionManager;
      if (reactionManager) {
        const menuActions = [
          { emoji: '📋', action: 'show_servers_list', description: 'Lista de servidores' },
          { emoji: '📊', action: 'show_summary', description: 'Resumo detalhado' },
          { emoji: '⚡', action: 'quick_status', description: 'Status rápido' },
          { emoji: '🔄', action: 'refresh_menu', description: 'Atualizar menu' },
          { emoji: '❓', action: 'show_help', description: 'Mostrar ajuda' }
        ];

        await reactionManager.addReactions(
          reply,
          menuActions,
          interaction.user.id,
          undefined, // No specific server
          15 // 15 minutes expiration
        );

        logger.info(`Interactive menu displayed for user ${interaction.user.tag}`);
      }

    } catch (error: any) {
      logger.error('Menu command failed:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setTitle('❌ Erro no Menu')
        .setDescription(`Falha ao carregar menu: ${error.message || 'Erro desconhecido'}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

/**
 * Get count of running servers
 */
async function getRunningServersCount(craftyClient: CraftyClient, servers: any[]): Promise<number> {
    let runningCount = 0;
    
    // Check status of each server (limit to avoid overwhelming the API)
    const checkServers = servers.slice(0, 10);
    
    for (const server of checkServers) {
      try {
        const stats = await craftyClient.getServerStats(server.server_id);
        if (stats.running) {
          runningCount++;
        }
      } catch (error) {
        // If can't get stats, assume server is not running
        logger.debug(`Could not get stats for server ${server.server_id}`);
      }
    }

    return runningCount;
}
