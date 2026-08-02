import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { PluginSchemaCopyResult } from '../../domain/plugin-kind.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort } from '../../ports/template-port.ts';
import {
  isPrismaTrivia,
  type PrismaDeclaration,
  removePrismaDeclarations,
  scanPrismaDeclarations,
} from './prisma-declaration-scanner.ts';

interface ExistingPrismaDeclaration {
  readonly path: string;
  readonly declaration: PrismaDeclaration;
}

/** Write one collision-checked plugin fragment into the active Prisma schema tree. */
export async function writePluginSchemaFragment(
  projectRoot: string,
  pluginName: string,
  engineDirName: string,
  sourcePath: string,
  content: string,
  fs: FileSystemPort,
  scaffolder: ScaffolderPort,
  overwrite: boolean,
): Promise<PluginSchemaCopyResult> {
  const normalizedSourcePath = sourcePath.replaceAll('\\', '/');
  const fileName = normalizedSourcePath.endsWith(`${SCAFFOLD_DIRS.DATABASE}/schema.prisma`)
    ? `${pluginName}.prisma`
    : normalizedSourcePath.split('/').at(-1) ?? `${pluginName}.prisma`;
  const schemaRoot = join(projectRoot, SCAFFOLD_DIRS.DATABASE, engineDirName, 'schema');
  const targetPath = join(
    schemaRoot,
    SCAFFOLD_DIRS.PLUGINS,
    pluginName,
    fileName,
  );
  const preparedContent = await guardPrismaSchemaFragment(
    schemaRoot,
    pluginName,
    sourcePath,
    content,
    fs,
  );
  const written = preparedContent === null
    ? false
    : await scaffolder.writeFile(targetPath, preparedContent, overwrite);
  return { sourcePath, targetPath, written };
}

async function guardPrismaSchemaFragment(
  schemaRoot: string,
  pluginName: string,
  sourcePath: string,
  content: string,
  fs: FileSystemPort,
): Promise<string | null> {
  const existing = await collectSchemaDeclarations(schemaRoot, fs);
  const incoming = scanPrismaDeclarations(content);
  const seenIncoming = new Map<string, PrismaDeclaration>();
  const redundant: PrismaDeclaration[] = [];

  for (const declaration of incoming) {
    const priorIncoming = seenIncoming.get(declaration.name);
    if (priorIncoming) {
      assertCompatibleDeclaration(
        pluginName,
        sourcePath,
        declaration,
        sourcePath,
        priorIncoming,
      );
      redundant.push(declaration);
      continue;
    }
    seenIncoming.set(declaration.name, declaration);

    const priorDeclarations = existing.get(declaration.name) ?? [];
    for (const prior of priorDeclarations) {
      assertCompatibleDeclaration(
        pluginName,
        sourcePath,
        declaration,
        prior.path,
        prior.declaration,
      );
    }
    if (priorDeclarations.length > 0) redundant.push(declaration);
  }

  if (redundant.length === 0) return content;
  const deduplicated = removePrismaDeclarations(content, redundant);
  return isPrismaTrivia(deduplicated) ? null : deduplicated;
}

async function collectSchemaDeclarations(
  schemaRoot: string,
  fs: FileSystemPort,
): Promise<Map<string, ExistingPrismaDeclaration[]>> {
  const declarations = new Map<string, ExistingPrismaDeclaration[]>();
  if (!(await fs.exists(schemaRoot))) return declarations;

  for await (const entry of fs.walk(schemaRoot)) {
    if (!entry.isFile || !entry.path.endsWith('.prisma')) continue;
    for (const declaration of scanPrismaDeclarations(await fs.readFile(entry.path))) {
      const matches = declarations.get(declaration.name) ?? [];
      matches.push({ path: entry.path.replaceAll('\\', '/'), declaration });
      declarations.set(declaration.name, matches);
    }
  }
  return declarations;
}

function assertCompatibleDeclaration(
  pluginName: string,
  fragmentPath: string,
  incoming: PrismaDeclaration,
  existingPath: string,
  existing: PrismaDeclaration,
): void {
  if (incoming.normalizedBody === existing.normalizedBody) return;
  throw new ScaffoldValidationError(
    `Plugin "${pluginName}" schema fragment "${fragmentPath}" declares ${incoming.kind} ` +
      `"${incoming.name}", which conflicts with its declaration in "${existingPath}".`,
    {
      pluginName,
      fragmentPath,
      declarationKind: incoming.kind,
      declarationName: incoming.name,
      existingPath,
    },
  );
}
