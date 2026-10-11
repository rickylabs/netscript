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

export const SECTIONS: readonly Section[] = [
  { id: 'start', heading: 'Getting started' },
  { id: 'tutorials', heading: 'Tutorials' },
  { id: 'howto', heading: 'How-to guides' },
  { id: 'capabilities', heading: 'Capabilities & hubs' },
  { id: 'reference', heading: 'Reference' },
  { id: 'explanation', heading: 'Explanation' },
];

const HUB_PREFIXES = [
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

export function sectionOf(url: string): string {
  if (url.startsWith('/tutorials/')) return 'tutorials';
  if (url.startsWith('/how-to/')) return 'howto';
  if (url.startsWith('/reference/')) return 'reference';
  if (url.startsWith('/explanation/')) return 'explanation';
  if (HUB_PREFIXES.some((prefix) => url.startsWith(prefix))) return 'capabilities';
  return 'start';
}

export function buildLlmsFull(
  infos: readonly LlmsPage[],
  origin: URL,
  releaseVersion: string,
): string {
  const order = new Map(SECTIONS.map((section, i) => [section.id, i]));
  const sorted = [...infos].sort((a, b) => {
    const sa = order.get(sectionOf(a.url)) ?? 99;
    const sb = order.get(sectionOf(b.url)) ?? 99;
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
