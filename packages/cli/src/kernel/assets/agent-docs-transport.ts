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
  const section = (path: string): number => {
    const url = '/' + path.slice('pages/'.length);
    if (url.startsWith('/tutorials/')) return 1;
    if (url.startsWith('/how-to/')) return 2;
    if (url.startsWith('/reference/')) return 4;
    if (url.startsWith('/explanation/')) return 5;
    const hubs = [
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
    return hubs.some((prefix) => url.startsWith(prefix)) ? 3 : 0;
  };
  const paths = Object.keys(files).filter((path) => path.startsWith('pages/')).sort((a, b) =>
    section(a) - section(b) ||
    a.replace(/index\.md$/, '').localeCompare(b.replace(/index\.md$/, ''))
  );
  const header =
    `# NetScript documentation — full corpus\n\n> Deno-native, polyglot backend framework, pre-1.0 (${version}). This file concatenates the Markdown twin of every documentation page for AI ingestion.\n\n`;
  const blocks = paths.map((path) => {
    const url = path.slice('pages/'.length).replace(/index\.md$/, '');
    return `${files[path].trim()}\n\n_Canonical: https://rickylabs.github.io/netscript/${url}_`;
  });
  return `${header}${blocks.join('\n\n---\n\n')}\n`;
}
