/**
 * Shared contracts for the design-sync system.
 *
 * Vocabulary is locked by the run plan
 * (`.llm/runs/feat-dashboard-design-prototype--design/worklog.md` § Design):
 * `SyncConfig`, `RegistryUnit`, `ConversionResult`, `ParityReport`, `TrapCheck`,
 * plus the `RegistrySource` / `ClosureBuilder` ports.
 */
import type {
  RegistryItemDefinition,
  RegistryItemKind,
} from '../../../packages/fresh-ui/registry.schema.ts';

export type { RegistryItemDefinition, RegistryItemKind };

/** The six recorded eis-chat parity traps, encoded as first-class checks. */
export const TRAP_IDS = [
  'theme-default',
  'token-closure',
  'compiled-css',
  'weak-dts',
  'render-blank',
  'raw-hex',
] as const;

export type TrapId = (typeof TRAP_IDS)[number];

export interface ExcludeRule {
  /** RegExp source matched against each manifest file `source` path. */
  pattern: string;
  reason: string;
}

export interface SyncConfig {
  projectId: string;
  projectName: string;
  pkg: string;
  globalName: string;
  shape: 'package';
  registry: {
    /** repo-relative package root, e.g. `packages/fresh-ui` */
    root: string;
    /** manifest module relative to `root`, e.g. `registry.manifest.ts` */
    manifest: string;
  };
  /** repo-relative gitignored scratch dir, e.g. `.ds-sync` */
  scratchDir: string;
  /** CSS `@import` line(s) for remote fonts, prepended to `styles.css`. */
  fontImport: string;
  exclude: ExcludeRule[];
  /**
   * Package-subpath specifiers (e.g. `@netscript/fresh-ui/interactive`)
   * mapped to their entry module relative to `registry.root`. The loader
   * walks each entry's relative-import graph into the synthetic package and
   * the converter rewrites the specifier to a relative path.
   */
  subpaths: Record<string, string>;
  /** kind → canvas card group; kinds absent here get no preview card. */
  groups: Partial<Record<RegistryItemKind, string>>;
  react: { version: string; domVersion: string };
  /** absolute repo root (resolved at load time, not persisted) */
  repoRoot: string;
  /** absolute path of the loaded config file */
  configPath: string;
}

export interface SourceFile {
  /** path as written in the manifest, e.g. `registry/components/ui/badge.tsx` */
  registryPath: string;
  /** synthetic-package-relative emit path, e.g. `components/ui/badge.tsx` */
  pkgPath: string;
  content: string;
}

export interface RegistryUnit {
  item: RegistryItemDefinition;
  sources: SourceFile[];
  /** exclusion reason when the unit is out of the parity set */
  excluded?: string;
}

export type ConversionKind = 'emitted' | 'shimmed' | 'skipped';

export interface PropsSummary {
  raw: string;
  hasChildren: boolean;
  required: string[];
}

export interface ConversionResult {
  unit: string;
  kind: ConversionKind;
  /** primary PascalCase export used for the preview card */
  exportName?: string;
  defaultExport?: boolean;
  /** canvas card group, when the unit's kind maps to one */
  group?: string;
  /** synthetic-package-relative emitted paths */
  files: string[];
  notes: string[];
  errors: string[];
  props?: PropsSummary;
}

export interface TrapCheck {
  id: TrapId;
  result: 'PASS' | 'WARN' | 'FAIL';
  evidence: string;
  details: string[];
}

export interface ParityRow {
  kind: string;
  manifest: number;
  converted: number;
  cards: number;
  excluded: number;
}

export interface ParityReport {
  rows: ParityRow[];
  /** included units missing a conversion or an expected card */
  missing: string[];
  excluded: { unit: string; reason: string }[];
  ok: boolean;
}

/** Seam: where registry units come from (fresh-ui today; any copied app registry later). */
export interface RegistrySource {
  load(): Promise<RegistryUnit[]>;
}

export interface BuildOutput {
  units: RegistryUnit[];
  conversions: ConversionResult[];
  /** bundle-dir-relative path → content of every emitted canvas file */
  bundleFiles: Map<string, string>;
  traps: TrapCheck[];
  parity: ParityReport;
}
