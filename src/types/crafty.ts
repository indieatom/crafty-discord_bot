// Crafty Controller API Types

export interface CraftyConfig {
  host: string;
  username?: string;
  password?: string;
  token?: string;
  timeout?: number;
}

export interface CraftyApiResponse<T = any> {
  status: 'ok' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface ServerInfo {
  id: string;
  name: string;
  status: ServerStatus;
  type: string;
  version: string;
  players: {
    online: number;
    max: number;
  };
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  port: number;
  ip: string;
}

export enum ServerStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  STARTING = 'starting',
  STOPPING = 'stopping',
  CRASHED = 'crashed',
  UNKNOWN = 'unknown',
}

export interface ServerPlayer {
  uuid: string;
  name: string;
  online: boolean;
  last_seen?: string;
  playtime?: number;
}

export interface ServerLog {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
}

export interface ServerStats {
  uptime: number;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  disk_usage: number;
  disk_total: number;
  network_in: number;
  network_out: number;
  players_online: number;
  players_max: number;
  tps: number;
}

export interface ServerAction {
  action: 'start' | 'stop' | 'restart' | 'kill';
  server_id: string;
}

export interface ServerCommand {
  command: string;
  server_id: string;
}

export interface CraftyLoginRequest {
  username: string;
  password: string;
}

export interface CraftyLoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    permissions: string[];
  };
}

export interface ServerBackup {
  id: string;
  name: string;
  size: number;
  created: string;
  status: 'completed' | 'failed' | 'running';
}
