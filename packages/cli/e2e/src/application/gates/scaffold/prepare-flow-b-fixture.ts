import { configurePublishedWorkersBlock } from './configure-published-workers-block.ts';
import { prepareLocalSourceFixture } from './local-source-fixture.ts';

const projectRoot = Deno.args[0];
if (!projectRoot) {
  throw new Error('project root argument is required');
}

const mode = Deno.args[1] === 'published' ? 'published' : 'local';
const flowBJobId = 'flow-b-callback';
const flowBJobPath = `${projectRoot}/workers/jobs/${flowBJobId}.ts`;

const denoConfigPath = `${projectRoot}/deno.json`;
const denoConfig = JSON.parse(await Deno.readTextFile(denoConfigPath));
if (!isRecord(denoConfig) || !isRecord(denoConfig.imports)) {
  throw new Error('generated deno.json did not contain imports');
}

const registerPluginsPath = `${projectRoot}/aspire/.helpers/register-plugins.mts`;
const registerPlugins = await Deno.readTextFile(registerPluginsPath);

// Published-JSR runs need no local-source mapping: the published packages carry
// the T6/T5 telemetry behavior. Bare jsr aliases expand subpath imports
// (@netscript/sdk/client, @netscript/telemetry/tracer) for the injected
// callback. The release version is read from the generated workers resource pin.
const publishedVersion = registerPlugins.match(
  /jsr:@netscript\/plugin-workers@([^/']+)\/services/,
)?.[1];
if (mode === 'published' && !publishedVersion) {
  throw new Error('generated register-plugins.mts did not reveal the published release version');
}
const sourceRoot = mode === 'published'
  ? ''
  : (await Deno.readTextFile(`${projectRoot}/.netscript-source-root`)).trim();
if (mode === 'local' && !sourceRoot) {
  throw new Error('generated project did not record its local source root');
}
const publishedImports = {
  '@netscript/sdk': `jsr:@netscript/sdk@${publishedVersion}`,
  '@netscript/telemetry': `jsr:@netscript/telemetry@${publishedVersion}`,
};
const sharedNpmImports = {
  '@opentelemetry/api': 'npm:@opentelemetry/api@^1.9.1',
  '@orpc/client': 'npm:@orpc/client@^1.14.6',
  '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
  '@orpc/otel': 'npm:@orpc/otel@^1.14.7',
};
const localSourcePackages = [
  [
    '@netscript/plugin-workers-core/contracts/v1',
    'packages/plugin-workers-core/src/contracts/v1/mod.ts',
  ],
  ['@netscript/plugin-workers/services', 'plugins/workers/services/src/main.ts'],
  ['@netscript/sdk/client', 'packages/sdk/src/client/mod.ts'],
  ['@netscript/telemetry', 'packages/telemetry/mod.ts'],
  ['@netscript/telemetry/attributes', 'packages/telemetry/attributes.ts'],
  ['@netscript/telemetry/config', 'packages/telemetry/config.ts'],
  ['@netscript/telemetry/context', 'packages/telemetry/context.ts'],
  ['@netscript/telemetry/hono', 'packages/telemetry/hono.ts'],
  ['@netscript/telemetry/instrumentation', 'packages/telemetry/instrumentation.ts'],
  ['@netscript/telemetry/orpc', 'packages/telemetry/orpc.ts'],
  ['@netscript/telemetry/otel', 'packages/telemetry/src/adapters/otel/mod.ts'],
  ['@netscript/telemetry/query', 'packages/telemetry/query.ts'],
  ['@netscript/telemetry/registry', 'packages/telemetry/registry.ts'],
  ['@netscript/telemetry/testing', 'packages/telemetry/src/testing/mod.ts'],
  ['@netscript/telemetry/tracer', 'packages/telemetry/tracer.ts'],
].map(([specifier, entrypoint]) => ({ specifier, entrypoint }));
const flowBConfigPath = `${projectRoot}/.netscript-flow-b-deno.json`;
const flowBImportMapPath = `${projectRoot}/.netscript/e2e/flow-b-import-map.json`;
if (mode === 'local') {
  await prepareLocalSourceFixture({
    projectRoot,
    sourceBase: sourceRoot,
    packages: localSourcePackages,
    imports: sharedNpmImports,
    targets: [
      { path: '.netscript-flow-b-deno.json', includeConfig: true },
      { path: '.netscript/e2e/flow-b-import-map.json' },
    ],
  });
} else {
  const flowBImports = { ...denoConfig.imports, ...sharedNpmImports, ...publishedImports };
  await Deno.mkdir(`${projectRoot}/.netscript/e2e`, { recursive: true });
  await Deno.writeTextFile(
    flowBConfigPath,
    `${JSON.stringify({ ...denoConfig, imports: flowBImports }, null, 2)}\n`,
  );
  await Deno.writeTextFile(
    flowBImportMapPath,
    `${JSON.stringify({ imports: flowBImports }, null, 2)}\n`,
  );
}

const workersMarker = '  // --- workers-api ---';
const workersIndex = registerPlugins.indexOf(workersMarker);
const nextResourceIndex = registerPlugins.indexOf('  // --- ', workersIndex + workersMarker.length);
if (workersIndex < 0 || nextResourceIndex < 0) {
  throw new Error('generated register-plugins.mts did not contain the workers-api resource block');
}
const workersBlock = registerPlugins.slice(workersIndex, nextResourceIndex);
// The published flow-b config introduces jsr pins that are minutes old at
// release-verification time; the Aspire-launched service must bypass Deno's
// dependency recency guard or it never starts (health probe timeout).
let configuredWorkersBlock = mode === 'published'
  ? configurePublishedWorkersBlock(workersBlock)
  : workersBlock.replace(
    "['run', '--config', 'deno.json',",
    "['run', '--config', '.netscript-flow-b-deno.json',",
  );
if (mode === 'local') {
  configuredWorkersBlock = configuredWorkersBlock.replace(
    /'jsr:@netscript\/plugin-workers@[^']+\/services'/,
    "'@netscript/plugin-workers/services'",
  );
}
if (
  configuredWorkersBlock === workersBlock &&
  !workersBlock.includes("'--config', '.netscript-flow-b-deno.json'")
) {
  throw new Error('workers-api resource did not contain the expected Deno config argument');
}
if (
  mode === 'local' && !configuredWorkersBlock.includes("'@netscript/plugin-workers/services'")
) {
  throw new Error('workers-api resource did not contain the expected service entrypoint');
}
await Deno.writeTextFile(
  registerPluginsPath,
  registerPlugins.slice(0, workersIndex) + configuredWorkersBlock +
    registerPlugins.slice(nextResourceIndex),
);

const workersCli = mode === 'published'
  ? `jsr:@netscript/plugin-workers@${publishedVersion}/cli`
  : `${sourceRoot}/plugins/workers/src/cli/composition/main.ts`;
await runDeno(
  [
    'run',
    '-A',
    '--minimum-dependency-age=0',
    workersCli,
    'add',
    'job',
    flowBJobId,
    '--topic=default',
  ],
  projectRoot,
  'workers add job',
);
const flowBJob = await Deno.readTextFile(flowBJobPath);
const callbackImports = [
  "import { UsersV1 } from '../../contracts/versions/v1/users.contract.ts';",
  "import { createServiceClient } from '@netscript/sdk/client';",
  "import { getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';",
].join('\n');
const callbackBody = [
  '  const channelClient = createServiceClient({',
  '    contract: UsersV1,',
  "    serviceName: 'users',",
  "    routerName: 'users',",
  '  });',
  "  await withSpan(getTracer('@netscript/e2e-flow-b'), 'flow-b.callback', async () => {",
  '    await channelClient.health.check();',
  '  }, {',
  '    kind: SpanKind.CLIENT,',
  '    attributes: {',
  "      'netscript.correlation.id': context.correlationId ?? context.id,",
  "      'netscript.flow_b.outcome': 'success',",
  '    },',
  '  });',
].join('\n');

let updatedFlowBJob = flowBJob;
updatedFlowBJob = updatedFlowBJob
  .replace('  const flowBCorrelationId = context.correlationId ?? context.id;\n', '')
  .replace(
    "  await Deno.writeTextFile('.netscript/e2e/flow-b-correlation-id', flowBCorrelationId);\n",
    '',
  )
  .replace(
    "attributes: { 'netscript.correlation.id': flowBCorrelationId }",
    "attributes: { 'netscript.correlation.id': context.correlationId ?? context.id }",
  );
if (!updatedFlowBJob.includes("from '@netscript/sdk/client'")) {
  updatedFlowBJob = `${callbackImports}\n${updatedFlowBJob}`;
}
if (!updatedFlowBJob.includes("'flow-b.callback'")) {
  updatedFlowBJob = updatedFlowBJob.replace(
    'defineJobHandler((context) => {',
    'defineJobHandler(async (context) => {',
  );
  const marker = '  return createSuccessResult({';
  const markerIndex = updatedFlowBJob.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('generated Flow-B callback job completion marker was not found');
  }
  updatedFlowBJob = updatedFlowBJob.slice(0, markerIndex) + callbackBody + '\n\n' +
    updatedFlowBJob.slice(markerIndex);
}
await Deno.writeTextFile(flowBJobPath, updatedFlowBJob);

const registerBackgroundPath = `${projectRoot}/aspire/.helpers/register-background.mts`;
const registerBackground = await Deno.readTextFile(registerBackgroundPath);
const workersBackgroundMarker = '  // --- workers ---';
const workersBackgroundIndex = registerBackground.indexOf(workersBackgroundMarker);
const nextBackgroundIndex = registerBackground.indexOf(
  '  // --- ',
  workersBackgroundIndex + workersBackgroundMarker.length,
);
if (workersBackgroundIndex < 0 || nextBackgroundIndex < 0) {
  throw new Error('generated register-background.mts did not contain the workers resource block');
}
const workersBackgroundBlock = registerBackground.slice(
  workersBackgroundIndex,
  nextBackgroundIndex,
);
const usersReference = [
  '    {',
  "      const usersEndpoint = await services.get('users')?.getEndpoint('http');",
  '      if (usersEndpoint) {',
  "        await workers.withEnvironment('services__users__http__0', usersEndpoint);",
  '      }',
  '    }',
].join('\n');
const configuredBackgroundBlock = workersBackgroundBlock.includes(
    'services__users__http__0',
  )
  ? workersBackgroundBlock
  : workersBackgroundBlock.replace(
    "    backgroundProcessors.set('workers', workers);",
    `${usersReference}\n\n    backgroundProcessors.set('workers', workers);`,
  );
if (!configuredBackgroundBlock.includes('services__users__http__0')) {
  throw new Error('workers resource did not contain its expected registration marker');
}
await Deno.writeTextFile(
  registerBackgroundPath,
  registerBackground.slice(0, workersBackgroundIndex) + configuredBackgroundBlock +
    registerBackground.slice(nextBackgroundIndex),
);

const triggerPath = `${projectRoot}/triggers/generic-inbound-webhook.ts`;
const triggerSource = await Deno.readTextFile(triggerPath);
const updatedTriggerSource = triggerSource.replaceAll(
  'workers-plugin-health-check',
  flowBJobId,
).replaceAll('Workers Health Check', 'Flow-B Callback');
if (updatedTriggerSource === triggerSource && !triggerSource.includes(`id: '${flowBJobId}'`)) {
  throw new Error('generated trigger did not reference the Flow-B callback job');
}
await Deno.writeTextFile(triggerPath, updatedTriggerSource);

const registryPath = `${projectRoot}/.netscript/generated/plugin-workers/job-registry.ts`;
const registrySource = await Deno.readTextFile(registryPath);
const flowBEntrypoint = `./${flowBJobId}.ts`;
const quotedEntrypoints = [JSON.stringify(flowBEntrypoint), `'${flowBEntrypoint}'`];
const flowBDefinitionLine = registrySource.split('\n').find((line) =>
  line.includes('createLocalJobDefinition(') &&
  quotedEntrypoints.some((entrypoint) => line.includes(entrypoint))
);
if (!flowBDefinitionLine) {
  throw new Error('generated workers registry did not contain the Flow-B callback job');
}
const configuredDefinitionLine = flowBDefinitionLine.replace(
  'createLocalJobDefinition(',
  'createFlowBJobDefinition(',
);
const configuredRegistrySource = registrySource.replace(
  flowBDefinitionLine,
  configuredDefinitionLine,
) + [
  '',
  'function createFlowBJobDefinition(id: string, entrypoint: string): RegisterJobInput {',
  '  return {',
  '    ...createLocalJobDefinition(id, entrypoint),',
  '    importMapUrl: new URL("../../e2e/flow-b-import-map.json", import.meta.url).href,',
  '    permissions: { net: true, read: true, env: true },',
  '    tags: ["flow-b", "e2e"],',
  '  };',
  '}',
  '',
].join('\n');
await Deno.writeTextFile(registryPath, configuredRegistrySource);

console.info('Flow-B generated callback fixture wired');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function runDeno(args: readonly string[], cwd: string, label: string): Promise<void> {
  const result = await new Deno.Command('deno', { args: [...args], cwd }).output();
  if (result.success) return;
  const stderr = new TextDecoder().decode(result.stderr).trim();
  throw new Error(`${label} failed: ${stderr}`);
}

// Pre-warm the flow-b module graph before Aspire launches workers-api: the
// flow-b config introduces pins absent from the project's default graph (fresh
// jsr pins in published mode, local source files otherwise). Cold resolution at
// service start can exceed the health-probe window even though the executable
// is 'running'. The generated launch args already carry
// --minimum-dependency-age=0 in published mode; mirror it here.
const servicesEntrypoint = mode === 'published'
  ? `jsr:@netscript/plugin-workers@${publishedVersion}/services`
  : '@netscript/plugin-workers/services';
// `deno cache` treats bare CLI arguments as file paths, so warm through a
// generated entrypoint module whose import resolves via the flow-b config.
const warmupEntrypoint = `${projectRoot}/.netscript/e2e/flow-b-warmup.ts`;
await Deno.writeTextFile(
  warmupEntrypoint,
  `import ${JSON.stringify(servicesEntrypoint)};\n`,
);
const warm = await new Deno.Command('deno', {
  args: [
    'cache',
    '--minimum-dependency-age=0',
    '--config',
    flowBConfigPath,
    warmupEntrypoint,
  ],
  cwd: projectRoot,
}).output();
if (!warm.success) {
  throw new Error(
    `flow-b graph pre-warm failed: ${new TextDecoder().decode(warm.stderr).slice(-1200)}`,
  );
}
console.info('flow-b module graph pre-warmed');
