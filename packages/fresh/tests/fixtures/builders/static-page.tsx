import { definePage } from '../../../src/application/builders/mod.ts';
import type { PageDefinition, PageHandlers } from '../../../src/application/builders/mod.ts';

type StaticPageState = { requestId: string };
type StaticPageDefinition = PageDefinition<StaticPageState>;

const page: StaticPageDefinition = definePage<StaticPageState>()
  .withHeader('Cache-Control', 'private, no-store')
  .withStatus(200)
  .withLayout((_slots, { state }) => <main>static:{state.requestId}</main>)
  .build();

export const handler: PageHandlers<StaticPageState> | undefined = page.handler;
const defaultPage: StaticPageDefinition['default'] = page.default;
export default defaultPage;
