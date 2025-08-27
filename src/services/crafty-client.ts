import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  CraftyConfig, 
  CraftyApiResponse, 
  ServerInfo, 
  ServerStatus,
  ServerPlayer, 
  ServerLog, 
  ServerStats,
  ServerAction,
  ServerCommand,
  CraftyLoginRequest,
  CraftyLoginResponse,
  ServerBackup
} from '../types/crafty';
import { Config, getLogger } from '../utils';

export class CraftyClient {
  private axios: AxiosInstance;
  private config: CraftyConfig;
  private logger = getLogger();
  private authToken: string | null = null;

  constructor(config?: Partial<CraftyConfig>) {
    const appConfig = Config.getInstance();
    
    this.config = {
      host: appConfig.get('CRAFTY_CONTROLLER_HOST'),
      username: appConfig.get('CRAFTY_CONTROLLER_USERNAME'),
      password: appConfig.get('CRAFTY_CONTROLLER_PASSWORD'),
      token: appConfig.get('CRAFTY_CONTROLLER_TOKEN'),
      timeout: 10000,
      ...config
    };

    this.axios = axios.create({
      baseURL: this.config.host,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.axios.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        } else if (this.config.token) {
          config.headers['Authorization'] = `Bearer ${this.config.token}`;
        }
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('API request failed:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
      }
    );

    // Auto-authenticate if credentials are provided
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.config.token && this.config.username && this.config.password) {
      try {
        await this.authenticate();
      } catch (error) {
        this.logger.warn('Failed to authenticate with Crafty Controller:', error);
      }
    }
  }

  // Authentication
  public async authenticate(): Promise<void> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username and password are required for authentication');
    }

    try {
      const response = await this.axios.post<CraftyLoginResponse>('/auth/login', {
        username: this.config.username,
        password: this.config.password,
      } as CraftyLoginRequest);

      this.authToken = response.data.token;
      this.logger.info('Successfully authenticated with Crafty Controller');
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      throw error;
    }
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.axios.get('/health');
      return response.status === 200;
    } catch {
      try {
        // Try alternative endpoint
        const response = await this.axios.get('/api/v2/servers');
        return response.status === 200;
      } catch {
        return false;
      }
    }
  }

  // Server Management
  public async getServers(): Promise<ServerInfo[]> {
    const response = await this.makeRequest<ServerInfo[]>('/api/v2/servers');
    return response;
  }

  public async getServerInfo(serverId: string): Promise<ServerInfo> {
    const response = await this.makeRequest<ServerInfo>(`/api/v2/servers/${serverId}`);
    return response;
  }

  public async getServerStatus(serverId: string): Promise<ServerStatus> {
    const response = await this.makeRequest<{ status: ServerStatus }>(`/api/v2/servers/${serverId}/status`);
    return response.status;
  }

  public async startServer(serverId: string): Promise<void> {
    await this.makeRequest(`/api/v2/servers/${serverId}/start`, 'POST');
    this.logger.info(`Started server ${serverId}`);
  }

  public async stopServer(serverId: string): Promise<void> {
    await this.makeRequest(`/api/v2/servers/${serverId}/stop`, 'POST');
    this.logger.info(`Stopped server ${serverId}`);
  }

  public async restartServer(serverId: string): Promise<void> {
    await this.makeRequest(`/api/v2/servers/${serverId}/restart`, 'POST');
    this.logger.info(`Restarted server ${serverId}`);
  }

  public async killServer(serverId: string): Promise<void> {
    await this.makeRequest(`/api/v2/servers/${serverId}/kill`, 'POST');
    this.logger.info(`Killed server ${serverId}`);
  }

  // Server Information
  public async getServerPlayers(serverId: string): Promise<ServerPlayer[]> {
    const response = await this.makeRequest<ServerPlayer[]>(`/api/v2/servers/${serverId}/players`);
    return response;
  }

  public async getServerLogs(serverId: string, lines: number = 100): Promise<ServerLog[]> {
    const response = await this.makeRequest<ServerLog[]>(`/api/v2/servers/${serverId}/logs?lines=${lines}`);
    return response;
  }

  public async getServerStats(serverId: string): Promise<ServerStats> {
    const response = await this.makeRequest<ServerStats>(`/api/v2/servers/${serverId}/stats`);
    return response;
  }

  // Server Commands
  public async sendCommand(serverId: string, command: string): Promise<void> {
    await this.makeRequest(`/api/v2/servers/${serverId}/command`, 'POST', {
      command: command
    });
    this.logger.info(`Sent command to server ${serverId}: ${command}`);
  }

  // Backups
  public async getBackups(serverId: string): Promise<ServerBackup[]> {
    const response = await this.makeRequest<ServerBackup[]>(`/api/v2/servers/${serverId}/backups`);
    return response;
  }

  public async createBackup(serverId: string, name?: string): Promise<void> {
    await this.makeRequest(`/api/v2/servers/${serverId}/backups`, 'POST', {
      name: name || `backup-${new Date().toISOString()}`
    });
    this.logger.info(`Created backup for server ${serverId}`);
  }

  // Utility method for making requests
  private async makeRequest<T = any>(
    url: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any
  ): Promise<T> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url,
        data,
      };

      const response: AxiosResponse<CraftyApiResponse<T>> = await this.axios.request(config);
      
      // Handle Crafty Controller response format
      if (response.data && typeof response.data === 'object') {
        if ('status' in response.data && response.data.status === 'error') {
          throw new Error(response.data.message || response.data.error || 'Unknown API error');
        }
        
        if ('data' in response.data) {
          return response.data.data as T;
        }
      }
      
      // Return raw response if it doesn't match expected format
      return response.data as T;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logger.warn('Authentication expired, attempting to re-authenticate...');
        if (this.config.username && this.config.password) {
          await this.authenticate();
          // Retry the request
          return this.makeRequest(url, method, data);
        }
      }
      throw error;
    }
  }

  // Health check
  public async isHealthy(): Promise<boolean> {
    try {
      return await this.testConnection();
    } catch {
      return false;
    }
  }
}
