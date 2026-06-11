#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * Audit every `packages/*` (and optionally `plugins/*`) for JSR + doctrine
 * readiness, writing one JSON report per package and a roll-up summary.
 *
 * Usage:
 *   deno run -A .llm/tools/fitness/audit-all-packages.ts \
 *     --out  .llm/tmp/run/<run-id>/audit \
 *     [--include-plugins] [--no-dry-run]
 */
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';

const args = parseArgs(Deno.args, {
  string: ['out'],
  boolean: ['include-plugins', 'no-dry-run'],
  default: { out: '.llm/tmp/run/audit', 'include-plugins': false, 'no-dry-run': false },
});

const OUT = args.out as string;
await Deno.mkdir(OUT, { recursive: true });

const targets: string[] = [];
for await (const e of Deno.readDir('packages')) {
  if (e.isDirectory) targets.push(`packages/${e.name}`);
}
if (args['include-plugins']) {
  for await (const e of Deno.readDir('plugins')) {
    if (e.isDirectory) targets.push(`plugins/${e.name}`);
  }
}

const summary: { name: string; root: string; ok: boolean; failCount: number; warnCount: number; loc: number; outFile: string }[] = [];

for (const t of targets) {
  const name = t.split('/').pop()!;
  const outFile = `${OUT}/${t.replace('/', '__')}.json`;
  console.log(`\n=== ${t} ===`);
  const cmd = new Deno.Command('deno', {
    args: [
      'run', '-A', '.llm/tools/fitness/audit-jsr-package.ts',
      '--root', t, '--out', outFile,
      ...(args['no-dry-run'] ? ['--no-dry-run'] : []),
    ],
    stdout: 'piped',
    stderr: 'piped',
  });
  const r = await cmd.output();
  const stdout = new TextDecoder().decode(r.stdout);
  const stderr = new TextDecoder().decode(r.stderr);
  console.log(stdout);
  if (!r.success && !stdout) console.error(stderr.split('\n').slice(-20).join('\n'));
  try {
    const rep = JSON.parse(await Deno.readTextFile(outFile));
    const failCount = rep.gates.filter((g: {level: string}) => g.level === 'FAIL').length;
    const warnCount = rep.gates.filter((g: {level: string}) => g.level === 'WARN').length;
    summary.push({
      name,
      root: t,
      ok: failCount === 0 && rep.slowTypes.ok,
      failCount,
      warnCount,
      loc: rep.files.loc,
      outFile,
    });
  } catch {
    summary.push({ name, root: t, ok: false, failCount: -1, warnCount: -1, loc: -1, outFile });
  }
}

await Deno.writeTextFile(`${OUT}/_summary.json`, JSON.stringify(summary, null, 2));
console.log('\n# JSR Audit Summary');
console.log('| Package | LOC | FAIL | WARN | Ready? |');
console.log('|---|---:|---:|---:|---|');
for (const s of summary) {
  console.log(
    `| ${s.name.padEnd(24)} | ${String(s.loc).padStart(6)} | ${
      String(s.failCount).padStart(4)
    } | ${String(s.warnCount).padStart(4)} | ${s.ok ? '✅' : '❌'} |`,
  );
}
