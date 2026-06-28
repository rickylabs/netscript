interface PlannedFile {
  readonly path: string;
  readonly content: string;
}

interface WritePlanResult {
  readonly createdFiles: readonly string[];
  readonly modifiedFiles: readonly string[];
}

/** Write planned files beneath a workspace root without duplicating unchanged content. */
export async function writePlannedFiles(
  workspaceRoot: string,
  files: readonly PlannedFile[],
  dryRun: boolean,
): Promise<WritePlanResult> {
  const createdFiles: string[] = [];
  const modifiedFiles: string[] = [];

  for (const file of files) {
    const absolutePath = safeJoin(workspaceRoot, file.path);
    const existing = await readExistingText(absolutePath);
    if (existing === file.content) {
      continue;
    }

    if (existing === undefined) {
      createdFiles.push(file.path);
    } else {
      modifiedFiles.push(file.path);
    }

    if (!dryRun) {
      await Deno.mkdir(dirname(absolutePath), { recursive: true });
      await Deno.writeTextFile(absolutePath, file.content);
    }
  }

  return { createdFiles, modifiedFiles };
}

async function readExistingText(path: string): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return undefined;
    }
    throw error;
  }
}

function safeJoin(workspaceRoot: string, relativePath: string): string {
  const root = normalizePath(workspaceRoot);
  const absolutePath = normalizePath(`${root}/${relativePath}`);
  const rootPrefix = root.endsWith('/') ? root : `${root}/`;
  if (absolutePath !== root && !absolutePath.startsWith(rootPrefix)) {
    throw new Error(`Refusing to write outside workspace root: ${relativePath}`);
  }
  return absolutePath;
}

function dirname(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('/');
  if (index <= 0) {
    return normalized.startsWith('/') ? '/' : '.';
  }
  return normalized.slice(0, index);
}

function normalizePath(path: string): string {
  const unixPath = path.replaceAll('\\', '/');
  const isAbsolute = unixPath.startsWith('/');
  const prefix = isAbsolute ? '/' : '';
  const parts: string[] = [];

  for (const part of unixPath.split('/')) {
    if (part.length === 0 || part === '.') {
      continue;
    }
    if (part === '..') {
      if (parts.length === 0) {
        if (!isAbsolute) {
          parts.push(part);
        }
        continue;
      }
      if (parts.at(-1) === '..') {
        parts.push(part);
      } else {
        parts.pop();
      }
      continue;
    }
    parts.push(part);
  }

  const normalized = `${prefix}${parts.join('/')}`;
  return normalized.length > 0 ? normalized : isAbsolute ? '/' : '.';
}
