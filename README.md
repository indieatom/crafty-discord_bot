# 🎮 Crafty Discord Bot

Discord bot to manage Minecraft servers through Crafty Controller.

## ⚡ Quick Start with Docker

### 1. Clone and configure
```bash
git clone <repository-url>
cd crafty-discord-bot
cp .env.example .env
# Edit .env file with your configuration
```

### 2. Start with Docker Compose
```bash
docker-compose up -d
```

### 3. Check logs
```bash
docker-compose logs -f
```

**Need help with configuration?** → [📖 Complete Setup Guide](SETUP_GUIDE.md)

## 🔧 Essential Commands

| Command             | Description       | Example         |
| ------------------- | ----------------- | --------------- |
| **`/ping`**         | Test connectivity | `/ping`         |
| **`/status`**       | Server status     | `/status`       |
| **`/servers`**      | List all servers  | `/servers`      |
| **`/server start`** | Start server      | `/server start` |
| **`/server stop`**  | Stop server       | `/server stop`  |

## ⚙️ Configuration (.env)

```env
# Discord (Required)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_id

# Crafty Controller (Required) 
CRAFTY_CONTROLLER_HOST=http://localhost:8000
CRAFTY_CONTROLLER_USERNAME=admin
CRAFTY_CONTROLLER_PASSWORD=your_password

# Optional
DISCORD_GUILD_ID=your_server_id
ADMIN_ROLE_ID=your_admin_role_id
LOG_LEVEL=info
```

## 📋 Features

### ✅ Implemented
- 🏓 Ping and connectivity testing
- 📊 Complete server status information
- 🎮 Server control (start/stop/restart)
- 📋 List all servers with details
- 🔧 Complete Crafty API integration

### 🚧 In Development
- 👥 Detailed player information
- 📜 Server log visualization
- 📈 Advanced statistics

## 🚀 Development Scripts

```bash
# Development
npm run dev              # Run with hot-reload
npm run dev:debug        # Debug with hot-reload

# Production
npm run build            # Compile TypeScript
npm start               # Run in production

# Docker
npm run docker:start     # Start with Docker
npm run docker:logs      # View container logs
npm run docker:stop      # Stop container
```

**More commands available:** [📚 Complete Documentation](#-available-scripts)

## 🆘 Troubleshooting

### Bot doesn't connect to Discord
- ❌ Check your `DISCORD_TOKEN`
- ❌ Confirm the bot was invited to the server
- ❌ Verify bot permissions

### Crafty Controller connection error
- ❌ Confirm `CRAFTY_CONTROLLER_HOST` is correct
- ❌ Test connectivity: `curl http://localhost:8000/health`
- ❌ Verify authentication credentials

### Commands don't appear in Discord
```bash
# Deploy commands manually
npm run deploy:commands
```

### Detailed logs
```bash
LOG_LEVEL=debug npm run dev
```

## 🔗 Useful Links

- [📖 Complete Setup Guide](SETUP_GUIDE.md) - Step-by-step configuration
- [🐳 Docker Usage](#-docker) - Configuration and deployment
- [🔧 Available Scripts](#-available-scripts) - All npm commands
- [🤖 Detailed Commands](#-detailed-commands) - Complete Discord commands documentation

---

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Jordan Rocha** - [70rd23@gmail.com](mailto:70rd23@gmail.com)

---

# 📚 Complete Technical Documentation

## 📁 Project Structure

```
src/
├── commands/           # Discord commands
│   ├── ping.ts        # Ping command
│   ├── status.ts      # Server status command
│   ├── server.ts      # Server control command
│   └── index.ts       # Commands export
├── services/           # External services
│   └── crafty-client.ts # Crafty Controller API client
├── types/             # TypeScript definitions
│   ├── discord.ts     # Discord types
│   └── crafty.ts      # Crafty Controller types
├── utils/             # Utilities
│   ├── config.ts      # Configuration management
│   ├── logger.ts      # Logging system
│   └── deploy-commands.ts # Commands deployment
└── index.ts           # Main entry point
```

## ⚙️ Environment Variables

### Required
```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_id
CRAFTY_CONTROLLER_HOST=http://localhost:8000
CRAFTY_CONTROLLER_USERNAME=admin      # OR use TOKEN
CRAFTY_CONTROLLER_PASSWORD=password   # OR use TOKEN
```

### Optional
```env
DISCORD_GUILD_ID=your_server_id       # For development
ADMIN_ROLE_ID=your_admin_role_id      # Restrict admin commands
ALLOWED_CHANNEL_ID=your_channel_id    # Restrict channel
LOG_LEVEL=info                        # error/warn/info/debug
```

### Crafty Controller API Endpoints
- `GET /api/v2/servers` - List servers
- `GET /api/v2/servers/{id}` - Server information
- `POST /api/v2/servers/{id}/start` - Start server
- `POST /api/v2/servers/{id}/stop` - Stop server
- `POST /api/v2/servers/{id}/restart` - Restart server

## 🔧 Available Scripts

### Development
```bash
npm run dev                    # Run in development
npm run dev:watch              # With hot-reload
npm run dev:debug              # Debug with hot-reload
npm run build                  # Compile TypeScript
npm start                      # Run in production
```

### Docker
```bash
npm run docker:start           # Start bot
npm run docker:stop            # Stop bot
npm run docker:logs            # View logs
npm run docker:logs:follow     # Follow logs
npm run docker:deploy          # Complete deployment
```

### Debug
```bash
npm run debug                  # Debug on port 9229
npm run debug:break            # Debug with breakpoint
npm run debug:compiled         # Debug compiled version
```

### Deploy
```bash
npm run deploy:commands        # Register Discord commands
npm run deploy:commands:debug  # Debug command deployment
```

## 🤖 Detailed Commands

### `/ping` - Connectivity Test
```
/ping
```
- Tests Discord ↔ Bot connectivity
- Shows latency and uptime
- Available to all users

### `/status` - Server Status
```
/status [server:SERVER_ID]
```
- Shows detailed Minecraft server information
- States: 🟢 RUNNING | 🔴 STOPPED | 🟡 STARTING/STOPPING | 💥 CRASHED
- Includes: online players, uptime, resources (CPU/memory), network info

### `/servers` - Server List
```
/servers
```
- Lists all servers configured in Crafty Controller
- Groups by status with statistical summary
- Shows IDs, addresses, online players

### `/server` - Server Control ⚠️ Admin
```
/server start [server:SERVER_ID]    # Start server
/server stop [server:SERVER_ID]     # Stop server
/server restart [server:SERVER_ID]  # Restart server
/server kill [server:SERVER_ID]     # Force stop (emergency)
```
**Required permissions:**
- Role defined in `ADMIN_ROLE_ID`
- "Manage Server" permission in Discord
- Be Discord server owner

## 🐛 Advanced Troubleshooting

### Debug
```bash
# VS Code: Use pre-configured settings (F5)
npm run dev:debug              # Debug with hot-reload
npm run debug                  # Simple debug (port 9229)
node debug.js --help           # Advanced helper
```

### Common Issues
```bash
# Port in use
lsof -i :9229
pkill -f node

# Detailed logs
LOG_LEVEL=debug npm run dev
```

## 🐳 Docker

### Quick Usage
```bash
# Docker Compose (Recommended)
docker-compose up -d

# Or direct
docker run -d \
  --name crafty-discord-bot \
  --env-file .env \
  ghcr.io/indieatom/crafty-discord_bot:latest
```

### Main Commands
```bash
npm run docker:start         # Start
npm run docker:stop          # Stop
npm run docker:logs          # View logs
npm run docker:deploy        # Complete deployment
```

**Official image:** `ghcr.io/indieatom/crafty-discord_bot:latest`
