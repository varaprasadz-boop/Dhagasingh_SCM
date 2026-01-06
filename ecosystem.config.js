module.exports = {
  apps: [
    {
      name: "dhagasingh-scm",
      script: "dist/index.cjs",
      cwd: "/var/www/Dhagasingh_SCM",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env_file: ".env", // PM2 will automatically load .env file
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

