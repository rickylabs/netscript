import { relative, resolve } from '@std/path';

export type QualityRule = 'explicit-any-ignore' | 'unsafe-cast' | 'explicit-any' | 'plugin-name-check';

export interface QualityFinding {
  readonly rule: QualityRule;
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

const PLUGIN_NAMES = ['ai', 'auth', 'sagas', 'streams', 'triggers', 'workers'];
const DEFAULT_ROOTS = ['packages/cli/src', 'plugins'];

function ruleFor(line: string, file: string): QualityRule | undefined {
  // Template/fixture source strings are data, not syntax in the scanned module.
  if (/^\s*[`'\"]/.test(line)) return undefined;
  if (/deno-lint-ignore(?:-file)?\s+no-explicit-any/.test(line)) return 'explicit-any-ignore';
  if (/\bas\s+unknown\s+as\b|\bas\s+any\b/.test(line)) return 'unsafe-cast';
  if (/(?:<|:\s*)any(?:\s*[,>;)\]}]|\b)/.test(line)) return 'explicit-any';
  if (file.includes('/features/plugins/') && PLUGIN_NAMES.some((name) =>
    new RegExp(`(?:===|!==)\\s*[\"']${name}[\"']|[\"']${name}[\"']\\s*(?:===|!==)`).test(line)
  )) return 'plugin-name-check';
  return undefined;
}

function isScannable(file: string): boolean {
  return /\.[cm]?[jt]sx?$/.test(file) && !/(?:_test|\.test|\.spec)\.[cm]?[jt]sx?$/.test(file) &&
    !file.endsWith('.generated.ts');
}

async function collect(path: string): Promise<string[]> {
  try {
    const stat = await Deno.stat(path);
    if (stat.isFile) return isScannable(path) ? [path] : [];
  } catch {
    return [];
  }
  const files: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory) files.push(...await collect(child));
    else if (entry.isFile && isScannable(child)) files.push(child);
  }
  return files;
}

/** Scan selected source paths for code-quality violations. */
export async function scanCodeQuality(
  paths: readonly string[],
  cwd: string = Deno.cwd(),
): Promise<QualityFinding[]> {
  const files = (await Promise.all(paths.map((path) => collect(resolve(cwd, path))))).flat();
  const findings: QualityFinding[] = [];
  for (const file of files) {
    const lines = (await Deno.readTextFile(file)).split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const allowance = line.match(/\/\/\s*quality-allow:\s*(.+)$/);
      if (allowance?.[1].trim()) continue;
      const rule = ruleFor(line, file.replaceAll('\\', '/'));
      if (rule) findings.push({ rule, file: relative(cwd, file), line: index + 1, text: line.trim() });
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

if (import.meta.main) {
  const pretty = Deno.args.includes('--pretty');
  const changed = Deno.args.flatMap((arg, index, args) => arg === '--changed-file' ? [args[index + 1]] : []);
  const roots = Deno.args.flatMap((arg, index, args) => arg === '--root' ? [args[index + 1]] : []);
  const mode = changed.length > 0 ? 'changed-files' : 'repository';
  const findings = await scanCodeQuality(changed.length > 0 ? changed : roots.length > 0 ? roots : DEFAULT_ROOTS);
  const result = { ok: findings.length === 0, mode, scanned: changed.length > 0 ? changed : roots.length > 0 ? roots : DEFAULT_ROOTS, findings };
  console.log(JSON.stringify(result, null, pretty ? 2 : undefined));
  if (!result.ok) Deno.exit(1);
}
