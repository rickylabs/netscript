import { definePage } from '../../../src/application/builders/mod.ts';
import type { PageHandlers, RoutedPageDefinition } from '../../../src/application/builders/mod.ts';
import {
  paginationSearchSchema,
  type PaginationSearchState,
} from '../../../src/application/builders/define-page/mod.ts';

type SearchPageState = { requestId: string };
type SearchPageDefinition = RoutedPageDefinition<
  SearchPageState,
  Record<string, never>,
  Record<string, never>,
  PaginationSearchState,
  Record<string, never>
>;

const page: SearchPageDefinition = definePage<SearchPageState>()
  .withSearchParams(paginationSearchSchema({ defaultLimit: 5, defaultSort: 'name' }))
  .withLayout((_slots, { search }) => <main>search:{search.page}:{search.limit}</main>)
  .build({ routePattern: '/playground/builders/search-page' });

export const handler: PageHandlers<SearchPageState> | undefined = page.handler;
const defaultPage: SearchPageDefinition['default'] = page.default;
export default defaultPage;
