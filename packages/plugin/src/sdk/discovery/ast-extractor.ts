import type {
  ContributionBuilderPattern,
  ExtractedContribution,
  ExtractorPort,
} from './ports/extractor-port.ts';
import type { WalkedFile } from './ports/walker-port.ts';

const TYPESCRIPT_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const DEFAULT_CONTRIBUTION_BUILDERS: readonly ContributionBuilderPattern[] = Object.freeze([
  Object.freeze({ callee: 'defineJob', axis: 'jobs' }),
  Object.freeze({ callee: 'defineSaga', axis: 'sagas' }),
  Object.freeze({ callee: 'defineWebhook', axis: 'triggers' }),
]);

/** Options for configuring one {@link AstExtractor} instance. */
export interface AstExtractorOptions {
  /** Additional factory-to-axis patterns appended to the official defaults. */
  readonly additionalBuilders?: readonly ContributionBuilderPattern[];
}

/** Extractor for exported plugin contribution builder call sites. */
export class AstExtractor implements ExtractorPort {
  readonly #builders: readonly ContributionBuilderPattern[];

  /** Create an extractor with immutable per-instance builder configuration. */
  constructor(options: AstExtractorOptions = {}) {
    this.#builders = createContributionBuilders(options.additionalBuilders ?? []);
  }

  /** Extract contribution candidates from walked source files. */
  extract(files: readonly WalkedFile[]): Promise<readonly ExtractedContribution[]> {
    const contributions = files.flatMap((file) => extractFromFile(file, this.#builders));
    return Promise.resolve(
      contributions.sort((left, right) =>
        left.file.localeCompare(right.file) ||
        left.axis.localeCompare(right.axis) ||
        left.symbol.localeCompare(right.symbol)
      ),
    );
  }
}

function createContributionBuilders(
  additionalBuilders: readonly ContributionBuilderPattern[],
): readonly ContributionBuilderPattern[] {
  const callees = new Set(DEFAULT_CONTRIBUTION_BUILDERS.map((builder) => builder.callee));
  const snapshots = additionalBuilders.map((builder) => {
    if (!TYPESCRIPT_IDENTIFIER.test(builder.callee)) {
      throw new TypeError(`Invalid contribution builder callee "${builder.callee}"`);
    }
    if (builder.axis.trim().length === 0) {
      throw new TypeError(`Contribution builder axis for "${builder.callee}" must not be blank`);
    }
    if (callees.has(builder.callee)) {
      throw new TypeError(`Duplicate contribution builder callee "${builder.callee}"`);
    }

    callees.add(builder.callee);
    return Object.freeze({ callee: builder.callee, axis: builder.axis });
  });

  return Object.freeze([...DEFAULT_CONTRIBUTION_BUILDERS, ...snapshots]);
}

function extractFromFile(
  file: WalkedFile,
  builders: readonly ContributionBuilderPattern[],
): ExtractedContribution[] {
  const text = stripCommentsAndStrings(file.text);
  const contributions: ExtractedContribution[] = [];

  for (const builder of builders) {
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
