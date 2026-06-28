interface PlannedFile {
  readonly path: string;
  readonly content: string;
}

interface WritePlanResult {
  readonly createdFiles: readonly string[];
  readonly modifiedFiles: readonly string[];
}

interface PlannedWrite {
  readonly absolutePath: string;
  readonly content: string;
  readonly existing: string | undefined;
}

/** Write planned files beneath a workspace root without duplicating unchanged content. */
export async function writePlannedFiles(
  workspaceRoot: string,
  files: readonly PlannedFile[],
  dryRun: boolean,
): Promise<WritePlanResult> {
  const createdFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const writes: PlannedWrite[] = [];

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

    writes.push({
      absolutePath,
      content: file.content,
      existing,
    });
  }

  if (!dryRun) {
    await applyWrites(writes);
  }

  return { createdFiles, modifiedFiles };
}

async function applyWrites(writes: readonly PlannedWrite[]): Promise<void> {
  const applied: PlannedWrite[] = [];
  try {
    for (const write of writes) {
      await Deno.mkdir(dirname(write.absolutePath), { recursive: true });
      await Deno.writeTextFile(write.absolutePath, write.content);
      applied.push(write);
    }
  } catch (error) {
    await rollbackWrites(applied);
    throw error;
  }
}

async function rollbackWrites(writes: readonly PlannedWrite[]): Promise<void> {
  for (const write of [...writes].reverse()) {
    try {
      if (write.existing === undefined) {
        await Deno.remove(write.absolutePath);
      } else {
        await Deno.writeTextFile(write.absolutePath, write.existing);
      }
    } catch {
      // Preserve the original scaffold failure; rollback is best-effort cleanup.
    }
  }
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
