/** Runs one bounded, non-interactive OpenCode turn. */

import { OPENCODE_TOOL } from '../config/versions.ts';
export { parseOpenRouterApiKey } from '../lib/openrouter-credential.ts';
import { environmentWithOpenRouterApiKey } from '../lib/openrouter-credential.ts';
import { dirname, resolve } from 'node:path';
import { prepareOpenCodeProjectEnvironment } from './opencode-project-config.ts';
import { preflightOpenCodeMcp } from './opencode-preflight.ts';

export type OpenCodeOutputFormat = 'default' | 'json';

export interface OpenCodeRunOptions {
  readonly message: string;
  readonly model: string;
  readonly variant: string;
  readonly files?: readonly string[];
  readonly format?: OpenCodeOutputFormat;
  readonly session?: string;
  readonly cwd?: string;
  readonly requiredMcp?: readonly string[];
  readonly receiptPath?: string;
}

export interface OpenCodeRunResult {
  readonly code: number;
  readonly stdout?: string;
}

interface CliOptions extends OpenCodeRunOptions {
  readonly capture: boolean;
}

type Environment = Readonly<Record<string, string | undefined>>;

/**
 * Builds the OpenCode argv. The message deliberately comes immediately after
 * `run`: OpenCode's `-f` flag accepts an array and otherwise swallows a trailing
 * positional message as another filename.
 */
export function opencodeRunArguments(options: OpenCodeRunOptions): string[] {
  return [
    'run',
    options.message,
    '-m',
    options.model,
    '--variant',
    options.variant,
    ...(options.session ? ['--session', options.session] : []),
    ...(options.files ?? []).flatMap((file) => ['-f', file]),
    ...(options.format === 'json' ? ['--format', 'json'] : []),
  ];
}

/** Resolves an explicit override before delegating PATH lookup to Deno.Command. */
export function resolveOpenCodeBinary(env: Environment): string {
  return env.OPENCODE_BIN?.trim() || OPENCODE_TOOL.binary;
}

/** Returns a child environment with OpenRouter auth, without logging the key. */
export async function openCodeChildEnvironment(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
  options: { readonly cwd?: string; readonly receiptPath?: string } = {},
): Promise<Record<string, string>> {
  const credentialed = await environmentWithOpenRouterApiKey(env, readTextFile);
  return await prepareOpenCodeProjectEnvironment(credentialed, {
    cwd: resolve(options.cwd ?? Deno.cwd()),
    receiptPath: options.receiptPath,
  });
}

/** Executes OpenCode with either inherited output or captured stdout. */
export async function runOpenCode(
  options: OpenCodeRunOptions,
  capture = false,
): Promise<OpenCodeRunResult> {
  const processEnv = Deno.env.toObject();
  const cwd = resolve(options.cwd ?? Deno.cwd());
  if (options.receiptPath) {
    await Deno.mkdir(dirname(resolve(cwd, options.receiptPath)), { recursive: true });
  }
  const env = await openCodeChildEnvironment(processEnv, Deno.readTextFile, {
    cwd,
    receiptPath: options.receiptPath,
  });
  if (options.requiredMcp?.length) {
    if (!options.receiptPath) {
      throw new Error('--receipt is required when --require-mcp is used');
    }
    await preflightOpenCodeMcp({
      cwd,
      requiredServers: options.requiredMcp,
      model: options.model,
      variant: options.variant,
      env,
      receiptPath: options.receiptPath,
    });
  }
  const child = new Deno.Command(resolveOpenCodeBinary(processEnv), {
    args: opencodeRunArguments(options),
    cwd,
    env,
    stdin: 'null',
    stdout: capture ? 'piped' : 'inherit',
    stderr: 'inherit',
  }).spawn();
  const stdout = capture ? new Response(child.stdout).text() : undefined;
  const status = await child.status;
  return {
    code: status.code,
    ...(stdout ? { stdout: await stdout } : {}),
  };
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value?.trim()) throw new Error(`${flag} requires a value`);
  return value;
}

function parse(args: readonly string[]): CliOptions {
  let message: string | undefined;
  let model: string | undefined;
  let variant: string = OPENCODE_TOOL.defaultVariant;
  let format: OpenCodeOutputFormat = 'default';
  let capture = false;
  const files: string[] = [];
  let session: string | undefined;
  let cwd: string | undefined;
  let receiptPath: string | undefined;
  const requiredMcp: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--message') message = requiredValue(args, index++, argument);
    else if (argument === '-m' || argument === '--model') {
      model = requiredValue(args, index++, argument);
    } else if (argument === '--variant') variant = requiredValue(args, index++, argument);
    else if (argument === '-f' || argument === '--file') {
      files.push(requiredValue(args, index++, argument));
    } else if (argument === '--format') {
      const value = requiredValue(args, index++, argument);
      if (value !== 'default' && value !== 'json') {
        throw new Error('--format must be default or json');
      }
      format = value;
    } else if (argument === '--capture') capture = true;
    else if (argument === '-s' || argument === '--session') {
      session = requiredValue(args, index++, argument);
    } else if (argument === '--cwd' || argument === '--dir') {
      cwd = requiredValue(args, index++, argument);
    } else if (argument === '--require-mcp') {
      requiredMcp.push(requiredValue(args, index++, argument));
    } else if (argument === '--receipt') {
      receiptPath = requiredValue(args, index++, argument);
    } else if (!argument.startsWith('-') && !message) message = argument;
    else throw new Error(`Unknown or duplicate argument: ${argument}`);
  }

  if (!message?.trim() || !model?.trim() || !variant.trim()) {
    throw new Error(
      'Usage: opencode-run <message>|--message <text> --model <provider/model> ' +
        '[--variant <effort>] [-s <session>] [--cwd <project>] [-f <path> ...] ' +
        '[--require-mcp <server> ...] [--receipt <jsonl>] [--format default|json] [--capture]',
    );
  }
  return {
    message,
    model,
    variant,
    files,
    format,
    capture,
    ...(session ? { session } : {}),
    ...(cwd ? { cwd } : {}),
    ...(requiredMcp.length ? { requiredMcp } : {}),
    ...(receiptPath ? { receiptPath } : {}),
  };
}

if (import.meta.main) {
  try {
    const options = parse(Deno.args);
    const result = await runOpenCode(options, options.capture);
    if (result.stdout !== undefined) {
      await Deno.stdout.write(new TextEncoder().encode(result.stdout));
    }
    Deno.exit(result.code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
