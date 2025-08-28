#!/bin/bash

# =====================================
# Docker Scripts for Crafty Discord Bot
# =====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
log() {
    echo -e "${2}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Configuration
IMAGE_NAME="ghcr.io/indieatom/crafty-discord_bot"
CONTAINER_NAME="crafty-discord-bot"

# Check if Docker Buildx is available
check_buildx() {
    if docker buildx version >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Build function with automatic fallback and multi-arch support
docker_build_optimized() {
    local target="$1"
    local tag="$2"
    local platforms="${3:-linux/$(uname -m | sed 's/x86_64/amd64/')}"
    
    if check_buildx; then
        log "Using Docker Buildx for maximum optimization..." $BLUE
        log "Building for platforms: $platforms" $BLUE
        
        # Use --load for single platform builds, --push for multi-platform
        if [[ "$platforms" == *","* ]]; then
            # Multi-platform build - must push to registry
            log "Multi-platform build detected - building for registry..." $YELLOW
            DOCKER_BUILDKIT=1 docker buildx build \
                --target "$target" \
                --platform "$platforms" \
                --cache-from type=local,src=/tmp/.buildx-cache \
                --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
                -t "$tag" \
                --push \
                .
        else
            # Single platform build - can load locally
            DOCKER_BUILDKIT=1 docker buildx build \
                --target "$target" \
                --platform "$platforms" \
                --load \
                --cache-from type=local,src=/tmp/.buildx-cache \
                --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
                -t "$tag" \
                .
        fi
        
        # Move cache to avoid growing cache
        rm -rf /tmp/.buildx-cache
        mv /tmp/.buildx-cache-new /tmp/.buildx-cache || true
    else
        log "Using standard Docker build with Dockerfile optimizations..." $YELLOW
        log "Note: Still benefits from optimized npm flags and layer caching!" $CYAN
        log "Warning: Multi-architecture builds require Docker Buildx!" $RED
        docker build \
            --target "$target" \
            -t "$tag" \
            .
    fi
}

# Check system capabilities and show optimization status
check_system() {
    echo "🔍 Docker Build Optimization Status"
    echo "=================================="
    
    # Docker version
    echo -n "Docker: "
    if docker --version >/dev/null 2>&1; then
        docker --version | cut -d' ' -f3 | cut -d',' -f1
    else
        echo "❌ Not installed"
    fi
    
    # Buildx availability  
    echo -n "Buildx: "
    if check_buildx; then
        echo "✅ Available ($(docker buildx version | cut -d' ' -f2))"
    else
        echo "❌ Not available"
        echo ""
        echo "📦 To install Docker Buildx (recommended):"
        echo "   macOS (Homebrew): brew install docker-buildx"
        echo "   macOS (Manual): https://docs.docker.com/buildx/working-with-buildx/"
        echo "   Linux: Install docker-ce-cli package or use docker-compose-plugin"
        echo "   Windows: Update Docker Desktop to latest version"
    fi
    
    # BuildKit support
    echo -n "BuildKit: "
    if command -v docker >/dev/null 2>&1; then
        echo "✅ Enabled via DOCKER_BUILDKIT=1"
    else
        echo "❌ Docker not found"
    fi
    
    echo ""
    echo "🚀 Performance Features:"
    if check_buildx; then
        echo "   ✅ Advanced caching with Buildx"
        echo "   ✅ Parallel builds" 
        echo "   ✅ Multi-platform support"
    else
        echo "   ⚠️  Standard BuildKit caching (still fast!)"
        echo "   ⚠️  Sequential builds"
        echo "   ❌ No multi-platform support"
    fi
    
    echo ""
    echo "💡 Current build mode: $(check_buildx && echo "Buildx optimized" || echo "Standard optimized")"
}

# Show help
show_help() {
    echo "🐳 Crafty Discord Bot - Docker Management Scripts"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  check          Check Docker optimization status"
    echo "  build          Build Docker image locally"
    echo "  build-multiarch Build for multiple architectures (AMD64 + ARM64)"
    echo "  start          Start production bot"
    echo "  stop           Stop bot service"
    echo "  restart        Restart bot service"
    echo "  logs           Show logs"
    echo "  logs-follow    Follow logs in real-time"
    echo "  shell          Open shell in running container"
    echo "  status         Check container status"
    echo "  clean          Clean up containers and images"
    echo "  pull           Pull latest image from registry"
    echo "  deploy         Deploy latest version"
    echo ""
    echo "Release Commands:"
    echo "  release        Build and push to GitHub Container Registry"
    echo "  release-tag    Release with specific tag"
    echo ""
    echo "Examples:"
    echo "  $0 build              # Build local image"
    echo "  $0 build-multiarch    # Build for AMD64 + ARM64 (pushes to registry)"
    echo "  $0 start              # Start production bot"
    echo "  $0 release            # Build and push to GHCR (multi-arch)"
    echo "  $0 release-tag v1.0.0 # Release with version tag (multi-arch)"
}

# Build Docker image locally
build() {
    log "Building Docker image locally..." $BLUE
    docker_build_optimized "production" "$IMAGE_NAME:latest"
    log "Build completed successfully!" $GREEN
}

# Build for multiple architectures (requires registry push)
build_multiarch() {
    log "Building Docker image for multiple architectures..." $BLUE
    log "Note: Multi-arch builds will be pushed to registry automatically" $YELLOW
    
    # Check if logged in to registry
    if ! docker info 2>/dev/null | grep -q "Username:"; then
        log "Please login to container registry first:" $RED
        log "echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin" $YELLOW
        exit 1
    fi
    
    docker_build_optimized "production" "$IMAGE_NAME:latest" "linux/amd64,linux/arm64"
    log "Multi-architecture build completed successfully!" $GREEN
    log "Images available for: AMD64 (x86_64) and ARM64 (Apple Silicon)" $GREEN
}

# Start production
start_production() {
    log "Starting production bot..." $BLUE
    docker-compose up -d
    log "Production bot started!" $GREEN
    docker-compose logs -f
}

# Stop services
stop_all() {
    log "Stopping bot service..." $YELLOW
    docker-compose down
    log "Service stopped!" $GREEN
}

# Restart service
restart_service() {
    log "Restarting bot service..." $BLUE
    docker-compose restart
    log "Service restarted!" $GREEN
}

# Show logs
show_logs() {
    docker-compose logs
}

# Follow logs
follow_logs() {
    docker-compose logs -f
}

# Open shell in container
open_shell() {
    log "Opening shell in $CONTAINER_NAME..." $BLUE
    docker-compose exec crafty-bot sh
}

# Check status
check_status() {
    log "Checking container status..." $BLUE
    docker-compose ps
    echo ""
    
    # Check health if container is running
    if docker-compose ps | grep -q "Up"; then
        local container_id=$(docker-compose ps -q crafty-bot)
        if [ -n "$container_id" ]; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' $container_id 2>/dev/null || echo "no-health-check")
            local status=$(docker inspect --format='{{.State.Status}}' $container_id)
            
            echo "Container Status: $status"
            echo "Health Status: $health"
        fi
    else
        log "Container is not running" $YELLOW
    fi
}

# Clean up
clean_up() {
    log "Cleaning up Docker resources..." $YELLOW
    
    # Stop services
    docker-compose down -v --remove-orphans
    
    # Remove local images
    docker image rm $IMAGE_NAME:latest 2>/dev/null || true
    
    # Remove unused resources
    docker system prune -f
    
    log "Cleanup completed!" $GREEN
}

# Pull latest image
pull_image() {
    log "Pulling latest image from registry..." $BLUE
    docker pull $IMAGE_NAME:latest
    log "Image pulled successfully!" $GREEN
}

# Deploy latest version
deploy() {
    log "Deploying latest version..." $BLUE
    
    # Pull latest image
    pull_image
    
    # Stop current container
    docker-compose down
    
    # Start with new image
    docker-compose up -d
    
    log "Deployment completed! Showing logs..." $GREEN
    docker-compose logs -f
}

# Release to GitHub Container Registry with multi-arch support
release() {
    log "Building and releasing to GitHub Container Registry..." $BLUE
    log "Building for multiple architectures: AMD64 + ARM64" $BLUE
    
    # Check if logged in to registry
    if ! docker info 2>/dev/null | grep -q "Username:"; then
        log "Please login to container registry first:" $RED
        log "echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin" $YELLOW
        exit 1
    fi
    
    # Build and push multi-architecture image
    docker_build_optimized "production" "$IMAGE_NAME:latest" "linux/amd64,linux/arm64"
    
    # Tag with timestamp for multi-arch too
    local timestamp=$(date +%Y%m%d-%H%M%S)
    log "Creating timestamped multi-arch tag: $timestamp" $YELLOW
    docker_build_optimized "production" "$IMAGE_NAME:$timestamp" "linux/amd64,linux/arm64"
    
    log "Multi-architecture release completed successfully!" $GREEN
    log "Images available at: $IMAGE_NAME:latest (AMD64 + ARM64)" $GREEN
    log "Timestamped version: $IMAGE_NAME:$timestamp (AMD64 + ARM64)" $GREEN
}

# Release with specific tag and multi-arch support
release_tag() {
    local tag="${1:-latest}"
    
    if [ "$tag" = "latest" ]; then
        log "Please provide a specific tag (e.g., v1.0.0)" $RED
        exit 1
    fi
    
    log "Building and releasing version $tag for multiple architectures..." $BLUE
    
    # Check if logged in to registry
    if ! docker info 2>/dev/null | grep -q "Username:"; then
        log "Please login to container registry first:" $RED
        log "echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin" $YELLOW
        exit 1
    fi
    
    # Build and push multi-architecture images
    log "Building version tag: $tag (AMD64 + ARM64)" $YELLOW
    docker_build_optimized "production" "$IMAGE_NAME:$tag" "linux/amd64,linux/arm64"
    
    log "Building latest tag (AMD64 + ARM64)..." $YELLOW  
    docker_build_optimized "production" "$IMAGE_NAME:latest" "linux/amd64,linux/arm64"
    
    log "Multi-architecture release completed successfully!" $GREEN
    log "Version available at: $IMAGE_NAME:$tag (AMD64 + ARM64)" $GREEN
    log "Latest updated: $IMAGE_NAME:latest (AMD64 + ARM64)" $GREEN
}

# Main command dispatcher
case "${1:-help}" in
    "check")
        check_system
        ;;
    "build")
        build
        ;;
    "build-multiarch")
        build_multiarch
        ;;
    "start")
        start_production
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_service
        ;;
    "logs")
        show_logs
        ;;
    "logs-follow")
        follow_logs
        ;;
    "shell")
        open_shell
        ;;
    "status")
        check_status
        ;;
    "clean")
        clean_up
        ;;
    "pull")
        pull_image
        ;;
    "deploy")
        deploy
        ;;
    "release")
        release
        ;;
    "release-tag")
        release_tag "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
