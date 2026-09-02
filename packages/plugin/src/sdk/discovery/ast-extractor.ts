import type {
  ContributionBuilderPattern,
  ExtractedContribution,
  ExtractorPort,
} from './ports/extractor-port.ts';
import type { WalkedFile } from './ports/walker-port.ts';

const TYPESCRIPT_IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const CONTRIBUTION_BUILDERS_EXPORT = 'NETSCRIPT_CONTRIBUTION_BUILDERS';
const CONTRIBUTION_BUILDERS_START = /\bexport\s+const\s+NETSCRIPT_CONTRIBUTION_BUILDERS\s*=/g;
const CONTRIBUTION_BUILDERS_DECLARATION =
  /\bexport\s+const\s+NETSCRIPT_CONTRIBUTION_BUILDERS\s*=\s*\[([\s\S]*?)\]\s*as\s+const\s*;?/g;
const CONTRIBUTION_BUILDER_ENTRY =
  /\{\s*callee\s*:\s*(['"])([^'"\r\n]*)\1\s*,\s*axis\s*:\s*(['"])([^'"\r\n]*)\3\s*,?\s*\}/g;
const NAMED_IMPORT = /\bimport\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\2/g;
const PLUGIN_CORE_MODULE = /(?:^|\/)plugin-[^/]+-core(?:\/builders)?$/;
const CONTRIBUTION_FACTORY_IDENTIFIER = /^define(?!.*(?:Config|Handler)$)[A-Z][\w$]*$/;

/** Options for configuring one {@link AstExtractor} instance. */
export interface AstExtractorOptions {
  /** Factory-to-axis patterns added to declarations found in walked files. */
  readonly additionalBuilders?: readonly ContributionBuilderPattern[];
}

/** Extractor for exported plugin contribution builder call sites. */
export class AstExtractor implements ExtractorPort {
  readonly #additionalBuilders: readonly ContributionBuilderPattern[];

  /** Create an extractor with immutable per-instance builder configuration. */
  constructor(options?: AstExtractorOptions) {
    this.#additionalBuilders = createContributionBuilders(options?.additionalBuilders ?? []);
  }

  /** Extract contribution candidates from walked source files. */
  extract(files: readonly WalkedFile[]): Promise<readonly ExtractedContribution[]> {
    const declaredBuilders = files.flatMap(readContributionBuilderDeclarations);
    const builders = createContributionBuilders([
      ...this.#additionalBuilders,
      ...declaredBuilders,
    ]);

    assertContributionFactoriesAreDeclared(files, builders);

    const contributions = files.flatMap((file) => extractFromFile(file, builders));
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
  builders: readonly ContributionBuilderPattern[],
): readonly ContributionBuilderPattern[] {
  const callees = new Set<string>();
  const snapshots = builders.map((builder) => {
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

  return Object.freeze(snapshots);
}

function readContributionBuilderDeclarations(file: WalkedFile): ContributionBuilderPattern[] {
  const starts = [...file.text.matchAll(CONTRIBUTION_BUILDERS_START)];
  if (starts.length === 0) return [];

  const declarations = [...file.text.matchAll(CONTRIBUTION_BUILDERS_DECLARATION)];
  if (declarations.length !== starts.length) {
    throw malformedContributionBuildersDeclaration(file.path);
  }

  return declarations.flatMap((declaration) => {
    const body = declaration[1];
    const entries = [...body.matchAll(CONTRIBUTION_BUILDER_ENTRY)];
    const remainder = body.replace(CONTRIBUTION_BUILDER_ENTRY, '').replace(/[\s,]/g, '');
    if (remainder.length > 0) {
      throw malformedContributionBuildersDeclaration(file.path);
    }

    return entries.map((entry) => ({ callee: entry[2], axis: entry[4] }));
  });
}

function malformedContributionBuildersDeclaration(file: string): TypeError {
  return new TypeError(`Malformed ${CONTRIBUTION_BUILDERS_EXPORT} declaration in "${file}"`);
}

function assertContributionFactoriesAreDeclared(
  files: readonly WalkedFile[],
  builders: readonly ContributionBuilderPattern[],
): void {
  const declaredCallees = new Set(builders.map((builder) => builder.callee));

  for (const file of files) {
    const text = stripCommentsAndStrings(file.text);
    for (const callee of readImportedContributionFactories(file.text)) {
      if (declaredCallees.has(callee)) continue;
      if (
        extractNamedExports(file.path, text, callee, '').length === 0 &&
        extractDefaultExports(file.path, text, callee, '').length === 0
      ) continue;

      throw new TypeError(
        `Contribution factory "${callee}" has no declared axis; run plugin sync/update or pass it through additionalBuilders`,
      );
    }
  }
}

function readImportedContributionFactories(text: string): readonly string[] {
  const callees = new Set<string>();

  for (const match of text.matchAll(NAMED_IMPORT)) {
    if (!PLUGIN_CORE_MODULE.test(match[3])) continue;

    for (const specifier of match[1].split(',')) {
      const [imported, alias] = specifier.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
      if (alias !== undefined || !CONTRIBUTION_FACTORY_IDENTIFIER.test(imported)) continue;
      callees.add(imported);
    }
  }

  return [...callees];
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
