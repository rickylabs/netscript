import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../../../src/kernel/application/registries/template-registry.ts';
import { generateRegisterApps } from '../../../../../../src/kernel/templates/aspire/helpers/register/generate-register-apps.ts';
import { generateRegisterInfrastructure } from '../../../../../../src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';
import {
  GARNET_TEST_LISTENER_PORT,
  LISTENER_FAULT_ACK_FILE,
  LISTENER_FAULT_CONTROLLER_DIR,
  LISTENER_FAULT_STATE_FILE,
  POSTGRES_TEST_LISTENER_PORT,
  TEST_ONLY_GARNET_HEALTH_KEY,
  TEST_ONLY_POSTGRES_HEALTH_KEY,
} from './listener-fault-controller.ts';
import { DATABASE, type DatabaseEngine } from '../../../../domain/extension-axes.ts';
import {
  listenerFaultExpectations,
  parseListenerFaultDatabase,
} from './listener-readiness-gates.ts';

export { TEST_ONLY_GARNET_HEALTH_KEY, TEST_ONLY_POSTGRES_HEALTH_KEY };

const RETURN_APPS_MARKER = '  return apps;';
const POSTGRES_REAL_HEALTH_KEY = 'postgres_listener';
const GARNET_REAL_HEALTH_KEY = 'garnet_resp';

/** Prepare the dead-port app and D-101 synthetic listener controller before Aspire starts. */
export async function prepareReadinessFixture(
  projectRoot: string,
  database: DatabaseEngine,
): Promise<void> {
  await writeDeadPortFixture(projectRoot);
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();

  const registerInfrastructurePath = `${projectRoot}/aspire/.helpers/register-infrastructure.mts`;
  const registerInfrastructure = await Deno.readTextFile(registerInfrastructurePath);
  await writeControllerFixture(projectRoot);

  const registerAppsPath = `${projectRoot}/aspire/.helpers/register-apps.mts`;
  const registerApps = await Deno.readTextFile(registerAppsPath);
  await Deno.writeTextFile(registerAppsPath, injectReadinessFixtureApps(registerApps));

  await Deno.writeTextFile(
    registerInfrastructurePath,
    injectListenerFaultHealthChecks(registerInfrastructure, database),
  );
}

/** Attach the two test-only checks at markers derived from the real infrastructure generator. */
export function injectListenerFaultHealthChecks(
  source: string,
  database: DatabaseEngine = DATABASE.POSTGRES,
): string {
  if (
    source.includes(TEST_ONLY_POSTGRES_HEALTH_KEY) ||
    source.includes(TEST_ONLY_GARNET_HEALTH_KEY)
  ) {
    throw new Error('test-only listener health checks were already registered');
  }

  const reference = listenerInfrastructureReference();
  const postgresMarker = healthAttachmentMarker(reference, POSTGRES_REAL_HEALTH_KEY);
  const garnetMarker = healthAttachmentMarker(reference, GARNET_REAL_HEALTH_KEY);
  if (!source.includes(garnetMarker)) {
    throw new Error('generated register-infrastructure helper has no garnet health-check marker');
  }
  const includePostgres = listenerFaultExpectations(database).some((expectation) =>
    expectation.controllerListener === 'postgres'
  );
  if (includePostgres && !source.includes(postgresMarker)) {
    throw new Error('generated register-infrastructure helper has no postgres health-check marker');
  }

  const postgresBlock = `${postgresMarker}
  builder.addHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}', createListenerReadinessCheck({ kind: 'tcp', host: 'localhost', port: ${POSTGRES_TEST_LISTENER_PORT} }));
  await postgres_server.withHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}');`;
  const garnetBlock = `${garnetMarker}
  builder.addHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}', createRespPingCheck({ host: 'localhost', port: ${GARNET_TEST_LISTENER_PORT} }));
  await garnet.withHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}');`;

  const withPostgres = includePostgres ? source.replace(postgresMarker, postgresBlock) : source;
  return withPostgres.replace(garnetMarker, garnetBlock);
}

/** Inject the existing dead-port app plus the Aspire-managed listener controller task. */
export function injectReadinessFixtureApps(
  source: string,
  includeListenerFaultController = true,
): string {
  if (!source.includes(RETURN_APPS_MARKER)) {
    throw new Error('generated register-apps helper has no return marker');
  }

  const generated = generateRegisterApps({
    apps: {
      'readiness-dead-port': {
        Enabled: true,
        Runtime: 'deno',
        Type: 'task',
        Workdir: '.netscript/e2e/readiness-dead-port',
        TaskName: 'start',
        Port: 18_997,
        WatchMode: false,
        RequiresKv: false,
      },
      'listener-fault-controller': {
        Enabled: true,
        Runtime: 'deno',
        Type: 'task',
        Workdir: LISTENER_FAULT_CONTROLLER_DIR,
        TaskName: 'start',
        WatchMode: false,
        RequiresKv: false,
      },
    },
    version: 'e2e',
    denoDefaults: { Permissions: [], WatchMode: false },
  });

  let injected = source;
  const fixtureNames = includeListenerFaultController
    ? ['readiness-dead-port', 'listener-fault-controller']
    : ['readiness-dead-port'];
  for (const name of fixtureNames) {
    if (injected.includes(`apps.set('${name}'`)) {
      throw new Error(`${name} fixture was already registered`);
    }
    injected = injected.replace(RETURN_APPS_MARKER, appBlock(generated, name) + RETURN_APPS_MARKER);
  }
  return injected;
}

function listenerInfrastructureReference(): string {
  return generateRegisterInfrastructure({
    databases: {
      postgres: {
        Enabled: true,
        Engine: 'Postgres',
        Mode: 'Container',
        Persistent: false,
      },
    },
    caches: {
      garnet: {
        Enabled: true,
        Engine: 'Garnet',
        Mode: 'Container',
      },
    },
    primaryDatabase: 'postgres',
    primaryCache: 'garnet',
  });
}

function healthAttachmentMarker(source: string, key: string): string {
  const marker = source.split('\n').find((line) =>
    line.trimStart().startsWith('await ') && line.includes(`.withHealthCheck('${key}');`)
  );
  if (!marker) throw new Error(`infrastructure generator omitted ${key} attachment marker`);
  return marker;
}

function appBlock(generated: string, name: string): string {
  const startMarker = `  // --- ${name} (task) ---`;
  const blockStart = generated.indexOf(startMarker);
  const nextBlock = generated.indexOf('\n\n  // --- ', blockStart + startMarker.length);
  const returnIndex = generated.indexOf(RETURN_APPS_MARKER, blockStart);
  const blockEnd = nextBlock >= 0 && nextBlock < returnIndex ? nextBlock + 2 : returnIndex;
  if (blockStart < 0 || blockEnd < 0) {
    throw new Error(`generator did not emit ${name} fixture block`);
  }
  return generated.slice(blockStart, blockEnd);
}

async function writeControllerFixture(projectRoot: string): Promise<void> {
  const fixtureDir = `${projectRoot}/${LISTENER_FAULT_CONTROLLER_DIR}`;
  await Deno.mkdir(fixtureDir, { recursive: true });
  const controllerSource = await Deno.readTextFile(
    new URL('./listener-fault-controller.ts', import.meta.url),
  );
  await Deno.writeTextFile(`${fixtureDir}/main.ts`, controllerSource);
  await Deno.writeTextFile(
    `${fixtureDir}/deno.json`,
    `${
      JSON.stringify(
        {
          tasks: { start: 'deno run --allow-net --allow-read --allow-write main.ts' },
        },
        null,
        2,
      )
    }\n`,
  );
  await Deno.writeTextFile(
    `${projectRoot}/${LISTENER_FAULT_STATE_FILE}`,
    `${JSON.stringify({ revision: 0, postgresOpen: true, garnetOpen: true }, null, 2)}\n`,
  );
  try {
    await Deno.remove(`${projectRoot}/${LISTENER_FAULT_ACK_FILE}`);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

async function writeDeadPortFixture(projectRoot: string): Promise<void> {
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
}

if (import.meta.main) {
  const projectRoot = Deno.args[0];
  const database = Deno.args[1];
  if (!projectRoot) throw new Error('project root argument is required');
  if (!database) throw new Error('database argument is required');
  await prepareReadinessFixture(projectRoot, parseListenerFaultDatabase(database));
}
