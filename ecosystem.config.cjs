/**
 * PM2 config for production.
 *
 * Usage on the VPS:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup    # so it auto-restarts after server reboot
 *
 * View logs:    pm2 logs earthystays
 * Restart:      pm2 restart earthystays
 */
module.exports = {
  apps: [
    {
      name: "earthystays",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,           // bump to "max" once you outgrow KVM 2
      exec_mode: "fork",      // "cluster" if you go to multiple instances
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
