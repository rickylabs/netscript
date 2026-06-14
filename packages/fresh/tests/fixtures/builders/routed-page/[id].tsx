import { definePage } from '../../../../src/application/builders/mod.ts';
import { z } from 'zod';

const page = definePage<{ requestId: string }>()
  .withPathParams(z.object({ id: z.string().min(1) }))
  .withLayer('summary', () => <section />, ({ path }) => ({ id: path.id }))
  .withLayout((slots, { path, state }) => (
    <main>
      routed:{path.id}:{state.requestId}:{slots.summary.data?.id}
    </main>
  ))
  .build({ routePattern: '/playground/builders/routed-page/[id]' });

export const handler = page.handler;
export default page.default;
