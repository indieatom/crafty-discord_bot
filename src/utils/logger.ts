import { Logger, LogLevel } from '../types';

export class ConsoleLogger implements Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.DEBUG]: 3,
    };

    return levels[level] <= levels[this.logLevel];
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    const formattedArgs = args.length > 0 ? ` | ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')}` : '';
    
    return `${timestamp} ${emoji} [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  private getEmoji(level: string): string {
    const emojis = {
      'error': '❌',
      'warn': '⚠️',
      'info': 'ℹ️',
      'debug': '🐛',
    };
    return emojis[level.toLowerCase() as keyof typeof emojis] || '📝';
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('info', message, ...args));
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('debug', message, ...args));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Singleton instance
let loggerInstance: ConsoleLogger;

export const getLogger = (logLevel?: LogLevel): Logger => {
  if (!loggerInstance) {
    loggerInstance = new ConsoleLogger(logLevel);
  }
  return loggerInstance;
};
