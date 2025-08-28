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
  server_id: string;
  created: string;
  server_name: string;
  path: string;
  executable: string;
  log_path: string;
  execution_command: string;
  auto_start: boolean;
  auto_start_delay: number;
  crash_detection: boolean;
  stop_command: string;
  executable_update_url: string;
  server_ip: string;
  server_port: number;
  logs_delete_after: number;
  type: string;
  show_status: boolean;
  created_by: number;
  shutdown_timeout: number;
  ignored_exits: string;
  count_players: boolean;
  // Additional fields that might be present in status responses
  status?: ServerStatus;
  players?: {
    online: number;
    max: number;
  };
  uptime?: number;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
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
  stats_id: number;
  created: string;
  server_id: ServerInfo;
  started: string;
  running: boolean;
  cpu: number;
  mem: string;
  mem_percent: number;
  world_name: string;
  world_size: string;
  server_port: number;
  int_ping_results: string;
  online: number;
  max: number;
  players: string;
  desc: string;
  icon: string;
  version: string;
  updating: boolean;
  waiting_start: boolean;
  first_run: boolean;
  crashed: boolean;
  importing: boolean;
  // Additional fields for compatibility
  uptime?: number;
  cpu_usage?: number;
  memory_usage?: number;
  memory_total?: number;
  disk_usage?: number;
  disk_total?: number;
  network_in?: number;
  network_out?: number;
  players_online?: number;
  players_max?: number;
  tps?: number;
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
