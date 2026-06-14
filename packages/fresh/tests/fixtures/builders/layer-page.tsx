import { definePage } from '../../../src/application/builders/mod.ts';

const page = definePage<{ requestId: string }>()
  .withLayer('panel', (props: { label: string }) => <section>{props.label}</section>, {
    loader: () => ({ label: 'ready' }),
    partial: '/partials/playground/builders/layer-page/panel',
    staleTime: 10_000,
  })
  .withLayout((slots) => <main>{slots.panel()}</main>)
  .build({ routePattern: '/playground/builders/layer-page' });

export const handler = page.handler;
export default page.default;
