import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../../../src/kernel/application/registries/template-registry.ts';
import { generateRegisterApps } from '../../../../../../src/kernel/templates/aspire/helpers/register/generate-register-apps.ts';

const projectRoot = Deno.args[0];
if (!projectRoot) throw new Error('project root argument is required');

const fixtureDir = `${projectRoot}/.netscript/e2e/readiness-dead-port`;
await Deno.mkdir(fixtureDir, { recursive: true });
await Deno.writeTextFile(
  `${fixtureDir}/main.ts`,
  '// Deliberately stays alive without binding the advertised endpoint.\nawait new Promise(() => {});\n',
);
await Deno.writeTextFile(
  `${fixtureDir}/deno.json`,
  `${JSON.stringify({ tasks: { start: 'deno run main.ts' } }, null, 2)}\n`,
);

const registerAppsPath = `${projectRoot}/aspire/.helpers/register-apps.mts`;
const source = await Deno.readTextFile(registerAppsPath);
const returnMarker = '  return apps;';
if (!source.includes(returnMarker)) {
  throw new Error('generated register-apps helper has no return marker');
}
await DEFAULT_TEMPLATE_REGISTRY.hydrate();
const generatedFixture = generateRegisterApps({
  apps: {
    'readiness-dead-port': {
      Enabled: true,
      Runtime: 'deno',
      Type: 'task',
      Workdir: '.netscript/e2e/readiness-dead-port',
      TaskName: 'start',
      Port: 18997,
      WatchMode: false,
      RequiresKv: false,
    },
  },
  version: 'e2e',
  denoDefaults: { Permissions: [], WatchMode: false },
});
const blockStart = generatedFixture.indexOf('  // --- readiness-dead-port (task) ---');
const blockEnd = generatedFixture.indexOf(returnMarker, blockStart);
if (blockStart < 0 || blockEnd < 0) {
  throw new Error('generator did not emit readiness fixture block');
}
const fixtureBlock = generatedFixture.slice(blockStart, blockEnd);
if (source.includes("apps.set('readiness-dead-port'")) {
  throw new Error('readiness fixture was already registered');
}
await Deno.writeTextFile(
  registerAppsPath,
  source.replace(returnMarker, fixtureBlock + returnMarker),
);
