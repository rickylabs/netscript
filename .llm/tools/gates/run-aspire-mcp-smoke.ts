import { join, resolve } from '@std/path';
import { main as runGate } from './run-gate.ts';

const SKIP_EXIT_CODE = 20;

async function main(args: readonly string[]): Promise<number> {
  if (args.length !== 6) {
    console.error(
      'usage: run-aspire-mcp-smoke.ts <repo> <project> <apphost> <database> <app> <job>',
    );
    return 2;
  }
  const repoRoot = resolve(args[0]);
  const projectRoot = resolve(args[1]);
  const appHost = resolve(args[2]);
  const database = args[3];
  const appResource = args[4];
  const job = args[5];
  const safeJob = job.split(/[\\/]/).pop() ?? 'scaffold-runtime';
  const outputDir = join(repoRoot, '.llm', 'tmp', 'gate-receipts', safeJob);
  const lifecycle = join(outputDir, 'agent.aspire-mcp-smoke.lifecycle.json');
  const receipt = join(outputDir, 'agent.aspire-mcp-smoke.json');
  const transcript = join(outputDir, 'agent.aspire-mcp-smoke.transcript.jsonl');
  const startState = join(projectRoot, '.netscript', 'e2e', 'aspire-start.json');
  try {
    await Deno.stat(startState);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    await runGate([
      '--gate',
      'aspire-mcp-smoke',
      '--id',
      `agent-aspire-mcp-smoke-${safeJob}`,
      '--output',
      lifecycle,
      '--cwd',
      repoRoot,
      '--skip-reason',
      `runtime phase did not run: ${startState} is absent`,
    ]);
    return SKIP_EXIT_CODE;
  }
  return await runGate([
    '--gate',
    'aspire-mcp-smoke',
    '--id',
    `agent-aspire-mcp-smoke-${safeJob}`,
    '--output',
    lifecycle,
    '--cwd',
    repoRoot,
    '--timeout-ms',
    '140000',
    '--child-report',
    receipt,
    '--',
    '--execute',
    projectRoot,
    appHost,
    database,
    appResource,
    receipt,
    transcript,
  ]);
}

if (import.meta.main) Deno.exitCode = await main(Deno.args);
