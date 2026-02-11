import { startServer } from './server-lib.mjs';

const port = Number(process.env.PORT || 4173);
const { server } = await startServer({ mode: 'dist', port });

console.log(`preview server running at http://localhost:${port}`);

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
