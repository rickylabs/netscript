import CrudExampleView from './(_components)/crud-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const crudExamplePage = definePage()
  .withRoute(appRoutes.crudExample)
  .withMeta(() => ({
    title: 'json-smoke — CRUD example',
    description: 'CRUD scaffold example composed from app-owned fresh-ui registry blocks.',
  }))
  .withLayer('crud', CrudExampleView, () => ({
    records: [
      {
        name: 'Acme Robotics',
        plan: 'Enterprise',
        owner: 'Maya Chen',
        status: 'Active',
        updated: '4m ago',
      },
      {
        name: 'Northstar Labs',
        plan: 'Scale',
        owner: 'Jon Bell',
        status: 'Review',
        updated: '18m ago',
      },
      {
        name: 'Harbor Health',
        plan: 'Starter',
        owner: 'Priya Rao',
        status: 'Paused',
        updated: '2h ago',
      },
    ] as const,
  }))
  .withLayout((slots) => slots.crud())
  .build();

export const { default: page } = crudExamplePage;
export { page as default };
