import { dirname, join, normalize } from '@std/path';

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
  const root = normalize(workspaceRoot);
  const absolutePath = normalize(join(root, relativePath));
  if (absolutePath !== root && !absolutePath.startsWith(`${root}/`)) {
    throw new Error(`Refusing to write outside workspace root: ${relativePath}`);
  }
  return absolutePath;
}
