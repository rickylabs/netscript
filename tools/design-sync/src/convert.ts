/**
 * Converter: fresh-ui (Preact/Fresh) registry sources → a synthetic React
 * package the Claude Design canvas can execute.
 *
 * The eis-chat recipe still applies to the registry's component surface,
 * which is mostly type-only Preact imports, but islands and interactive
 * subpaths also use a finite value surface. Compiling the same source under
 * a classic React JSX transform therefore needs React-backed equivalents for
 * those values as well. The converter therefore only:
 *
 *  1. rewrites the three Preact specifiers to local shims
 *     (`preact` → types + Fragment compat, `preact/hooks` → React hooks,
 *     `@preact/signals` → a useState-backed signal shim),
 *  2. replaces `lib/cn.ts` with a dependency-free implementation (registry
 *     components carry zero Tailwind utility classes, so `tailwind-merge`
 *     is semantically a no-op here — dropping it removes every npm dep
 *     except React itself),
 *  3. injects the `React` scope import that the classic JSX factory needs.
 *
 * Everything else (JSX bodies, `class=` props — React ≥16 passes `class`
 * through to the DOM, `ns-*` class contracts, CSS) ports verbatim.
 */
import type {
  ConversionResult,
  PropsSummary,
  RegistryUnit,
  SourceFile,
  SyncConfig,
} from './types.ts';

/** Value exports the preact compat shim knows how to map onto React. */
const PREACT_VALUE_COMPAT: Record<string, string> = {
  Fragment: 'export const Fragment = React.Fragment;',
  h: 'export const h = React.createElement;',
  createContext: 'export const createContext = React.createContext;',
  cloneElement: 'export const cloneElement = React.cloneElement;',
  toChildArray: 'export const toChildArray = React.Children.toArray;',
};

/** Preact hook value exports with direct React equivalents. */
const HOOK_VALUE_COMPAT: Record<string, string> = {
  useCallback: 'export const useCallback = React.useCallback;',
  useContext: 'export const useContext = React.useContext;',
  useEffect: 'export const useEffect = React.useEffect;',
  useId: 'export const useId = React.useId;',
  useImperativeHandle: 'export const useImperativeHandle = React.useImperativeHandle;',
  useLayoutEffect: 'export const useLayoutEffect = React.useLayoutEffect;',
  useMemo: 'export const useMemo = React.useMemo;',
  useReducer: 'export const useReducer = React.useReducer;',
  useRef: 'export const useRef = React.useRef;',
  useState: 'export const useState = React.useState;',
};

const SIGNAL_IMPL: Record<string, string> = {
  useSignal: `export function useSignal<T>(initial: T) {
  const [value, set] = React.useState(initial);
  return {
    get value(): T {
      return value;
    },
    set value(next: T) {
      set(next);
    },
    peek(): T {
      return value;
    },
  };
}`,
  useComputed: `export function useComputed<T>(compute: () => T) {
  const value = compute();
  return { get value(): T { return value; }, peek(): T { return value; } };
}`,
  useSignalEffect: `export function useSignalEffect(effect: () => void | (() => void)) {
  React.useEffect(effect);
}`,
};

function relTo(pkgPath: string, target: string): string {
  const depth = pkgPath.split('/').length - 1;
  return depth === 0 ? `./${target}` : `${'../'.repeat(depth)}${target}`;
}

function relToDs(pkgPath: string): string {
  return relTo(pkgPath, '__ds');
}

const CN_SHIM = `/**
 * Dependency-free replacement for fresh-ui's clsx + tailwind-merge \`cn\`.
 * Registry components use semantic \`ns-*\` classes only (no Tailwind
 * utilities), so merge semantics reduce to flatten + join.
 */
export type ClassValue =
  | string
  | number
  | bigint
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, unknown>;

export const cn = (...inputs: ClassValue[]): string => {
  const out: string[] = [];
  const visit = (input: ClassValue): void => {
    if (!input && input !== 0) return;
    if (Array.isArray(input)) {
      input.forEach(visit);
    } else if (typeof input === 'object') {
      for (const [key, on] of Object.entries(input)) {
        if (on) out.push(key);
      }
    } else {
      out.push(String(input));
    }
  };
  inputs.forEach(visit);
  return out.join(' ');
};
`;

export interface ConvertOutput {
  conversions: ConversionResult[];
  /** pkg-relative path → content for the synthetic package tree */
  pkgFiles: Map<string, string>;
  /** JSX.* members + top-level preact type names seen across all sources */
  shims: {
    jsxMembers: Set<string>;
    typeNames: Set<string>;
    valueNames: Set<string>;
    hookNames: Set<string>;
    signalNames: Set<string>;
  };
}

/** Raised when registry source cannot be represented by the React compatibility layer. */
export class ConversionError extends Error {
  constructor(readonly diagnostics: readonly string[]) {
    super(`conversion errors:\n${diagnostics.map((error) => `  ! ${error}`).join('\n')}`);
    this.name = 'ConversionError';
  }
}

function importBinding(binding: string): { imported: string; typeOnly: boolean } {
  const trimmed = binding.trim();
  const typeOnly = trimmed.startsWith('type ');
  const withoutType = trimmed.replace(/^type\s+/, '');
  return { imported: withoutType.split(/\s+as\s+/)[0], typeOnly };
}

function pascal(unitName: string): string {
  return unitName.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function extractProps(source: string): PropsSummary | undefined {
  const m = source.match(/(?:export )?(?:interface|type) (\w*Props)\b[^{]*\{([\s\S]*?)\n\}/);
  if (!m) return undefined;
  const raw = `${m[0]}`;
  const body = m[2];
  const required: string[] = [];
  for (const line of body.split('\n')) {
    const field = line.match(/^\s{2}(\w+)(\??):/);
    if (field && field[2] !== '?' && field[1] !== 'children') required.push(field[1]);
  }
  return { raw, hasChildren: /children\??:/.test(body), required };
}

function primaryExport(source: string, unitName: string): { name?: string; isDefault: boolean } {
  const def = source.match(/export default function ([A-Z]\w*)/);
  if (def) return { name: def[1], isDefault: true };
  const wanted = pascal(unitName);
  const named = [...source.matchAll(/export (?:function|const) ([A-Z]\w*)/g)].map((m) => m[1]);
  if (named.includes(wanted)) return { name: wanted, isDefault: false };
  return { name: named[0], isDefault: false };
}

/** Rewrite one source file; mutates the scan-accumulator sets. */
export function convertSource(
  pkgPath: string,
  content: string,
  scan: ConvertOutput['shims'],
  notes: string[],
  errors: string[],
  subpaths: Record<string, string> = {},
): string {
  const ds = relToDs(pkgPath);
  let out = content;

  for (const [spec, target] of Object.entries(subpaths)) {
    if (out.includes(`'${spec}'`)) {
      out = out.replaceAll(`'${spec}'`, `'${relTo(pkgPath, target)}'`);
      notes.push(`subpath "${spec}" → ${relTo(pkgPath, target)} (${pkgPath})`);
    }
  }

  for (const m of content.matchAll(/\bJSX\.([A-Za-z]\w*)/g)) scan.jsxMembers.add(m[1]);

  out = out.replace(
    /import\s+(type\s+)?\{([^}]*)\}\s+from\s+'(preact|preact\/hooks|@preact\/signals)';?/g,
    (_full, typeOnly: string | undefined, names: string, spec: string) => {
      const bindings = names.split(',').map((n) => n.trim()).filter(Boolean);
      if (spec === 'preact') {
        for (const b of bindings) {
          const binding = importBinding(b);
          if (typeOnly || binding.typeOnly) scan.typeNames.add(binding.imported);
          else {
            if (!PREACT_VALUE_COMPAT[binding.imported]) {
              errors.push(`unmapped preact value import "${binding.imported}" in ${pkgPath}`);
            }
            scan.valueNames.add(binding.imported);
          }
        }
        return `import ${typeOnly ?? ''}{ ${names.trim()} } from '${ds}/preact-compat.ts';`;
      }
      if (spec === 'preact/hooks') {
        for (const b of bindings) {
          const binding = importBinding(b);
          if (typeOnly || binding.typeOnly) continue;
          if (!HOOK_VALUE_COMPAT[binding.imported]) {
            errors.push(
              `unmapped preact/hooks value import "${binding.imported}" in ${pkgPath}`,
            );
          }
          scan.hookNames.add(binding.imported);
        }
        return `import { ${names.trim()} } from '${ds}/hooks.ts';`;
      }
      for (const b of bindings) {
        const binding = importBinding(b);
        if (!typeOnly && !binding.typeOnly) {
          if (!SIGNAL_IMPL[binding.imported]) {
            errors.push(
              `unmapped @preact/signals value import "${binding.imported}" in ${pkgPath}`,
            );
          }
        }
        scan.signalNames.add(binding.imported);
      }
      return `import { ${names.trim()} } from '${ds}/signals.ts';`;
    },
  );

  // Statement-aware scan: `@example` doc blocks legitimately show imports of
  // npm specifiers (e.g. rehype-sanitize), so comment lines don't count.
  for (const line of out.split('\n')) {
    const t = line.trimStart();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) continue;
    const m = t.match(/from\s+'([^'.][^']*)'/);
    if (m) errors.push(`unexpected bare specifier "${m[1]}" in ${pkgPath}`);
  }

  if (pkgPath.endsWith('.tsx')) {
    out = `import { React } from '${ds}/react-scope.ts';\n${out}`;
    notes.push(`injected React scope import (${pkgPath})`);
  }
  return out;
}

export function convertUnits(
  cfg: SyncConfig,
  units: RegistryUnit[],
  extraSources: SourceFile[] = [],
): ConvertOutput {
  const pkgFiles = new Map<string, string>();
  const conversions: ConversionResult[] = [];
  const shims: ConvertOutput['shims'] = {
    jsxMembers: new Set(),
    typeNames: new Set(),
    valueNames: new Set(),
    hookNames: new Set(),
    signalNames: new Set(),
  };

  for (const unit of units) {
    if (unit.excluded) continue;
    const group = cfg.groups[unit.item.kind];
    const result: ConversionResult = {
      unit: unit.item.name,
      kind: 'emitted',
      group,
      files: [],
      notes: [],
      errors: [],
    };

    for (const src of unit.sources) {
      if (src.pkgPath === 'lib/cn.ts') {
        if (!pkgFiles.has(src.pkgPath)) pkgFiles.set(src.pkgPath, CN_SHIM);
        result.kind = 'shimmed';
        result.notes.push('lib/cn.ts replaced with dependency-free implementation');
        result.files.push(src.pkgPath);
        continue;
      }
      if (/\.(ts|tsx)$/.test(src.pkgPath)) {
        if (!pkgFiles.has(src.pkgPath)) {
          pkgFiles.set(
            src.pkgPath,
            convertSource(
              src.pkgPath,
              src.content,
              shims,
              result.notes,
              result.errors,
              cfg.subpaths,
            ),
          );
        }
        result.files.push(src.pkgPath);
        const code = src.pkgPath.endsWith('.tsx') ? src.content : undefined;
        if (code && !result.exportName) {
          const exp = primaryExport(code, unit.item.name);
          result.exportName = exp.name;
          result.defaultExport = exp.isDefault;
          result.props = extractProps(code);
          if (!exp.name) result.errors.push(`no PascalCase export found in ${src.pkgPath}`);
        }
      } else {
        // css / json assets flow into the closure builder, not the package tree
        result.kind = result.files.length ? result.kind : 'skipped';
        result.notes.push(`asset handled by closure: ${src.pkgPath}`);
      }
    }
    if (group && !result.exportName) {
      result.errors.push(`card-bearing unit "${unit.item.name}" has no renderable export`);
    }
    conversions.push(result);
  }

  if (extraSources.length) {
    const result: ConversionResult = {
      unit: '__subpaths',
      kind: 'emitted',
      files: [],
      notes: [],
      errors: [],
    };
    for (const src of extraSources) {
      if (pkgFiles.has(src.pkgPath)) continue;
      pkgFiles.set(
        src.pkgPath,
        convertSource(src.pkgPath, src.content, shims, result.notes, result.errors, cfg.subpaths),
      );
      result.files.push(src.pkgPath);
    }
    conversions.push(result);
  }

  const diagnostics = conversions.flatMap((conversion) =>
    conversion.errors.map((error) => `${conversion.unit}: ${error}`)
  );
  if (diagnostics.length) throw new ConversionError(diagnostics);

  emitShims(pkgFiles, shims);
  return { conversions, pkgFiles, shims };
}

function emitShims(pkgFiles: Map<string, string>, shims: ConvertOutput['shims']): void {
  pkgFiles.set(
    '__ds/react-scope.ts',
    `import * as ReactNamespace from 'react';\n\n` +
      `// Single in-bundle React identity; the classic JSX factory references it.\n` +
      `export const React = ReactNamespace;\n`,
  );

  const jsxMembers = [...shims.jsxMembers].sort().map((m) =>
    `  export type ${m}<A = unknown, B = unknown> = Record<string, unknown> | A | B;`
  );
  const typeNames = [...shims.typeNames].sort()
    .filter((n) => n !== 'JSX')
    .map((n) => `export type ${n}<A = unknown, B = unknown> = unknown | A | B;`);
  const valueLines = [...shims.valueNames].sort()
    .map((n) => PREACT_VALUE_COMPAT[n])
    .filter((line): line is string => Boolean(line));
  pkgFiles.set(
    '__ds/preact-compat.ts',
    `/**\n * Parse-only Preact type surface + React-backed value compat.\n` +
      ` * Types are erased at bundle time; only names/arity must line up.\n */\n` +
      (valueLines.length ? `import { React } from './react-scope.ts';\n\n` : '\n') +
      `${typeNames.join('\n')}\n` +
      `// deno-lint-ignore no-namespace\n` +
      `export namespace JSX {\n${jsxMembers.join('\n')}\n}\n` +
      (valueLines.length ? `\n${valueLines.join('\n')}\n` : ''),
  );

  const hookLines = [...shims.hookNames].sort()
    .map((name) => HOOK_VALUE_COMPAT[name])
    .filter((line): line is string => Boolean(line));
  pkgFiles.set(
    '__ds/hooks.ts',
    `import { React } from './react-scope.ts';\n\n${hookLines.join('\n')}\n`,
  );

  const signalBodies = [...shims.signalNames].sort()
    .map((n) => SIGNAL_IMPL[n])
    .filter((body): body is string => Boolean(body));
  if (signalBodies.length) {
    pkgFiles.set(
      '__ds/signals.ts',
      `import { React } from './react-scope.ts';\n\n${signalBodies.join('\n\n')}\n`,
    );
  }
}
