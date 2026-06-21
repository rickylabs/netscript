import HomeView from './(_components)/home-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const homePage = definePage()
  .withRoute(appRoutes.home)
  .withMeta(() => ({
    title: 'json-smoke — dashboard',
    description: 'NetScript starter scaffold with app-owned fresh-ui pages.',
  }))
  .withLayer('home', HomeView, () => ({
    projectName: 'json-smoke',
    appName: 'dashboard',
    routes: [
      {
        title: 'Dashboard',
        href: appRoutes.dashboard.href(),
        description: 'Operational overview built from registry stats, tables, panels, and alerts.',
        cta: 'Open dashboard',
        badge: 'app',
      },
      {
        title: 'CRUD example',
        href: appRoutes.crudExample.href(),
        description: 'Directory, filters, table, and detail rail composed from copied UI blocks.',
        cta: 'Open CRUD',
        badge: 'example',
      },
      {
        title: 'Design reference',
        href: '/design/components',
        description: 'The scaffolded component gallery and token reference for the active theme.',
        cta: 'Open design',
        badge: 'design',
      },
      {
        title: 'Examples',
        href: appRoutes.examples.href(),
        description: 'Index of generated workflow examples and integration placeholders.',
        cta: 'Open examples',
        badge: 'routes',
      },
    ],
  }))
  .withLayout((slots) => slots.home())
  .build();

export const { default: page } = homePage;
export { page as default };
