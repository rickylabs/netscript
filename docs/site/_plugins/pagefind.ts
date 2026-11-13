import pagefind from 'lume/plugins/pagefind.ts';
import type Site from 'lume/core/site.ts';

/** Index final pages in URL order so native page IDs are independent of filesystem order. */
export default function reproduciblePagefind(): (site: Site) => void {
  return (site) => {
    site.process(['.html'], (_pages, allPages) => {
      // Lume filters into a fresh array per processor; reorder the shared input for Pagefind.
      allPages.sort((a, b) => a.data.url < b.data.url ? -1 : a.data.url > b.data.url ? 1 : 0);
    });
    site.use(pagefind({ ui: false }));
  };
}
