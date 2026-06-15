import { definePage } from '../../../src/application/builders/mod.ts';
import type {
  PageHandlers,
  RoutedPageDefinition,
} from '../../../src/application/builders/mod.ts';

type LayerPageState = { requestId: string };
type LayerPageDefinition = RoutedPageDefinition<
  LayerPageState,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  { panel: { label: string } }
>;

const page: LayerPageDefinition = definePage<LayerPageState>()
  .withLayer('panel', (props: { label: string }) => <section>{props.label}</section>, {
    loader: () => ({ label: 'ready' }),
    partial: '/partials/playground/builders/layer-page/panel',
    staleTime: 10_000,
  })
  .withLayout((slots) => <main>{slots.panel()}</main>)
  .build({ routePattern: '/playground/builders/layer-page' });

export const handler: PageHandlers<LayerPageState> | undefined = page.handler;
const defaultPage: LayerPageDefinition['default'] = page.default;
export default defaultPage;
