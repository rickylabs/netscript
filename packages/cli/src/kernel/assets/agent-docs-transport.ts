import { buildLlmsFull, DOCS_SITE_LOCATION } from './llms-policy.generated.ts';

/** One independently verifiable page: path, gzip/base64, SHA-256, decoded byte count. */
export type AgentDocsPage = readonly [string, string, string, number];

/** Decode the page transport once before an offline documentation installation. */
export async function decodeAgentDocsPages(
  pages: readonly AgentDocsPage[],
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const [path, base64, expectedHash, size] of pages) {
    if (Object.hasOwn(files, path)) throw new Error(`Duplicate offline docs page: ${path}`);
    const bytes = Uint8Array.fromBase64(base64);
    const stream = new Blob([new Uint8Array(bytes).buffer]).stream().pipeThrough(
      new DecompressionStream('gzip'),
    );
    const decoded = new Uint8Array(await new Response(stream).arrayBuffer());
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', decoded)).toHex();
    if (decoded.byteLength !== size || hash !== expectedHash) {
      throw new Error(`Offline docs page integrity failed: ${path}`);
    }
    files[path] = new TextDecoder().decode(decoded);
  }
  return files;
}

/** Reconstruct the site concatenation from the same page twins, without storing another copy. */
export function agentDocsFullCorpus(
  files: Readonly<Record<string, string>>,
  version: string,
): string {
  const pages = Object.keys(files).filter((path) => path.startsWith('pages/')).map((path) => ({
    url: '/' + path.slice('pages/'.length).replace(/index\.md$/, ''),
    markdown: files[path],
  }));
  return buildLlmsFull(pages, new URL(DOCS_SITE_LOCATION), version);
}
