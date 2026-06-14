import { assertEquals } from './test-helpers.ts';

const README_PATH = new URL('../README.md', import.meta.url);

const DOCTEST_PRELUDE = `
declare const ordersContract: unknown;
declare const usersContract: unknown;
declare const ordersClient: unknown;
declare const ordersApi: unknown;
declare const usersApi: unknown;
declare const queryClient: unknown;
declare const queries: {
  readonly orders: {
    readonly list: ((input: { readonly limit: number; readonly offset: number }) => Promise<unknown>) & {
      readonly key: (input: { readonly limit: number; readonly offset: number }) => readonly unknown[];
      readonly prefetch: (input: { readonly limit: number; readonly offset: number }) => void;
    };
    readonly invalidate: () => Promise<void>;
  };
};
declare const router: unknown;
declare const chatStreamSchema: unknown;
declare const console: { error(...args: readonly unknown[]): void };
declare function defineServices(config: unknown): {
  readonly clients: { readonly orders: { readonly get: (input: unknown) => Promise<unknown> } };
  readonly queries: { readonly orders: { readonly list: (input: unknown) => Promise<unknown> } };
  readonly queryUtils: { readonly orders: { readonly list: { readonly queryOptions: (input: unknown) => unknown } } };
};
declare function createServiceClient(config: unknown): {
  readonly get: (input: unknown) => Promise<unknown>;
  readonly getById: (input: unknown) => Promise<unknown>;
};
declare function safe<T>(value: Promise<T>): Promise<[unknown, T | undefined]>;
declare function isDefinedError(error: unknown): error is { readonly code: string; readonly data: unknown };
declare function createQueryFactories(config: unknown): typeof queries;
declare function createNetScriptQueryClient(): unknown;
declare function createServiceQueryUtils(client: unknown, options?: unknown): {
  readonly list: { readonly queryOptions: (input: unknown) => unknown };
};
declare class CacheQuery {
  constructor(store?: unknown);
}
declare class KvCacheStore {}
declare const cacheQuery: { readonly setCachedData: (key: readonly string[], value: unknown) => Promise<void> };
declare function getAllServices(): readonly string[];
declare function getKvConnection(name?: string): string | undefined;
declare function getServiceInfo(name: string): unknown;
declare function getServiceUrl(name: string, protocol?: string): string;
declare function createQueryCollection(config: {
  readonly resource: string;
  readonly queryKey: readonly string[];
  readonly queryFn: () => Promise<unknown>;
  readonly getKey: (item: { readonly id: string }) => string;
  readonly queryClient: unknown;
}): {
  readonly preload: () => Promise<void>;
  readonly get: (key: string) => unknown;
};
declare function createOpenAPIGenerator(): unknown;
declare function generateOpenAPISpec(router: unknown, generator: unknown, options: unknown): Promise<unknown>;
declare function otelMiddleware(): unknown;
declare const createStreamProducer: (config: unknown) => unknown;
type QueryClientPort = unknown;
type QueryFactory<T> = unknown;
type ServiceClient<T> = unknown;
type ServiceQueryUtils<T> = unknown;
`;

interface MarkdownBlock {
  readonly language: string;
  readonly code: string;
}

function extractBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const fencePattern = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;

  for (const match of markdown.matchAll(fencePattern)) {
    blocks.push({
      language: match[1].toLowerCase(),
      code: match[2],
    });
  }

  return blocks;
}

function stripImports(code: string): string {
  return code
    .replaceAll(/import\s+(?:type\s+)?[\s\S]*?from\s+["'][^"']+["'];\n?/g, '')
    .replaceAll(/^\s*export\s+/gm, '');
}

Deno.test('README examples include checked TypeScript fences', async () => {
  const markdown = await Deno.readTextFile(README_PATH);
  const blocks = extractBlocks(markdown);
  const tsBlocks = blocks.filter((block) => block.language === 'ts');

  assertEquals(tsBlocks.length > 0, true);

  const tempDir = await Deno.makeTempDir({ prefix: 'netscript-sdk-readme-doctest-' });

  try {
    for (const [index, block] of tsBlocks.entries()) {
      const file = `${tempDir}/snippet-${index}.ts`;
      await Deno.writeTextFile(file, `${DOCTEST_PRELUDE}\n{\n${stripImports(block.code)}\n}\n`);
      const result = await new Deno.Command(Deno.execPath(), {
        args: ['check', '--no-config', file],
      }).output();

      if (result.code !== 0) {
        const stderr = new TextDecoder().decode(result.stderr);
        throw new Error(`README TypeScript fence ${index + 1} failed:\n${stderr}`);
      }
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('README JSON fences parse', async () => {
  const markdown = await Deno.readTextFile(README_PATH);
  const jsonBlocks = extractBlocks(markdown).filter((block) => block.language === 'json');

  assertEquals(jsonBlocks.length > 0, true);

  for (const block of jsonBlocks) {
    JSON.parse(block.code);
  }
});
