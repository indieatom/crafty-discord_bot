import { Command } from '../types/discord';
import { pingCommand } from './ping';
import { statusCommand } from './status';
import { serverCommand } from './server';

// Export all commands
export const commands: Command[] = [
  pingCommand,
  statusCommand,
  serverCommand,
];

// Export individual commands
export * from './ping';
export * from './status';
export * from './server';
