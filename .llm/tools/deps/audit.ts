/**
 * deps/audit.ts — structured wrapper over `deno audit`.
 *
 * `deno audit` checks the resolved dependency graph against the advisory DB.
 * This wrapper runs it at a chosen severity floor and normalizes the result to
 * JSON so CI report lanes and the supervisor read an exit code + advisory list
 * instead of scraping human text.
 *
 * Usage:
 *   deno run --allow-read --allow-net --allow-run .llm/tools/deps/audit.ts [--level critical|high|moderate|low] [--pretty] [--fail-on-find]
 */

function parseArgs(argv: string[]): { level: string; pretty: boolean; failOnFind: boolean } {
  const levelIndex = argv.indexOf('--level');
  return {
    level: levelIndex !== -1 ? argv[levelIndex + 1] ?? 'low' : 'low',
    pretty: argv.includes('--pretty'),
    failOnFind: argv.includes('--fail-on-find'),
  };
}

async function main() {
  const args = parseArgs(Deno.args);
  const command = new Deno.Command('deno', {
    args: ['audit', '--level', args.level],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  const text = `${stdout}\n${stderr}`;

  // `deno audit` exits non-zero when advisories at/above the level are found.
  const advisoriesFound = output.code !== 0;
  // Best-effort count: lines that look like advisory headers (GHSA / "vulnerability").
  const advisoryLines = text.split('\n').filter((line) => /GHSA-|advisory|vulnerab/i.test(line));

  const result = {
    generatedAt: new Date().toISOString(),
    level: args.level,
    exitCode: output.code,
    advisoriesFound,
    advisoryLineCount: advisoryLines.length,
    advisoryLines,
    raw: text.trim(),
  };

  if (args.pretty) {
    console.log(
      `deps:audit (level=${args.level}) — ${advisoriesFound ? 'ADVISORIES FOUND' : 'clean'}`,
    );
    for (const line of advisoryLines) console.log(`  ${line.trim()}`);
    if (!advisoriesFound && advisoryLines.length === 0) {
      console.log('  no advisories at this level');
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }

  if (args.failOnFind && advisoriesFound) Deno.exit(1);
}

function printHelp(): void {
  console.log(
    [
      'deps/audit.ts — structured JSON wrapper over `deno audit`',
      '',
      'Usage:',
      '  deno run --allow-read --allow-net --allow-run .llm/tools/deps/audit.ts [flags]',
      '',
      'Flags:',
      '  --level <critical|high|moderate|low>   severity floor (default: low)',
      '  --pretty                               human-readable output instead of JSON',
      '  --fail-on-find                         exit 1 if advisories are found',
      '  --help, -h                             show this help',
      '',
      'Output (default): JSON { generatedAt, level, exitCode, advisoriesFound, ... }.',
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
