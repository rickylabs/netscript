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

function describeCatalog(use: DependencyUse, catalog: Record<string, string>): string {
  const catalogVersion = catalog[use.name];
  if (!catalogVersion) return 'no root catalog entry exists';
  if (use.range && use.range !== catalogVersion) {
    return `catalog has ${catalogVersion}, inline use has ${use.range}`;
  }
  return `catalog has ${catalogVersion}`;
}

/** Analyze npm dependency uses that should flow through package.json catalog refs. */
export function analyzeNpmCatalogCompliance(
  dependencies: DependencyUse[],
  catalog: Record<string, string>,
  args: Args,
): Finding[] {
  const findings: Finding[] = [];
  for (const use of dependencies) {
    if (use.registry !== 'npm') continue;
    if (use.source === 'package.json' && use.raw === 'catalog:') {
      if (!use.catalogVersion) {
        findings.push({
          ref: 'DEPS-NPM-CATALOG',
          level: findingLevel(args),
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
      level: findingLevel(args),
      message: `${use.member.root} uses ${use.raw} outside package.json catalog: (${
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

await main();
