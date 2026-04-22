'use strict';

// Azure App Service sets HOSTNAME to the internal worker hostname which resolves
// to the container private IP. Next.js uses it as the bind address, so it would
// listen on the wrong interface and fail the nginx health check. Delete it so
// Next.js falls back to binding on 0.0.0.0.
delete process.env.HOSTNAME;

const next = require('next');
const http = require('http');

const port = parseInt(process.env.PORT || '3000', 10);

// Use the programmatic API so Node.js module resolution handles the
// node_modules→/node_modules symlink that Oryx creates at startup.
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, '0.0.0.0', () => {
        console.log(`> Ready on http://0.0.0.0:${port}`);
      });
  })
  .catch((err) => {
    console.error('Failed to start Next.js:', err);
    process.exit(1);
  });
