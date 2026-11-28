#!/usr/bin/env -S deno run --allow-read
/**
 * Report npm dependencies that bypass the root catalog.
 *
 * Detection intentionally anchors on real dependency surfaces only:
 * package.json dependency maps, deno.json imports/scopes, and source
 * import/export specifiers. Known string-literal npm values in
 * packages/cli/src/kernel/constants/windows.ts and
 * packages/fresh-ui/registry.manifest.ts are not scanned because they are data
 * values, not runtime imports.
 */
import {
  collectWorkspaceFacts,
  type DependencyUse,
  type Finding,
  hasFail,
  printFindings,
} from './workspace.ts';

export interface ScanNpmCatalogArgs {
  json: boolean;
  failOnViolation: boolean;
  failOnPackagePrefixes: readonly string[];
}

export function parseArgs(argv: readonly string[]): ScanNpmCatalogArgs {
  const failOnPackagePrefixes: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--fail-on-package-prefix=')) {
      const value = arg.slice('--fail-on-package-prefix='.length).trim();
      if (!value) {
        throw new Error('--fail-on-package-prefix requires a non-empty package prefix');
      }
      failOnPackagePrefixes.push(value);
      continue;
    }
    if (arg === '--fail-on-package-prefix') {
      const value = argv[i + 1]?.trim();
      if (!value || value.startsWith('--')) {
        throw new Error('--fail-on-package-prefix requires a non-empty package prefix');
      }
      failOnPackagePrefixes.push(value);
      i += 1;
    }
  }
  return {
    json: argv.includes('--json'),
    failOnViolation: argv.includes('--fail-on-violation'),
    failOnPackagePrefixes,
  };
}

function findingLevel(args: ScanNpmCatalogArgs, packageName: string): 'WARN' | 'FAIL' {
  if (args.failOnViolation) return 'FAIL';
  if (args.failOnPackagePrefixes.some((prefix) => packageName.startsWith(prefix))) {
    return 'FAIL';
  }
  return 'WARN';
}

function describeCatalog(use: DependencyUse, catalog: Record<string, string>): string {
  const catalogVersion = catalog[use.name];
  if (!catalogVersion) return 'no root catalog entry exists';
  if (use.range && use.range !== catalogVersion) {
    return `catalog has ${catalogVersion}, inline use has ${use.range}`;
  }
  return `catalog has ${catalogVersion}`;
}

/** Analyze npm dependency uses that should flow through catalog: refs. */
export function analyzeNpmCatalogCompliance(
  dependencies: DependencyUse[],
  catalog: Record<string, string>,
  args: ScanNpmCatalogArgs,
): Finding[] {
  const findings: Finding[] = [];
  for (const use of dependencies) {
    if (use.registry !== 'npm') continue;
    if (
      (use.source === 'package.json' || use.source === 'deno.imports' ||
        use.source === 'deno.scopes') &&
      use.raw === 'catalog:'
    ) {
      if (!use.catalogVersion) {
        findings.push({
          ref: 'DEPS-NPM-CATALOG',
          level: findingLevel(args, use.name),
          message:
            `${use.member.root} declares ${use.name} as catalog: but the root catalog has no matching entry`,
          path: use.path,
          line: use.line,
        });
      }
      continue;
    }
    findings.push({
      ref: 'DEPS-NPM-CATALOG',
      level: findingLevel(args, use.name),
      message: `${use.member.root} uses ${use.raw} outside catalog: (${
        describeCatalog(use, catalog)
      })`,
      path: use.path,
      line: use.line,
    });
  }
  return findings.sort((a, b) => `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`));
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const facts = await collectWorkspaceFacts();
  const findings = analyzeNpmCatalogCompliance(facts.dependencies, facts.catalog, args);
  printFindings(findings, args.json);
  Deno.exit(hasFail(findings) ? 1 : 0);
}

function printHelp(): void {
  console.log(
    [
      'deps/scan-npm-catalog-compliance.ts — report npm deps that bypass the root catalog',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/deps/scan-npm-catalog-compliance.ts [flags]',
      '',
      'Flags:',
      '  --json                                  JSON findings instead of the text report',
      '  --fail-on-violation                     emit all findings at FAIL level (exit 1 on any finding)',
      '  --fail-on-package-prefix=<prefix>       emit FAIL for findings matching package prefix (repeatable)',
      '  --help, -h                              show this help',
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
