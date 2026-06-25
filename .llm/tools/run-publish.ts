import {
  discoverWorkspaceMembers,
  formatJsrLinks,
  publishWorkspace,
  updateReleaseBodyWithJsrLinks,
} from './publish-workspace.ts';

interface Options {
  readonly dryRun: boolean;
  readonly printJsrLinks: boolean;
  readonly updateReleaseBody: boolean;
  readonly version?: string;
  readonly bodyFile?: string;
  readonly outFile?: string;
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
} else {
  await publishWorkspace({ mode: options.dryRun ? 'dry-run' : 'publish' });
}

function parseArgs(args: readonly string[]): Options {
  let dryRun = false;
  let printJsrLinks = false;
  let updateReleaseBody = false;
  let version: string | undefined;
  let bodyFile: string | undefined;
  let outFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      dryRun = true;
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

  return { dryRun, printJsrLinks, updateReleaseBody, version, bodyFile, outFile };
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
