import { copy } from '@std/fs';
import { join, resolve, toFileUrl } from '@std/path';
import { requireNativeCommand } from './command.ts';
import { prepareDesktopFixture } from './fixture-workspace.ts';

function argument(name: string): string {
  const index = Deno.args.indexOf(name);
  const value = index < 0 ? undefined : Deno.args[index + 1];
  if (!value) throw new Error(`Missing required ${name}.`);
  return resolve(value);
}

async function main(): Promise<void> {
  const repoRoot = argument('--repo-root');
  const checkOnly = Deno.args.includes('--check-only');
  const fixtureRoot = await Deno.makeTempDir({
    prefix: 'netscript-desktop-fixture-contract-',
  });
  try {
    const fixture = await prepareDesktopFixture(repoRoot, fixtureRoot, '1.0.0');
    const isolatedSdk = join(fixture.root, 'sdk-source');
    await copy(join(repoRoot, 'packages', 'sdk', 'src'), isolatedSdk, { overwrite: true });
    const denoPath = join(fixture.root, 'deno.json');
    const config = JSON.parse(await Deno.readTextFile(denoPath)) as {
      imports: Record<string, string>;
    };
    config.imports['@netscript/sdk/auto-update'] = toFileUrl(
      join(isolatedSdk, 'auto-update', 'mod.ts'),
    ).href;
    config.imports['@netscript/sdk/desktop'] = toFileUrl(
      join(isolatedSdk, 'desktop', 'mod.ts'),
    ).href;
    await Deno.writeTextFile(denoPath, `${JSON.stringify(config, null, 2)}\n`);
    // Assert the invariant directly instead of relying on `deno check`, which resolves npm
    // specifiers through node_modules and therefore stayed green while the isolated dpkg failed at
    // runtime with `not a dependency and not in import map`. The fixture maps SDK sources by path,
    // so the fixture's import map is the ONLY map the packaged app has: every bare specifier
    // reachable from the mapped SDK entry points must appear in it. That is exactly what #1926 was.
    // Read the FIXTURE's own import map from the repo, not the staged config: prepareDesktopFixture
    // overwrites config.imports with a map synthesized from the workspace root, so the staged copy is
    // not isolated and can never reproduce the packaged app's resolution. The fixture's committed
    // deno.json is the map the dpkg actually ships with.
    const fixtureConfig = JSON.parse(
      await Deno.readTextFile(
        join(repoRoot, 'packages', 'cli', 'e2e', 'fixtures', 'desktop-native', 'deno.json'),
      ),
    ) as { imports: Record<string, string> };
    const mapped = new Set(Object.keys(fixtureConfig.imports));
    // A bare specifier resolves when its PACKAGE NAME is mapped: Deno serves `@scope/pkg/sub` from
    // the `@scope/pkg` entry. Compare on the package name, not the whole specifier.
    const packageName = (spec: string): string => {
      const parts = spec.split('/');
      return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    };
    const resolvable = (spec: string): boolean => {
      if (spec.startsWith('.') || spec.startsWith('/') || spec.includes(':')) return true;
      if (mapped.has(spec) || mapped.has(packageName(spec))) return true;
      for (const key of mapped) if (key.endsWith('/') && spec.startsWith(key)) return true;
      return false;
    };
    const seen = new Set<string>();
    const missing = new Map<string, string>();
    const queue = [
      join(isolatedSdk, 'auto-update', 'mod.ts'),
      join(isolatedSdk, 'desktop', 'mod.ts'),
    ];
    // Collect every specifier form that requires RUNTIME resolution. Matching only
    // `... from '...'` missed two material forms: bare side-effect imports (`import 'x'`) and
    // literal dynamic imports (`import('x')`). Their relative equivalents were invisible to the
    // traversal too, so a module reachable only through one of them was never visited.
    //
    // `import type` / `export type` statements are erased by the compiler and can never produce a
    // runtime resolution failure, so they are stripped before collection rather than matched around.
    const TYPE_ONLY =
      /(?:^|\n)\s*(?:import|export)\s+type\s[\s\S]*?(?:;|\n(?=\s*(?:import|export|const|function|class|type|interface|\/\*|\/\/)))/g;
    const FROM_SPEC = /\bfrom\s*['"]([^'"]+)['"]/g;
    const SIDE_EFFECT = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
    const DYNAMIC = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    // Strip comments first: doc examples contain import statements (e.g. `@my-app/contracts` in
    // sdk/src/desktop/mod.ts) that are not real edges. This is a token-level strip, not a parser —
    // a specifier appearing inside a string literal that looks like a comment could still slip
    // through, which would over-report rather than under-report.
    const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
    const LINE_COMMENT = /(?:^|\n)\s*\/\/[^\n]*/g;
    const collect = (source: string): string[] => {
      const stripped = source
        .replace(BLOCK_COMMENT, '\n')
        .replace(LINE_COMMENT, '\n')
        .replace(TYPE_ONLY, '\n');
      const found: string[] = [];
      for (const re of [FROM_SPEC, SIDE_EFFECT, DYNAMIC]) {
        for (const match of stripped.matchAll(re)) found.push(match[1]);
      }
      return found;
    };
    while (queue.length > 0) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      let source: string;
      try {
        source = await Deno.readTextFile(file);
      } catch {
        continue;
      }
      for (const spec of collect(source)) {
        if (spec.startsWith('.')) {
          queue.push(resolve(join(file, '..'), spec));
          continue;
        }
        if (!resolvable(spec)) missing.set(spec, file);
      }
    }
    if (missing.size > 0) {
      const lines = [...missing].map(([spec, file]) =>
        `  ${spec} — imported by ${file.replace(isolatedSdk, 'packages/sdk/src')}`
      );
      throw new Error(
        `desktop fixture import map cannot satisfy the SDK graph it maps by path.\n` +
          `${lines.join('\n')}\n` +
          `Add each specifier to packages/cli/e2e/fixtures/desktop-native/deno.json ` +
          `at the same pin as packages/sdk/deno.json.`,
      );
    }
    console.log(
      `desktop fixture import map satisfies ${seen.size} reachable SDK modules; 0 unmapped specifiers.`,
    );
    const check = { stdout: '' };
    if (check.stdout.trim()) console.log(check.stdout.trim());
    if (checkOnly) return;
    const test = await requireNativeCommand(Deno.execPath(), [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      join(repoRoot, '.llm', 'tools', 'run-deno-test.ts'),
      '--',
      '--allow-all',
      'tests/fixture-contract.ts',
    ], {
      cwd: fixture.root,
      timeoutMs: 180_000,
    });
    if (test.stdout.trim()) console.log(test.stdout.trim());
  } finally {
    await Deno.remove(fixtureRoot, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

if (import.meta.main) await main();
