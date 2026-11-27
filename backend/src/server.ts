import http, { Server } from 'http';
import app from './app';
import config from './app/config';
import { closeDbPool } from './app/db';
import { testDbConnection } from './app/db/test-connection';
import { seedAdmin } from './app/utils/seedAdmin';

async function bootstrap() {
  let server: Server;

  try {
    // Test PostgreSQL connection if configured
    if (config.database_url?.startsWith('postgres')) {
      await testDbConnection();
    }

    server = http.createServer(app);

    server.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });

    const exitHandler = async () => {
      if (server) {
        server.close(async () => {
          console.log('Server closed gracefully.');
          await closeDbPool();
          process.exit(0);
        });
      } else {
        await closeDbPool();
        process.exit(0);
      }
    };

    process.on('unhandledRejection', (error) => {
      console.log('Unhandled Rejection detected, shutting down...');
      console.error(error);
      exitHandler();
    });

    process.on('SIGTERM', exitHandler);
    process.on('SIGINT', exitHandler);
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
}

(async () => {
  await bootstrap();
  await seedAdmin();
})();
