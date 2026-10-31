import { createStateSchema } from '@durable-streams/state';
import { z } from 'zod';

export const schema = createStateSchema({
  order: {
    schema: z.object({ id: z.string(), status: z.string() }),
    type: 'order',
    primaryKey: 'id',
  },
});
