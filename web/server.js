'use strict';

// Azure App Service sets HOSTNAME to the internal worker hostname which resolves
// to the container private IP. The standalone startServer uses HOSTNAME for the
// bind address — override it to 0.0.0.0 so the app passes the nginx health check.
delete process.env.HOSTNAME;

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

if (!process.env.NEXT_MANUAL_SIG_HANDLE) {
  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));
}

const { startServer } = require('next/dist/server/lib/start-server');

const port = parseInt(process.env.PORT || '3000', 10);

startServer({
  dir: __dirname,
  isDev: false,
  hostname: '0.0.0.0',
  port,
  allowRetry: false,
  keepAliveTimeout: 5000,
}).catch((err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
