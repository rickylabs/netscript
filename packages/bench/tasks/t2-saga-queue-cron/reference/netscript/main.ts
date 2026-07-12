/** Entry point for the t2 golden reference. @module */

import { defineService } from '@netscript/service';
import { router } from './router.ts';

const port = Number.parseInt(Deno.env.get('PORT') ?? '0', 10);

await defineService(router, {
  name: 'saga-queue-cron',
  port,
  openapi: {
    title: 'Saga queue cron API',
    description: 'Golden reference for t2-saga-queue-cron.',
  },
});
