/**
 * Page-module route-binding scanner and rewriter for WI-12 codegen.
 *
 * The NetScript route manifest generator owns two trees (`routePatterns` in
 * `manifest.ts`, `routes` in `routes.ts`). WI-12 extends it so the binding call
 * inside each page module is generator-owned across three authoring forms:
 *
 * - Form A (inline): the user writes `.withRouteContract({ pathSchema?, ... })`;
 *   the generator inserts the `$route:` field and the `routePatterns` import.
 * - Form B (sidecar): a sibling `<page>.route.ts` owns the contract; the
 *   generator inserts `.withRoute(routes.<key>.$route)` and the `routes` import.
 * - Form C (no contract): the generator inserts a default
 *   `.withRoute(routes.<key>.$route)` backed by `createRouteReference`.
 *
 * This module is intentionally dependency-free: it uses a small brace/paren
 * matching scanner rather than a full TypeScript AST, matching the existing
 * path-based generator's string-analysis style and avoiding a new JSR/npm
 * dependency. The scan is deliberately conservative — it recognizes the
 * realistic `definePage()` chains the framework emits and surfaces ambiguity as
 * a structured result rather than guessing.
 *
 * @module
 */

/** Page-module authoring form discovered by the scanner. */
export type PageModuleRouteForm = 'inline' | 'sidecar' | 'default';

/** Result of scanning a page module for route-binding calls. */
export interface PageModuleScanResult {
  /** Whether a `.withRouteContract({...})` call is present. */
  readonly hasInlineContract: boolean;
  /** Whether a `.withRoute(...)` call is present. */
  readonly hasWithRoute: boolean;
  /**
   * Raw source of the `.withRouteContract({...})` object literal body, excluding
   * any pre-filled `$route` field. `undefined` when no inline contract exists.
   */
  readonly inlineContractBody?: string;
  /**
   * The pre-filled `$route` accessor source, if the author wrote one (e.g.
   * `routePatterns.dashboard.orders.$id.$route`). `undefined` when absent.
   */
  readonly prefilledRoute?: string;
}

const WITH_ROUTE_CONTRACT_TOKEN = '.withRouteContract';
const WITH_ROUTE_TOKEN = '.withRoute';

/**
 * Find the index just past `token` when it begins a builder call, i.e. the
 * next non-whitespace character is the expected opener.
 */
function findBuilderCall(source: string, token: string, opener: '(' | '{'): number {
  let searchFrom = 0;
  while (true) {
    const tokenIndex = source.indexOf(token, searchFrom);
    if (tokenIndex === -1) {
      return -1;
    }

    const afterToken = tokenIndex + token.length;
    // Reject longer identifiers (e.g. `.withRoute` must not match
    // `.withRouteContract`). The char after the token must not be an identifier
    // character.
    const nextChar = source[afterToken];
    if (nextChar !== undefined && /[A-Za-z0-9_$]/.test(nextChar)) {
      searchFrom = afterToken;
      continue;
    }

    let cursor = afterToken;
    while (cursor < source.length && /\s/.test(source[cursor])) {
      cursor += 1;
    }

    if (source[cursor] === '(') {
      // `.withRouteContract({...})` opens with `(` then `{`.
      if (opener === '{') {
        let inner = cursor + 1;
        while (inner < source.length && /\s/.test(source[inner])) {
          inner += 1;
        }
        if (source[inner] === '{') {
          return inner;
        }
        searchFrom = afterToken;
        continue;
      }
      return cursor;
    }

    searchFrom = afterToken;
  }
}

/** Return the index of the matching closer for the opener at `openIndex`. */
function matchBalanced(source: string, openIndex: number): number {
  const open = source[openIndex];
  const close = open === '{' ? '}' : ')';
  let depth = 0;
  let inString: string | undefined;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === inString) {
        inString = undefined;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

/** Split an object-literal body into top-level field source slices. */
function splitTopLevelFields(body: string): string[] {
  const fields: string[] = [];
  let depth = 0;
  let inString: string | undefined;
  let start = 0;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (inString) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === inString) {
        inString = undefined;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    if (char === '{' || char === '(' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ')' || char === ']') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      fields.push(body.slice(start, index));
      start = index + 1;
    }
  }

  const tail = body.slice(start);
  if (tail.trim().length > 0) {
    fields.push(tail);
  }

  return fields;
}

/**
 * Scan a page module source for `.withRouteContract({...})` / `.withRoute(...)`
 * route-binding calls.
 *
 * @param source - Page module source text.
 * @returns Structured scan result describing the discovered form and contract body.
 */
export function scanPageModuleRouteBinding(source: string): PageModuleScanResult {
  const contractOpen = findBuilderCall(source, WITH_ROUTE_CONTRACT_TOKEN, '{');
  const withRouteOpen = findBuilderCall(source, WITH_ROUTE_TOKEN, '(');

  if (contractOpen === -1) {
    return {
      hasInlineContract: false,
      hasWithRoute: withRouteOpen !== -1,
    };
  }

  const contractClose = matchBalanced(source, contractOpen);
  if (contractClose === -1) {
    return {
      hasInlineContract: true,
      hasWithRoute: withRouteOpen !== -1,
    };
  }

  const innerBody = source.slice(contractOpen + 1, contractClose);
  const fields = splitTopLevelFields(innerBody);

  let prefilledRoute: string | undefined;
  const retainedFields: string[] = [];
  for (const field of fields) {
    const match = field.match(/^\s*(?:'\$route'|"\$route"|\$route)\s*:/);
    if (match) {
      prefilledRoute = field.slice(match[0].length).trim();
      continue;
    }
    if (field.trim().length > 0) {
      retainedFields.push(field.trim());
    }
  }

  return {
    hasInlineContract: true,
    hasWithRoute: withRouteOpen !== -1,
    inlineContractBody: retainedFields.join(', '),
    prefilledRoute,
  };
}

/** Input describing how to rewrite a single page module's route binding. */
export interface PageModuleRewriteInput {
  /** Current page module source text. */
  readonly source: string;
  /** Authoring form for this page module. */
  readonly form: PageModuleRouteForm;
  /** Dotted route key path including the trailing `$route` (e.g. `dashboard.orders.$id.$route`). */
  readonly routeKey: string;
  /** Import specifier for the generated manifest module (e.g. `@app/.generated/manifest.ts`). */
  readonly manifestImportSpecifier: string;
  /** Import specifier for the generated routes module (e.g. `@app/.generated/routes.ts`). */
  readonly routesImportSpecifier: string;
  /** Whether a sibling sidecar also exists (drives the inline-precedence warning). */
  readonly hasSidecar?: boolean;
}

/** Result of computing a page-module rewrite. */
export interface PageModuleRewriteResult {
  /** Target page module source (equals input source when no change is needed). */
  readonly content: string;
  /** Whether the target differs from the input source. */
  readonly changed: boolean;
  /** Build warning to surface (e.g. inline form taking precedence over a sidecar). */
  readonly warning?: string;
}

/** Insert an import line if `specifierMatch` is not already imported. */
function ensureImport(
  source: string,
  importLine: string,
  specifierMatch: RegExp,
): string {
  if (specifierMatch.test(source)) {
    return source;
  }

  // Place the new import after the final existing top-level import for stable
  // output; fall back to prepending when the module has no imports yet.
  const lastImportMatch = [...source.matchAll(/^import\b[^\n]*\n/gm)].at(-1);
  if (lastImportMatch && lastImportMatch.index !== undefined) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length;
    return `${source.slice(0, insertAt)}${importLine}\n${source.slice(insertAt)}`;
  }

  return `${importLine}\n${source}`;
}

/**
 * Compute the generator-owned target source for a page module's route binding.
 *
 * - Form A inserts `$route: <manifest>.<key>` as the first field of the inline
 *   `.withRouteContract({...})` object and ensures the `routePatterns` import.
 * - Form B and Form C insert `.withRoute(<routes>.<key>)` immediately after the
 *   `definePage()` call and ensure the `routes` import.
 *
 * The function is idempotent: when the source already matches the target it
 * returns `changed: false` and the original source unchanged.
 *
 * @param input - Rewrite input.
 * @returns The target source, a changed flag, and any build warning.
 */
export function computePageModuleRewrite(input: PageModuleRewriteInput): PageModuleRewriteResult {
  const warning = input.form === 'inline' && input.hasSidecar
    ? `Page has both inline .withRouteContract and sibling sidecar. Inline form ` +
      `takes precedence. Delete the sidecar to silence this warning.`
    : undefined;

  if (input.form === 'inline') {
    return rewriteInlineForm(input, warning);
  }

  return rewriteWithRouteForm(input, warning);
}

function rewriteInlineForm(
  input: PageModuleRewriteInput,
  warning: string | undefined,
): PageModuleRewriteResult {
  const routeAccessor = `routePatterns.${input.routeKey}`;
  const contractOpen = findBuilderCall(input.source, WITH_ROUTE_CONTRACT_TOKEN, '{');
  if (contractOpen === -1) {
    return { content: input.source, changed: false, warning };
  }

  const contractClose = matchBalanced(input.source, contractOpen);
  if (contractClose === -1) {
    return { content: input.source, changed: false, warning };
  }

  const innerBody = input.source.slice(contractOpen + 1, contractClose);
  const fields = splitTopLevelFields(innerBody);
  const retained: string[] = [];
  for (const field of fields) {
    const match = field.match(/^\s*(?:'\$route'|"\$route"|\$route)\s*:/);
    if (match) {
      // Drop any existing $route field; the generator re-inserts the canonical one.
      continue;
    }
    if (field.trim().length > 0) {
      retained.push(field.trim());
    }
  }

  const fieldParts = [`$route: ${routeAccessor}`, ...retained];
  const rebuiltObject = `{ ${fieldParts.join(', ')} }`;
  let next = `${input.source.slice(0, contractOpen)}${rebuiltObject}${
    input.source.slice(contractClose + 1)
  }`;
  next = ensureImport(
    next,
    `import { routePatterns } from '${input.manifestImportSpecifier}';`,
    /\broutePatterns\b[^\n]*\bfrom\b/,
  );

  return { content: next, changed: next !== input.source, warning };
}

function rewriteWithRouteForm(
  input: PageModuleRewriteInput,
  warning: string | undefined,
): PageModuleRewriteResult {
  const routeAccessor = `routes.${input.routeKey}`;
  const bindingCall = `.withRoute(${routeAccessor})`;

  // Idempotency: if the exact binding already exists, only ensure the import.
  if (input.source.includes(bindingCall)) {
    const ensured = ensureImport(
      input.source,
      `import { routes } from '${input.routesImportSpecifier}';`,
      /\broutes\b[^\n]*\bfrom\b/,
    );
    return { content: ensured, changed: ensured !== input.source, warning };
  }

  const defineCall = input.source.match(/definePage\s*(?:<[^>]*>)?\s*\(\s*\)/);
  if (!defineCall || defineCall.index === undefined) {
    return { content: input.source, changed: false, warning };
  }

  const insertAt = defineCall.index + defineCall[0].length;
  let next = `${input.source.slice(0, insertAt)}\n  ${bindingCall}${input.source.slice(insertAt)}`;
  next = ensureImport(
    next,
    `import { routes } from '${input.routesImportSpecifier}';`,
    /\broutes\b[^\n]*\bfrom\b/,
  );

  return { content: next, changed: next !== input.source, warning };
}
