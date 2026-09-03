import { DELIMITER, dirname, resolve } from '@std/path';
import {
  explicitServicePort,
  parseReadmeQuickstartCommands,
  README_QUICKSTART_EXPECTED_COMMANDS,
  readmeQuickstartArgv,
  substituteReadmeQuickstartCommand,
} from '../../../domain/readme-quickstart.ts';
import { resolveResourceUrlsFromAppHost } from '../scaffold/generated-app-endpoint.ts';
import { type AspireCommandRunner, runAspireCommand } from './aspire-walk.ts';

const JSR_CLI_PREFIX = 'jsr:@netscript/cli@';
const SERVICE_RESOURCE = 'users';
const SERVICE_READINESS_PREFIX = `aspire wait ${SERVICE_RESOURCE} `;
const RECEIPT_TAIL_LENGTH = 4_000;
const DENO_INSTALL_DIRECTORY = '.deno-install';

type ServiceUrlResolver = (appHost: string, resourceName: string) => Promise<string[]>;

interface ReadmeWalkState {
  readonly cwd: string;
  readonly denoInstallRoot: string;
  readonly nextIndex: number;
  readonly servicePort?: number;
  readonly servicePortSource?: string;
  readonly servicePortError?: string;
}

interface ReadmeCommandReceipt {
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly durationMs: number;
  readonly environment: {
    readonly denoInstallRoot: string;
    readonly pathPrepend: string;
  };
  readonly exitCode: number;
  readonly readmeLine: number;
  readonly sourceCommand: string;
  readonly stderrTail: string;
  readonly stdoutTail: string;
  readonly substitutions: {
    readonly port?: number;
    readonly version?: string;
  };
  readonly evidence?: {
    readonly error?: string;
    readonly servicePort?: number;
    readonly source?: string;
  };
  readonly timedOut: boolean;
}

/** Execute one indexed root README Quickstart command and emit its child receipt. */
export async function executeReadmeQuickstartCommand(
  repoRoot: string,
  runRoot: string,
  appHost: string,
  index: number,
  cliSpecifier: string,
  statePath: string,
  timeoutMs: number,
  spawn: AspireCommandRunner = runAspireCommand,
  resolveServiceUrls: ServiceUrlResolver = resolveResourceUrlsFromAppHost,
): Promise<number> {
  const readme = await Deno.readTextFile(resolve(repoRoot, 'README.md'));
  const commands = parseReadmeQuickstartCommands(readme);
  assertExpectedCommands(commands.map((entry) => entry.command));
  const entry = commands[index];
  if (!entry) throw new Error(`README Quickstart command index ${index} does not exist.`);

  const version = publishedVersion(cliSpecifier, entry.line);
  const state = index === 0
    ? await initializeState(runRoot, statePath)
    : await readState(statePath, entry.line);
  if (state.nextIndex !== index) {
    throw new Error(
      `README line ${entry.line} cannot run out of order: expected command index ` +
        `${state.nextIndex}, received ${index}.`,
    );
  }

  if (
    entry.command.includes('<port>') && state.servicePort === undefined && state.servicePortError
  ) {
    throw new Error(
      `README line ${entry.line} cannot substitute <port>: ${state.servicePortError}.`,
    );
  }
  const substituted = substituteReadmeQuickstartCommand(
    entry.command,
    { version, port: state.servicePort },
    entry.line,
  );
  const argv = readmeQuickstartArgv(substituted, entry.line);
  const environment = readmeCommandEnvironment(state.denoInstallRoot);
  const started = performance.now();
  const result = argv[0] === 'cd'
    ? await changeDirectory(argv, state.cwd, entry.line)
    : await runCommand(argv, state.cwd, timeoutMs, environment.env, spawn);
  const durationMs = Math.round(performance.now() - started);
  let nextState: ReadmeWalkState = state;
  if (result.code === 0 && !result.timedOut) {
    nextState = {
      ...state,
      cwd: argv[0] === 'cd' ? resolve(state.cwd, argv[1]) : state.cwd,
      nextIndex: index + 1,
    };
    if (entry.command.startsWith(SERVICE_READINESS_PREFIX)) {
      nextState = await captureServicePort(nextState, appHost, resolveServiceUrls);
    }
    await writeState(statePath, nextState);
  }

  const receipt: ReadmeCommandReceipt = Object.freeze({
    argv,
    cwd: state.cwd,
    durationMs,
    environment: Object.freeze({
      denoInstallRoot: state.denoInstallRoot,
      pathPrepend: environment.pathPrepend,
    }),
    exitCode: result.code,
    readmeLine: entry.line,
    sourceCommand: entry.command,
    stderrTail: tail(result.stderr),
    stdoutTail: tail(result.stdout),
    substitutions: Object.freeze({
      ...(entry.command.includes('<version>') ? { version } : {}),
      ...(entry.command.includes('<port>') && state.servicePort !== undefined
        ? { port: state.servicePort }
        : {}),
    }),
    ...(entry.command.startsWith(SERVICE_READINESS_PREFIX) &&
        (nextState.servicePort !== undefined || nextState.servicePortError !== undefined)
      ? {
        evidence: {
          ...(nextState.servicePort === undefined ? {} : { servicePort: nextState.servicePort }),
          ...(nextState.servicePortSource === undefined
            ? {}
            : { source: nextState.servicePortSource }),
          ...(nextState.servicePortError === undefined
            ? {}
            : { error: nextState.servicePortError }),
        },
      }
      : {}),
    timedOut: result.timedOut,
  });
  await writeReceipt(statePath, index, receipt);
  console.info(JSON.stringify(receipt));
  if (result.code !== 0 || result.timedOut) {
    console.error(
      `README line ${entry.line} failed exactly as printed: ${entry.command}`,
    );
  }
  return result.code;
}

async function runCommand(
  argv: readonly string[],
  cwd: string,
  timeoutMs: number,
  env: Record<string, string>,
  spawn: AspireCommandRunner,
): Promise<{ code: number; stdout: string; stderr: string; timedOut: boolean }> {
  try {
    return await spawn(argv, cwd, timeoutMs, env);
  } catch (error) {
    return {
      code: 1,
      stdout: '',
      stderr: `Command could not start: ${errorMessage(error)}`,
      timedOut: false,
    };
  }
}

async function initializeState(runRoot: string, statePath: string): Promise<ReadmeWalkState> {
  await Deno.mkdir(runRoot, { recursive: true });
  const denoInstallRoot = resolve(runRoot, DENO_INSTALL_DIRECTORY);
  try {
    await Deno.remove(denoInstallRoot, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  await Deno.mkdir(denoInstallRoot, { recursive: true });
  try {
    await Deno.remove(resolve(dirname(statePath), 'receipts'), { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return Object.freeze({ cwd: runRoot, denoInstallRoot, nextIndex: 0 });
}

function readmeCommandEnvironment(
  denoInstallRoot: string,
): { env: Record<string, string>; pathPrepend: string } {
  const pathPrepend = resolve(denoInstallRoot, 'bin');
  return {
    env: {
      DENO_INSTALL_ROOT: denoInstallRoot,
      PATH: `${pathPrepend}${DELIMITER}${Deno.env.get('PATH') ?? ''}`,
    },
    pathPrepend,
  };
}

function assertExpectedCommands(actual: readonly string[]): void {
  if (actual.length !== README_QUICKSTART_EXPECTED_COMMANDS.length) {
    throw new Error(
      `README Quickstart contains ${actual.length} commands; ` +
        `readme.quickstart expects ${README_QUICKSTART_EXPECTED_COMMANDS.length}.`,
    );
  }
  for (let index = 0; index < actual.length; index++) {
    if (actual[index] !== README_QUICKSTART_EXPECTED_COMMANDS[index]) {
      throw new Error(
        `README Quickstart command ${index + 1} diverged: expected ` +
          `${JSON.stringify(README_QUICKSTART_EXPECTED_COMMANDS[index])}, received ` +
          `${JSON.stringify(actual[index])}.`,
      );
    }
  }
}

function publishedVersion(specifier: string, line: number): string {
  if (!specifier.startsWith(JSR_CLI_PREFIX)) {
    throw new Error(
      `README line ${line} requires --source jsr and --cli ${JSR_CLI_PREFIX}<version>.`,
    );
  }
  const version = specifier.slice(JSR_CLI_PREFIX.length);
  if (!version || /\s/.test(version)) {
    throw new Error(`README line ${line} received an invalid published CLI version.`);
  }
  return version;
}

async function changeDirectory(
  argv: readonly string[],
  cwd: string,
  line: number,
): Promise<{ code: number; stdout: string; stderr: string; timedOut: boolean }> {
  if (argv.length !== 2) {
    return {
      code: 2,
      stdout: '',
      stderr: `README line ${line} has an unsupported cd shape.`,
      timedOut: false,
    };
  }
  const target = resolve(cwd, argv[1]);
  try {
    const info = await Deno.stat(target);
    if (!info.isDirectory) throw new Error('target is not a directory');
    return { code: 0, stdout: '', stderr: '', timedOut: false };
  } catch (error) {
    return {
      code: 1,
      stdout: '',
      stderr: `README line ${line} cd ${argv[1]} failed: ${errorMessage(error)}`,
      timedOut: false,
    };
  }
}

async function captureServicePort(
  state: ReadmeWalkState,
  appHost: string,
  resolveServiceUrls: ServiceUrlResolver,
): Promise<ReadmeWalkState> {
  try {
    const urls = await resolveServiceUrls(appHost, SERVICE_RESOURCE);
    const port = explicitServicePort(urls);
    return Object.freeze({
      ...state,
      servicePort: port,
      servicePortSource: `aspire describe ${SERVICE_RESOURCE} run receipt`,
    });
  } catch (error) {
    return Object.freeze({
      ...state,
      servicePortError: `service-port receipt failed: ${errorMessage(error)}`,
    });
  }
}

async function readState(path: string, line: number): Promise<ReadmeWalkState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await Deno.readTextFile(path));
  } catch (error) {
    throw new Error(`README line ${line} cannot read prior run receipt: ${errorMessage(error)}.`);
  }
  if (
    !isRecord(parsed) || typeof parsed.cwd !== 'string' ||
    typeof parsed.denoInstallRoot !== 'string' ||
    typeof parsed.nextIndex !== 'number'
  ) {
    throw new Error(`README line ${line} found a malformed prior run receipt.`);
  }
  const servicePort = parsed.servicePort;
  const servicePortSource = parsed.servicePortSource;
  const servicePortError = parsed.servicePortError;
  if (servicePort !== undefined && typeof servicePort !== 'number') {
    throw new Error(`README line ${line} found a malformed service port receipt.`);
  }
  if (servicePortSource !== undefined && typeof servicePortSource !== 'string') {
    throw new Error(`README line ${line} found a malformed service port source.`);
  }
  if (servicePortError !== undefined && typeof servicePortError !== 'string') {
    throw new Error(`README line ${line} found a malformed service port error.`);
  }
  return Object.freeze({
    cwd: parsed.cwd,
    denoInstallRoot: parsed.denoInstallRoot,
    nextIndex: parsed.nextIndex,
    ...(servicePort === undefined ? {} : { servicePort }),
    ...(servicePortSource === undefined ? {} : { servicePortSource }),
    ...(servicePortError === undefined ? {} : { servicePortError }),
  });
}

async function writeState(path: string, state: ReadmeWalkState): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await Deno.writeTextFile(temporary, `${JSON.stringify(state, null, 2)}\n`);
  await Deno.rename(temporary, path);
}

async function writeReceipt(
  statePath: string,
  index: number,
  receipt: ReadmeCommandReceipt,
): Promise<void> {
  const path = resolve(
    dirname(statePath),
    'receipts',
    `${String(index + 1).padStart(2, '0')}.json`,
  );
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(receipt, null, 2)}\n`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function tail(text: string): string {
  return text.length > RECEIPT_TAIL_LENGTH ? text.slice(-RECEIPT_TAIL_LENGTH) : text;
}

if (import.meta.main) {
  const [repoRoot, runRoot, appHost, rawIndex, cliSpecifier, statePath, rawTimeout] = Deno.args;
  const index = Number(rawIndex);
  const timeoutMs = Number(rawTimeout);
  if (
    !repoRoot || !runRoot || !appHost || !Number.isSafeInteger(index) || !cliSpecifier ||
    !statePath ||
    !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0
  ) {
    throw new Error(
      'repo root, run root, AppHost, command index, CLI specifier, state path, and timeout are required',
    );
  }
  try {
    Deno.exitCode = await executeReadmeQuickstartCommand(
      repoRoot,
      runRoot,
      appHost,
      index,
      cliSpecifier,
      statePath,
      timeoutMs,
    );
  } catch (error) {
    console.error(errorMessage(error));
    Deno.exitCode = 1;
  }
}
