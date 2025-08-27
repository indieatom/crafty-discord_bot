// Re-export all types for easy importing
export * from './discord';
export * from './crafty';

// Common utility types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TimestampedData {
  timestamp: string;
  data: any;
}

// Environment configuration
export interface EnvConfig {
  // Discord
  DISCORD_TOKEN: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_GUILD_ID?: string;
  
  // Crafty Controller
  CRAFTY_CONTROLLER_HOST: string;
  CRAFTY_CONTROLLER_USERNAME?: string;
  CRAFTY_CONTROLLER_PASSWORD?: string;
  CRAFTY_CONTROLLER_TOKEN?: string;
  
  // Bot Configuration
  BOT_PREFIX?: string;
  ADMIN_ROLE_ID?: string;
  ALLOWED_CHANNEL_ID?: string;
  LOG_LEVEL?: string;
}

// Utility types
export type Awaitable<T> = T | Promise<T>;

export interface Logger {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}
