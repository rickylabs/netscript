import { configurePublishedWorkersBlock } from './configure-published-workers-block.ts';
import {
  locateWorkersBackgroundBlock,
  locateWorkersResourceBlock,
} from './locate-workers-resource-block.ts';
import { prepareLocalSourceFixture } from './local-source-fixture.ts';

const projectRoot = Deno.args[0];
if (!projectRoot) {
  throw new Error('project root argument is required');
}

const mode = Deno.args[1] === 'published' ? 'published' : 'local';
const cliEntrypoint = Deno.args[2];
if (!cliEntrypoint) {
  throw new Error('CLI entrypoint argument is required');
}
const flowBJobId = 'flow-b-callback';
const flowBJobPath = `${projectRoot}/workers/jobs/${flowBJobId}.ts`;
const flowBSagaId = 'flow-b-compensation';
const flowBSagaPath = `${projectRoot}/sagas/${flowBSagaId}-saga.ts`;

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
  '@netscript/plugin-sagas/runtime': `jsr:@netscript/plugin-sagas@${publishedVersion}/runtime`,
  '@netscript/plugin-sagas-core': `jsr:@netscript/plugin-sagas-core@${publishedVersion}`,
  '@netscript/plugin-sagas-core/config':
    `jsr:@netscript/plugin-sagas-core@${publishedVersion}/config`,
  '@netscript/plugin-sagas-core/domain':
    `jsr:@netscript/plugin-sagas-core@${publishedVersion}/domain`,
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
  ['@netscript/plugin-sagas/runtime', 'plugins/sagas/src/runtime/mod.ts'],
  ['@netscript/plugin-sagas-core', 'packages/plugin-sagas-core/mod.ts'],
  ['@netscript/plugin-sagas-core/config', 'packages/plugin-sagas-core/config.ts'],
  ['@netscript/plugin-sagas-core/domain', 'packages/plugin-sagas-core/src/domain/mod.ts'],
  [
    '@netscript/plugin-sagas-core/integration/publisher',
    'packages/plugin-sagas-core/src/integration/publisher/mod.ts',
  ],
  ['@netscript/plugin-sagas-core/runtime', 'packages/plugin-sagas-core/src/runtime/mod.ts'],
  ['@netscript/plugin-sagas-core/stores', 'packages/plugin-sagas-core/src/stores/mod.ts'],
  ['@netscript/plugin-sagas-core/telemetry', 'packages/plugin-sagas-core/src/telemetry/mod.ts'],
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
await Deno.mkdir(`${projectRoot}/.netscript/e2e`, { recursive: true });
if (mode === 'local') {
  await prepareLocalSourceFixture({
    projectRoot,
    sourceBase: sourceRoot,
    packages: localSourcePackages,
    imports: sharedNpmImports,
    targets: [
      { path: 'deno.json', includeConfig: true },
      { path: '.netscript-flow-b-deno.json', includeConfig: true },
    ],
  });
} else {
  const flowBImports = { ...denoConfig.imports, ...sharedNpmImports, ...publishedImports };
  const flowBConfig = { ...denoConfig, imports: flowBImports };
  await Deno.writeTextFile(
    flowBConfigPath,
    `${JSON.stringify(flowBConfig, null, 2)}\n`,
  );
  await Deno.writeTextFile(
    denoConfigPath,
    `${JSON.stringify(flowBConfig, null, 2)}\n`,
  );
}

// #1837 renamed the per-plugin block comment from the resource name to a positional ordinal
// (`// --- workers-api ---` became `// --- plugin 3 ---`), silently breaking every consumer keyed
// on the name. Keying on the ordinal instead would be worse: it shifts with plugin order, so a
// stale consumer selects the *wrong* block rather than failing. Locate the block from the
// generated code that names the resource, so it is independent of comment formatting entirely.
const workersRange = locateWorkersResourceBlock(registerPlugins);
const workersIndex = workersRange.start;
const nextResourceIndex = workersRange.end;
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
const sagasCli = mode === 'published'
  ? `jsr:@netscript/plugin-sagas@${publishedVersion}/cli`
  : `${sourceRoot}/plugins/sagas/src/cli/mod.ts`;
await runDeno(
  [
    'run',
    '-A',
    '--minimum-dependency-age=0',
    sagasCli,
    'add',
    'saga',
    flowBSagaId,
    '--message-type=FlowBCompensationRequested',
  ],
  projectRoot,
  'sagas add saga',
);
await Deno.writeTextFile(
  flowBSagaPath,
  `import { defineSaga, sagaCompensate } from '@netscript/plugin-sagas-core';
import type {
  SagaCorrelationKey,
  SagaDefinition,
  SagaMessage,
} from '@netscript/plugin-sagas-core/domain';

type FlowBCompensationPayload = Readonly<{ correlationId: string }>;
type FlowBCompensationState = Readonly<{ compensated: boolean }>;

function correlateFlowB(message: SagaMessage): SagaCorrelationKey | undefined {
  const payload = message.payload;
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return undefined;
  const correlationId = payload.correlationId;
  return typeof correlationId === 'string' && correlationId.length > 0
    ? correlationId as SagaCorrelationKey
    : undefined;
}

export const flowBCompensationSaga = defineSaga('${flowBSagaId}')
  .state<FlowBCompensationState>({ compensated: false })
  .correlate(correlateFlowB)
  .on<'FlowBCompensationRequested', FlowBCompensationPayload>(
    'FlowBCompensationRequested',
    (_saga, message) => [
      sagaCompensate({
        type: 'FlowBCompensationUndo',
        payload: { correlationId: message.payload.correlationId },
      }, 'Flow-B telemetry proof'),
    ],
  )
  .compensate<'FlowBCompensationUndo', FlowBCompensationPayload>(
    'FlowBCompensationUndo',
    (saga) => {
      saga.state = { compensated: true };
      return [];
    },
  )
  .build() as SagaDefinition;

export default flowBCompensationSaga;
`,
);
const flowBJob = await Deno.readTextFile(flowBJobPath);
const callbackImports = [
  "import { UsersV1 } from '../../contracts/versions/v1/users.contract.ts';",
  "import { createServiceClient } from '@netscript/sdk/client';",
  "import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';",
  "import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';",
  "import { getTraceContext } from '@netscript/telemetry/context';",
  "import { getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';",
];
const callbackBody = [
  '  const flowBCorrelationId = context.correlationId ?? context.id;',
  "  await Deno.writeTextFile('.netscript/e2e/flow-b-correlation-id', flowBCorrelationId);",
  '  const channelClient = createServiceClient({',
  '    contract: UsersV1,',
  "    serviceName: 'users',",
  "    routerName: 'users',",
  '  });',
  "  await withSpan(getTracer('@netscript/e2e-flow-b'), 'flow-b.callback', async () => {",
  '    await channelClient.health.check();',
  '    const traceContext = getTraceContext();',
  '    const correlationKey = flowBCorrelationId as SagaCorrelationKey;',
  '    const publish = await createSagaPublisher().publish({',
  "      type: 'FlowBCompensationRequested',",
  '      payload: { correlationId: flowBCorrelationId },',
  '      correlationKey,',
  '    }, {',
  '      correlationKey,',
  '      traceparent: traceContext?.traceparent,',
  '      tracestate: traceContext?.tracestate,',
  '    });',
  '    if (!publish.published) throw new Error(`Flow-B saga publish failed: ${publish.reason}`);',
  '  }, {',
  '    kind: SpanKind.CLIENT,',
  '    attributes: {',
  "      'netscript.correlation.id': flowBCorrelationId,",
  "      'netscript.flow_b.outcome': 'success',",
  '    },',
  '  });',
].join('\n');

let updatedFlowBJob = flowBJob;
const missingCallbackImports = callbackImports.filter((statement) =>
  !updatedFlowBJob.includes(statement)
);
if (missingCallbackImports.length > 0) {
  updatedFlowBJob = `${missingCallbackImports.join('\n')}\n${updatedFlowBJob}`;
}
if (!updatedFlowBJob.includes("'flow-b.callback'")) {
  const handlerMarker = '  (context) => {';
  if (!updatedFlowBJob.includes(handlerMarker)) {
    throw new Error('generated Flow-B callback job handler marker was not found');
  }
  updatedFlowBJob = updatedFlowBJob.replace(
    handlerMarker,
    '  async (context) => {',
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
const workersBackgroundRange = locateWorkersBackgroundBlock(registerBackground);
// The locator anchors the block on `const <id> = builder.addExecutable('workers', ...)`, but the
// generator emits the processor's `if (config.BackgroundProcessors[...])` guard *before* that line.
// Slicing from the locator's start therefore excludes the guard, and every downstream edit here
// operates on the sliced block. Anchor the start on the processor's own config line instead — it is
// as unique per processor as the locator's anchor, and needs no comment-marker heuristic.
const workersConfigPattern =
  /^ {2}if \(config\.BackgroundProcessors\[(["'])workers\1\]\?\.Enabled !== false\) \{/m;
const workersConfigMatch = workersConfigPattern.exec(registerBackground);
if (!workersConfigMatch) {
  throw new Error('generated workers resource block did not contain its config lookup');
}
const workersBackgroundIndex = Math.min(workersConfigMatch.index, workersBackgroundRange.start);
const nextBackgroundIndex = workersBackgroundRange.end;
const workersBackgroundBlock = registerBackground.slice(
  workersBackgroundIndex,
  nextBackgroundIndex,
);
// #1865's locateWorkersBackgroundBlock locates the block but returns only a SourceRange, so the
// binding identifier still has to be extracted from within it. Quote-agnostic on purpose: the
// generator emits JSON.stringify'd names after this slice's source-safety change.
const workersExecutablePattern =
  /const ([A-Za-z_$][\w$]*) = builder\.addExecutable\((["'])workers\2,/;
const workersExecutableMatch = workersExecutablePattern.exec(workersBackgroundBlock);
if (!workersExecutableMatch) {
  throw new Error('generated register-background.mts did not contain the workers resource block');
}
const workersBinding = workersExecutableMatch[1];
if (!workersBinding) {
  throw new Error('generated workers resource block did not expose its processor binding');
}
const workersSetAnchor = new RegExp(
  `    backgroundProcessors\\.set\\((["'])workers\\1, ${workersBinding}\\);`,
).exec(workersBackgroundBlock)?.[0];
const workersSetIndex = workersSetAnchor
  ? workersBackgroundBlock.indexOf(workersSetAnchor, workersExecutableMatch.index)
  : -1;
if (!workersSetAnchor || workersSetIndex < 0) {
  throw new Error('generated workers resource block did not contain its registration marker');
}
// #1865 narrowed the located range to end exactly at the registration statement
// (`end = registration.index + registration[0].length`), so the enclosing
// `if (config.BackgroundProcessors[...])` brace now sits *after* the slice, and scanning for it
// inside `workersBackgroundBlock` can never succeed. Scan the full source from the range end,
// where the brace actually is. `workersSetIndex` above still proves the registration marker is
// inside the slice this function rewrites.
if (registerBackground.indexOf('\n  }', nextBackgroundIndex) < 0) {
  throw new Error('generated workers resource block did not contain its closing brace');
}
const usersReference = [
  '    {',
  "      const usersEndpoint = await _services.get('users')?.getEndpoint('http');",
  '      if (usersEndpoint) {',
  `        await ${workersBinding}.withEnvironment('services__users__http__0', usersEndpoint);`,
  '      }',
  '    }',
].join('\n');
const sagasReference = [
  '    {',
  "      const sagasEndpoint = await _plugins.get('sagas-api')?.getEndpoint('http');",
  '      if (sagasEndpoint) {',
  `        await ${workersBinding}.withEnvironment('services__sagas-api__http__0', sagasEndpoint);`,
  '      }',
  '    }',
].join('\n');
const missingBackgroundReferences = [
  workersBackgroundBlock.includes('services__users__http__0') ? undefined : usersReference,
  workersBackgroundBlock.includes('services__sagas-api__http__0') ? undefined : sagasReference,
].filter((reference): reference is string => reference !== undefined);
const configuredBackgroundBlock = missingBackgroundReferences.length === 0
  ? workersBackgroundBlock
  : workersBackgroundBlock.replace(
    workersSetAnchor,
    `${missingBackgroundReferences.join('\n\n')}\n\n${workersSetAnchor}`,
  );
if (
  !configuredBackgroundBlock.includes('services__users__http__0') ||
  !configuredBackgroundBlock.includes('services__sagas-api__http__0')
) {
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

await runDeno(
  [
    'run',
    '-A',
    ...(mode === 'published' ? ['--minimum-dependency-age=0'] : []),
    cliEntrypoint,
    'generate',
    'plugins',
    '--project-root',
    projectRoot,
  ],
  projectRoot,
  'netscript generate plugins',
);

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
