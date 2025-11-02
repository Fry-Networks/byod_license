module.exports = {
  apps: [
    {
      name: "byod",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss" // This line adds timestamp to your logs
    },
  ],
};
