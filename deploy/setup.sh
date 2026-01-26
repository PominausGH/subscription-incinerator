#!/bin/bash
# ===========================================
# Subscription Incinerator - VPS Setup Script
# Run this once to set up the deployment
# ===========================================

set -e

DEPLOY_DIR="/opt/docker/subscription"
GITHUB_REPO="ghcr.io/pominausgh/subscription-incinerator"

echo "=== Subscription Incinerator Setup ==="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo: sudo bash setup.sh"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "Docker installed successfully"
fi

# Create deployment directory
echo "Creating deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy files
echo "Copying configuration files..."
cp docker-compose.yml "$DEPLOY_DIR/"
cp .env.example "$DEPLOY_DIR/.env.example"

# Check if .env exists
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  cp .env.example "$DEPLOY_DIR/.env"
  echo ""
  echo "=== IMPORTANT ==="
  echo "Created .env file at $DEPLOY_DIR/.env"
  echo "Please edit this file and fill in your values:"
  echo ""
  echo "  nano $DEPLOY_DIR/.env"
  echo ""
  echo "Generate secrets with:"
  echo "  openssl rand -base64 32  # for NEXTAUTH_SECRET and ENCRYPTION_SECRET"
  echo "  openssl rand -base64 24  # for POSTGRES_PASSWORD"
  echo ""
else
  echo ".env file already exists, skipping..."
fi

# Log in to GitHub Container Registry
echo ""
echo "=== GitHub Container Registry Login ==="
echo "You need a GitHub Personal Access Token with 'read:packages' scope"
echo "Create one at: https://github.com/settings/tokens"
echo ""
read -p "Enter your GitHub username: " GITHUB_USER
echo "Enter your GitHub token (will be hidden): "
read -s GITHUB_TOKEN
echo ""

echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

if [ $? -eq 0 ]; then
  echo "Successfully logged in to GitHub Container Registry"
else
  echo "Failed to log in. You can retry manually with:"
  echo "  docker login ghcr.io -u YOUR_USERNAME"
  exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit your environment file:"
echo "   nano $DEPLOY_DIR/.env"
echo ""
echo "2. Pull the Docker images:"
echo "   cd $DEPLOY_DIR && docker compose pull"
echo ""
echo "3. Run database migrations:"
echo "   docker compose run --rm migrate"
echo ""
echo "4. Start the application:"
echo "   docker compose up -d"
echo ""
echo "5. Check the logs:"
echo "   docker compose logs -f"
echo ""
echo "6. Verify health:"
echo "   curl http://localhost:3000/api/health"
echo ""
