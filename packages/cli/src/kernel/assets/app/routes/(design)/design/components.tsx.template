import DesignComponentsView from './(_components)/components-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const designComponentsPage = definePage()
  .withRoute(appRoutes.designComponents)
  .withMeta(() => ({
    title: 'Components — NetScript design system',
    description: 'Component and block gallery for copied @netscript/fresh-ui registry items.',
  }))
  .withLayer('components', DesignComponentsView, () => ({}))
  .withLayout((slots) => slots.components())
  .build();

export const { default: page } = designComponentsPage;
export { page as default };
