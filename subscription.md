# Subscription Incinerator - VPS Deployment Guide

## Prerequisites

- Ubuntu 22.04+ VPS
- Domain name pointed to VPS IP
- Google OAuth credentials (for Gmail integration)
- Stripe account (for payments)
- Resend account (for emails)

## 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential
```

## 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version
```

## 3. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER subuser WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE subscription_incinerator OWNER subuser;
GRANT ALL PRIVILEGES ON DATABASE subscription_incinerator TO subuser;
EOF
```

## 4. Install Redis

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return PONG
```

## 5. Install PM2

```bash
sudo npm install -g pm2
```

## 6. Clone and Setup Application

```bash
cd /var/www
sudo git clone https://github.com/PominausGH/subscription-incinerator.git
sudo chown -R $USER:$USER subscription-incinerator
cd subscription-incinerator

# Install dependencies
npm install
```

## 7. Configure Environment

```bash
# Generate secrets
echo "NEXTAUTH_SECRET: $(openssl rand -base64 32)"
npx web-push generate-vapid-keys

# Create environment file
nano .env.local
```

Add the following to `.env.local`:

```env
# Database
DATABASE_URL="postgresql://subuser:CHANGE_THIS_PASSWORD@localhost:5432/subscription_incinerator"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="paste_generated_secret_here"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
STRIPE_PRICE_ID_PREMIUM="price_xxx"

# Resend (email service)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="noreply@yourdomain.com"

# Web Push (from generated VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_public_key"
VAPID_PRIVATE_KEY="your_private_key"
```

## 8. Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

## 9. Build Application

```bash
npm run build
```

## 10. Start with PM2

```bash
# Start web server (port 3000)
pm2 start npm --name "sub-web" -- start

# Start background worker
pm2 start npm --name "sub-worker" -- run worker

# Save PM2 config and enable startup
pm2 save
pm2 startup
# Run the command it outputs
```

## 11. Setup Nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/subscription
```

Add Nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/subscription /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 12. Setup SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

## 13. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 14. Setup Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`
5. Restart: `pm2 restart all`

## 15. Configure Google OAuth

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Add authorized JavaScript origin: `https://yourdomain.com`
5. Copy Client ID and Secret to `.env.local`
6. Enable Gmail API in Google Cloud Console

---

## Useful Commands

```bash
# View logs
pm2 logs

# Restart services
pm2 restart all

# Check status
pm2 status

# Update application
cd /var/www/subscription-incinerator
git pull
npm install
npm run build
pm2 restart all
```

## Troubleshooting

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U subuser -d subscription_incinerator -h localhost
```

### Redis issues
```bash
# Check Redis status
sudo systemctl status redis-server

# Test connection
redis-cli ping
```

### Application errors
```bash
# Check PM2 logs
pm2 logs sub-web --lines 100
pm2 logs sub-worker --lines 100
```

### Nginx issues
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```
