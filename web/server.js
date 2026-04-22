'use strict';
const { spawn } = require('child_process');
const path = require('path');

// Azure App Service sets HOSTNAME to the internal worker hostname which resolves
// to the container private IP. Next.js uses it as the bind address, so it would
// listen on the wrong interface and fail the nginx health check. Delete it so
// Next.js falls back to binding on 0.0.0.0.
delete process.env.HOSTNAME;

const port = process.env.PORT || '3000';
const nextCli = path.join(__dirname, 'node_modules', '.bin', 'next');

const proc = spawn(nextCli, ['start', '--port', port, '--hostname', '0.0.0.0'], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname,
});

process.on('SIGTERM', () => proc.kill('SIGTERM'));
process.on('SIGINT', () => proc.kill('SIGINT'));

proc.on('close', (code) => process.exit(code ?? 0));
proc.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
