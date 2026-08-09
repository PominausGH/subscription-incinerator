# Subscription Incinerator - Production Deployment

This folder contains everything needed to deploy the application to your VPS.

## Architecture

```
/opt/docker/subscription/
├── docker-compose.yml   # Orchestration (pulls from GHCR)
└── .env                 # Your secrets (never commit!)

Images are stored in GitHub Container Registry:
- ghcr.io/pominausgh/subscription-incinerator-web:latest
- ghcr.io/pominausgh/subscription-incinerator-worker:latest
```

## Initial Setup

### 1. Copy files to your VPS

```bash
# On your local machine
scp -r deploy/* user@your-vps:/tmp/subscription-setup/

# On your VPS
cd /tmp/subscription-setup
sudo bash setup.sh
```

### 2. Configure environment

```bash
cd /opt/docker/subscription
nano .env
```

Generate secrets:
```bash
# NEXTAUTH_SECRET and ENCRYPTION_SECRET
openssl rand -base64 32

# POSTGRES_PASSWORD
openssl rand -base64 24
```

### 3. Start the application

```bash
cd /opt/docker/subscription

# Pull images
docker compose pull

# Run migrations
docker compose run --rm migrate

# Start services
docker compose up -d

# Verify
curl http://localhost:3000/api/health
```

## Updating

Deployments are automatic via GitHub Actions. When you push to `master`:

1. CI runs tests and builds Docker images
2. Images are pushed to GitHub Container Registry
3. VPS pulls new images and restarts services

To manually update:
```bash
cd /opt/docker/subscription
docker compose pull
docker compose up -d --force-recreate
```

## Useful Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f web
docker compose logs -f worker

# Restart services
docker compose restart

# Stop everything
docker compose down

# Check status
docker compose ps

# View resource usage
docker stats

# Run migrations manually
docker compose run --rm migrate

# Access database
docker compose exec postgres psql -U subscription subscription_incinerator

# Access Redis
docker compose exec redis redis-cli
```

## Backup & Restore

### Backup database
```bash
docker compose exec postgres pg_dump -U subscription subscription_incinerator > backup.sql
```

### Restore database
```bash
cat backup.sql | docker compose exec -T postgres psql -U subscription subscription_incinerator
```

### Backup volumes
```bash
# Stop services first
docker compose down

# Backup
docker run --rm -v subscription_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
docker run --rm -v subscription_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Start services
docker compose up -d
```

## Reverse Proxy (Nginx)

Example nginx config for SSL termination:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Container won't start
```bash
docker compose logs web
docker compose logs worker
```

### Database connection issues
```bash
# Check if postgres is healthy
docker compose ps
docker compose exec postgres pg_isready
```

### Health check failing
```bash
# Check if web is responding
docker compose exec web wget -qO- http://localhost:3000/api/health
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```
