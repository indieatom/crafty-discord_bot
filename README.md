# 🎮 Crafty Discord Bot

A Discord bot in TypeScript to manage Minecraft servers through Crafty Controller.

## 📋 Features

### ✅ Implemented
- 🏓 **Ping Command** - Bot connectivity and latency testing
- 📊 **Server Status** - Complete information about Minecraft server
- 📋 **Servers List** - List all servers with IDs and current status
- 🎮 **Server Control** - Start, stop, restart and force kill servers
- 🔧 **HTTP Client** - Complete communication with Crafty Controller API
- 📝 **Logging System** - Structured logs with different levels
- ⚙️ **Flexible Configuration** - Environment variable-based configuration system
- 🚀 **Auto Deploy** - Commands are automatically registered in Discord

### 🚧 In Development
- 👥 Detailed player information
- 📜 Server log visualization
- 📈 Advanced statistics
- 🔐 Granular permission system
- 🧪 Automated testing

## 🚀 Installation

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** or **yarn**
- **Crafty Controller** configured and running
- **Discord Bot** created in Discord Developer Portal

### 1. Clone the repository
```bash
git clone <repository-url>
cd crafty-discord-bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit the `.env` file with your settings:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_GUILD_ID=your_discord_server_id_optional

# Crafty Controller Configuration
CRAFTY_CONTROLLER_HOST=http://localhost:8000
CRAFTY_CONTROLLER_USERNAME=your_crafty_username
CRAFTY_CONTROLLER_PASSWORD=your_crafty_password
CRAFTY_CONTROLLER_TOKEN=your_crafty_api_token_optional

# Bot Configuration
BOT_PREFIX=!
ADMIN_ROLE_ID=your_admin_role_id_optional
ALLOWED_CHANNEL_ID=your_allowed_channel_id_optional
LOG_LEVEL=info
```

### 4. Configure Discord Bot

1. Access the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the token and set it in `DISCORD_TOKEN`
5. Copy the Client ID from "General Information" section
6. Invite the bot to your server with necessary permissions

**Required permissions:**
- `Send Messages`
- `Use Slash Commands` 
- `Embed Links`
- `Read Message History`
- `Manage Server` (for administrative commands)

**Invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2148005952&scope=bot%20applications.commands
```

## 🎯 Usage

### Development
```bash
# Run in development mode with hot-reload
npm run dev

# Run in development mode with watch
npm run dev:watch
```

### Debug
```bash
# Debug with nodemon (recommended for development)
npm run dev:debug

# Simple debug (port 9229)
npm run debug

# Debug with breakpoint on first line
npm run debug:break

# Debug compiled version
npm run debug:compiled

# Debug helper script with options
node debug.js --help
node debug.js --mode dev --verbose
node debug.js --mode prod --port 9230 --break
```

### Production
```bash
# Build the project
npm run build

# Start in production
npm start
```

### Manual command deployment
```bash
# Register Discord commands manually
npm run deploy:commands

# Debug command deployment
npm run deploy:commands:debug
```

## 🤖 Available Discord Commands

### 🏓 **/ping Command**
Tests bot connectivity and performance.

**Usage:**
```
/ping
```

**Response:**
```
🏓 Pong!
📡 Latency: 120ms
💓 API Latency: 45ms
⏱️ Uptime: 3600s
```

**Features:**
- Tests Discord ↔ Bot connection
- Shows network latency
- Displays uptime
- Available to all users

---

### 📊 **/status Command**
Shows detailed information about the Minecraft server.

**Usage:**
```
/status
/status server:7242b0e5-bdb2-44c2-815c-285d5605cf67
```

**Response (online server):**
```
🟢 Prominence II
Status: RUNNING

📊 Server Info
Type: minecraft-java
Executable: fabric-server-launcher.jar
Version: 1.20.1
Address: 127.0.0.1:25567

👥 Players: 0/6 (0%)
⏱️ Uptime: Started: 2025-08-28 02:02:44
💾 Resources
CPU: 2.8%
Memory: 5.4GB (59%)
World Size: 1.0GB

🌐 Network
Port: 25567
Ping: True
Description: A ~BAIT~ Minecraft Server

🆔 Server ID: 7242b0e5-bdb2-44c2-815c-285d5605cf67
```

**Parameters:**
- `server` (optional): Specific server ID

**Possible states:**
- 🟢 **RUNNING** - Server online and working
- 🔴 **STOPPED** - Server offline  
- 🟡 **STARTING** - Server starting up
- 🟡 **STOPPING** - Server stopping
- 💥 **CRASHED** - Server crashed
- ❓ **UNKNOWN** - Undetermined status

---

### 📋 **/servers Command**
Lists all Minecraft servers configured in Crafty Controller with their IDs and current status.

**Usage:**
```
/servers
```

**Response:**
```
🖥️ Servidores do Crafty Controller
Total de servidores: 3

🟢 Executando (1)
• Prominence II (ID: 7242b0e5-bdb2-44c2-815c-285d5605cf67)
  🌐 127.0.0.1:25567 | 👥 0/6 jogadores | ⏱️ Started: 2025-08-28 02:02:44

🔴 Parado (2)
• Integrated MC (ID: f64ef5b5-743b-4817-aff4-a1e3e933e27d)
  🌐 127.0.0.1:25565 | 👥 N/A jogadores | ⏱️ Não iniciado

• Infinity Server (ID: 45d094fd-b82a-46fe-b540-dee61fc056e2)
  🌐 mine.rochajg.dev:25564 | 👥 N/A jogadores | ⏱️ Não iniciado

📊 Resumo
🟢 Executando: 1 | 🔴 Parados: 2 | 🟡 Outros: 0
```

**Features:**
- Lists all configured servers
- Shows current status with color-coded emojis
- Displays player count and uptime for each server
- Groups servers by status
- Provides summary statistics
- Available to all users

**Possible status groups:**
- 🟢 **Executando** - Servers currently online
- 🔴 **Parado** - Servers currently offline
- 🟡 **Iniciando** - Servers starting up
- 🟡 **Parando** - Servers stopping
- 💥 **Crashado** - Servers that crashed
- ❓ **Desconhecido** - Undetermined status

---

### 🎮 **/server Command**
Controls the Minecraft server (administrative commands).

**Subcommands:**

#### **🟢 /server start**
```
/server start
/server start server:7242b0e5-bdb2-44c2-815c-285d5605cf67
```
**Function:** Starts the Minecraft server  
**Permissions:** Requires administrative role  
**Time:** ~30-120 seconds depending on server

#### **🔴 /server stop**
```
/server stop
/server stop server:7242b0e5-bdb2-44c2-815c-285d5605cf67
```
**Function:** Gracefully stops the server  
**Behavior:** Saves world, disconnects players, stops process  
**Time:** ~10-30 seconds

#### **🔄 /server restart**
```
/server restart  
/server restart server:7242b0e5-bdb2-44c2-815c-285d5605cf67
```
**Function:** Restarts the server (stop + start)  
**Common use:** Apply configurations, resolve issues  
**Time:** ~40-150 seconds total

#### **💀 /server kill**
```
/server kill server:7242b0e5-bdb2-44c2-815c-285d5605cf67
```
**Function:** Forces immediate stop (emergency)  
**⚠️ Warning:** May cause unsaved data loss  
**Use:** Only when server is unresponsive

**Global Parameters:**
- `server` (optional): Specific server ID
- If omitted, uses first available server

**Required Permissions:**
- Role with ID defined in `ADMIN_ROLE_ID`
- Or "Manage Server" permission in Discord
- Or be the Discord server owner

**Success Responses:**
```
▶️ Server Started
Prominence II has been started successfully.
🆔 Server ID: 7242b0e5-bdb2-44c2-815c-285d5605cf67
👤 Executed by: @username  
⚡ Action: START
```

**Error Responses:**
```
❌ Server Action Failed
Failed to execute server command: Connection timeout

🔧 Possible Solutions:
• Check Crafty Controller connection
• Verify server ID is correct  
• Ensure proper permissions are set
• Check server logs for more details
```

## 📁 Project Structure

```
src/
├── commands/           # Discord commands
│   ├── ping.ts        # Ping command
│   ├── status.ts      # Server status
│   ├── server.ts      # Server control
│   └── index.ts       # Commands export
├── services/           # External services
│   ├── crafty-client.ts # Crafty Controller API client
│   └── index.ts       # Services export  
├── types/             # TypeScript definitions
│   ├── discord.ts     # Discord types
│   ├── crafty.ts      # Crafty Controller types
│   └── index.ts       # Types export
├── utils/             # Utilities
│   ├── config.ts      # Configuration management
│   ├── logger.ts      # Logging system
│   ├── deploy-commands.ts # Commands deployment
│   └── index.ts       # Utilities and helpers export
└── index.ts           # Main entry point
```

## ⚙️ Configuration

### Environment Variables

| Variable                     | Required | Description                          |
| ---------------------------- | -------- | ------------------------------------ |
| `DISCORD_TOKEN`              | ✅        | Discord bot token                    |
| `DISCORD_CLIENT_ID`          | ✅        | Discord application ID               |
| `DISCORD_GUILD_ID`           | ❌        | Server ID (development)              |
| `CRAFTY_CONTROLLER_HOST`     | ✅        | Crafty Controller URL                |
| `CRAFTY_CONTROLLER_USERNAME` | ❌*       | Crafty username                      |
| `CRAFTY_CONTROLLER_PASSWORD` | ❌*       | Crafty password                      |
| `CRAFTY_CONTROLLER_TOKEN`    | ❌*       | Crafty API token                     |
| `BOT_PREFIX`                 | ❌        | Command prefix (default: !)          |
| `ADMIN_ROLE_ID`              | ❌        | Administrative role ID               |
| `ALLOWED_CHANNEL_ID`         | ❌        | Allowed channel ID                   |
| `LOG_LEVEL`                  | ❌        | Log level (error/warn/info/debug)    |

*You need to configure **either** username/password **or** token for Crafty Controller authentication.

### Crafty Controller

The bot communicates with Crafty Controller through its REST API. Make sure that:

1. Crafty Controller is running and accessible
2. API credentials are configured
3. User has permissions to manage servers

**Endpoints used:**
- `GET /api/v2/servers` - List servers
- `GET /api/v2/servers/{id}` - Server information
- `GET /api/v2/servers/{id}/stats` - Server statistics
- `POST /api/v2/servers/{id}/start` - Start server
- `POST /api/v2/servers/{id}/stop` - Stop server
- `POST /api/v2/servers/{id}/restart` - Restart server

## 🔧 Available Scripts

### **Main Scripts**

| Script    | Command             | Description                         |
| --------- | ------------------- | ----------------------------------- |
| **Build** | `npm run build`     | Compile TypeScript to JavaScript   |
| **Start** | `npm start`         | Start bot in production             |
| **Dev**   | `npm run dev`       | Start in development                |
| **Watch** | `npm run dev:watch` | Development with hot-reload         |
| **Lint**  | `npm run lint`      | Check code with ESLint              |
| **Fix**   | `npm run lint:fix`  | Fix ESLint problems                 |

### **Debug Scripts**

| Script          | Command                  | Description                      |
| --------------- | ------------------------ | -------------------------------- |
| **Debug**       | `npm run debug`          | Debug on port 9229               |
| **Debug+**      | `npm run debug:break`    | Debug with initial breakpoint    |
| **Debug Dev**   | `npm run dev:debug`      | Debug with hot-reload            |
| **Debug Build** | `npm run debug:compiled` | Debug compiled version           |

### **Docker Scripts**

| Script          | Command                      | Description                  |
| --------------- | ---------------------------- | ---------------------------- |
| **Build**       | `npm run docker:build`       | Build local Docker image     |
| **Start**       | `npm run docker:start`       | Start bot                    |
| **Stop**        | `npm run docker:stop`        | Stop bot                     |
| **Restart**     | `npm run docker:restart`     | Restart bot                  |
| **Logs**        | `npm run docker:logs`        | View logs                    |
| **Follow**      | `npm run docker:logs:follow` | Follow logs in real-time     |
| **Status**      | `npm run docker:status`      | Container status             |
| **Shell**       | `npm run docker:shell`       | Open shell in container      |
| **Pull**        | `npm run docker:pull`        | Download latest image        |
| **Deploy**      | `npm run docker:deploy`      | Deploy to production         |
| **Release**     | `npm run docker:release`     | Release to GHCR              |
| **Tag Release** | `npm run docker:release:tag` | Release with specific tag    |
| **Clean**       | `npm run docker:clean`       | Complete cleanup             |

### **Deploy Scripts**

| Script              | Command                         | Description                |
| ------------------- | ------------------------------- | -------------------------- |
| **Deploy Commands** | `npm run deploy:commands`       | Register Discord commands  |
| **Deploy Debug**    | `npm run deploy:commands:debug` | Debug command deployment   |

## 🐛 Troubleshooting

### Bot doesn't connect to Discord
- Check if `DISCORD_TOKEN` is correct
- Confirm the bot has been invited to the server
- Verify bot permissions

### Crafty Controller connection error
- Confirm `CRAFTY_CONTROLLER_HOST` is correct
- Test connectivity: `curl http://localhost:8000/health`
- Verify authentication credentials

### Commands don't appear in Discord
- Run `npm run build && npx ts-node src/utils/deploy-commands.ts`
- In development, commands are registered automatically
- Global commands may take up to 1 hour to appear

### Debug logs
```bash
# Enable detailed logs
LOG_LEVEL=debug npm run dev
```

## 🐛 Debug & Development

### VS Code Debug Configuration

The project includes pre-configured debug settings for VS Code:

**Available configurations:**
- 🚀 **Debug Bot (ts-node)** - Direct TypeScript debugging
- 🔧 **Debug Bot (Compiled)** - Debug compiled version
- 🧪 **Debug Tests** - Debug tests (when implemented)
- 📡 **Debug Deploy Commands** - Debug command deployment
- 🔍 **Debug Current File** - Debug current file
- 🔗 **Attach to Process** - Attach to running process

**How to use:**
1. Open "Run and Debug" tab (Ctrl+Shift+D)
2. Select a configuration
3. Click "Start Debugging" (F5)

### Terminal Debug

**Available debug scripts:**

```bash
# Debug with hot-reload (recommended)
npm run dev:debug

# Simple debug
npm run debug

# Debug with breakpoint on first line
npm run debug:break

# Debug compiled version (production)
npm run debug:compiled
```

**Advanced debug helper:**

```bash
# Show help
node debug.js --help

# Debug in development mode with verbose logs
node debug.js --mode dev --verbose

# Debug compiled version on port 9230 with breakpoint
node debug.js --mode prod --port 9230 --break

# Debug in test mode
node debug.js --mode test
```

### Debugger Connection

**Connection options:**

1. **VS Code**: Use pre-defined configurations
2. **Chrome DevTools**: Access `chrome://inspect`
3. **Node Inspector**: Connect to specified port (default: 9229)

**Debug ports:**
- Development: `9229`
- Test: `9230`  
- Production: `9231`

### Debug Variables

```bash
# .env.debug (copy and customize)
LOG_LEVEL=debug
NODE_ENV=development
DEBUG=crafty-discord-bot:*
MOCK_CRAFTY_API=false
TEST_MODE=false
```

### Docker Debugging (future)

```bash
# Debug in Docker container  
docker run -p 9229:9229 crafty-discord-bot:debug
```

### Debug Troubleshooting

**Debugger won't connect:**
```bash
# Check if port is free
lsof -i :9229

# Kill pending Node processes  
pkill -f node
```

**Source maps not working:**
- Make sure `sourceMap: true` is in `tsconfig.json`
- Check if `.ts` files are being mapped correctly
- Use TypeScript version debug (`Debug Bot (ts-node)`)

**Slow performance:**
- Use `debug:compiled` for optimized version debug
- Disable unnecessary logs: `LOG_LEVEL=warn`

## 🐳 Docker

### **Official Image**
The bot is available on GitHub Container Registry:

📦 **`ghcr.io/indieatom/crafty-discord_bot:latest`**

- **Size**: ~100MB (production optimized)
- **Base**: Node.js 18 Alpine Linux
- **User**: Non-root for security
- **Health Check**: Integrated

### **Quick Usage**

```bash
# Start with Docker Compose (Recommended)
docker-compose up -d

# Or run directly
docker run -d \
  --name crafty-discord-bot \
  --env-file .env \
  -v ./logs:/app/logs \
  ghcr.io/indieatom/crafty-discord_bot:latest
```

### **Docker Commands**

```bash
# Basic management
npm run docker:start        # Start bot
npm run docker:stop         # Stop bot
npm run docker:restart      # Restart bot
npm run docker:logs         # View logs
npm run docker:logs:follow  # Follow logs
npm run docker:status       # Container status

# Development
npm run docker:build        # Build local image
npm run docker:shell        # Shell in container
npm run docker:clean        # Cleanup

# Deploy & Release
npm run docker:pull         # Download latest version
npm run docker:deploy       # Deploy with latest version
npm run docker:release      # Build and push to GHCR
npm run docker:release:tag  # Release with specific tag
```

### **Configuration**

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  crafty-bot:
    image: ghcr.io/indieatom/crafty-discord_bot:latest
    container_name: crafty-discord-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./logs:/app/logs:rw
```

**Environment variables (.env):**
```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id
CRAFTY_CONTROLLER_HOST=http://localhost:8000
CRAFTY_CONTROLLER_USERNAME=admin
CRAFTY_CONTROLLER_PASSWORD=password
LOG_LEVEL=info
```

### **Production Deployment**

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 2. Deploy
npm run docker:deploy

# 3. Monitor logs
npm run docker:logs:follow

# 4. Check status
npm run docker:status
```

### **GitHub Container Registry Release**

**Automatic (GitHub Actions):**
- Push to `main` branch → Automatic build
- Tag `v1.0.0` → Versioned release

**Manual:**
```bash
# Login to GHCR (first time)
docker login ghcr.io -u USERNAME

# Automatic release
npm run docker:release

# Release with specific version  
npm run docker:release:tag v1.0.0
```

### **Local Development**

For development, use Node.js directly:

```bash
# Local development (recommended)
npm run dev

# Local debug
npm run debug

# Local build for testing
npm run docker:build
```

## 📝 Development

### Adding new commands

1. Create a file in `src/commands/new-command.ts`
2. Implement the `Command` interface
3. Add to `src/commands/index.ts`
4. Commands are loaded automatically

**Example:**
```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command, CommandCategory } from '../types/discord';

export const myCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('Command description'),
  
  category: CommandCategory.UTILITY,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply('Hello world!');
  }
};
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👤 Author

**Jordan Rocha** - [70rd23@gmail.com](mailto:70rd23@gmail.com)

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API library
- [Crafty Controller](https://craftycontrol.com/) - Minecraft server manager
- [TypeScript](https://www.typescriptlang.org/) - Static typing for JavaScript
