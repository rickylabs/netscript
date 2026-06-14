import { definePage } from '../../../src/application/builders/mod.ts';
import { paginationSearchSchema } from '../../../src/application/builders/define-page/mod.ts';

const page = definePage<{ requestId: string }>()
  .withSearchParams(paginationSearchSchema({ defaultLimit: 5, defaultSort: 'name' }))
  .withLayout((_slots, { search }) => <main>search:{search.page}:{search.limit}</main>)
  .build({ routePattern: '/playground/builders/search-page' });

export const handler = page.handler;
export default page.default;
