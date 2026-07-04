#!/usr/bin/env -S deno run --allow-read
/**
 * Report shared JSR dependencies whose version requirements diverge.
 */
import {
  collectWorkspaceFacts,
  type DependencyUse,
  type Finding,
  hasFail,
  printFindings,
} from './workspace.ts';

interface Args {
  json: boolean;
  failOnViolation: boolean;
}

function parseArgs(argv: string[]): Args {
  return {
    json: argv.includes('--json'),
    failOnViolation: argv.includes('--fail-on-violation'),
  };
}

function findingLevel(args: Args): 'WARN' | 'FAIL' {
  return args.failOnViolation ? 'FAIL' : 'WARN';
}

function canonicalRange(range: string): string {
  const trimmed = range.trim();
  if (/^\d+$/.test(trimmed)) return `^${trimmed}`;
  return trimmed;
}

/** Analyze shared JSR dependencies for cross-member version divergence. */
export function analyzeJsrCentralization(
  dependencies: DependencyUse[],
  args: Args,
): Finding[] {
  const byName = new Map<string, DependencyUse[]>();
  for (const use of dependencies) {
    if (use.registry !== 'jsr' || !use.range) continue;
    const uses = byName.get(use.name) ?? [];
    uses.push(use);
    byName.set(use.name, uses);
  }

  const findings: Finding[] = [];
  for (const [name, uses] of byName) {
    const members = new Set(uses.map((use) => use.member.root));
    if (members.size <= 1) continue;
    const ranges = new Set(uses.map((use) => canonicalRange(use.range)));
    if (ranges.size <= 1) continue;
    const refs = uses.map((use) => `${use.path}:${use.line}=${use.range}`).sort().join(', ');
    findings.push({
      ref: 'DEPS-JSR-CENTRALIZATION',
      level: findingLevel(args),
      message: `${name} is used by ${members.size} members with divergent JSR ranges: ${
        [...ranges].sort().join(', ')
      } (${refs})`,
    });
  }
  return findings.sort((a, b) => a.message.localeCompare(b.message));
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const facts = await collectWorkspaceFacts();
  const findings = analyzeJsrCentralization(facts.dependencies, args);
  printFindings(findings, args.json);
  Deno.exit(hasFail(findings) ? 1 : 0);
}

function printHelp(): void {
  console.log(
    [
      'deps/scan-jsr-centralization.ts — report shared JSR deps with divergent version ranges',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/deps/scan-jsr-centralization.ts [flags]',
      '',
      'Flags:',
      '  --json                JSON findings instead of the text report',
      '  --fail-on-violation   emit findings at FAIL level (exit 1 on any finding)',
      '  --help, -h            show this help',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }
  await main();
}
