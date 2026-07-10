import { aggregateAntigravityEvidence } from './runtime/antigravity-evidence-aggregation.ts';
import type { AntigravityCapability } from './runtime/antigravity-evidence.ts';
import {
  ANTIGRAVITY_EVIDENCE_PROBES,
  AntigravityEvidenceAdapter,
  type AntigravityEvidenceProbe,
} from './runtime/adapters/antigravity-adapter.ts';
import { LocalRunResourceAggregationAdapter } from './runtime/adapters/run-resource-aggregation-adapter.ts';

const OWNER_ACCEPTED: readonly AntigravityCapability[] = [
  'headless',
  'sandbox',
  'web_search_fetch',
  'citation_persistence',
  'agents_instructions',
  'gemini_instructions',
];
interface ParsedEvidenceArgs {
  readonly probe: AntigravityEvidenceProbe;
  readonly cwd: string;
  readonly timeoutMs?: number;
  readonly model?: string;
  readonly agent?: string;
  readonly project?: string;
  readonly aggregate?: string;
  readonly json: boolean;
}
function usage(): string {
  return 'Usage: deno task agentic:antigravity-evidence --probe <headless|web-citations|agents-instructions|gemini-instructions> --cwd <native-worktree> [--timeout-ms <1..60000>] [--model <id>] [--agent <id>] [--project <id>] [--aggregate <absolute-json-path>] [--json]';
}
/** Parses the bounded evidence CLI without accepting prompt or credential values. */
export function parseAntigravityEvidenceArgs(args: readonly string[]): ParsedEvidenceArgs {
  const values = new Map<string, string>();
  let json = false;
  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    if (token === '--json') json = true;
    else if (
      ['--probe', '--cwd', '--timeout-ms', '--model', '--agent', '--project', '--aggregate']
        .includes(
          token,
        )
    ) {
      const value = args[++index];
      if (!value || value.startsWith('--') || values.has(token)) throw new Error(usage());
      values.set(token, value);
    } else throw new Error(usage());
  }
  const probe = values.get('--probe');
  const cwd = values.get('--cwd');
  if (!probe || !ANTIGRAVITY_EVIDENCE_PROBES.includes(probe as AntigravityEvidenceProbe) || !cwd) {
    throw new Error(usage());
  }
  const timeoutText = values.get('--timeout-ms');
  const timeoutMs = timeoutText === undefined ? undefined : Number(timeoutText);
  if (
    timeoutMs !== undefined &&
    (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000)
  ) {
    throw new Error(usage());
  }
  const aggregate = values.get('--aggregate');
  if (aggregate && !aggregate.startsWith('/')) throw new Error(usage());
  return {
    probe: probe as AntigravityEvidenceProbe,
    cwd,
    timeoutMs,
    model: values.get('--model'),
    agent: values.get('--agent'),
    project: values.get('--project'),
    aggregate,
    json,
  };
}

async function main(): Promise<number> {
  try {
    const parsed = parseAntigravityEvidenceArgs(Deno.args);
    const result = await new AntigravityEvidenceAdapter().run({
      cwd: parsed.cwd,
      probe: parsed.probe,
      timeoutMs: parsed.timeoutMs,
      model: parsed.model,
      agent: parsed.agent,
      project: parsed.project,
      ownerAcceptedCapabilities: OWNER_ACCEPTED,
    });
    const aggregated = parsed.aggregate
      ? await aggregateAntigravityEvidence(
        result,
        new LocalRunResourceAggregationAdapter(parsed.aggregate),
      )
      : false;
    const output = { ...result, aggregated };
    console.log(parsed.json ? JSON.stringify(output) : JSON.stringify(output, null, 2));
    return result.status === 'passed' ? 0 : result.status === 'blocked' ? 4 : 5;
  } catch (error) {
    console.error(error instanceof Error ? error.message : usage());
    return 3;
  }
}
if (import.meta.main) Deno.exitCode = await main();
