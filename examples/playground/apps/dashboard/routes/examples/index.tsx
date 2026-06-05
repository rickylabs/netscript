import ExamplesView from './(_components)/examples-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const examplesPage = definePage()
  .withRoute(appRoutes.examples)
  .withMeta(() => ({
    title: 'playground — examples',
    description: 'Landing page for scaffolded NetScript showcase routes.',
  }))
  .withLayer('examples', ExamplesView, () => ({
    examples: [
      {
        title: 'Users service example',
        href: appRoutes.serviceExample.href(),
        description:
          'Hydrated query island, typed optimistic mutation, and deferred partial summary.',
        status: 'Showcase',
      },
      {
        title: 'Telemetry trace example',
        href: '/examples/telemetry',
        description: 'Step 10 closes the rollout with an FE → service → DB trace demo.',
        status: 'Step 10',
      },
    ],
  }))
  .withLayout((slots) => slots.examples())
  .build();

export const { default: page } = examplesPage;
export { page as default };
