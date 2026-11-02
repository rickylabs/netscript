// @generated from docs/site/_plugins/llms-policy.ts by gen:agent-docs-prose.
/** Composition policy for the docs index and full corpus; also shipped through a generated CLI copy. */
export const DOCS_SITE_LOCATION: string = 'https://rickylabs.github.io/netscript/';

/** Rendered Markdown twin and its canonical page URL. */
export interface LlmsPage {
  readonly url: string;
  readonly markdown: string;
}

export interface Section {
  id: string;
  heading: string;
}

/** One section per docs lane, in top-bar order; `sectionOf` mirrors `getDocsLane`. */
export const SECTIONS: readonly Section[] = [
  { id: 'start', heading: 'Start' },
  { id: 'tutorials', heading: 'Learn' },
  { id: 'capabilities', heading: 'Build' },
  { id: 'reference', heading: 'Reference' },
  { id: 'explanation', heading: 'Concepts' },
  { id: 'design-system', heading: 'Design system' },
];

const BUILD_PREFIXES = [
  '/how-to/',
  '/web-layer/',
  '/services-sdk/',
  '/background-processing/',
  '/durable-workflows/',
  '/ai/',
  '/data-persistence/',
  '/identity-access/',
  '/orchestration-runtime/',
  '/observability/',
];

export function sectionOf(url: string): string {
  if (url.startsWith('/tutorials/')) return 'tutorials';
  if (url.startsWith('/reference/') || url === '/cli-reference/' || url === '/glossary/') {
    return 'reference';
  }
  if (url.startsWith('/explanation/') || url.startsWith('/comparisons/')) return 'explanation';
  if (url.startsWith('/design-system/') || url === '/create/') return 'design-system';
  if (BUILD_PREFIXES.some((prefix) => url.startsWith(prefix))) return 'capabilities';
  return 'start';
}

/**
 * Concatenation order of llms-full.txt, which has no section headings. It predates the lane
 * sections above and stays fixed: the frozen carrier-parity fixture rebuilds the full corpus from
 * its legacy pages and compares digests, so reordering it would break that guarantee.
 */
const CORPUS_ORDER = ['start', 'tutorials', 'howto', 'capabilities', 'reference', 'explanation'];

const CORPUS_HUB_PREFIXES = [
  '/web-layer/',
  '/services-sdk/',
  '/background-processing/',
  '/durable-workflows/',
  '/data-persistence/',
  '/identity-access/',
  '/orchestration-runtime/',
  '/observability/',
  '/capabilities/',
];

function corpusGroupOf(url: string): string {
  if (url.startsWith('/tutorials/')) return 'tutorials';
  if (url.startsWith('/how-to/')) return 'howto';
  if (url.startsWith('/reference/')) return 'reference';
  if (url.startsWith('/explanation/')) return 'explanation';
  if (CORPUS_HUB_PREFIXES.some((prefix) => url.startsWith(prefix))) return 'capabilities';
  return 'start';
}

export function buildLlmsFull(
  infos: readonly LlmsPage[],
  origin: URL,
  releaseVersion: string,
): string {
  const order = new Map(CORPUS_ORDER.map((group, i) => [group, i]));
  const sorted = [...infos].sort((a, b) => {
    const sa = order.get(corpusGroupOf(a.url)) ?? 99;
    const sb = order.get(corpusGroupOf(b.url)) ?? 99;
    return sa !== sb ? sa - sb : a.url.localeCompare(b.url);
  });

  const header = [
    '# NetScript documentation — full corpus',
    '',
    `> Deno-native, polyglot backend framework, pre-1.0 (${releaseVersion}). This file concatenates the Markdown twin of every documentation page for AI ingestion.`,
    '',
  ].join('\n');

  const blocks = sorted.map((info) => {
    const canonical = new URL(info.url.replace(/^\//, ''), origin).href;
    return `${info.markdown.trim()}\n\n_Canonical: ${canonical}_`;
  });

  return `${header}\n${blocks.join('\n\n---\n\n')}\n`;
}
