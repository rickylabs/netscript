/** Launches OpenCode's native browser UI with safe remote-exposure defaults. */

import { OPENCODE_TOOL } from '../config/versions.ts';
import { openCodeChildEnvironment, resolveOpenCodeBinary } from './opencode-run.ts';

export interface OpenCodeWebOptions {
  readonly hostname: string;
  readonly port: number;
  readonly mdns?: boolean;
  readonly mdnsDomain?: string;
  readonly cors?: readonly string[];
}

type Environment = Readonly<Record<string, string | undefined>>;

export function opencodeWebArguments(options: OpenCodeWebOptions): string[] {
  return [
    'web',
    '--hostname',
    options.hostname,
    '--port',
    String(options.port),
    ...(options.mdns ? ['--mdns'] : []),
    ...(options.mdnsDomain ? ['--mdns-domain', options.mdnsDomain] : []),
    ...(options.cors ?? []).flatMap((origin) => ['--cors', origin]),
  ];
}

export function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return normalized === OPENCODE_TOOL.webDefaultHostname || normalized === 'localhost' ||
    normalized === '::1' || normalized === '[::1]';
}

/** Refuses network discovery or non-loopback binding without HTTP basic auth. */
export function assertProtectedWebExposure(options: OpenCodeWebOptions, env: Environment): void {
  if (
    (!isLoopbackHostname(options.hostname) || options.mdns) &&
    !env.OPENCODE_SERVER_PASSWORD?.trim()
  ) {
    throw new Error(
      'OPENCODE_SERVER_PASSWORD is required for non-loopback or mDNS OpenCode web exposure',
    );
  }
}

export async function runOpenCodeWeb(options: OpenCodeWebOptions): Promise<number> {
  const processEnv = Deno.env.toObject();
  assertProtectedWebExposure(options, processEnv);
  const status = await new Deno.Command(resolveOpenCodeBinary(processEnv), {
    args: opencodeWebArguments(options),
    env: await openCodeChildEnvironment(processEnv),
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  return status.code;
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value?.trim()) throw new Error(`${flag} requires a value`);
  return value;
}

function parse(args: readonly string[]): OpenCodeWebOptions {
  let hostname: string = OPENCODE_TOOL.webDefaultHostname;
  let port: number = OPENCODE_TOOL.webDefaultPort;
  let mdns = false;
  let mdnsDomain: string | undefined;
  const cors: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--hostname') hostname = requiredValue(args, index++, argument);
    else if (argument === '--port') {
      const value = requiredValue(args, index++, argument);
      port = Number(value);
      if (!Number.isInteger(port) || port < 0 || port > 65_535) {
        throw new Error('--port must be an integer from 0 through 65535');
      }
    } else if (argument === '--mdns') mdns = true;
    else if (argument === '--mdns-domain') mdnsDomain = requiredValue(args, index++, argument);
    else if (argument === '--cors') cors.push(requiredValue(args, index++, argument));
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return { hostname, port, mdns, ...(mdnsDomain ? { mdnsDomain } : {}), cors };
}

if (import.meta.main) {
  try {
    Deno.exit(await runOpenCodeWeb(parse(Deno.args)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
