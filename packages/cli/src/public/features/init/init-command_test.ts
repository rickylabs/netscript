import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import type { InitPipelineContext } from '../../../kernel/application/scaffold/context.ts';
import { validateOptions } from '../../../kernel/application/scaffold/validate-init.ts';
import type { PromptPort } from '../../../kernel/ports/prompt-port.ts';
import { createInitCommand } from './init-command.ts';
import { resolveInteractiveInitInput } from './init-interactive.ts';

const noopPrompt: PromptPort = {
  input: () => Promise.resolve('unused'),
  confirm: () => Promise.resolve(false),
  select: (_message, options) => Promise.resolve(options[0]),
};

Deno.test('init --from reports the empty Wave 6 preset registry', async () => {
  const command = createInitCommand({
    initContext: {} as never,
    defaultProjectName: () => 'preset-smoke',
    prompt: noopPrompt,
  });

  await assertRejects(
    () => command.parse(['--from', 'api-only']),
    Error,
    'no presets registered',
  );
});

Deno.test('init defaults cache on with redis backend in non-interactive mode', async () => {
  const validated = await validateOptions(fakeInitContext(), {
    name: 'cache-defaults',
    importMode: 'jsr',
    force: true,
    ci: true,
    yes: false,
    dryRun: true,
    noGit: true,
    noAspire: false,
  });

  assertEquals(validated.cache, true);
  assertEquals(validated.cacheBackend, 'redis');
  assertEquals(validated.modelName, 'User');
});

Deno.test('init derives Prisma model name from service name', async () => {
  const validated = await validateOptions(fakeInitContext(), {
    name: 'crud-defaults',
    importMode: 'jsr',
    force: true,
    ci: true,
    yes: false,
    dryRun: true,
    noGit: true,
    noAspire: false,
    dbEngine: 'postgres',
    includeExampleService: true,
    serviceName: 'products',
  });

  assertEquals(validated.serviceName, 'products');
  assertEquals(validated.modelName, 'Product');
});

Deno.test('init accepts validated Prisma model name override', async () => {
  const validated = await validateOptions(fakeInitContext(), {
    name: 'crud-override',
    importMode: 'jsr',
    force: true,
    ci: true,
    yes: false,
    dryRun: true,
    noGit: true,
    noAspire: false,
    dbEngine: 'postgres',
    includeExampleService: true,
    serviceName: 'products',
    modelName: 'InventoryItem',
  });

  assertEquals(validated.modelName, 'InventoryItem');
});

Deno.test('init rejects invalid Prisma model name override', async () => {
  await assertRejects(
    () =>
      validateOptions(fakeInitContext(), {
        name: 'crud-invalid',
        importMode: 'jsr',
        force: true,
        ci: true,
        yes: false,
        dryRun: true,
        noGit: true,
        noAspire: false,
        dbEngine: 'postgres',
        includeExampleService: true,
        serviceName: 'products',
        modelName: 'inventory-item',
      }),
    Error,
    'Invalid model name',
  );
});

Deno.test('interactive init prompts for all missing scaffold choices', async () => {
  const calls: string[] = [];
  const prompt: PromptPort = {
    input(message, options) {
      calls.push(`input:${message}:${options?.defaultValue ?? ''}`);
      if (message === 'Project name') return Promise.resolve('interactive-app');
      if (message === 'Example service name') return Promise.resolve('billing');
      if (message === 'Frontend application name') return Promise.resolve('console');
      return Promise.resolve(options?.defaultValue ?? '');
    },
    confirm(message, options) {
      calls.push(`confirm:${message}:${String(options?.defaultValue)}`);
      return Promise.resolve(true);
    },
    select(message, options, config) {
      calls.push(`select:${message}:${config?.defaultValue ?? ''}`);
      if (message === 'Database engine') return Promise.resolve('postgres' as typeof options[number]);
      if (message === 'Cache backend') return Promise.resolve('garnet' as typeof options[number]);
      return Promise.resolve(options[0]);
    },
  };

  const resolved = await resolveInteractiveInitInput(
    prompt,
    {},
    undefined,
    () => 'cwd-name',
    true,
  );

  assertEquals(resolved.name, 'interactive-app');
  assertEquals(resolved.options.appName, 'console');
  assertEquals(resolved.options.db, 'postgres');
  assertEquals(resolved.options.service, true);
  assertEquals(resolved.options.serviceName, 'billing');
  assertEquals(resolved.options.cache, true);
  assertEquals(resolved.options.cacheBackend, 'garnet');
  assertEquals(calls, [
    'input:Project name:cwd-name',
    'select:Database engine:none',
    'confirm:Scaffold an example oRPC service?:false',
    'input:Example service name:users',
    'input:Frontend application name:dashboard',
    'confirm:Scaffold a shared cache?:true',
    'select:Cache backend:redis',
  ]);
});

function fakeInitContext(): InitPipelineContext {
  return {
    fs: {
      exists: () => Promise.resolve(false),
      readDir: () => Promise.resolve([]),
    },
    cwd: () => '/workspace',
    resolveModeFields: () => ({}),
  } as unknown as InitPipelineContext;
}
