/** Launches an inference-only Claude session behind the credential-isolated model gateway. */

import { type CurrentOpenRouterModelId, OPENROUTER_MODEL_IDS } from '../config/models.ts';
import { type Effort, EFFORTS } from '../runtime/contract.ts';
import { resolveOpenRouterApiKey } from '../lib/openrouter-credential.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import { startRemoteModelGateway } from './remote-model-gateway.ts';

export interface RemoteModelLaunchOptions {
  readonly model: CurrentOpenRouterModelId;
  readonly cwd: string;
  readonly effort: Effort;
  readonly name?: string;
  readonly resume?: string;
  readonly forkSession: boolean;
}

interface ManagedClaudeProcess {
  readonly status: Promise<{ readonly code: number }>;
  readonly kill: (signal: Deno.Signal) => void;
}

export interface RemoteModelLauncherPorts {
  readonly environment: () => Record<string, string>;
  readonly resolveCredential: (environment: Readonly<Record<string, string>>) => Promise<string>;
  readonly assertDirectory: (path: string) => Promise<void>;
  readonly startGateway: (
    options: {
      readonly model: RemoteModelLaunchOptions['model'];
      readonly openRouterApiKey: string;
    },
  ) => { readonly baseUrl: string; readonly close: () => Promise<void> };
  readonly spawnClaude: (
    args: readonly string[],
    cwd: string,
    environment: Readonly<Record<string, string>>,
  ) => ManagedClaudeProcess;
  readonly addSignalListener: (signal: Deno.Signal, listener: () => void) => void;
  readonly removeSignalListener: (signal: Deno.Signal, listener: () => void) => void;
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const result = args[index + 1];
  if (!result?.trim() || result.startsWith('--')) throw new Error(`${flag} requires a value`);
  return result;
}

function safeText(value: string, flag: string): string {
  const hasControlCharacter = [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
  if (value.length > 256 || hasControlCharacter) {
    throw new Error(`${flag} contains unsupported characters`);
  }
  return value;
}

/** Parses and validates the finite launcher CLI contract. */
export function parseRemoteModelLaunchOptions(args: readonly string[]): RemoteModelLaunchOptions {
  args = normalizeTaskArguments(args);
  let model: string = OPENROUTER_MODEL_IDS.implEvaluator;
  let cwd = Deno.cwd();
  let effort: Effort = 'max';
  let name: string | undefined;
  let resume: string | undefined;
  let forkSession = false;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--model') model = requiredValue(args, index++, argument);
    else if (argument === '--cwd') cwd = requiredValue(args, index++, argument);
    else if (argument === '--effort') effort = requiredValue(args, index++, argument) as Effort;
    else if (argument === '--name') {
      name = safeText(requiredValue(args, index++, argument), argument);
    } else if (argument === '--resume') {
      resume = safeText(requiredValue(args, index++, argument), argument);
    } else if (argument === '--fork-session') forkSession = true;
    else if (argument === '--remote-control' || argument === '--remote-session-id') {
      throw new Error(
        'Remote Control with a custom model endpoint is unsupported by Claude Code >=2.1.196',
      );
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  const configuredModels = Object.values(OPENROUTER_MODEL_IDS) as readonly string[];
  if (!configuredModels.includes(model)) {
    throw new Error('--model must name a configured OpenRouter model');
  }
  if (!EFFORTS.includes(effort)) throw new Error('--effort is invalid');
  if (forkSession && !resume) throw new Error('--fork-session requires --resume');
  return {
    model: model as CurrentOpenRouterModelId,
    cwd,
    effort,
    ...(name ? { name } : {}),
    ...(resume ? { resume } : {}),
    forkSession,
  };
}

/** Builds supported inference-only Claude argv for new, resume, and fork modes. */
export function remoteModelClaudeArguments(options: RemoteModelLaunchOptions): string[] {
  return [
    ...(options.resume ? ['--resume', options.resume] : []),
    ...(options.forkSession ? ['--fork-session'] : []),
    '--model',
    options.model,
    '--effort',
    options.effort,
    '--permission-mode',
    'bypassPermissions',
    ...(options.name ? ['--name', options.name] : []),
  ];
}

/** Removes the alternate-provider credential from the Claude child environment. */
export function claudeGatewayChildEnvironment(
  environment: Readonly<Record<string, string>>,
  _openRouterApiKey: string,
  baseUrl: string,
): Record<string, string> {
  const child = { ...environment };
  delete child.OPENROUTER_API_KEY;
  // Remote Control requires the Claude subscription OAuth session. Any API-key
  // auth source takes precedence over that login, even when it is unrelated to
  // the OpenRouter credential held by this gateway.
  delete child.ANTHROPIC_API_KEY;
  delete child.ANTHROPIC_AUTH_TOKEN;
  child.ANTHROPIC_BASE_URL = baseUrl;
  return child;
}

async function assertDirectory(path: string): Promise<void> {
  const info = await Deno.stat(path);
  if (!info.isDirectory) throw new Error(`--cwd is not a directory: ${path}`);
}

/** Owns gateway/child lifetime and always closes the listener after child exit. */
export async function runRemoteModelLauncher(
  options: RemoteModelLaunchOptions,
  ports: RemoteModelLauncherPorts = defaultLauncherPorts,
): Promise<number> {
  await ports.assertDirectory(options.cwd);
  const environment = ports.environment();
  const credential = await ports.resolveCredential(environment);
  const gateway = ports.startGateway({ model: options.model, openRouterApiKey: credential });
  let child: ManagedClaudeProcess | undefined;
  const forwardSignal = () => {
    try {
      child?.kill('SIGTERM');
    } catch {
      // The process already exited.
    }
  };
  ports.addSignalListener('SIGINT', forwardSignal);
  ports.addSignalListener('SIGTERM', forwardSignal);
  try {
    child = ports.spawnClaude(
      remoteModelClaudeArguments(options),
      options.cwd,
      claudeGatewayChildEnvironment(environment, credential, gateway.baseUrl),
    );
    return (await child.status).code;
  } finally {
    ports.removeSignalListener('SIGINT', forwardSignal);
    ports.removeSignalListener('SIGTERM', forwardSignal);
    await gateway.close();
  }
}

const defaultLauncherPorts: RemoteModelLauncherPorts = {
  environment: () => Deno.env.toObject(),
  resolveCredential: (environment) => resolveOpenRouterApiKey(environment),
  assertDirectory,
  startGateway: (options) => startRemoteModelGateway(options),
  spawnClaude: (args, cwd, environment) =>
    new Deno.Command('claude', {
      args: [...args],
      cwd,
      env: environment,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    }).spawn(),
  addSignalListener: (signal, listener) => Deno.addSignalListener(signal, listener),
  removeSignalListener: (signal, listener) => Deno.removeSignalListener(signal, listener),
};

if (import.meta.main) {
  try {
    const code = await runRemoteModelLauncher(parseRemoteModelLaunchOptions(Deno.args));
    Deno.exit(code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
