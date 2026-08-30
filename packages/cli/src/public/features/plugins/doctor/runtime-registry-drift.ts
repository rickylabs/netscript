import { dirname, relative, resolve } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { GeneratedPluginRegistry } from '../../generate/plugins/generate-installed-plugin-registries.ts';
import type { PluginDoctorCheck } from './doctor-plugin-use-case.ts';

const CHECK_PREFIX = 'runtime-registry';
const CHECK_TITLE = 'Manifest-declared runtime registry matches source';
const GENERATOR_CHECK_TITLE = 'Generator-selected runtime registry matches source';
const REMEDIATION = 'Run: netscript generate plugins';
const EVIDENCE_BOUNDARY =
  'This verifies manifest-declared runtime registry sources only; no non-registry runtime topology was verified.';
const GENERATOR_EVIDENCE_BOUNDARY =
  'This verifies generator-selected runtime registry sources only; no non-registry runtime topology was verified.';

/** Input for manifest-backed runtime registry drift checks. */
export interface RuntimeRegistryDriftInput {
  readonly fs: FileSystemPort;
  readonly projectRoot: string;
  readonly registries: readonly GeneratedPluginRegistry[];
}

interface RuntimeRegistryImport {
  readonly bindings: readonly string[];
  readonly end: number;
  readonly path: string;
}

/** Compare generated runtime registry bindings with manifest-discovered source files. */
export async function checkRuntimeRegistryDrift(
  input: RuntimeRegistryDriftInput,
): Promise<readonly PluginDoctorCheck[]> {
  if (input.registries.length === 0) {
    return [{
      id: `${CHECK_PREFIX}:no-targets`,
      title: CHECK_TITLE,
      status: 'healthy',
      message:
        `No manifest-declared runtime registry targets were discovered. ${EVIDENCE_BOUNDARY}`,
    }];
  }

  return await Promise.all(input.registries.map(async (registry) => {
    const generatorSelected = registry.sourceAuthority === 'generator';
    const sourceDescription = generatorSelected ? 'generator-selected' : 'manifest-discovered';
    const declaredDescription = generatorSelected ? 'generator-selected' : 'manifest-declared';
    const title = generatorSelected ? GENERATOR_CHECK_TITLE : CHECK_TITLE;
    const evidenceBoundary = generatorSelected ? GENERATOR_EVIDENCE_BOUNDARY : EVIDENCE_BOUNDARY;
    const expected = new Set(
      (registry.sourceFiles ?? []).map(normalizeProjectPath),
    );
    const registryPath = normalizeProjectPath(registry.path);
    const absoluteRegistryPath = resolve(input.projectRoot, registry.path);
    const registryExists = await input.fs.exists(absoluteRegistryPath);
    const source = registryExists ? await input.fs.readFile(absoluteRegistryPath) : '';
    const actual = registrySourceFiles(
      input.projectRoot,
      absoluteRegistryPath,
      source,
    );
    const missing = [...expected].filter((path) => !actual.has(path)).sort();
    const orphaned = [...actual].filter((path) => !expected.has(path)).sort();

    if (!registryExists || missing.length > 0 || orphaned.length > 0) {
      const details = [
        ...(!registryExists ? [`Generated registry does not exist: ${registryPath}.`] : []),
        ...missing.map((path) =>
          `Missing generated entry for ${sourceDescription} source: ${path}.`
        ),
        ...orphaned.map((path) => `Registry entry has no ${sourceDescription} source: ${path}.`),
      ].join(' ');
      return {
        id: `${CHECK_PREFIX}:${registryPath}`,
        title,
        status: 'error' as const,
        message: `${registryPath}: ${details} ${REMEDIATION}`,
      };
    }

    const files = [...expected].sort();
    const noun = files.length === 1 ? 'source file' : 'source files';
    const evidence = files.length > 0 ? `: ${files.join(', ')}` : '';
    return {
      id: `${CHECK_PREFIX}:${registryPath}`,
      title,
      status: 'healthy' as const,
      message:
        `Verified ${registryPath} against ${files.length} ${declaredDescription} ${noun}${evidence}. ${evidenceBoundary}`,
    };
  }));
}

function registrySourceFiles(
  projectRoot: string,
  registryPath: string,
  source: string,
): ReadonlySet<string> {
  const imports = readRuntimeRegistryImports(source);
  const bodyStart = imports.reduce((end, entry) => Math.max(end, entry.end), 0);
  const body = source.slice(bodyStart);
  return new Set(
    imports.filter((entry) => entry.bindings.some((binding) => identifierOccurs(body, binding)))
      .map((entry) =>
        normalizeProjectPath(
          relative(projectRoot, resolve(dirname(registryPath), entry.path)),
        )
      ),
  );
}

function readRuntimeRegistryImports(
  source: string,
): readonly RuntimeRegistryImport[] {
  const imports: RuntimeRegistryImport[] = [];
  const pattern = /import\s+(?!type\b)([\s\S]*?)\s+from\s+(['"])(\.[^'"]+)\2\s*;?/g;
  for (const match of source.matchAll(pattern)) {
    const bindings = readRuntimeBindings(match[1]);
    if (bindings.length === 0) continue;
    imports.push({
      bindings,
      end: (match.index ?? 0) + match[0].length,
      path: match[3],
    });
  }
  return imports;
}

function readRuntimeBindings(clause: string): readonly string[] {
  const bindings = new Set<string>();
  const defaultBinding = /^\s*([A-Za-z_$][\w$]*)/.exec(clause)?.[1];
  if (defaultBinding) bindings.add(defaultBinding);

  const namespaceBinding = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(clause)?.[1];
  if (namespaceBinding) bindings.add(namespaceBinding);

  const named = /\{([\s\S]*?)\}/.exec(clause)?.[1];
  for (const entry of named?.split(',') ?? []) {
    const trimmed = entry.trim();
    if (!trimmed || trimmed.startsWith('type ')) continue;
    const binding = /(?:^|\s+as\s+)([A-Za-z_$][\w$]*)\s*$/.exec(trimmed)?.[1];
    if (binding) bindings.add(binding);
  }
  return [...bindings];
}

function identifierOccurs(source: string, identifier: string): boolean {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(source);
}

function normalizeProjectPath(path: string): string {
  return path.replaceAll('\\', '/');
}
