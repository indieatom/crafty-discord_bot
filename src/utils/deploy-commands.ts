import { REST, Routes } from 'discord.js';
import { commands } from '../commands';
import { Config, getLogger } from '../utils';

const logger = getLogger();

export async function deployCommands(): Promise<void> {
  const config = Config.getInstance();
  const token = config.get('DISCORD_TOKEN');
  const clientId = config.get('DISCORD_CLIENT_ID');
  const guildId = config.get('DISCORD_GUILD_ID');

  if (!token || !clientId) {
    throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
  }

  const rest = new REST().setToken(token);

  try {
    logger.info('Started refreshing application (/) commands.');

    // Convert commands to JSON
    const commandsJson = commands.map(command => command.data.toJSON());

    let route: string;
    let scope: string;

    if (guildId) {
      // Deploy to specific guild (faster for development)
      route = Routes.applicationGuildCommands(clientId, guildId);
      scope = `guild ${guildId}`;
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      route = Routes.applicationCommands(clientId);
      scope = 'globally';
    }

    const data = await rest.put(route as `/${string}`, { body: commandsJson }) as any[];

    logger.info(`Successfully reloaded ${data.length} application (/) commands ${scope}.`);

    // Log registered commands
    if (data.length > 0) {
      logger.debug('Registered commands:', data.map(cmd => cmd.name).join(', '));
    }

  } catch (error) {
    logger.error('Error deploying commands:', error);
    throw error;
  }
}

// Standalone script execution
if (require.main === module) {
  deployCommands()
    .then(() => {
      logger.info('Command deployment completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Command deployment failed:', error);
      process.exit(1);
    });
}
