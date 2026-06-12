import DesignCompositionView from './(_components)/composition-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const designCompositionPage = definePage()
  .withRoute(appRoutes.designComposition)
  .withMeta(() => ({
    title: 'Composition rules — NetScript design system',
    description: 'Layering, ownership, and composition rules for scaffolded fresh-ui surfaces.',
  }))
  .withLayer('composition', DesignCompositionView, () => ({}))
  .withLayout((slots) => slots.composition())
  .build();

export const { default: page } = designCompositionPage;
export { page as default };
