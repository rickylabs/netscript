const projectRoot = Deno.args[0];
if (!projectRoot) {
  throw new Error('project root argument is required');
}

const mode = Deno.args[1] === 'published' ? 'published' : 'local';
const healthJobPath = `${projectRoot}/workers/jobs/health-check.ts`;

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
const localSourceImports = {
  '@netscript/plugin-workers-core/contracts/v1':
    `${sourceRoot}/packages/plugin-workers-core/src/contracts/v1/mod.ts`,
  '@netscript/plugin-workers/services': `${sourceRoot}/plugins/workers/services/src/main.ts`,
  '@netscript/sdk/client': `${sourceRoot}/packages/sdk/src/client/mod.ts`,
  '@netscript/telemetry': `${sourceRoot}/packages/telemetry/mod.ts`,
  '@netscript/telemetry/attributes': `${sourceRoot}/packages/telemetry/attributes.ts`,
  '@netscript/telemetry/config': `${sourceRoot}/packages/telemetry/config.ts`,
  '@netscript/telemetry/context': `${sourceRoot}/packages/telemetry/context.ts`,
  '@netscript/telemetry/hono': `${sourceRoot}/packages/telemetry/hono.ts`,
  '@netscript/telemetry/instrumentation': `${sourceRoot}/packages/telemetry/instrumentation.ts`,
  '@netscript/telemetry/orpc': `${sourceRoot}/packages/telemetry/orpc.ts`,
  '@netscript/telemetry/otel': `${sourceRoot}/packages/telemetry/src/adapters/otel/mod.ts`,
  '@netscript/telemetry/query': `${sourceRoot}/packages/telemetry/query.ts`,
  '@netscript/telemetry/registry': `${sourceRoot}/packages/telemetry/registry.ts`,
  '@netscript/telemetry/testing': `${sourceRoot}/packages/telemetry/src/testing/mod.ts`,
  '@netscript/telemetry/tracer': `${sourceRoot}/packages/telemetry/tracer.ts`,
};
const flowBImports = {
  ...denoConfig.imports,
  ...sharedNpmImports,
  ...(mode === 'published' ? publishedImports : localSourceImports),
};
const flowBConfigPath = `${projectRoot}/.netscript-flow-b-deno.json`;
const flowBImportMapPath = `${projectRoot}/.netscript/e2e/flow-b-import-map.json`;
await Deno.mkdir(`${projectRoot}/.netscript/e2e`, { recursive: true });
await Deno.writeTextFile(
  flowBConfigPath,
  `${JSON.stringify({ ...denoConfig, imports: flowBImports }, null, 2)}\n`,
);
await Deno.writeTextFile(
  flowBImportMapPath,
  `${JSON.stringify({ imports: flowBImports }, null, 2)}\n`,
);

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
const flowBRunPrefix = mode === 'published'
  ? "['run', '--minimum-dependency-age=0', '--config', '.netscript-flow-b-deno.json',"
  : "['run', '--config', '.netscript-flow-b-deno.json',";
let configuredWorkersBlock = workersBlock.replace(
  "['run', '--config', 'deno.json',",
  flowBRunPrefix,
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

const healthJob = await Deno.readTextFile(healthJobPath);
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
  "  await withSpan(getTracer('@netscript/e2e-flow-b'), 'flow-b.callback', async (span) => {",
  '    await channelClient.health.check();',
  "    span.setAttribute('netscript.flow_b.outcome', 'success');",
  '  }, {',
  '    kind: SpanKind.CLIENT,',
  "    attributes: { 'netscript.correlation.id': context.correlationId ?? context.id },",
  '  });',
].join('\n');

let updatedHealthJob = healthJob;
updatedHealthJob = updatedHealthJob
  .replace('  const flowBCorrelationId = context.correlationId ?? context.id;\n', '')
  .replace(
    "  await Deno.writeTextFile('.netscript/e2e/flow-b-correlation-id', flowBCorrelationId);\n",
    '',
  )
  .replace(
    "attributes: { 'netscript.correlation.id': flowBCorrelationId }",
    "attributes: { 'netscript.correlation.id': context.correlationId ?? context.id }",
  );
if (!updatedHealthJob.includes("from '@netscript/sdk/client'")) {
  updatedHealthJob = `${callbackImports}\n${updatedHealthJob}`;
}
if (!updatedHealthJob.includes("'flow-b.callback'")) {
  updatedHealthJob = updatedHealthJob.replace(
    'defineJobHandler((context) => {',
    'defineJobHandler(async (context) => {',
  );
  const marker = '  return createSuccessResult({';
  const markerIndex = updatedHealthJob.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('generated workers health job completion marker was not found');
  }
  updatedHealthJob = updatedHealthJob.slice(0, markerIndex) + callbackBody + '\n\n' +
    updatedHealthJob.slice(markerIndex);
}
await Deno.writeTextFile(healthJobPath, updatedHealthJob);

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
  'health-check',
).replaceAll('Workers Health Check', 'Flow-B Health Check');
if (updatedTriggerSource === triggerSource && !triggerSource.includes("id: 'health-check'")) {
  throw new Error('generated trigger did not reference workers-plugin-health-check');
}
await Deno.writeTextFile(triggerPath, updatedTriggerSource);

const registryPath = `${projectRoot}/.netscript/generated/plugin-workers/job-registry.ts`;
await Deno.mkdir(`${projectRoot}/.netscript/generated/plugin-workers`, { recursive: true });
await Deno.writeTextFile(
  registryPath,
  [
    "import type { RegisterJobInput, StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';",
    "import { healthCheckJob } from '../../../workers/jobs/health-check.ts';",
    '',
    'const definition = {',
    "  id: 'health-check',",
    "  name: 'Flow-B Health Check',",
    "  entrypoint: './workers/jobs/health-check.ts',",
    "  topic: 'default',",
    "  source: 'local',",
    "  executionType: 'deno',",
    "  timezone: 'UTC',",
    '  timeout: 300000,',
    '  maxRetries: 1,',
    '  retryDelay: 1000,',
    '  maxConcurrency: 1,',
    '  priority: 50,',
    '  enabled: true,',
    '  persist: true,',
    "  tags: ['flow-b', 'e2e'],",
    '  importMapUrl: new URL("../../e2e/flow-b-import-map.json", import.meta.url).href,',
    '  permissions: { net: true, read: true, env: true },',
    '} satisfies RegisterJobInput;',
    '',
    "export const jobRegistry: StaticJobRegistry = new Map([['health-check', healthCheckJob]]);",
    'export const registry = jobRegistry;',
    "export const jobDefinitions = new Map<string, RegisterJobInput>([['health-check', definition]]);",
    'export const definitions = jobDefinitions;',
    '',
  ].join('\n'),
);

console.info('Flow-B generated callback fixture wired');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
