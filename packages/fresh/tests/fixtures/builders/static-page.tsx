import { definePage } from '../../../src/application/builders/mod.ts';

const page = definePage<{ requestId: string }>()
  .withHeader('Cache-Control', 'private, no-store')
  .withStatus(200)
  .withLayout((_slots, { state }) => <main>static:{state.requestId}</main>)
  .build();

export const handler = page.handler;
export default page.default;
