/**
 * check-scaffold-versions.ts — E-12 / LD-7 fitness guard.
 *
 * `netscript init` generates `AppHost.csproj` / `global.json` from the version
 * literals in `SCAFFOLD_VERSIONS`. If any of those pins carries a prerelease
 * suffix (`-preview`, `-beta`, `-rc`, `-alpha`, `-dev`, `-nightly`, ...), every
 * scaffolded app would default to a preview SDK. This guard asserts the pinned
 * versions are stable (no SemVer prerelease segment) so we never ship a preview
 * default into a user's scaffold.
 *
 * Single responsibility: prerelease detection on the scaffold version constant.
 * Catalog parity for Deno deps is enforced structurally by sourcing scaffold
 * pins from the root catalog (see `generate-app-deno-json.ts`), not here.
 *
 * Usage:
 *   deno run .llm/tools/validation/check-scaffold-versions.ts [--aspire-only] [--pretty] [--quiet] [--help]
 *
 * Exit codes: 0 = all pins stable · 1 = at least one prerelease pin (E-12 FAIL).
 *
 * Perms: none — static import only, no runtime `--allow-*` required (safe as a CI gate).
 */
import { SCAFFOLD_VERSIONS } from '../../../packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts';

/** Keys whose pins feed the Aspire/.NET scaffold surface (LD-7 scope). */
const ASPIRE_KEYS = new Set<string>([
  'ASPIRE_SDK',
  'ASPIRE_HOSTING_DENO',
  'ASPIRE_HOSTING_SQLITE',
  'SCALAR_ASPIRE',
]);

interface Args {
  aspireOnly: boolean;
  pretty: boolean;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  return {
    aspireOnly: argv.includes('--aspire-only'),
    pretty: argv.includes('--pretty'),
    quiet: argv.includes('--quiet'),
  };
}

/**
 * SemVer prerelease = the dot-separated identifiers after the first `-` and
 * before any `+build` metadata. Returns the prerelease segment, or null when
 * the version is a stable release.
 */
function prereleaseOf(version: string): string | null {
  const core = version.split('+', 1)[0];
  const dash = core.indexOf('-');
  return dash === -1 ? null : core.slice(dash + 1);
}

function main(): void {
  const args = parseArgs(Deno.args);

  const entries = Object.entries(SCAFFOLD_VERSIONS as Record<string, string>)
    .filter(([key]) => !args.aspireOnly || ASPIRE_KEYS.has(key));

  const violations = entries
    .map(([key, version]) => ({
      key,
      version,
      prerelease: prereleaseOf(version),
      aspire: ASPIRE_KEYS.has(key),
    }))
    .filter((row) => row.prerelease !== null);

  const ok = violations.length === 0;
  const report = {
    gate: 'E-12',
    ok,
    scope: args.aspireOnly ? 'aspire-only' : 'all-scaffold-pins',
    checked: entries.length,
    violations,
  };

  if (!args.quiet) {
    if (args.pretty) {
      if (ok) {
        console.log(
          `E-12 OK — ${entries.length} scaffold pin(s) are stable (no prerelease suffix).`,
        );
      } else {
        console.error(
          `E-12 FAIL — ${violations.length} scaffold pin(s) carry a prerelease suffix:`,
        );
        for (const v of violations) {
          console.error(`  ${v.key} = ${v.version}  (prerelease: ${v.prerelease})`);
        }
      }
    } else {
      console.log(JSON.stringify(report));
    }
  }

  Deno.exit(ok ? 0 : 1);
}

function printHelp(): void {
  console.log(
    [
      'check-scaffold-versions.ts — E-12 / LD-7 guard: scaffold version pins must be stable',
      '',
      'Usage:',
      '  deno run .llm/tools/validation/check-scaffold-versions.ts [flags]',
      '',
      'Flags:',
      '  --aspire-only   only check the Aspire/.NET scaffold pins (LD-7 scope)',
      '  --pretty        human-readable output instead of JSON',
      '  --quiet         suppress the report (exit code only)',
      '  --help, -h      show this help',
      '',
      'Exit codes: 0 = all pins stable · 1 = at least one prerelease pin (E-12 FAIL).',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }
  main();
}
