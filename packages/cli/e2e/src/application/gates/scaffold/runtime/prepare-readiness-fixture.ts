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
const FIXTURE_APP_IDENTIFIER_PREFIX = 'readiness_fixture_';
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

/** Attach the two test-only checks at boundaries derived from the real infrastructure generator. */
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
  assertGeneratedHealthAttachment(reference, GARNET_REAL_HEALTH_KEY);
  const garnetAttachments = healthAttachments(source, GARNET_REAL_HEALTH_KEY);
  if (garnetAttachments.length === 0) {
    throw new Error(
      'generated register-infrastructure helper has no garnet health-check attachment',
    );
  }
  const includePostgres = listenerFaultExpectations(database).some((expectation) =>
    expectation.controllerListener === 'postgres'
  );
  let withPostgres = source;
  if (includePostgres) {
    assertGeneratedHealthAttachment(reference, POSTGRES_REAL_HEALTH_KEY);
    const postgresAttachments = healthAttachments(source, POSTGRES_REAL_HEALTH_KEY);
    if (postgresAttachments.length === 0) {
      throw new Error(
        'generated register-infrastructure helper has no postgres health-check attachment',
      );
    }
    withPostgres = injectAtHealthAttachments(
      source,
      postgresAttachments,
      (attachment, indentation) =>
        `${indentation}builder.addHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}', createEndpointListenerReadinessCheck({ kind: 'tcp', endpoint: () => Promise.resolve({ host: () => Promise.resolve('localhost'), port: () => Promise.resolve(${POSTGRES_TEST_LISTENER_PORT}) }) }));
${indentation}await ${attachment.resourceBinding}.withHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}');`,
    );
  }

  return injectAtHealthAttachments(
    withPostgres,
    healthAttachments(withPostgres, GARNET_REAL_HEALTH_KEY),
    (attachment, indentation) =>
      `${indentation}builder.addHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}', createRespPingCheck({ host: 'localhost', port: ${GARNET_TEST_LISTENER_PORT} }));
${indentation}await ${attachment.resourceBinding}.withHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}');`,
  );
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
    if (appRegistrations(injected, name).length > 0) {
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

interface HealthAttachment {
  readonly endOffset: number;
  readonly healthCheckKey: string;
  readonly resourceBinding: string;
  readonly startOffset: number;
  readonly statement: string;
}

const HEALTH_ATTACHMENT_PATTERN =
  /^[ \t]*await[ \t]+([A-Za-z_$][\w$]*)\.withHealthCheck\((?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')\);[ \t]*$/gm;

const APP_REGISTRATION_PATTERN =
  /^[ \t]*apps\.set\((?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'),[ \t]*([A-Za-z_$][\w$]*)\);[ \t]*$/gm;

function healthAttachments(source: string, key: string): readonly HealthAttachment[] {
  const attachments: HealthAttachment[] = [];
  for (const match of source.matchAll(HEALTH_ATTACHMENT_PATTERN)) {
    const healthCheckKey = match[2] ?? match[3];
    const resourceBinding = match[1];
    const startOffset = match.index;
    if (healthCheckKey === key && resourceBinding && startOffset !== undefined) {
      attachments.push({
        endOffset: startOffset + match[0].length,
        healthCheckKey,
        resourceBinding,
        startOffset,
        statement: match[0],
      });
    }
  }
  return attachments;
}

function assertGeneratedHealthAttachment(source: string, key: string): void {
  const attachments = healthAttachments(source, key);
  if (attachments.length === 0) {
    throw new Error(`infrastructure generator omitted ${key} attachment marker`);
  }
}

function injectAtHealthAttachments(
  source: string,
  attachments: readonly HealthAttachment[],
  injectedBlock: (attachment: HealthAttachment, indentation: string) => string,
): string {
  let injected = source;
  const descendingAttachments = [...attachments].sort((left, right) =>
    right.startOffset - left.startOffset
  );
  for (const attachment of descendingAttachments) {
    const indentation = attachment.statement.match(/^[ \t]*/u)?.[0] ?? '';
    injected = `${injected.slice(0, attachment.endOffset)}\n${
      injectedBlock(attachment, indentation)
    }${injected.slice(attachment.endOffset)}`;
  }
  return injected;
}

function appRegistrations(source: string, name: string): readonly RegExpMatchArray[] {
  return [...source.matchAll(APP_REGISTRATION_PATTERN)].filter((match) =>
    (match[1] ?? match[2]) === name
  );
}

function appBlock(generated: string, name: string): string {
  const registrations = appRegistrations(generated, name);
  if (registrations.length !== 1) {
    throw new Error(`generator did not emit ${name} fixture block`);
  }
  const registrationIndex = registrations[0].index;
  if (registrationIndex === undefined) {
    throw new Error(`generator did not emit ${name} fixture block`);
  }
  const blockStart = generated.lastIndexOf('  // --- app ', registrationIndex);
  const nextBlock = generated.indexOf('\n\n  // --- app ', registrationIndex);
  const returnIndex = generated.indexOf(RETURN_APPS_MARKER, blockStart);
  const blockEnd = nextBlock >= 0 && nextBlock < returnIndex ? nextBlock + 2 : returnIndex;
  if (blockStart < 0 || blockEnd < 0) {
    throw new Error(`generator did not emit ${name} fixture block`);
  }
  const block = generated.slice(blockStart, blockEnd);
  const generatedBinding = registrations[0][3];
  if (!generatedBinding) {
    throw new Error(`generator did not emit ${name} fixture binding`);
  }
  return namespaceFixtureAppBinding(block, generatedBinding);
}

function namespaceFixtureAppBinding(block: string, generatedBinding: string): string {
  const escapedBinding = generatedBinding.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const bindingPrefix = new RegExp(
    `(?<![\\w$])${escapedBinding}(?=_|[^\\w$]|$)`,
    'gu',
  );
  return block.replaceAll(
    bindingPrefix,
    `${FIXTURE_APP_IDENTIFIER_PREFIX}${generatedBinding}`,
  );
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
