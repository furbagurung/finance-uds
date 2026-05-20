module.exports = {
  apps: [
    {
      name: "finance-uds",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/finance-uds",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
