import { z } from 'npm:zod@^4.6.5';
import { importFigmaTokenBundle } from '../../../packages/fresh-ui/src/tokens/adapters/figma/figma-round-trip.ts';
import { canonical } from '../../../packages/fresh-ui/src/tokens/adapters/figma/parse-figma-round-trip.ts';

const itemSchema = z.object({
  type: z.literal('registry:theme'),
  meta: z.object({
    netscript: z.object({ version: z.literal(1), preset: z.string(), figma: z.unknown() }).strict(),
  }).strict(),
}).passthrough();
const identity = z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) });
const commitSchema = z.object({ tree: identity });
const blobSchema = z.object({ content: z.string(), encoding: z.literal('base64') });
const pullSchema = z.object({ html_url: z.string().url() });

/** Compare every item field, allowing only literal token values and their oklch value metadata. */
export function assertValuesOnly(previous: unknown, next: unknown): void {
  for (const candidate of [previous, next]) {
    const item = itemSchema.parse(candidate);
    importFigmaTokenBundle(item.meta.netscript.figma);
  }
  function shape(value: unknown, path: readonly string[] = []): unknown {
    if (Array.isArray(value)) {
      return value.map((child, index) => shape(child, [...path, String(index)]));
    }
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map((
        [key, child],
      ) => [
        key,
        key === '$value' && path.length === 8 &&
          path.slice(0, 5).join('/') === 'meta/netscript/figma/sources/documents' &&
          !(typeof child === 'string' && /^\{.*\}$/.test(child))
          ? '<token-value>'
          : key === 'oklch' && path.length === 10 &&
              path.slice(0, 5).join('/') === 'meta/netscript/figma/sources/documents' &&
              path[8] === '$extensions' && path[9] === 'netscript'
          ? '<perceptual-value>'
          : shape(child, [...path, key]),
      ]),
    );
  }
  if (JSON.stringify(shape(previous)) !== JSON.stringify(shape(next))) {
    throw new Error(
      'Export contains name, type, alias, mode or metadata changes; download and review a new baseline',
    );
  }
  if (canonical(previous) === canonical(next)) throw new Error('No token values changed');
}

/** Create a single-file values-only branch and PR without persisting or logging the supplied token. */
export async function pushThemePullRequest(input: {
  readonly repository: string;
  readonly token: string;
  readonly branch: string;
  readonly path: string;
  readonly item: unknown;
}, request: typeof fetch = fetch): Promise<string> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(input.repository)) {
    throw new Error('GitHub repository must be owner/repo');
  }
  if (!/^figma\/[A-Za-z0-9_-]+$/.test(input.branch)) {
    throw new Error('Export branch must be figma/<name>');
  }
  if (
    !/^[A-Za-z0-9_/-]+\.json$/.test(input.path) ||
    input.path.split('/').some((part) => !part || part === '..' || part === '.')
  ) throw new Error('Theme path must be a repository-relative JSON file');
  if (!input.token.trim()) throw new Error('A user-supplied GitHub token is required');
  const api = async (path: string, body?: unknown): Promise<unknown> => {
    let result: Response;
    try {
      result = await request(
        `https://api.github.com/repos/${input.repository}${path ? `/${path}` : ''}`,
        {
          method: body === undefined ? 'GET' : 'POST',
          redirect: 'error',
          headers: {
            Authorization: `Bearer ${input.token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
      );
    } catch {
      throw new Error('GitHub request failed');
    }
    if (!result.ok) {
      await result.body?.cancel();
      throw new Error(
        `GitHub HTTP ${result.status}; ensure the baseline exists and token has Contents and Pull requests write access`,
      );
    }
    return await result.json();
  };
  const repository = z.object({ default_branch: z.string() }).parse(await api(''));
  const base = repository.default_branch;
  const reference = z.object({ object: identity }).parse(
    await api(`git/ref/heads/${encodeURIComponent(base)}`),
  );
  const head = reference.object.sha;
  const commit = commitSchema.parse(await api(`git/commits/${head}`));
  const file = identity.parse(await api(`contents/${input.path}?ref=${head}`));
  const blob = blobSchema.parse(await api(`git/blobs/${file.sha}`));
  const bytes = Uint8Array.fromBase64(blob.content.replace(/\s/g, ''));
  let previous: unknown;
  let baselineText: string;
  try {
    baselineText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    previous = JSON.parse(baselineText);
  } catch {
    throw new Error('Existing theme baseline is not valid UTF-8 JSON');
  }
  if (baselineText !== JSON.stringify(previous, null, 2) + '\n') {
    throw new Error('Baseline is not in canonical export format; re-download and commit it');
  }
  assertValuesOnly(previous, input.item);
  const createdBlob = identity.parse(
    await api('git/blobs', {
      encoding: 'utf-8',
      content: JSON.stringify(input.item, null, 2) + '\n',
    }),
  );
  const tree = identity.parse(
    await api('git/trees', {
      base_tree: commit.tree.sha,
      tree: [{ path: input.path, mode: '100644', type: 'blob', sha: createdBlob.sha }],
    }),
  );
  const next = identity.parse(
    await api('git/commits', {
      message: 'chore(tokens): export Figma values',
      tree: tree.sha,
      parents: [head],
    }),
  );
  await api('git/refs', { ref: `refs/heads/${input.branch}`, sha: next.sha });
  const pull = pullSchema.parse(
    await api('pulls', {
      title: 'chore(tokens): export Figma values',
      head: input.branch,
      base,
      body:
        'Figma variable values exported through the NetScript plugin. Names, types, modes, aliases and theme metadata match the committed baseline.',
    }),
  );
  return pull.html_url;
}
