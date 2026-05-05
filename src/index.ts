import 'dotenv/config';
import { XSwiftClient } from './bot';
import { connectDatabase } from './services/database/MongoDB';
import { startHealthServer } from './utils/healthcheck';
import { logger } from './utils/logger';
import { FeedWorker } from './jobs/FeedWorker';
import { LeaderboardRefresh } from './jobs/LeaderboardRefresh';
import { WebhookHealth } from './jobs/WebhookHealth';

async function main() {
  logger.info('Starting xSwift Bot...');
    await connectDatabase();
      startHealthServer();
        const client = new XSwiftClient();
          await client.initialize();
            client.once('ready', () => {
                logger.info('xSwift is online!');
                    FeedWorker.start(client);
                        LeaderboardRefresh.start();
                            WebhookHealth.start(client);
                              });
                                process.on('SIGTERM', () => {
                                    client.destroy();
                                        process.exit(0);
                                          });
                                            process.on('unhandledRejection', (e) => logger.error('Unhandled:', e));
                                            }

                                            main().catch((e) => { logger.error('Fatal:', e); process.exit(1); });
