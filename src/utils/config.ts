import dotenv from 'dotenv';
import { EnvConfig, LogLevel } from '../types';

// Load environment variables
dotenv.config();

export class Config {
  private static instance: Config;
  private config: EnvConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private loadConfig(): EnvConfig {
    return {
      // Discord Configuration
      DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
      DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,

      // Crafty Controller Configuration
      CRAFTY_CONTROLLER_HOST: process.env.CRAFTY_CONTROLLER_HOST || 'http://localhost:8000',
      CRAFTY_CONTROLLER_USERNAME: process.env.CRAFTY_CONTROLLER_USERNAME,
      CRAFTY_CONTROLLER_PASSWORD: process.env.CRAFTY_CONTROLLER_PASSWORD,
      CRAFTY_CONTROLLER_TOKEN: process.env.CRAFTY_CONTROLLER_TOKEN,

      // Bot Configuration
      BOT_PREFIX: process.env.BOT_PREFIX || '!',
      ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
      ALLOWED_CHANNEL_ID: process.env.ALLOWED_CHANNEL_ID,
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    };
  }

  private validateConfig(): void {
    const requiredVars = [
      'DISCORD_TOKEN',
      'DISCORD_CLIENT_ID',
      'CRAFTY_CONTROLLER_HOST',
    ];

    const missingVars = requiredVars.filter(varName => !this.config[varName as keyof EnvConfig]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file or environment configuration.'
      );
    }

    // Validate Discord IDs format (snowflakes)
    this.validateDiscordId('DISCORD_CLIENT_ID', this.config.DISCORD_CLIENT_ID);
    if (this.config.DISCORD_GUILD_ID) {
      this.validateDiscordId('DISCORD_GUILD_ID', this.config.DISCORD_GUILD_ID);
    }

    // Validate other configurations
    this.validateCraftyAndLogLevel();
  }

  private validateDiscordId(name: string, value: string): void {
    // Check if it's a placeholder value
    if (value.includes('your_') || value.includes('_here')) {
      console.warn(`⚠️  ${name} appears to be a placeholder value. Please configure it with a real Discord ID.`);
      return;
    }

    // Check if it's a valid snowflake (numeric string, 15-20 digits)
    if (!/^\d{15,20}$/.test(value)) {
      console.warn(`⚠️  ${name} '${value}' is not a valid Discord ID (snowflake).`);
    }
  }

  public hasValidDiscordIds(): boolean {
    return !this.config.DISCORD_CLIENT_ID.includes('your_') && 
           !this.config.DISCORD_CLIENT_ID.includes('_here') &&
           /^\d{15,20}$/.test(this.config.DISCORD_CLIENT_ID);
  }

  private validateCraftyAndLogLevel(): void {
    // Validate Crafty Controller authentication
    const hasUsernamePassword = this.config.CRAFTY_CONTROLLER_USERNAME && this.config.CRAFTY_CONTROLLER_PASSWORD;
    const hasToken = this.config.CRAFTY_CONTROLLER_TOKEN;

    if (!hasUsernamePassword && !hasToken) {
      console.warn(
        '⚠️  Warning: No Crafty Controller authentication configured.\n' +
        'Please set either CRAFTY_CONTROLLER_TOKEN or both CRAFTY_CONTROLLER_USERNAME and CRAFTY_CONTROLLER_PASSWORD'
      );
    }

    // Validate log level
    const validLogLevels = Object.values(LogLevel);
    if (!validLogLevels.includes(this.config.LOG_LEVEL as LogLevel)) {
      console.warn(`⚠️  Invalid LOG_LEVEL '${this.config.LOG_LEVEL}'. Using 'info' instead.`);
      this.config.LOG_LEVEL = LogLevel.INFO;
    }
  }

  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  public getAll(): EnvConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
