import { assertEquals, assertStringIncludes } from '@std/assert';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
import {
  AddSagaCommand,
  InspectCommand,
  ListSagasCommand,
  PublishCommand,
  RemoveSagaCommand,
  UpdateSagaCommand,
} from '../../src/cli/commands.ts';
import type {
  SagasRuntimeApiClient,
  SagasRuntimeRequest,
} from '../../src/cli/adapters/runtime-api-client.ts';
import { LocalSagasRuntimeBackend } from '../../src/cli/local-runtime-backend.ts';

Deno.test('saga publish and list commands use runtime contract routes and filters', async () => {
  const runtime = new RecordingRuntimeClient();
  const backend = new LocalSagasRuntimeBackend({ files: new MemoryProjectFiles(), runtime });

  const published = await backend.handle(new PublishCommand().definition, {
    command: 'publish',
    values: ['OrderCreated'],
    flags: {
      payload: '{"orderId":"ord-1"}',
      'correlation-key': 'ord-1',
      'idempotency-key': 'msg-1',
    },
  });
  const listed = await backend.handle(new ListSagasCommand().definition, {
    command: 'list',
    flags: { instances: true, status: 'running', saga: 'CheckoutSaga', json: true },
  });
  const inspected = await backend.handle(new InspectCommand().definition, {
    command: 'inspect',
    values: ['CheckoutSaga'],
  });

  assertEquals(published.code, 0);
  assertEquals(listed.code, 0);
  assertEquals(inspected.data, { source: 'runtime', runtime: { ok: true } });
  assertEquals(runtime.requests, [
    {
      path: 'publish',
      request: {
        method: 'POST',
        body: {
          type: 'OrderCreated',
          payload: { orderId: 'ord-1' },
          correlationKey: 'ord-1',
          idempotencyKey: 'msg-1',
        },
      },
    },
    {
      path: 'instances',
      request: { query: { status: 'running', sagaName: 'CheckoutSaga' } },
    },
    { path: 'sagas/CheckoutSaga', request: {} },
  ]);
});

Deno.test('saga add update and remove regenerate a definition-only registry', async () => {
  const files = new MemoryProjectFiles();
  const backend = new LocalSagasRuntimeBackend({ files, runtime: new RecordingRuntimeClient() });

  const added = await backend.handle(new AddSagaCommand().definition, {
    command: 'add-saga',
    values: ['checkout'],
    flags: { 'message-type': 'OrderCreated' },
  });
  assertEquals(added.code, 0);
  const registryPath = '.netscript/generated/plugin-sagas/sagas.registry.ts';
  const firstRegistry = files.contents.get(registryPath) ?? '';
  assertStringIncludes(firstRegistry, 'checkout-saga.ts');
  assertEquals(firstRegistry.includes('checkout.config.ts'), false);

  const configPath = 'sagas/checkout.config.ts';
  files.contents.set(
    configPath,
    `${
      files.contents.get(configPath)
    }\n// .topic('comment-lookalike')\nconst note = ".tags('string-lookalike')";\n`,
  );
  const updated = await backend.handle(new UpdateSagaCommand().definition, {
    command: 'update-saga',
    values: ['checkout'],
    flags: {
      durability: 't3',
      topic: 'orders',
      tags: 'checkout,durable',
      description: 'Durable checkout flow',
    },
  });
  assertEquals(updated.code, 0);
  assertStringIncludes(files.contents.get('sagas/checkout-saga.ts') ?? '', '.durability("t3")');
  const config = files.contents.get(configPath) ?? '';
  assertStringIncludes(config, `.topic("orders")`);
  assertStringIncludes(config, `.tags(...["checkout","durable"])`);
  assertStringIncludes(config, `.description("Durable checkout flow")`);
  assertStringIncludes(config, `// .topic('comment-lookalike')`);

  const removed = await backend.handle(new RemoveSagaCommand().definition, {
    command: 'remove-saga',
    values: ['checkout'],
  });
  assertEquals(removed.code, 0);
  assertEquals(files.contents.has('sagas/checkout-saga.ts'), false);
  assertEquals(files.contents.has(configPath), false);
  assertEquals(files.contents.get(registryPath)?.includes('checkout-saga.ts'), false);
});

class RecordingRuntimeClient implements SagasRuntimeApiClient {
  readonly requests: Array<{ path: string; request: SagasRuntimeRequest }> = [];

  request(path: string, request: SagasRuntimeRequest = {}): Promise<unknown> {
    this.requests.push({ path, request });
    return Promise.resolve({ ok: true });
  }
}

class MemoryProjectFiles implements ProjectFiles {
  readonly projectRoot = '/project';
  readonly contents: Map<string, string>;

  constructor(contents: Map<string, string> = new Map()) {
    this.contents = contents;
  }

  resolve(path: string): string {
    return `${this.projectRoot}/${path}`;
  }

  writeTextFile(path: string, content: string): Promise<void> {
    this.contents.set(path, content);
    return Promise.resolve();
  }

  readTextFile(path: string): Promise<string | undefined> {
    return Promise.resolve(this.contents.get(path));
  }

  removeFile(path: string): Promise<boolean> {
    return Promise.resolve(this.contents.delete(path));
  }

  listFiles(
    path: string,
    extensions: readonly string[] = [],
  ): Promise<readonly ProjectFileEntry[]> {
    const prefix = path ? `${path}/` : '';
    return Promise.resolve(
      [...this.contents.entries()]
        .filter(([candidate]) => candidate.startsWith(prefix))
        .filter(([candidate]) =>
          !extensions.length || extensions.some((ext) => candidate.endsWith(ext))
        )
        .map(([relativePath, content]) => ({
          path: this.resolve(relativePath),
          relativePath,
          size: content.length,
        })),
    );
  }

  toImportUrl(path: string): string {
    return `file://${this.resolve(path)}`;
  }

  relative(path: string): string {
    return path.replace(`${this.projectRoot}/`, '');
  }
}
