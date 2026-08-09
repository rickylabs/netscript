interface SourceDiagnostic {
  readonly path: string;
  readonly line: number;
  readonly message: string;
}

const SOURCE_EXTENSIONS = new Set(['.md', '.vto']);
const SKIPPED_DIRECTORIES = new Set(['_site', '_cache', '_plan']);

async function collectSourceFiles(root: string, directory = root): Promise<string[]> {
  const paths: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (entry.isDirectory && SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory) paths.push(...await collectSourceFiles(root, path));
    else if (entry.isFile && SOURCE_EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      paths.push(path);
    }
  }
  return paths.sort();
}

function lineAt(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function findMultilineQuotedVentoExpressions(path: string, source: string): SourceDiagnostic[] {
  const diagnostics: SourceDiagnostic[] = [];
  let offset = 0;

  while ((offset = source.indexOf('{{', offset)) >= 0) {
    const expressionStart = offset;
    offset += 2;

    const executableStart = source.slice(offset).match(/^\s*/)?.[0].length ?? 0;
    if (source[offset + executableStart] === '#') {
      const commentEnd = source.indexOf('#}}', offset + executableStart + 1);
      offset = commentEnd >= 0 ? commentEnd + 3 : source.length;
      continue;
    }

    let quote = '';
    let quoteStart = -1;
    let escaped = false;
    let multilineQuoteStart = -1;
    while (offset < source.length) {
      const character = source[offset];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === quote) quote = '';
        else if (character === '\n' || character === '\r') {
          if (multilineQuoteStart < 0) multilineQuoteStart = quoteStart;
        }
      } else if (character === '"' || character === "'") {
        quote = character;
        quoteStart = offset;
      } else if (character === '}' && source[offset + 1] === '}') {
        offset += 2;
        break;
      }
      offset++;
    }

    if (multilineQuoteStart >= 0) {
      diagnostics.push({
        path,
        line: lineAt(source, multilineQuoteStart),
        message: 'Vento expression contains a raw newline inside a quoted string',
      });
    }

    if (offset >= source.length && source.indexOf('}}', expressionStart + 2) < 0) {
      diagnostics.push({
        path,
        line: lineAt(source, expressionStart),
        message: 'Vento expression is not closed',
      });
    }
  }
  return diagnostics;
}

function findUnrenderedMarkdownInVto(path: string, source: string): SourceDiagnostic[] {
  if (!path.endsWith('.vto') || path.split('/').some((part) => part.startsWith('_'))) return [];
  if (!/^#{1,6}\s+\S/m.test(source)) return [];

  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  if (/^templateEngine:\s*\[[^\]]*\bmd\b[^\]]*\]\s*$/m.test(frontMatter)) return [];

  const headingOffset = source.search(/^#{1,6}\s+\S/m);
  return [{
    path,
    line: lineAt(source, headingOffset),
    message: 'Vento page authors Markdown headings without enabling the Markdown template engine',
  }];
}

export async function collectSiteSourceDiagnostics(root: string): Promise<SourceDiagnostic[]> {
  const diagnostics: SourceDiagnostic[] = [];
  for (const path of await collectSourceFiles(root)) {
    const source = await Deno.readTextFile(path);
    diagnostics.push(...findMultilineQuotedVentoExpressions(path, source));
    diagnostics.push(...findUnrenderedMarkdownInVto(path, source));
  }
  return diagnostics;
}

export async function assertSiteSourceFormat(root: string): Promise<void> {
  const diagnostics = await collectSiteSourceDiagnostics(root);
  if (diagnostics.length === 0) return;
  const details = diagnostics.map(({ path, line, message }) => `- ${path}:${line}: ${message}`);
  throw new Error(`Invalid docs source formatting:\n${details.join('\n')}`);
}

if (import.meta.main) {
  const root = Deno.args[0] ?? '.';
  await assertSiteSourceFormat(root);
  console.log('Docs source format: OK');
}
