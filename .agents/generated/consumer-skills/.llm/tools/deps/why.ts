/**
 * deps/why.ts — structured wrapper over `deno why <package>`.
 *
 * `deno why <pkg>` explains *why a package is in the resolved dependency graph*
 * (who pulls it in). That is provenance, not source usage. For the dead-import
 * sweep we combine two signals:
 *   1. SOURCE usage — does any `.ts`/`.tsx` file actually import the specifier?
 *      (this tool greps the workspace for import statements)
 *   2. GRAPH provenance — `deno why` confirms whether removing the import would
 *      drop the package from the graph entirely (i.e. nothing else needs it).
 *
 * A declared import with zero direct source references is a dead-import
 * candidate. If `deno why` ALSO can't find it in the graph (`transitivelyPresent`
 * false), nothing pulls it in at all → safe to prune. If it is still in the graph
 * (transitively needed), pruning the direct mapping is usually safe but verify.
 *
 * Usage:
 *   deno run --allow-read --allow-run .llm/tools/deps/why.ts <package> [--pretty]
 *   deno run --allow-read --allow-run .llm/tools/deps/why.ts @hono/hono --pretty
 */

interface SourceHit {
  file: string;
  line: number;
  text: string;
}

async function grepImports(root: string, pkg: string): Promise<SourceHit[]> {
  const hits: SourceHit[] = [];
  // Match the bare package name inside an import/export-from or dynamic import.
  const needle = pkg;
  const walk = async (dir: string): Promise<void> => {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        if (['node_modules', '.git', '.llm', 'coverage', 'dist'].includes(entry.name)) continue;
        await walk(path);
      } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
        let text: string;
        try {
          text = await Deno.readTextFile(path);
        } catch {
          continue;
        }
        if (!text.includes(needle)) continue;
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            (line.includes('import') || line.includes('export') || line.includes('require')) &&
            line.includes(needle)
          ) {
            hits.push({ file: path.slice(root.length + 1), line: i + 1, text: line.trim() });
          }
        }
      }
    }
  };
  await walk(root);
  return hits;
}

async function denoWhy(pkg: string): Promise<{ code: number; stdout: string }> {
  const command = new Deno.Command('deno', {
    args: ['why', pkg],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  return { code: output.code, stdout: new TextDecoder().decode(output.stdout) };
}

async function main() {
  const argv = Deno.args;
  const pretty = argv.includes('--pretty');
  const pkg = argv.find((arg) => !arg.startsWith('--'));
  if (!pkg) {
    console.error('usage: why.ts <package> [--pretty]');
    Deno.exit(2);
  }
  const root = Deno.cwd();
  const [sourceHits, why] = await Promise.all([grepImports(root, pkg), denoWhy(pkg)]);
  const sourceUsed = sourceHits.length > 0;
  const inGraph = why.code === 0 && why.stdout.trim().length > 0 && !/not found/i.test(why.stdout);
  const result = {
    package: pkg,
    sourceUsed,
    sourceHitCount: sourceHits.length,
    transitivelyPresent: inGraph,
    likelyDeadImport: !sourceUsed,
    fullyRemovable: !sourceUsed && !inGraph,
    sourceHits,
    why: why.stdout,
  };

  if (pretty) {
    console.log(`deps:why ${pkg}`);
    console.log(`  source usage:         ${sourceUsed ? `${sourceHits.length} hit(s)` : 'NONE'}`);
    console.log(`  transitively present: ${inGraph}`);
    if (result.fullyRemovable) {
      console.log('  ⚠ DEAD import — no source usage and not in graph → safe to prune');
    } else if (result.likelyDeadImport) {
      console.log('  ⚠ no direct source usage (transitively present) — verify before pruning');
    }
    for (const hit of sourceHits.slice(0, 10)) {
      console.log(`    ${hit.file}:${hit.line}  ${hit.text}`);
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

function printHelp(): void {
  console.log(
    [
      'deps/why.ts — structured wrapper over `deno why <package>` + source-usage grep',
      '',
      'Usage:',
      '  deno run --allow-read --allow-run .llm/tools/deps/why.ts <package> [--pretty]',
      '',
      'Flags:',
      '  --pretty    human-readable summary instead of JSON',
      '  --help, -h  show this help',
      '',
      'Output (default): JSON { package, sourceUsed, transitivelyPresent, likelyDeadImport, ... }.',
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
