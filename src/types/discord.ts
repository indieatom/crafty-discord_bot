import { 
  SlashCommandBuilder, 
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction, 
  PermissionResolvable,
  Client 
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
  permissions?: PermissionResolvable[];
  category?: CommandCategory;
  cooldown?: number; // in seconds
}

export enum CommandCategory {
  SERVER = 'server',
  INFO = 'info',
  ADMIN = 'admin',
  UTILITY = 'utility',
}

export interface CommandCollection {
  [key: string]: Command;
}

export interface BotConfig {
  token: string;
  clientId: string;
  guildId?: string;
  adminRoleId?: string;
  allowedChannelId?: string;
  prefix?: string;
  logLevel: LogLevel;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface EmbedColors {
  SUCCESS: number;
  ERROR: number;
  WARNING: number;
  INFO: number;
}

export const EMBED_COLORS: EmbedColors = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  WARNING: 0xffaa00,
  INFO: 0x0099ff,
};
