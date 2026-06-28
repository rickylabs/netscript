import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';
import { discoverWorkspaceMembers } from '../deps/workspace.ts';

interface ImportMetaPath {
  identifier: string;
  line: number;
}

export interface TextImportFinding {
  path: string;
  line: number;
  read: 'Deno.readTextFile' | 'Deno.readFile';
  message: string;
  declarationLine?: number;
}

interface Options {
  root: string;
  files: string[];
}

const sourceExtensions = new Set(['.ts', '.tsx']);

/** Scan one source file for import.meta-relative file reads that should be text imports. */
export async function scanFile(path: string): Promise<TextImportFinding[]> {
  const source = await Deno.readTextFile(path);
  return scanSource(source, normalize(path));
}

/** Scan source text for the narrow preflight read patterns. */
export function scanSource(source: string, path: string): TextImportFinding[] {
  const importMetaPaths = collectImportMetaPathIdentifiers(source);
  return [
    ...findIdentifierReads(source, path, importMetaPaths),
    ...findInlineReads(source, path),
  ];
}

/** Discover publishable workspace source files and scan them. */
export async function scanPublishSurface(root: string): Promise<TextImportFinding[]> {
  const members = (await discoverWorkspaceMembers(root)).filter((member) =>
    member.publishable && member.name.startsWith('@netscript/')
  );
  const files: string[] = [];
  for (const member of members) {
    for await (
      const entry of walk(join(root, member.root), {
        includeDirs: false,
        exts: [...sourceExtensions],
        skip: [
          /(?:^|[/\\])node_modules(?:[/\\]|$)/,
          /(?:^|[/\\])\.generated(?:[/\\]|$)/,
          /(?:^|[/\\])\.git(?:[/\\]|$)/,
        ],
      })
    ) {
      const relativePath = normalize(relative(root, entry.path));
      if (isSourceFile(entry.path) && !isTestFile(relativePath)) {
        files.push(entry.path);
      }
    }
  }
  return await scanFiles(files);
}

async function scanFiles(files: string[]): Promise<TextImportFinding[]> {
  const findings: TextImportFinding[] = [];
  for (const file of files.sort()) {
    findings.push(...await scanFile(file));
  }
  return findings;
}

function collectImportMetaPathIdentifiers(source: string): Map<string, ImportMetaPath> {
  const identifiers = new Map<string, ImportMetaPath>();
  const urlDecl =
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:fromFileUrl\s*\(\s*)?new\s+URL\s*\(\s*(['"`])(?:\\.|(?!\2).)*\2\s*,\s*import\.meta\.url\s*\)/g;
  for (const match of source.matchAll(urlDecl)) {
    const identifier = match[1];
    if (!identifier || match.index === undefined) continue;
    identifiers.set(identifier, {
      identifier,
      line: lineAt(source, match.index),
    });
  }
  return identifiers;
}

function findIdentifierReads(
  source: string,
  path: string,
  importMetaPaths: Map<string, ImportMetaPath>,
): TextImportFinding[] {
  const findings: TextImportFinding[] = [];
  const readCall = /\bDeno\.(readTextFile|readFile)\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
  for (const match of source.matchAll(readCall)) {
    if (match.index === undefined) continue;
    const line = lineAt(source, match.index);
    if (hasAllowlist(source, line)) continue;
    const identifier = match[2];
    if (!identifier) continue;
    const declaration = importMetaPaths.get(identifier);
    if (!declaration) continue;
    const read = readName(match[1]);
    findings.push({
      path,
      line,
      read,
      declarationLine: declaration.line,
      message:
        `${read} reads ${identifier}, declared from new URL(..., import.meta.url) on line ${declaration.line}; use a text import instead.`,
    });
  }
  return findings;
}

function findInlineReads(source: string, path: string): TextImportFinding[] {
  const findings: TextImportFinding[] = [];
  const inlineRead =
    /\bDeno\.(readTextFile|readFile)\s*\(\s*new\s+URL\s*\(\s*(['"`])(?:\\.|(?!\2).)*\2\s*,\s*import\.meta\.url\s*\)/g;
  for (const match of source.matchAll(inlineRead)) {
    if (match.index === undefined) continue;
    const line = lineAt(source, match.index);
    if (hasAllowlist(source, line)) continue;
    const read = readName(match[1]);
    findings.push({
      path,
      line,
      read,
      message: `${read} reads new URL(..., import.meta.url) inline; use a text import instead.`,
    });
  }
  return findings;
}

function readName(name: string | undefined): 'Deno.readTextFile' | 'Deno.readFile' {
  return name === 'readFile' ? 'Deno.readFile' : 'Deno.readTextFile';
}

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function hasAllowlist(source: string, line: number): boolean {
  const text = source.split('\n')[line - 1] ?? '';
  return /\/\/\s*preflight-allow:\s*\S+/.test(text);
}

function isSourceFile(path: string): boolean {
  return [...sourceExtensions].some((extension) => path.endsWith(extension));
}

function isTestFile(path: string): boolean {
  const normalized = normalize(path);
  return /(?:^|[/\\])tests?(?:[/\\]|$)/.test(normalized) ||
    /(?:^|[/\\])__fixtures__(?:[/\\]|$)/.test(normalized) ||
    /(?:^|[/\\])[^/\\]+(?:_test|\.test)\.tsx?$/.test(normalized);
}

function parseArgs(argv: string[]): Options | null {
  const files: string[] = [];
  let root = Deno.cwd();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    switch (arg) {
      case '--root':
        root = requireValue(argv, ++index, arg);
        break;
      case '--file':
        files.push(requireValue(argv, ++index, arg));
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { root, files };
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function printHelp(): void {
  console.log(`Usage:
  deno run --allow-read .llm/tools/release/preflight-text-imports.ts [options]

Options:
  --root <path>  Repository root to scan. Defaults to the current directory.
  --file <path>  Scan an explicit file. Repeatable; bypasses workspace discovery.
  --help         Show this help.`);
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;
  const findings = options.files.length > 0
    ? await scanFiles(options.files)
    : await scanPublishSurface(options.root);

  if (findings.length === 0) {
    console.log('release:preflight text-imports — PASS');
    return;
  }

  console.error('release:preflight text-imports — FAIL');
  for (const finding of findings) {
    const declaration = finding.declarationLine
      ? ` (URL declaration line ${finding.declarationLine})`
      : '';
    console.error(
      `${relative(Deno.cwd(), finding.path)}:${finding.line}: ${finding.message}${declaration}`,
    );
  }
  Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
