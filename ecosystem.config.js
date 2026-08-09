module.exports = {
  apps: [
    {
      name: 'sub-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/subscription-incinerator',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/sub-web-error.log',
      out_file: '/var/log/pm2/sub-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'sub-worker',
      script: 'node_modules/.bin/tsx',
      args: 'workers/index.ts',
      cwd: '/var/www/subscription-incinerator',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/sub-worker-error.log',
      out_file: '/var/log/pm2/sub-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
