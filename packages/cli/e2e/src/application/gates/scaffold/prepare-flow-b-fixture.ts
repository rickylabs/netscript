const projectRoot = Deno.args[0];
if (!projectRoot) {
  throw new Error('project root argument is required');
}

const healthJobPath = `${projectRoot}/workers/jobs/health-check.ts`;
const sourceRoot = (await Deno.readTextFile(`${projectRoot}/.netscript-source-root`)).trim();
if (!sourceRoot) throw new Error('generated project did not record its local source root');

const denoConfigPath = `${projectRoot}/deno.json`;
const denoConfig = JSON.parse(await Deno.readTextFile(denoConfigPath));
if (!isRecord(denoConfig) || !isRecord(denoConfig.imports)) {
  throw new Error('generated deno.json did not contain imports');
}
denoConfig.imports['@netscript/sdk/client'] = `${sourceRoot}/packages/sdk/src/client/mod.ts`;
await Deno.writeTextFile(denoConfigPath, `${JSON.stringify(denoConfig, null, 2)}\n`);

const healthJob = await Deno.readTextFile(healthJobPath);
const callbackImports = [
  "import { workersContractV1 } from '@netscript/plugin-workers-core/contracts/v1';",
  "import { createServiceClient } from '@netscript/sdk/client';",
].join('\n');
const callbackBody = [
  '  const channelClient = createServiceClient({',
  '    contract: workersContractV1,',
  "    serviceName: 'workers-api',",
  "    routerName: 'workers',",
  '  });',
  '  await channelClient.listExecutions({ limit: 1, offset: 0 });',
].join('\n');

let updatedHealthJob = healthJob;
if (!updatedHealthJob.includes("from '@netscript/sdk/client'")) {
  updatedHealthJob = `${callbackImports}\n${updatedHealthJob}`;
}
if (!updatedHealthJob.includes('await channelClient.listExecutions')) {
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

console.info('Flow-B generated callback fixture wired');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
