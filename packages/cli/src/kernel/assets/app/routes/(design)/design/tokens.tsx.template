import DesignTokensView from './(_components)/tokens-view.tsx';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

export const designTokensPage = definePage()
  .withRoute(appRoutes.designTokens)
  .withMeta(() => ({
    title: 'Design tokens — NetScript design system',
    description: 'Token reference for the scaffolded @netscript/fresh-ui theme.',
  }))
  .withLayer('tokens', DesignTokensView, () => ({}))
  .withLayout((slots) => slots.tokens())
  .build();

export const { default: page } = designTokensPage;
export { page as default };
