/**
 * deps/outdated.ts — structured wrapper over `deno outdated`.
 *
 * `deno outdated` has no `--json` flag, and its `--latest` view includes
 * pre-release tags (see deps/latest.ts for why that misleads). This wrapper runs
 * `deno outdated --recursive [--latest]`, parses the box-drawing table into JSON,
 * and (for the --latest view) flags rows whose "Latest" is a pre-release so a
 * reader does not mistake `2.3.0-dev.*` for a real release.
 *
 * Use deps/latest.ts for the authoritative "latest stable" decision; use this for
 * the lock-aware inventory (it surfaces transitive/locked entries latest.ts does
 * not, because it reads the resolved graph rather than declared imports).
 *
 * Usage:
 *   deno run --allow-read --allow-run .llm/tools/deps/outdated.ts [--latest] [--pretty]
 */

interface Row {
  package: string;
  current: string;
  update: string;
  latest: string;
  latestIsPrerelease: boolean;
}

function parseArgs(argv: string[]): { latest: boolean; pretty: boolean } {
  return { latest: argv.includes('--latest'), pretty: argv.includes('--pretty') };
}

function parseTable(stdout: string): Row[] {
  const rows: Row[] = [];
  for (const line of stdout.split('\n')) {
    if (!line.includes('│')) continue;
    const cells = line.split('│').map((cell) => cell.trim()).filter((cell) => cell.length > 0);
    if (cells.length < 4) continue;
    if (cells[0].toLowerCase() === 'package') continue; // header
    const [pkg, current, update, latest] = cells;
    rows.push({
      package: pkg,
      current,
      update,
      latest,
      latestIsPrerelease: latest.includes('-'),
    });
  }
  return rows;
}

async function main() {
  const args = parseArgs(Deno.args);
  const cmdArgs = ['outdated', '--recursive'];
  if (args.latest) cmdArgs.push('--latest');
  const command = new Deno.Command('deno', { args: cmdArgs, stdout: 'piped', stderr: 'piped' });
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const rows = parseTable(stdout);
  const result = {
    generatedAt: new Date().toISOString(),
    mode: args.latest ? 'latest' : 'compatible',
    count: rows.length,
    prereleaseLatest: rows.filter((row) => row.latestIsPrerelease).map((row) => row.package),
    rows,
  };

  if (args.pretty) {
    console.log(`deps:outdated (${result.mode}) — ${rows.length} rows`);
    for (const row of rows) {
      const warn = row.latestIsPrerelease ? '  [prerelease — use deps:latest]' : '';
      console.log(`  ${row.package}  ${row.current} → ${row.latest}${warn}`);
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  Deno.exit(output.code);
}

await main();
