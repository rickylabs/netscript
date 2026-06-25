interface Options {
  readonly tag: string;
  readonly target: string;
  readonly notesFile: string;
  readonly repo: string;
  readonly prerelease: boolean;
  readonly dryRun: boolean;
}

type JsonObject = Record<string, unknown>;

const DEFAULT_REPO = 'rickylabs/netscript';
const TAG_PATTERN = /^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const options = parseArgs(Deno.args);
await validateRelease(options);

const argv = buildReleaseArgs(options);
if (options.dryRun) {
  console.log(`would run: gh ${argv.join(' ')}`);
  Deno.exit(0);
}

const result = await new Deno.Command('gh', {
  args: argv,
  stdout: 'inherit',
  stderr: 'inherit',
}).output();
Deno.exit(result.code);

function parseArgs(args: readonly string[]): Options {
  let tag: string | undefined;
  let target = 'main';
  let notesFile: string | undefined;
  let repo = DEFAULT_REPO;
  let prerelease: boolean | undefined;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--tag') {
      tag = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--target') {
      target = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--notes-file') {
      notesFile = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--repo') {
      repo = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--prerelease') {
      prerelease = true;
    } else if (arg === '--no-prerelease') {
      prerelease = false;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!tag) {
    throw new Error('--tag is required.');
  }
  if (!notesFile) {
    throw new Error('--notes-file is required.');
  }

  return {
    tag,
    target,
    notesFile,
    repo,
    prerelease: prerelease ?? isDefaultPrerelease(tag),
    dryRun,
  };
}

function readValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

async function validateRelease(optionsToValidate: Options): Promise<void> {
  if (!TAG_PATTERN.test(optionsToValidate.tag)) {
    throw new Error(
      `Invalid tag ${optionsToValidate.tag}; expected vMAJOR.MINOR.PATCH[-PRERELEASE].`,
    );
  }

  const workspaceVersion = await readWorkspaceVersion(Deno.cwd());
  const tagVersion = optionsToValidate.tag.slice(1);
  if (workspaceVersion !== tagVersion) {
    throw new Error(
      `Release tag version ${tagVersion} does not match workspace version ${workspaceVersion}.`,
    );
  }

  let notes;
  try {
    notes = await Deno.readTextFile(optionsToValidate.notesFile);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Notes file not found: ${optionsToValidate.notesFile}`);
    }
    throw error;
  }
  if (notes.trim().length === 0) {
    throw new Error(`Notes file is empty: ${optionsToValidate.notesFile}`);
  }
}

async function readWorkspaceVersion(root: string): Promise<string> {
  const denoJsonPath = `${root}/deno.json`;
  const denoJsoncPath = `${root}/deno.jsonc`;
  const source = await readFirstExisting(denoJsonPath, denoJsoncPath);
  const config = parseJsonObject(stripJsonComments(source.text), source.path);
  if (typeof config.version !== 'string') {
    throw new Error(`${source.path} is missing a string version.`);
  }
  return config.version;
}

async function readFirstExisting(
  firstPath: string,
  secondPath: string,
): Promise<{ readonly path: string; readonly text: string }> {
  try {
    return { path: firstPath, text: await Deno.readTextFile(firstPath) };
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  return { path: secondPath, text: await Deno.readTextFile(secondPath) };
}

function parseJsonObject(source: string, path: string): JsonObject {
  const parsed: unknown = JSON.parse(source);
  if (!isJsonObject(parsed)) {
    throw new Error(`${path} must contain a JSON object.`);
  }
  return parsed;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripJsonComments(source: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (inString) {
      output += current;
      if (current === '"' && !escaped) {
        inString = false;
      }
      escaped = current === '\\' ? !escaped : false;
      continue;
    }

    if (current === '"') {
      inString = true;
      output += current;
    } else if (current === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      output += '\n';
    } else if (current === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index += 1;
    } else {
      output += current;
    }
  }
  return output;
}

function isDefaultPrerelease(tag: string): boolean {
  return tag.includes('-alpha') || tag.includes('-beta') || tag.includes('-rc');
}

function buildReleaseArgs(optionsToBuild: Options): string[] {
  const args = [
    'release',
    'create',
    optionsToBuild.tag,
    '--target',
    optionsToBuild.target,
    '--notes-file',
    optionsToBuild.notesFile,
    '--repo',
    optionsToBuild.repo,
    '--title',
    optionsToBuild.tag,
  ];
  if (optionsToBuild.prerelease) {
    args.push('--prerelease');
  }
  return args;
}
