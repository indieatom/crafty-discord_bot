# 🐳 Docker Release Guide

This guide explains how to release Docker images to GitHub Container Registry (GHCR).

## 📋 Prerequisites

1. **GitHub Personal Access Token** with permissions:
   - `write:packages`
   - `read:packages`
   - `delete:packages` (optional, for management)

2. **Docker** installed and running

3. **Push access** to the repository

## 🔑 Initial Setup

### 1. Generate GitHub Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a token with `packages` permissions
3. Copy the token (won't be shown again)

### 2. Login to GHCR

```bash
# Method 1: Using token directly
echo "YOUR_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin

# Method 2: Using environment variable  
export GITHUB_TOKEN=your_token_here
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Method 3: Interactive
docker login ghcr.io -u USERNAME
# Enter token when prompted
```

## 🚀 Release Methods

### **Automatic (GitHub Actions) - Recommended**

The repository is already configured with GitHub Actions:

```bash
# 1. Automatic release on push to main
git push origin main

# 2. Versioned release with tags
git tag v1.0.0
git push origin v1.0.0
```

**Automatically generated images:**
- `ghcr.io/indieatom/crafty-discord_bot:latest` (push main)  
- `ghcr.io/indieatom/crafty-discord_bot:v1.0.0` (tags)
- `ghcr.io/indieatom/crafty-discord_bot:1.0` (major.minor)
- `ghcr.io/indieatom/crafty-discord_bot:1` (major)

### **Manual with Scripts**

```bash
# Release latest
npm run docker:release

# Release with specific tag
npm run docker:release:tag v1.0.0

# Or using script directly
./docker-scripts.sh release
./docker-scripts.sh release-tag v1.2.3
```

### **Manual with Docker**

```bash
# 1. Build image
docker build -t ghcr.io/indieatom/crafty-discord_bot:latest --target production .

# 2. Tag with version
docker tag ghcr.io/indieatom/crafty-discord_bot:latest ghcr.io/indieatom/crafty-discord_bot:v1.0.0

# 3. Push images
docker push ghcr.io/indieatom/crafty-discord_bot:latest
docker push ghcr.io/indieatom/crafty-discord_bot:v1.0.0
```

## 📦 Using the Image

### **With Docker Compose (Recommended)**

```bash
# 1. Download docker-compose.yml from repository
wget https://raw.githubusercontent.com/indieatom/crafty-discord-bot/main/docker-compose.yml

# 2. Configure .env
cp .env.example .env
# Edit .env with your settings

# 3. Start
docker-compose up -d
```

### **Direct Docker**

```bash
# Run with all configurations
docker run -d \
  --name crafty-discord-bot \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/indieatom/crafty-discord_bot:latest

# Or specific version
docker run -d \
  --name crafty-discord-bot \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/indieatom/crafty-discord_bot:v1.0.0
```

### **On Production Server**

```bash
# 1. Baixar arquivos necessários
wget https://raw.githubusercontent.com/indieatom/crafty-discord-bot/main/docker-compose.yml
wget https://raw.githubusercontent.com/indieatom/crafty-discord-bot/main/.env.example

# 2. Configurar ambiente
cp .env.example .env
nano .env  # Configure suas credenciais

# 3. Deploy
docker-compose up -d

# 4. Monitor
docker-compose logs -f

# 5. Atualizações futuras
docker-compose pull
docker-compose up -d
```

## 🔄 Workflow de Versionamento

### **Convenção de Tags**

- `v1.0.0` - Versão semântica completa
- `v1.0` - Major.Minor (automaticamente criada)
- `v1` - Major (automaticamente criada)  
- `latest` - Última versão estável

### **Release Process**

1. **Desenvolvimento**
   ```bash
   # Trabalhe normalmente
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

2. **Release Candidate**
   ```bash
   # Teste em staging
   npm run docker:build
   npm run docker:start
   ```

3. **Release Oficial**
   ```bash
   # Tag de versão
   git tag v1.0.0
   git push origin v1.0.0
   
   # GitHub Actions fará o resto automaticamente
   ```

## 🔍 Verificação

### **Verificar Imagens Publicadas**

```bash
# Listar tags disponíveis
curl -s https://api.github.com/orgs/indieatom/packages/container/crafty-discord_bot/versions | jq '.[].metadata.container.tags'

# Ou verificar no GitHub
# https://github.com/indieatom/crafty-discord-bot/pkgs/container/crafty-discord_bot
```

### **Testar Imagem**

```bash
# Pull da imagem
docker pull ghcr.io/indieatom/crafty-discord_bot:latest

# Verificar informações
docker inspect ghcr.io/indieatom/crafty-discord_bot:latest

# Teste rápido
docker run --rm ghcr.io/indieatom/crafty-discord_bot:latest node --version
```

## 🛠 Troubleshooting

### **Erro de Autenticação**

```bash
# Verificar login
docker info | grep -i username

# Re-fazer login
docker logout ghcr.io
docker login ghcr.io
```

### **Permissões Negadas**

1. Verificar se o token tem permissões `write:packages`
2. Verificar se o usuário tem acesso ao repositório
3. Verificar se o package existe e é público

### **Build Falha**

```bash
# Build com logs detalhados
docker build --no-cache --progress=plain -t test-image .

# Verificar se o Dockerfile está correto
docker build --dry-run .
```

### **GitHub Actions Falha**

1. Verificar logs do workflow no GitHub
2. Verificar se o GITHUB_TOKEN tem permissões corretas
3. Verificar se o Dockerfile está na raiz do repositório

## 📚 Referências

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Documentation](https://docs.docker.com/engine/reference/commandline/build/)
- [GitHub Actions Docker](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
