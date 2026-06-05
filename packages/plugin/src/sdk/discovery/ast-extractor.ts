import type { ExtractedContribution, ExtractorPort } from './ports/extractor-port.ts';
import type { WalkedFile } from './ports/walker-port.ts';

const CONTRIBUTION_BUILDERS = [
  { callee: 'defineJob', axis: 'jobs' },
  { callee: 'defineSaga', axis: 'sagas' },
  { callee: 'defineWebhook', axis: 'triggers' },
] as const;

/** Extractor for exported plugin contribution builder call sites. */
export class AstExtractor implements ExtractorPort {
  async extract(files: readonly WalkedFile[]): Promise<readonly ExtractedContribution[]> {
    const contributions = files.flatMap((file) => extractFromFile(file));
    return contributions.sort((left, right) =>
      left.file.localeCompare(right.file) ||
      left.axis.localeCompare(right.axis) ||
      left.symbol.localeCompare(right.symbol)
    );
  }
}

function extractFromFile(file: WalkedFile): ExtractedContribution[] {
  const text = stripCommentsAndStrings(file.text);
  const contributions: ExtractedContribution[] = [];

  for (const builder of CONTRIBUTION_BUILDERS) {
    contributions.push(...extractNamedExports(file.path, text, builder.callee, builder.axis));
    contributions.push(...extractDefaultExports(file.path, text, builder.callee, builder.axis));
  }

  return contributions;
}

function extractNamedExports(
  file: string,
  text: string,
  callee: string,
  axis: string,
): ExtractedContribution[] {
  const pattern = new RegExp(
    `(?:^|[\\n;])\\s*export\\s+const\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${callee}\\s*\\(`,
    'g',
  );
  return [...text.matchAll(pattern)].map((match) => ({
    file,
    symbol: match[1],
    axis,
  }));
}

function extractDefaultExports(
  file: string,
  text: string,
  callee: string,
  axis: string,
): ExtractedContribution[] {
  const pattern = new RegExp(`(?:^|[\\n;])\\s*export\\s+default\\s+${callee}\\s*\\(`, 'g');
  return [...text.matchAll(pattern)].map(() => ({
    file,
    symbol: 'default',
    axis,
  }));
}

function stripCommentsAndStrings(text: string): string {
  let output = '';
  let index = 0;

  while (index < text.length) {
    const current = text[index];
    const next = text[index + 1];

    if (current === '/' && next === '/') {
      const end = text.indexOf('\n', index + 2);
      if (end === -1) return output;
      output += '\n';
      index = end + 1;
      continue;
    }

    if (current === '/' && next === '*') {
      const end = text.indexOf('*/', index + 2);
      const comment = text.slice(index, end === -1 ? text.length : end + 2);
      output += comment.replace(/[^\n]/g, ' ');
      index = end === -1 ? text.length : end + 2;
      continue;
    }

    if (current === '"' || current === "'" || current === '`') {
      const { replacement, nextIndex } = consumeString(text, index, current);
      output += replacement;
      index = nextIndex;
      continue;
    }

    output += current;
    index += 1;
  }

  return output;
}

function consumeString(
  text: string,
  start: number,
  quote: string,
): { readonly replacement: string; readonly nextIndex: number } {
  let index = start + 1;
  let replacement = ' ';

  while (index < text.length) {
    const current = text[index];
    if (current === '\\') {
      replacement += text[index + 1] === '\n' ? '\n' : '  ';
      index += 2;
      continue;
    }
    if (current === quote) {
      return { replacement: `${replacement} `, nextIndex: index + 1 };
    }
    replacement += current === '\n' ? '\n' : ' ';
    index += 1;
  }

  return { replacement, nextIndex: index };
}
