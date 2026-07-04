/**
 * run-publish.ts — workspace publish entrypoint used by the release/publish flow
 * (`.github/workflows/publish.yml`) and the `publish`/`publish:dry-run` tasks.
 *
 * Modes: default publish, `--dry-run`, `--preflight`, `--print-jsr-links`, and
 * `--update-release-body`. Perms: matches the publish-workspace surface
 * (--allow-read --allow-run --allow-env, --allow-write for --update-release-body,
 * plus network for the underlying `deno publish`).
 *
 * Usage:
 *   deno run -A .llm/tools/release/run-publish.ts [--dry-run | --preflight]
 *   deno run -A .llm/tools/release/run-publish.ts --print-jsr-links --version <v>
 *   deno run -A .llm/tools/release/run-publish.ts --update-release-body --version <v> \
 *     --body-file <in> --out <out>
 */

import {
  discoverWorkspaceMembers,
  formatJsrLinks,
  publishWorkspace,
  updateReleaseBodyWithJsrLinks,
} from './publish-workspace.ts';

interface Options {
  readonly dryRun: boolean;
  readonly preflight: boolean;
  readonly printJsrLinks: boolean;
  readonly updateReleaseBody: boolean;
  readonly version?: string;
  readonly bodyFile?: string;
  readonly outFile?: string;
}

function printHelp(): void {
  console.log(
    [
      'run-publish.ts — workspace publish entrypoint (release/publish flow)',
      '',
      'Usage:',
      '  deno run -A .llm/tools/release/run-publish.ts [flags]',
      '',
      'Flags:',
      '  --dry-run                run publish in dry-run mode',
      '  --preflight              run publish preflight checks',
      '  --print-jsr-links        print JSR links (requires --version)',
      '  --update-release-body    rewrite a release body with JSR links',
      '                           (requires --version, --body-file, --out)',
      '  --version <v>            release version for link generation',
      '  --body-file <path>      input release body for --update-release-body',
      '  --out <path>            output path for --update-release-body',
      '  --help, -h              show this help',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }

  const options = parseArgs(Deno.args);

  if (options.printJsrLinks) {
    const version = requireVersion(options);
    const members = await discoverWorkspaceMembers();
    await Deno.stdout.write(new TextEncoder().encode(formatJsrLinks(members, version)));
  } else if (options.updateReleaseBody) {
    const version = requireVersion(options);
    if (!options.bodyFile || !options.outFile) {
      throw new Error('--update-release-body requires --body-file and --out.');
    }
    const body = await Deno.readTextFile(options.bodyFile);
    const members = await discoverWorkspaceMembers();
    const updated = updateReleaseBodyWithJsrLinks(body, members, version);
    await Deno.writeTextFile(options.outFile, updated);
  } else if (options.preflight) {
    await publishWorkspace({ mode: 'preflight' });
  } else {
    await publishWorkspace({ mode: options.dryRun ? 'dry-run' : 'publish' });
  }
}

function parseArgs(args: readonly string[]): Options {
  let dryRun = false;
  let preflight = false;
  let printJsrLinks = false;
  let updateReleaseBody = false;
  let version: string | undefined;
  let bodyFile: string | undefined;
  let outFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--preflight') {
      preflight = true;
    } else if (arg === '--print-jsr-links') {
      printJsrLinks = true;
    } else if (arg === '--update-release-body') {
      updateReleaseBody = true;
    } else if (arg === '--version') {
      version = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--body-file') {
      bodyFile = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--out') {
      outFile = readValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (printJsrLinks && updateReleaseBody) {
    throw new Error('--print-jsr-links and --update-release-body cannot be combined.');
  }
  if (preflight && dryRun) {
    throw new Error('--preflight and --dry-run cannot be combined.');
  }

  return { dryRun, preflight, printJsrLinks, updateReleaseBody, version, bodyFile, outFile };
}

function readValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function requireVersion(options: Options): string {
  if (!options.version) {
    throw new Error('--version is required for JSR link generation.');
  }
  return options.version.startsWith('v') ? options.version.slice(1) : options.version;
}
