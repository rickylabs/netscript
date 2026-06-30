import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';
import { discoverWorkspaceMembers, type WorkspaceMember } from '../deps/workspace.ts';

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

export interface SelfImportFinding {
  path: string;
  line: number;
  member: string;
  specifier: string;
  message: string;
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
  // Blank template-literal text first: scaffolder emitters return userland
  // source as template strings, and an import.meta-relative read inside that
  // emitted string runs in the user's project (local file), not in the
  // published package. Stripping keeps real code + ${...} interpolations
  // scannable while removing false positives. (Comments + allowlist survive.)
  const scannable = blankTemplateLiterals(source);
  const importMetaPaths = collectImportMetaPathIdentifiers(scannable);
  return [
    ...findIdentifierReads(scannable, path, importMetaPaths),
    ...findInlineReads(scannable, path),
  ];
}

/**
 * Replace the *text* content of template literals with spaces (newlines
 * preserved) so emitted-code strings are not scanned as runtime reads, while
 * keeping ordinary code and `${...}` interpolation code intact. Ordinary
 * string literals and comments are copied verbatim so a stray backtick inside
 * them cannot toggle template state and blank real code below.
 */
export function blankTemplateLiterals(source: string): string {
  const out: string[] = [];
  // Each open template literal records the interpolation brace depth at which
  // its text resumes; deeper braceDepth means we are inside a `${...}`.
  const templates: Array<{ braceDepth: number }> = [];
  let braceDepth = 0;
  const inTemplateText = (): boolean =>
    templates.length > 0 &&
    braceDepth === templates[templates.length - 1].braceDepth;
  const n = source.length;
  let i = 0;
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (inTemplateText()) {
      if (c === '\\') {
        out.push(' ');
        out.push(next === '\n' ? '\n' : ' ');
        i += 2;
        continue;
      }
      if (c === '`') {
        out.push('`');
        templates.pop();
        i += 1;
        continue;
      }
      if (c === '$' && next === '{') {
        out.push('$');
        out.push('{');
        braceDepth += 1;
        i += 2;
        continue;
      }
      out.push(c === '\n' ? '\n' : ' ');
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < n && source[i] !== '\n') {
        out.push(source[i]);
        i += 1;
      }
      continue;
    }
    if (c === '/' && next === '*') {
      out.push('/');
      out.push('*');
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) {
        out.push(source[i]);
        i += 1;
      }
      if (i < n) {
        out.push('*');
        out.push('/');
        i += 2;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      out.push(c);
      i += 1;
      while (i < n) {
        const d = source[i];
        out.push(d);
        if (d === '\\') {
          if (i + 1 < n) out.push(source[i + 1]);
          i += 2;
          continue;
        }
        i += 1;
        if (d === c) break;
      }
      continue;
    }
    if (c === '`') {
      out.push('`');
      templates.push({ braceDepth });
      i += 1;
      continue;
    }
    if (c === '{') {
      braceDepth += 1;
      out.push(c);
      i += 1;
      continue;
    }
    if (c === '}') {
      if (braceDepth > 0) braceDepth -= 1;
      out.push(c);
      i += 1;
      continue;
    }
    out.push(c);
    i += 1;
  }
  return out.join('');
}

/** Discover publishable workspace source files and scan them. */
export async function scanPublishSurface(root: string): Promise<TextImportFinding[]> {
  const members = await discoverPublishableNetscriptMembers(root);
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

/** Discover publishable workspace member source files that import their own bare specifier. */
export async function scanSelfImports(root: string): Promise<SelfImportFinding[]> {
  const findings: SelfImportFinding[] = [];
  const members = await discoverPublishableNetscriptMembers(root);
  for (const member of members) {
    const sourceRoot = join(root, member.root, 'src');
    try {
      const stat = await Deno.stat(sourceRoot);
      if (!stat.isDirectory) continue;
    } catch {
      continue;
    }
    for await (
      const entry of walk(sourceRoot, {
        includeDirs: false,
        exts: [...sourceExtensions],
        skip: [
          /(?:^|[/\\])node_modules(?:[/\\]|$)/,
          /(?:^|[/\\])\.generated(?:[/\\]|$)/,
          /(?:^|[/\\])\.git(?:[/\\]|$)/,
        ],
      })
    ) {
      const path = normalize(relative(root, entry.path));
      const source = await Deno.readTextFile(entry.path);
      findings.push(...scanSelfImportSource(source, path, member.name));
    }
  }
  return findings;
}

/** Scan one source string for imports from the owning workspace member's bare specifier. */
export function scanSelfImportSource(
  source: string,
  path: string,
  memberName: string,
): SelfImportFinding[] {
  const findings: SelfImportFinding[] = [];
  const specifier = new RegExp(
    `(?:from\\s+)?['"](${escapeRegExp(memberName)}(?:/[a-z0-9/-]+)?)['"]`,
  );
  let statement = '';
  let statementLine = 1;
  let inDeclaration = false;
  let inBlockComment = false;
  const lines = source.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? '';
    const scannedLine = stripLineComments(line, inBlockComment);
    inBlockComment = scannedLine.inBlockComment;
    const trimmed = scannedLine.text.trimStart();
    if (!inDeclaration && isImportExportDeclarationStart(trimmed)) {
      statement = scannedLine.text;
      statementLine = index + 1;
      inDeclaration = !endsImportExportDeclaration(scannedLine.text);
      collectSelfImportStatement(statement, statementLine, path, memberName, specifier, findings);
      if (!inDeclaration) statement = '';
      continue;
    }
    if (inDeclaration) {
      statement += `\n${scannedLine.text}`;
      collectSelfImportStatement(statement, statementLine, path, memberName, specifier, findings);
      if (endsImportExportDeclaration(scannedLine.text)) {
        inDeclaration = false;
        statement = '';
      }
    }
  }
  return findings;
}

function collectSelfImportStatement(
  statement: string,
  line: number,
  path: string,
  memberName: string,
  specifier: RegExp,
  findings: SelfImportFinding[],
): void {
  if (findings.some((finding) => finding.path === path && finding.line === line)) return;
  const match = statement.match(specifier);
  const matchedSpecifier = match?.[1];
  if (!matchedSpecifier) return;
  findings.push({
    path,
    line,
    member: memberName,
    specifier: matchedSpecifier,
    message:
      `${memberName} source imports its own bare specifier '${matchedSpecifier}'; use a relative path so deno publish cannot resolve the package from JSR.`,
  });
}

function isImportExportDeclarationStart(trimmedLine: string): boolean {
  if (trimmedLine.startsWith('import ')) return true;
  if (!trimmedLine.startsWith('export ')) return false;
  return !/^export\s+(?:abstract\s+)?(?:interface|class|function|const|let|var|enum)\b/.test(
    trimmedLine,
  ) && !/^export\s+type\s+[A-Z_a-z]/.test(trimmedLine);
}

function endsImportExportDeclaration(line: string): boolean {
  return /;\s*$/.test(line) || /^import\s+['"][^'"]+['"]\s*$/.test(line.trim());
}

function stripLineComments(
  line: string,
  inBlockComment: boolean,
): { text: string; inBlockComment: boolean } {
  let text = '';
  let index = 0;
  while (index < line.length) {
    if (inBlockComment) {
      const end = line.indexOf('*/', index);
      if (end === -1) return { text, inBlockComment: true };
      index = end + 2;
      inBlockComment = false;
      continue;
    }
    const blockStart = line.indexOf('/*', index);
    const lineStart = line.indexOf('//', index);
    const nextComment = lineStart === -1
      ? blockStart
      : blockStart === -1
      ? lineStart
      : Math.min(blockStart, lineStart);
    if (nextComment === -1) {
      text += line.slice(index);
      break;
    }
    text += line.slice(index, nextComment);
    if (nextComment === lineStart) break;
    index = nextComment + 2;
    inBlockComment = true;
  }
  return { text, inBlockComment };
}

async function discoverPublishableNetscriptMembers(root: string): Promise<WorkspaceMember[]> {
  return (await discoverWorkspaceMembers(root)).filter((member) =>
    member.publishable && member.name.startsWith('@netscript/')
  );
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const textImportFindings = options.files.length > 0
    ? await scanFiles(options.files)
    : await scanPublishSurface(options.root);
  const selfImportFindings = options.files.length > 0 ? [] : await scanSelfImports(options.root);

  if (textImportFindings.length === 0 && selfImportFindings.length === 0) {
    console.log('release:preflight text-imports — PASS');
    if (options.files.length === 0) {
      console.log('release:preflight self-imports — PASS (0 findings)');
    }
    return;
  }

  if (textImportFindings.length > 0) {
    console.error('release:preflight text-imports — FAIL');
    for (const finding of textImportFindings) {
      const declaration = finding.declarationLine
        ? ` (URL declaration line ${finding.declarationLine})`
        : '';
      console.error(
        `${relative(Deno.cwd(), finding.path)}:${finding.line}: ${finding.message}${declaration}`,
      );
    }
  }
  if (selfImportFindings.length > 0) {
    console.error('release:preflight self-imports — FAIL');
    for (const finding of selfImportFindings) {
      console.error(`${relative(Deno.cwd(), finding.path)}:${finding.line}: ${finding.message}`);
    }
  }
  Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
