import {
  baseContract,
  CursorPaginationInputSchema,
  type NotFoundErrorSchema,
  SuccessSchema,
  type ValidationErrorSchema,
} from '@netscript/contracts';
import { type ClientPromiseResult, ORPCError } from '@orpc/client';
import { assert, assertEquals } from './test-helpers.ts';
import {
  type ContractSchemaOutput,
  type DefinedError,
  isDefinedError,
  safe,
  type SafeFailure,
  type ServiceClient,
} from '../mod.ts';

type IsAny<T> = 0 extends (1 & T) ? true : false;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;
type Assert<T extends true> = T;

type BaseErrorCode = keyof typeof baseContract['~orpc']['errorMap'];
type ExpectedBaseErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';
type _BaseErrorCodesPreserved = Assert<Equal<BaseErrorCode, ExpectedBaseErrorCode>>;
type _BaseErrorCodeIsNotAny = Assert<Equal<IsAny<BaseErrorCode>, false>>;
type _BaseErrorCodeIsNotNever = Assert<
  Equal<[BaseErrorCode] extends [never] ? true : false, false>
>;
type _UndeclaredBaseErrorRejected = Assert<
  Equal<Extract<'NOT_DECLARED', BaseErrorCode>, never>
>;
type BaseNotFoundDataSchema = typeof baseContract['~orpc']['errorMap']['NOT_FOUND']['data'];
type _BaseNotFoundShapePreserved = Assert<
  Equal<'shape' extends keyof BaseNotFoundDataSchema ? true : false, true>
>;

type BaseMeta = typeof baseContract['~orpc']['meta'];
type _BaseMetaIsNotAny = Assert<Equal<IsAny<BaseMeta>, false>>;
type _EmptyBaseMetaSlotPreserved = Assert<Equal<BaseMeta, Record<never, never>>>;

const typedErrorContract = {
  list: baseContract
    .route({ method: 'GET', path: '/typed-error-probe' })
    .input(CursorPaginationInputSchema)
    .output(SuccessSchema),
};

declare const typedErrorClient: ServiceClient<typeof typedErrorContract>;

async function assertRealExportErrorChannel(): Promise<void> {
  const discriminated = await safe(typedErrorClient.list({ limit: 10 }));
  if (!discriminated.isSuccess && discriminated.isDefined) {
    type _SafePreservesExactErrorCode = Assert<
      Equal<typeof discriminated.error.code, ExpectedBaseErrorCode>
    >;
    const preservedCode: ExpectedBaseErrorCode = discriminated.error.code;
    void preservedCode;

    if (discriminated.error.code === 'NOT_FOUND') {
      type _SafePreservesNotFoundData = Assert<
        Equal<
          typeof discriminated.error.data,
          ContractSchemaOutput<typeof NotFoundErrorSchema>
        >
      >;
    }

    if (discriminated.error.code === 'VALIDATION_ERROR') {
      type _SafePreservesValidationData = Assert<
        Equal<
          typeof discriminated.error.data,
          ContractSchemaOutput<typeof ValidationErrorSchema>
        >
      >;
    }
  }

  const guarded = await safe(typedErrorClient.list({ limit: 10 }));
  if (!guarded.isSuccess && isDefinedError(guarded.error)) {
    type _GuardNarrowsToExactDefinedError = Assert<
      Equal<typeof guarded.error.code, ExpectedBaseErrorCode>
    >;
    const definedError: DefinedError<ExpectedBaseErrorCode> = guarded.error;
    void definedError;

    if (guarded.error.code === 'NOT_FOUND') {
      type _GuardPreservesNotFoundData = Assert<
        Equal<typeof guarded.error.data, ContractSchemaOutput<typeof NotFoundErrorSchema>>
      >;
    }
  }
}

type _PlainErrorRemainsNonDefined = Assert<
  Equal<Extract<SafeFailure<Error>, { isDefined: false }>['error'], Error>
>;
type _PlainErrorRejectedFromDefinedArm = Assert<
  Equal<Extract<SafeFailure<Error>, { isDefined: true }>['error'], never>
>;

void assertRealExportErrorChannel;

Deno.test('safe preserves defined and non-defined failure identity', async () => {
  const contractError = new ORPCError('NOT_FOUND', {
    defined: true,
    status: 404,
    data: { resource: 'Order', id: 'ord_1' },
  });
  const contractFailure: ClientPromiseResult<never, typeof contractError> = Promise.reject(
    contractError,
  );
  const definedResult = await safe(contractFailure);

  assert(!definedResult.isSuccess, 'expected contract failure');
  assert(definedResult.isDefined, 'expected a defined contract failure');
  assertEquals(definedResult.error, contractError);
  assertEquals(definedResult.data, undefined);
  assertEquals(definedResult[0], contractError);
  assertEquals(definedResult[1], undefined);
  assertEquals(definedResult[2], true);
  assertEquals(definedResult[3], false);

  const plainError = new Error('network unavailable');
  const plainResult = await safe(Promise.reject(plainError));

  assert(!plainResult.isSuccess, 'expected plain failure');
  assert(!plainResult.isDefined, 'plain errors must not become defined errors');
  assertEquals(plainResult.error, plainError);
  assertEquals(plainResult.data, undefined);
  assertEquals(plainResult[0], plainError);
  assertEquals(plainResult[1], undefined);
  assertEquals(plainResult[2], false);
  assertEquals(plainResult[3], false);
});

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
declare function createDesktopServiceClient(config: unknown): {
  readonly get: (input: unknown) => Promise<unknown>;
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
declare function startAutoUpdate(options: {
  readonly release: {
    readonly baseUrl: string;
    readonly publicKey: string;
    readonly manualUpdateUrl: string;
  };
  readonly policy: { readonly checkOnLaunch: true; readonly intervalMs?: number };
  readonly onUpdateReady?: (event: {
    readonly applyMode: 'automatic';
    readonly version: string;
  } | {
    readonly applyMode: 'manual';
    readonly version: string;
    readonly manualUpdateUrl: string;
  }) => void;
  readonly onRollback?: (event: { readonly reason: string; readonly currentVersion: string }) => void;
}):
  | { readonly status: 'started'; readonly updateUrl: string }
  | { readonly status: 'scheduled'; readonly updateUrl: string; readonly firstCheckInMs: number }
  | { readonly status: 'disabled'; readonly reason: string };
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
