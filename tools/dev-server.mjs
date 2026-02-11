import { startServer } from './server-lib.mjs';

const port = Number(process.env.PORT || 3000);
const { server } = await startServer({ mode: 'src', port });

console.log(`dev server running at http://localhost:${port}`);

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
