/** Offline retrieval benchmark: run `deno task --cwd packages/mcp benchmark:docs`. */
import { createDocsFlows } from '../src/application/docs/docs-flows.ts';
import { createMcpServer } from '../src/application/runner/mcp-server.ts';
import type { DocsCorpusPort } from '../src/domain/docs/docs-corpus-port.ts';
import type { DocRetrievalResult } from '../src/domain/docs/doc-retrieval-contract.ts';
import { inventorySourceMaterial } from './source-material.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';
import { ReleaseEmbeddedDocsCorpus } from '../src/infrastructure/release-embedded-docs-corpus.ts';

interface BenchmarkRow {
  slug: string;
  mode: string;
  sourceTokens: number;
  responseTokens: number;
  baselineTokens: number;
  fences: number;
  fencesRetained: number;
  baselineFencesRetained: number;
  commands: number;
  commandsRetained: number;
  baselineCommandsRetained: number;
  snippets: number;
  snippetsRetained: number;
  baselineSnippetsRetained: number;
  links: number;
  linksRetained: number;
  baselineLinksRetained: number;
  fallbackProxy: boolean;
  baselineFallbackProxy: boolean;
  latencyMs: number;
}

/** Aggregate ratios over an explicitly identified cohort of documents. */
export interface DocBenchmarkAggregate {
  documents: number;
  returnedToVerbatimRatio: number;
  baselineToVerbatimRatio: number;
  fences: number;
  fencesRetained: number;
  baselineFencesRetained: number;
  fenceRetention: number;
  baselineFenceRetention: number;
  commandRetention: number;
  baselineCommandRetention: number;
  snippetRetention: number;
  baselineSnippetRetention: number;
  linkRetention: number;
  baselineLinkRetention: number;
  fallbackProxyRate: number;
  baselineFallbackProxyRate: number;
  fullReconstruction: string;
  latencyP95Ms: number;
}

/** Repeatable offline retrieval measurements and fidelity verdict. */
export interface DocBenchmarkReport {
  schemaVersion: number;
  method: string;
  summary: DocBenchmarkAggregate;
  extractOnly: DocBenchmarkAggregate;
  rows: BenchmarkRow[];
}

/** Model-independent lexical token proxy; compare ratios, not provider billing. */
function tokens(text: string): number {
  return [...text.matchAll(/[\p{Letter}\p{Number}_]+|[^\s]/gu)].length;
}

/** Benchmark actual MCP responses and fail on fidelity or full reconstruction drift. */
export async function benchmarkDocs(corpus: DocsCorpusPort): Promise<DocBenchmarkReport> {
  const instance = createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: true, message: 'offline' }) },
    flows: createDocsFlows(corpus),
  });
  const retrieve = async (slug: string, args: Record<string, unknown> = {}) => {
    const response = await instance.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'get_doc', arguments: { slug, ...args } },
    });
    if (response?.error || response?.result?.isError) {
      throw new Error(`Retrieval failed for ${slug}`);
    }
    if (new TextEncoder().encode(JSON.stringify(response)).length > 64 * 1024) {
      throw new Error(`Transport overflow for ${slug}`);
    }
    return response!.result!.structuredContent as DocRetrievalResult;
  };
  const rows: BenchmarkRow[] = [];
  for (const summary of await corpus.list()) {
    const doc = (await corpus.get(summary.slug))!;
    const start = performance.now();
    const result = await retrieve(doc.slug);
    const latencyMs = performance.now() - start;
    if (!['verbatim', 'extract'].includes(result.mode)) {
      throw new Error(`Missing fidelity mode for ${doc.slug}`);
    }
    if (result.mode === 'verbatim' && result.content !== doc.content) {
      throw new Error(`Verbatim mismatch for ${doc.slug}`);
    }
    const baseline = doc.content.length <= 2000
      ? doc.content
      : `${doc.content.slice(0, 2000)}…[truncated]`;
    const { fences, commands, keys, links } = inventorySourceMaterial(doc.content);
    const snippets = [...fences, ...commands, ...keys];
    const retained = (items: readonly string[], content: string) =>
      items.filter((item) => content.includes(item)).length;
    let full = '';
    let cursor: string | undefined;
    do {
      const page = await retrieve(doc.slug, { full: true, ...(cursor ? { cursor } : {}) });
      if (page.mode !== 'full' || (cursor && cursor === page.nextCursor)) {
        throw new Error(`Invalid full page for ${doc.slug}`);
      }
      full += page.content;
      cursor = page.nextCursor;
    } while (cursor);
    if (full !== doc.content) throw new Error(`Full reconstruction mismatch for ${doc.slug}`);
    rows.push({
      slug: doc.slug,
      mode: result.mode,
      sourceTokens: tokens(doc.content),
      responseTokens: tokens(JSON.stringify(result)),
      baselineTokens: tokens(baseline),
      fences: fences.length,
      fencesRetained: retained(fences, result.content),
      baselineFencesRetained: retained(fences, baseline),
      commands: commands.length,
      commandsRetained: retained(commands, result.content),
      baselineCommandsRetained: retained(commands, baseline),
      snippets: snippets.length,
      snippetsRetained: retained(snippets, result.content),
      baselineSnippetsRetained: retained(snippets, baseline),
      links: links.length,
      linksRetained: retained(links, result.content),
      baselineLinksRetained: retained(links, baseline),
      // A deterministic proxy, not an observed agent-run filesystem read: missing protected material.
      fallbackProxy: retained(snippets, result.content) < snippets.length ||
        retained(links, result.content) < links.length,
      baselineFallbackProxy: retained(snippets, baseline) < snippets.length ||
        retained(links, baseline) < links.length,
      latencyMs,
    });
  }
  return {
    schemaVersion: 2,
    method:
      'Independent source inventory of fences, commands, config lines and links; lexical content proxy includes response metadata; fallback proxy = missing inventoried material; cold in-process retrieval latency without inference. Extract-only cohort excludes verbatim results.',
    summary: aggregate(rows),
    extractOnly: aggregate(rows.filter((row) => row.mode === 'extract')),
    rows,
  };
}

function aggregate(rows: readonly BenchmarkRow[]): DocBenchmarkAggregate {
  type NumericField = {
    [K in keyof BenchmarkRow]: BenchmarkRow[K] extends number ? K : never;
  }[keyof BenchmarkRow];
  const sum = (field: NumericField) => rows.reduce((total, row) => total + row[field], 0);
  const ratio = (part: number, whole: number) => whole ? part / whole : 1;
  return {
    documents: rows.length,
    returnedToVerbatimRatio: ratio(sum('responseTokens'), sum('sourceTokens')),
    baselineToVerbatimRatio: ratio(sum('baselineTokens'), sum('sourceTokens')),
    fences: sum('fences'),
    fencesRetained: sum('fencesRetained'),
    baselineFencesRetained: sum('baselineFencesRetained'),
    fenceRetention: ratio(sum('fencesRetained'), sum('fences')),
    baselineFenceRetention: ratio(sum('baselineFencesRetained'), sum('fences')),
    commandRetention: ratio(sum('commandsRetained'), sum('commands')),
    baselineCommandRetention: ratio(sum('baselineCommandsRetained'), sum('commands')),
    snippetRetention: ratio(sum('snippetsRetained'), sum('snippets')),
    baselineSnippetRetention: ratio(sum('baselineSnippetsRetained'), sum('snippets')),
    linkRetention: ratio(sum('linksRetained'), sum('links')),
    baselineLinkRetention: ratio(sum('baselineLinksRetained'), sum('links')),
    fallbackProxyRate: rows.length
      ? rows.filter((row) => row.fallbackProxy).length / rows.length
      : 0,
    baselineFallbackProxyRate: rows.length
      ? rows.filter((row) => row.baselineFallbackProxy).length / rows.length
      : 0,
    fullReconstruction: 'pass',
    latencyP95Ms:
      rows.map((row) => row.latencyMs).sort((a, b) =>
        a - b
      )[Math.max(0, Math.ceil(rows.length * 0.95) - 1)] ?? 0,
  };
}

if (import.meta.main) {
  const source = Deno.args.includes('--embedded')
    ? new ReleaseEmbeddedDocsCorpus()
    : new FilesystemDocsCorpus({ root: new URL('../../../docs/site/', import.meta.url).pathname });
  // Freeze the filesystem index once; batch benchmarking must not rescan the tree per tool call.
  const documents = source instanceof FilesystemDocsCorpus ? await source.snapshot() : undefined;
  const index = documents ? new Map(documents.map((doc) => [doc.slug, doc])) : undefined;
  const corpus: DocsCorpusPort = index
    ? {
      list: () => Promise.resolve([...index.values()]),
      get: (slug) => Promise.resolve(index.get(slug)),
      search: (query) => source.search(query),
      findGuidance: (intent) => source.findGuidance(intent),
    }
    : source;
  console.log(JSON.stringify(await benchmarkDocs(corpus), null, 2));
}
