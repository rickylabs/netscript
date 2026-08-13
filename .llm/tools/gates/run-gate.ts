import { resolve } from '@std/path';

import { gateArgv } from './catalog.ts';
import { executeGate } from './command-lifecycle.ts';
import type { GateRequest } from './contract.ts';
import { AtomicFileReceiptStore } from './receipt-store.ts';

interface CliOptions {
  gate: string;
  invocationId: string;
  output: string;
  cwd: string;
  timeoutMs: number;
  attempt: number;
  runner: string;
  gitHead?: string;
  gitHeadOverrideReason?: string;
  childReport?: string;
  skipReason?: string;
  args: string[];
}

function value(args: string[], index: number): string {
  const result = args[index + 1];
  if (!result) throw new Error(`Missing value for ${args[index]}`);
  return result;
}

function valueAllowEmpty(args: string[], index: number): string {
  if (index + 1 >= args.length) throw new Error(`Missing value for ${args[index]}`);
  return args[index + 1];
}

function parseArgs(args: string[]): CliOptions {
  const separator = args.indexOf('--');
  const own = separator < 0 ? args : args.slice(0, separator);
  const forwarded = separator < 0 ? [] : args.slice(separator + 1);
  let gate = '';
  let invocationId = '';
  let output = '';
  let cwd = Deno.cwd();
  let timeoutMs = 30 * 60 * 1000;
  let attempt = Number(Deno.env.get('GITHUB_RUN_ATTEMPT') ?? '1');
  let runner = Deno.env.get('GITHUB_JOB') ?? `worker:${Deno.pid}`;
  let gitHead: string | undefined;
  let gitHeadOverrideReason: string | undefined;
  let childReport: string | undefined;
  let skipReason: string | undefined;
  for (let index = 0; index < own.length; index++) {
    switch (own[index]) {
      case '--gate':
        gate = value(own, index++);
        break;
      case '--id':
        invocationId = value(own, index++);
        break;
      case '--output':
        output = value(own, index++);
        break;
      case '--cwd':
        cwd = value(own, index++);
        break;
      case '--timeout-ms':
        timeoutMs = Number(value(own, index++));
        break;
      case '--attempt':
        attempt = Number(value(own, index++));
        break;
      case '--runner':
        runner = value(own, index++);
        break;
      case '--git-head':
        gitHead = value(own, index++);
        break;
      case '--allow-git-head-mismatch':
        gitHeadOverrideReason = value(own, index++);
        break;
      case '--child-report':
        childReport = value(own, index++);
        break;
      case '--skip-reason':
        skipReason = valueAllowEmpty(own, index++).trim() || 'Policy skip (no reason supplied)';
        break;
      default:
        throw new Error(`Unknown argument ${own[index]}`);
    }
  }
  if (!gate || !invocationId || !output) throw new Error('--gate, --id, and --output are required');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error('--timeout-ms must be positive');
  }
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error('--attempt must be positive');
  return {
    gate,
    invocationId,
    output,
    cwd,
    timeoutMs,
    attempt,
    runner,
    gitHead,
    gitHeadOverrideReason,
    childReport,
    skipReason,
    args: forwarded,
  };
}

export async function resolveHead(cwd: string): Promise<string> {
  const result = await new Deno.Command('git', {
    args: ['rev-parse', 'HEAD'],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(`Cannot resolve git HEAD: ${new TextDecoder().decode(result.stderr).trim()}`);
  }
  return new TextDecoder().decode(result.stdout).trim();
}

export function attestGitHead(
  actualGitHead: string,
  requestedGitHead?: string,
  overrideReason?: string,
): { gitHead: string; actualGitHead: string; gitHeadOverrideReason?: string } {
  const gitHead = requestedGitHead ?? actualGitHead;
  if (gitHead !== actualGitHead && !overrideReason?.trim()) {
    throw new Error(
      `--git-head ${gitHead} does not match actual HEAD ${actualGitHead}; ` +
        'use --allow-git-head-mismatch <reason> only for diagnostic evidence',
    );
  }
  return {
    gitHead,
    actualGitHead,
    gitHeadOverrideReason: gitHead === actualGitHead ? undefined : overrideReason?.trim(),
  };
}

export async function main(args: string[] = Deno.args): Promise<number> {
  const options = parseArgs(args);
  const cwd = await Deno.realPath(options.cwd).catch(() => resolve(options.cwd));
  const attestation = attestGitHead(
    await resolveHead(cwd),
    options.gitHead,
    options.gitHeadOverrideReason,
  );
  const request: GateRequest = {
    gateId: options.gate,
    invocationId: options.invocationId,
    argv: gateArgv(options.gate, options.args),
    cwd,
    ...attestation,
    timeoutMs: options.timeoutMs,
    runnerIdentity: options.runner,
    attempt: options.attempt,
  };
  const abort = new AbortController();
  const interrupt = () => abort.abort();
  const signals: Deno.Signal[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) Deno.addSignalListener(signal, interrupt);
  try {
    const receipt = await executeGate(request, {
      store: new AtomicFileReceiptStore(resolve(options.output)),
      signal: abort.signal,
      childReport: options.childReport,
      skipReason: options.skipReason,
    });
    console.log(JSON.stringify(receipt));
    return receipt.outcome === 'PASS' || receipt.outcome === 'SKIPPED'
      ? 0
      : receipt.exitCode && receipt.exitCode > 0
      ? receipt.exitCode
      : 1;
  } finally {
    for (const signal of signals) Deno.removeSignalListener(signal, interrupt);
  }
}

if (import.meta.main) Deno.exit(await main());
