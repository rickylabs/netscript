import { definePage } from '../../../../src/application/builders/mod.ts';
import type {
  PageHandlers,
  RoutedPageDefinition,
} from '../../../../src/application/builders/mod.ts';
import { z } from 'zod';

type RoutedPageState = { requestId: string };
type RoutedPagePath = { id: string };
type RoutedPageDefinitionFixture = RoutedPageDefinition<
  RoutedPageState,
  Record<string, never>,
  RoutedPagePath,
  Record<string, never>,
  { summary: { id: string } }
>;

const page: RoutedPageDefinitionFixture = definePage<RoutedPageState>()
  .withPathParams(z.object({ id: z.string().min(1) }))
  .withLayer('summary', () => <section />, ({ path }) => ({ id: path.id }))
  .withLayout((slots, { path, state }) => (
    <main>
      routed:{path.id}:{state.requestId}:{slots.summary.data?.id}
    </main>
  ))
  .build({ routePattern: '/playground/builders/routed-page/[id]' });

export const handler: PageHandlers<RoutedPageState> | undefined = page.handler;
const defaultPage: RoutedPageDefinitionFixture['default'] = page.default;
export default defaultPage;
