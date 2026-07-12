/**
 * RegistrySource port: joins the typed registry manifest with the actual
 * source files on disk.
 *
 * The fresh-ui implementation imports `registry.manifest.ts` directly (a
 * plain typed module) and reads each `files[].source` from the package
 * directory — it never parses the 290KB `registry.generated.ts` embed. The
 * port exists so the same converter can later run against any NetScript
 * app's copied registry (the `netscript ui:design-sync` promotion path).
 */
import type {
  RegistryItemDefinition,
  RegistrySource,
  RegistryUnit,
  SourceFile,
  SyncConfig,
} from './types.ts';
import { fwd } from './config.ts';

interface ManifestShape {
  items: RegistryItemDefinition[];
}

function isManifest(value: unknown): value is ManifestShape {
  return typeof value === 'object' && value !== null &&
    Array.isArray((value as ManifestShape).items);
}

/** Strip the leading `registry/` segment to get the synthetic-package path. */
export function toPkgPath(registryPath: string): string {
  return registryPath.replace(/^registry\//, '');
}

/** Resolve a relative specifier against a package-relative directory. */
export function joinRel(dir: string, spec: string): string {
  const parts = dir ? dir.split('/') : [];
  for (const seg of spec.split('/')) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

/** Relative `.ts`/`.tsx` specifiers on real import/export statements (not doc comments). */
export function relativeImports(content: string): string[] {
  const specs: string[] = [];
  for (const line of content.split('\n')) {
    const t = line.trimStart();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    const m = t.match(/from\s+'(\.\.?\/[^']*\.tsx?)'/);
    if (m) specs.push(m[1]);
  }
  return specs;
}

export class FreshUiRegistrySource implements RegistrySource {
  constructor(private readonly cfg: SyncConfig) {}

  async load(): Promise<RegistryUnit[]> {
    const root = `${this.cfg.repoRoot}/${fwd(this.cfg.registry.root)}`;
    const manifestPath = `${root}/${fwd(this.cfg.registry.manifest)}`;
    const mod = await import(`file:///${manifestPath.replace(/^\//, '')}`) as Record<
      string,
      unknown
    >;
    const manifest = Object.values(mod).find(isManifest);
    if (!manifest || manifest.items.length === 0) {
      throw new Error(`design-sync: no manifest with items[] exported by ${manifestPath}`);
    }

    const rules = this.cfg.exclude.map((r) => ({ re: new RegExp(r.pattern), reason: r.reason }));
    const units: RegistryUnit[] = [];
    for (const item of manifest.items) {
      const excludedBy = rules.find((r) => item.files.some((f) => r.re.test(fwd(f.source))));
      if (excludedBy) {
        units.push({ item, sources: [], excluded: excludedBy.reason });
        continue;
      }
      const sources = [];
      for (const file of item.files) {
        const registryPath = fwd(file.source);
        const content = await Deno.readTextFile(`${root}/${registryPath}`);
        sources.push({ registryPath, pkgPath: toPkgPath(registryPath), content });
      }
      units.push({ item, sources });
    }
    return units;
  }

  /**
   * Walk each configured subpath entry's relative-import graph. The files
   * keep their package-root-relative paths in the synthetic tree (they live
   * outside `registry/`), so relative imports inside the graph port verbatim.
   */
  async loadSubpaths(): Promise<SourceFile[]> {
    const root = `${this.cfg.repoRoot}/${fwd(this.cfg.registry.root)}`;
    const seen = new Set<string>();
    const queue = Object.values(this.cfg.subpaths).map(fwd);
    const files: SourceFile[] = [];
    while (queue.length) {
      const rel = queue.shift() as string;
      if (seen.has(rel)) continue;
      seen.add(rel);
      const content = await Deno.readTextFile(`${root}/${rel}`);
      files.push({ registryPath: rel, pkgPath: rel, content });
      const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
      for (const spec of relativeImports(content)) queue.push(joinRel(dir, spec));
    }
    return files;
  }
}
