/** Runs one bounded, non-interactive OpenCode turn. */

import { OPENCODE_TOOL } from '../config/versions.ts';

export type OpenCodeOutputFormat = 'default' | 'json';

export interface OpenCodeRunOptions {
  readonly message: string;
  readonly model: string;
  readonly variant: string;
  readonly files?: readonly string[];
  readonly format?: OpenCodeOutputFormat;
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
    ...(options.files ?? []).flatMap((file) => ['-f', file]),
    ...(options.format === 'json' ? ['--format', 'json'] : []),
  ];
}

/** Resolves an explicit override before delegating PATH lookup to Deno.Command. */
export function resolveOpenCodeBinary(env: Environment): string {
  return env.OPENCODE_BIN?.trim() || OPENCODE_TOOL.binary;
}

/** Parses only the OpenRouter key assignment from a shell-style env file. */
export function parseOpenRouterApiKey(source: string): string | undefined {
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?OPENROUTER_API_KEY\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[1].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"')))
    ) {
      value = value.slice(1, -1);
    }
    return value || undefined;
  }
  return undefined;
}

/** Returns a child environment with OpenRouter auth, without logging the key. */
export async function openCodeChildEnvironment(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
): Promise<Record<string, string>> {
  const childEnv = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  if (env.OPENROUTER_API_KEY?.trim()) return childEnv;

  const home = env.HOME?.trim();
  if (!home) {
    throw new Error('OPENROUTER_API_KEY is missing and HOME is unavailable');
  }
  const path = `${home.replace(/\/$/, '')}/${OPENCODE_TOOL.openRouterEnvRelativePath}`;
  let source: string;
  try {
    source = await readTextFile(path);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`OPENROUTER_API_KEY is missing and ${path} could not be read: ${detail}`);
  }
  const key = parseOpenRouterApiKey(source);
  if (!key) throw new Error(`OPENROUTER_API_KEY is missing from ${path}`);
  childEnv.OPENROUTER_API_KEY = key;
  return childEnv;
}

/** Executes OpenCode with either inherited output or captured stdout. */
export async function runOpenCode(
  options: OpenCodeRunOptions,
  capture = false,
): Promise<OpenCodeRunResult> {
  const processEnv = Deno.env.toObject();
  const child = new Deno.Command(resolveOpenCodeBinary(processEnv), {
    args: opencodeRunArguments(options),
    env: await openCodeChildEnvironment(processEnv),
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
    else if (!argument.startsWith('-') && !message) message = argument;
    else throw new Error(`Unknown or duplicate argument: ${argument}`);
  }

  if (!message?.trim() || !model?.trim() || !variant.trim()) {
    throw new Error(
      'Usage: opencode-run <message>|--message <text> --model <provider/model> ' +
        '[--variant <effort>] [-f <path> ...] [--format default|json] [--capture]',
    );
  }
  return { message, model, variant, files, format, capture };
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
