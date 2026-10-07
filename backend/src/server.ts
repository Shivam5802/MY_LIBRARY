import { app } from './app.js';
import { config } from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`[MY LIBRARY Backend] Server running on port ${config.port} (${config.nodeEnv})`);
  console.log(`[MY LIBRARY Backend] API Base: http://localhost:${config.port}/api/v1`);
});

const handleShutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
