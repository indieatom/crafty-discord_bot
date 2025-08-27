# 🔧 Discord Bot Setup Guide

This guide helps you configure the Discord bot step by step.

## 📋 Prerequisites

1. Discord account
2. Administrator permissions on Discord server
3. Crafty Controller running

## 🤖 1. Creating Discord Application

### 1.1. Access Discord Developer Portal
1. Go to https://discord.com/developers/applications
2. Login with your Discord account
3. Click **"New Application"**

### 1.2. Configure Application
1. **Name**: Type "Crafty Controller Bot" (or any name)
2. Click **"Create"**
3. In **"General Information"** tab:
   - Copy the **Application ID** (this is the `DISCORD_CLIENT_ID`)

### 1.3. Create the Bot
1. Go to **"Bot"** tab in sidebar
2. Click **"Add Bot"**
3. Confirm by clicking **"Yes, do it!"**
4. In **"Token"** section:
   - Click **"Copy"** to copy the token (this is the `DISCORD_TOKEN`)
   - ⚠️ **NEVER share this token!**

### 1.4. Configure Bot Permissions
In **"Bot"** tab, configure:

**Privileged Gateway Intents:**
- ☑️ Message Content Intent (to read messages)

**Bot Permissions:** (will be configured in next section)

## 🏠 2. Adding Bot to Server

### 2.1. Generate Invite URL
1. Go to **"OAuth2"** → **"URL Generator"** tab
2. In **"Scopes"** select:
   - ☑️ `bot`
   - ☑️ `applications.commands`
3. In **"Bot Permissions"** select:
   - ☑️ Send Messages
   - ☑️ Use Slash Commands
   - ☑️ Embed Links  
   - ☑️ Read Message History
   - ☑️ Manage Server (for administrative commands)
4. Copy the **"Generated URL"**

### 2.2. Invite the Bot
1. Paste the copied URL in browser
2. Select your Discord server
3. Click **"Continue"** → **"Authorize"**
4. Complete captcha if necessary

## 📊 3. Getting Discord IDs

### 3.1. Enable Developer Mode
1. Open Discord (app or web)
2. Go to **User Settings** (gear icon)
3. In **"App Settings"** → **"Advanced"**
4. Enable **"Developer Mode"**

### 3.2. Get Guild ID (Server ID)
1. In Discord, right-click on your server name
2. Select **"Copy Server ID"**
3. This is your `DISCORD_GUILD_ID`

### 3.3. Get Other IDs (Optional)
**Channel ID:**
1. Right-click on desired channel
2. **"Copy Channel ID"** → `ALLOWED_CHANNEL_ID`

**Role ID:**
1. Server Settings → Roles
2. Right-click on role → **"Copy Role ID"** → `ADMIN_ROLE_ID`

## 🔐 4. Configuring .env File

### 4.1. Copy Example File
```bash
cp .env.example .env
```

### 4.2. Configure Variables

Edit the `.env` file with obtained values:

```env
# Discord Bot Configuration
DISCORD_TOKEN=MTA4NzYxNjc5ODIzMzI5NDkzNA.G7X8Yh.example_token_here
DISCORD_CLIENT_ID=1087616798233294934
DISCORD_GUILD_ID=850408740392345621

# Crafty Controller Configuration
CRAFTY_CONTROLLER_HOST=http://localhost:8000
CRAFTY_CONTROLLER_USERNAME=admin
CRAFTY_CONTROLLER_PASSWORD=your_password

# Bot Configuration (Optional)
BOT_PREFIX=!
ADMIN_ROLE_ID=850408740392345625
ALLOWED_CHANNEL_ID=850408740392345623
LOG_LEVEL=info
```

### 4.3. Validate Configuration
```bash
# Test bot
npm run dev
```

If everything is correct, you should see:
```
✅ Bot is ready! Logged in as YourBot#1234
✅ Successfully loaded 3 commands
✅ Development mode: auto-deploying commands...
✅ Successfully reloaded 3 application (/) commands guild 850408740392345621.
```

## ❌ Common Problems

### Bot doesn't connect
- ❌ **Invalid token**: Check if you copied the complete token
- ❌ **Expired token**: Regenerate token in Bot tab

### Commands don't appear
- ❌ **Incorrect IDs**: Check `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID`
- ❌ **Permissions**: Bot needs "Use Slash Commands" permission
- ❌ **Cache**: Global commands may take up to 1 hour

### Permission errors
- ❌ **Administrative command**: Check if bot has "Manage Server" permission
- ❌ **Restricted channel**: Configure `ALLOWED_CHANNEL_ID` if needed

## ✅ Final Test

Execute commands to test:

1. `/ping` - Should show latency
2. `/status` - Should show server status (or error if Crafty not configured)  
3. `/server start` - Should try to start server (requires permissions)

## 🔄 Manual Command Deployment

If you need to register commands manually:

```bash
# Local deployment (instant)
DISCORD_GUILD_ID=your_guild_id npm run deploy:commands

# Global deployment (up to 1 hour)
unset DISCORD_GUILD_ID && npm run deploy:commands
```

## 🆘 Support

If you still have problems:

1. Check logs: `LOG_LEVEL=debug npm run dev`
2. Consult documentation: [Discord.js Guide](https://discordjs.guide/)
3. Verify all IDs are numeric (15-20 digits)

### Valid vs Invalid IDs

✅ **Valid**: `1087616798233294934`
❌ **Invalid**: `your_discord_client_id_here`
❌ **Invalid**: `YourBot#1234`
❌ **Invalid**: `@BotName`
