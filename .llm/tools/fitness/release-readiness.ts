#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * Release readiness — run every readiness evaluator against every
 * `@netscript/*` package and produce a unified roll-up.
 *
 * Evaluators:
 *   • JSR readiness         (.llm/tools/fitness/audit-jsr-package.ts)
 *   • Doctrine readiness    (.llm/tools/fitness/check-doctrine.ts)
 *   • Standards readiness   (.llm/tools/fitness/check-netscript-standards.ts)
 *   • CLI fitness gates     (.llm/tools/fitness/check-cli-*.ts) — only the
 *                           CLI package
 *
 * Usage:
 *   deno run -A .llm/tools/fitness/release-readiness.ts \
 *     --out  .llm/tmp/run/<run-id>/audit/readiness \
 *     [--include-plugins] [--no-dry-run]
 *
 * Output:
 *   <out>/jsr/<pkg>.json
 *   <out>/doctrine/<pkg>.json
 *   <out>/standards/<pkg>.json
 *   <out>/_summary.md
 */
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';

const args = parseArgs(Deno.args, {
  string: ['out'],
  boolean: ['include-plugins', 'no-dry-run'],
  default: { out: '.llm/tmp/run/audit/readiness', 'include-plugins': false, 'no-dry-run': false },
});
const OUT = args.out as string;
await Deno.mkdir(`${OUT}/jsr`, { recursive: true });
await Deno.mkdir(`${OUT}/doctrine`, { recursive: true });
await Deno.mkdir(`${OUT}/standards`, { recursive: true });

const targets: string[] = [];
for await (const e of Deno.readDir('packages')) if (e.isDirectory) targets.push(`packages/${e.name}`);
if (args['include-plugins']) {
  for await (const e of Deno.readDir('plugins')) if (e.isDirectory) targets.push(`plugins/${e.name}`);
}

interface Row {
  target: string;
  jsr: { fail: number; warn: number };
  doctrine: { fail: number; warn: number; info: number };
  standards: { fail: number; warn: number; info: number };
  totalFail: number;
  totalWarn: number;
  ready: boolean;
}
const rows: Row[] = [];

for (const t of targets) {
  const safe = t.replace('/', '__');
  console.log(`\n=== ${t} ===`);
  // JSR
  const jsrOut = `${OUT}/jsr/${safe}.json`;
  await runTool('audit-jsr-package.ts', [
    '--root', t, '--out', jsrOut,
    ...(args['no-dry-run'] ? ['--no-dry-run'] : []),
  ]);
  // Doctrine
  const docOut = `${OUT}/doctrine/${safe}.json`;
  await runTool('check-doctrine.ts', ['--root', t, '--out', docOut]);
  // Standards
  const stdOut = `${OUT}/standards/${safe}.json`;
  await runTool('check-netscript-standards.ts', ['--root', t, '--out', stdOut]);

  const jsr = await readJson(jsrOut);
  const doctrine = await readJson(docOut);
  const standards = await readJson(stdOut);
  const jsrFail = (jsr?.gates as { level: string }[] | undefined)?.filter((g) => g.level === 'FAIL').length ?? 0;
  const jsrWarn = (jsr?.gates as { level: string }[] | undefined)?.filter((g) => g.level === 'WARN').length ?? 0;
  const docTotals = doctrine?.totals as { fail?: number; warn?: number; info?: number } | undefined;
  const docF = docTotals?.fail ?? 0;
  const docW = docTotals?.warn ?? 0;
  const docI = docTotals?.info ?? 0;
  const stdTotals = standards?.totals as { fail?: number; warn?: number; info?: number } | undefined;
  const stdF = stdTotals?.fail ?? 0;
  const stdW = stdTotals?.warn ?? 0;
  const stdI = stdTotals?.info ?? 0;
  const totalFail = jsrFail + docF + stdF;
  const totalWarn = jsrWarn + docW + stdW;
  const dryOk = (jsr?.slowTypes as { ok?: boolean } | undefined)?.ok ?? false;
  rows.push({
    target: t,
    jsr: { fail: jsrFail, warn: jsrWarn },
    doctrine: { fail: docF, warn: docW, info: docI },
    standards: { fail: stdF, warn: stdW, info: stdI },
    totalFail,
    totalWarn,
    ready: totalFail === 0 && (args['no-dry-run'] || dryOk),
  });
}

// Markdown roll-up
const lines: string[] = [];
lines.push('# Release readiness roll-up\n');
lines.push(`Generated ${new Date().toISOString()} by \`.llm/tools/fitness/release-readiness.ts\`\n`);
lines.push('## Per-target totals (FAIL + WARN across JSR + Doctrine + Standards)\n');
lines.push('| Target | JSR fail/warn | Doctrine fail/warn/info | Standards fail/warn/info | Total fail | Total warn | Ready? |');
lines.push('|---|---|---|---|---:|---:|---|');
const sorted = [...rows].sort((a, b) => b.totalFail - a.totalFail || b.totalWarn - a.totalWarn);
for (const r of sorted) {
  lines.push(
    `| ${r.target} | ${r.jsr.fail}/${r.jsr.warn} | ${r.doctrine.fail}/${r.doctrine.warn}/${r.doctrine.info} | ${r.standards.fail}/${r.standards.warn}/${r.standards.info} | ${r.totalFail} | ${r.totalWarn} | ${r.ready ? '✅' : '❌'} |`,
  );
}
lines.push('\n## Detail files\n');
for (const r of rows) {
  const safe = r.target.replace('/', '__');
  lines.push(`- **${r.target}**`);
  lines.push(`  - \`${OUT}/jsr/${safe}.json\``);
  lines.push(`  - \`${OUT}/doctrine/${safe}.json\``);
  lines.push(`  - \`${OUT}/standards/${safe}.json\``);
}
await Deno.writeTextFile(`${OUT}/_summary.md`, lines.join('\n'));
console.log(`\nSummary: ${OUT}/_summary.md`);
console.log(`Ready: ${rows.filter((r) => r.ready).length}/${rows.length}`);

async function runTool(tool: string, args: string[]) {
  const cmd = new Deno.Command('deno', {
    args: ['run', '-A', `.llm/tools/fitness/${tool}`, ...args],
    stdout: 'piped',
    stderr: 'piped',
  });
  const r = await cmd.output();
  if (!r.success && r.code !== 1) {
    // exit code 1 is allowed (FAIL findings); other codes are tool errors
    const stderr = new TextDecoder().decode(r.stderr);
    console.error(`tool ${tool} errored:`, stderr.split('\n').slice(-10).join('\n'));
  }
}
async function readJson(p: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await Deno.readTextFile(p));
  } catch {
    return null;
  }
}
