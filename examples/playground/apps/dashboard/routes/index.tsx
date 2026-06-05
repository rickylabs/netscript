import HomeView from './(_components)/home-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const homePage = definePage()
  .withRoute(appRoutes.home)
  .withMeta(() => ({
    title: 'playground — dashboard',
    description: 'NetScript starter scaffold with definePage routes and showcase examples.',
  }))
  .withLayer('home', HomeView, () => ({
    projectName: 'playground',
    appName: 'dashboard',
    routes: [
      {
        title: 'Health route',
        href: appRoutes.health.href(),
        description: 'Content-negotiated liveness route for browsers, probes, and Aspire.',
        cta: 'Open /health',
      },
      {
        title: 'Examples landing',
        href: appRoutes.examples.href(),
        description: 'Entry point for the upcoming service and telemetry showcase routes.',
        cta: 'Open /examples',
      },
    ],
    nextSteps: [
      'Edit apps/dashboard/routes/index.tsx to shape the frontend.',
      'Add a service with netscript service add --name=<name>.',
      'Define contracts under contracts/versions/v1/.',
    ],
  }))
  .withLayout((slots) => slots.home())
  .build();

export const { default: page } = homePage;
export { page as default };
