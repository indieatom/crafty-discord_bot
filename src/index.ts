import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { Config, getLogger } from './utils';
import { Command, LogLevel } from './types';
import { ReactionManager } from './services';

class CraftyDiscordBot {
  private client: Client;
  private config: Config;
  private logger = getLogger();
  private commands: Collection<string, Command> = new Collection();
  private reactionManager: ReactionManager;

  constructor() {
    // Initialize configuration
    this.config = Config.getInstance();
    
    // Set logger level from config
    this.logger = getLogger(this.config.get('LOG_LEVEL') as LogLevel);

    // Initialize Discord client
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    this.setupEventHandlers();
    this.loadCommands();
    
    // Initialize reaction manager
    this.reactionManager = new ReactionManager(this.client);
    
    // Add reaction manager to client for access in commands
    (this.client as any).reactionManager = this.reactionManager;
  }

  private setupEventHandlers(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.info(`Bot is ready! Logged in as ${readyClient.user.tag}`);
      this.logger.info(`Serving ${readyClient.guilds.cache.size} guild(s)`);
      
      // Set bot status
      readyClient.user.setActivity('Crafty Controller', { type: 0 });
    });

    this.client.on(Events.Error, (error) => {
      this.logger.error('Discord client error:', error);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        this.logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      try {
        this.logger.info(`Command received: ${interaction.commandName} by ${interaction.user.tag}`);
        await command.execute(interaction, this.client);
      } catch (error) {
        this.logger.error(`Error executing command ${interaction.commandName}:`, error);
        
        const errorMessage = '❌ There was an error while executing this command!';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });

    // Handle message reactions
    this.client.on(Events.MessageReactionAdd, async (reaction, user) => {
      // Handle partial reactions
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          this.logger.error('Failed to fetch partial reaction:', error);
          return;
        }
      }

      await this.reactionManager.handleReaction(reaction, user, 'add');
    });

    this.client.on(Events.MessageReactionRemove, async (reaction, user) => {
      // Handle partial reactions
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          this.logger.error('Failed to fetch partial reaction:', error);
          return;
        }
      }

      await this.reactionManager.handleReaction(reaction, user, 'remove');
    });

    // Handle process termination gracefully
    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      this.logger.info('Received SIGTERM, shutting down gracefully...');
      this.shutdown();
    });
  }

  private async loadCommands(): Promise<void> {
    try {
      // Import commands
      const { commands } = await import('./commands');
      
      // Load commands into collection
      for (const command of commands) {
        this.commands.set(command.data.name, command);
        this.logger.debug(`Loaded command: ${command.data.name}`);
      }

      this.logger.info(`Successfully loaded ${this.commands.size} commands`);
      
      // Auto-deploy commands in development (only if Discord IDs are configured)
      if (this.config.isDevelopment()) {
        if (this.config.hasValidDiscordIds()) {
          this.logger.info('Development mode: auto-deploying commands...');
          const { deployCommands } = await import('./utils/deploy-commands');
          await deployCommands();
        } else {
          this.logger.warn('⚠️  Skipping auto-deploy: Discord IDs not properly configured');
          this.logger.info('💡 Configure DISCORD_CLIENT_ID and DISCORD_GUILD_ID in .env to enable auto-deploy');
          this.logger.info('💡 Or manually deploy with: npm run deploy:commands');
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to load commands:', error);
    }
  }

  public async start(): Promise<void> {
    try {
      const token = this.config.get('DISCORD_TOKEN');
      
      if (!token) {
        throw new Error('DISCORD_TOKEN is not configured');
      }

      this.logger.info('Starting Crafty Discord Bot...');
      this.logger.debug('Configuration loaded:', {
        host: this.config.get('CRAFTY_CONTROLLER_HOST'),
        logLevel: this.config.get('LOG_LEVEL'),
        isDev: this.config.isDevelopment()
      });

      await this.client.login(token);
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down bot...');
    this.client.destroy();
    process.exit(0);
  }

  public getClient(): Client {
    return this.client;
  }

  public getCommands(): Collection<string, Command> {
    return this.commands;
  }

  public getReactionManager(): ReactionManager {
    return this.reactionManager;
  }
}

// Start the bot
const bot = new CraftyDiscordBot();
bot.start();

export default CraftyDiscordBot;
