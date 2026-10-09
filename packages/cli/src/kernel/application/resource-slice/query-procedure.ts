import { join, toFileUrl } from '@std/path';
import type { ProcessPort } from '../../ports/process-port.ts';
import type {
  SelectedResourceClient,
  SelectedResourceProcedure,
} from './resource-slice-contract.ts';

const REPORT_PREFIX = 'NETSCRIPT_QUERY_PROCEDURE ';
const LISTED_KEYS = 24;
const PROBE_TIMEOUT_MS = 30_000;

/** What walking a dotted procedure path over a query factory export found. */
export type QueryProcedureInspection =
  | Readonly<{ kind: 'query' }>
  | Readonly<{
    kind: 'unresolved';
    /** Leading path segments that resolved before the walk stopped. */
    resolved: readonly string[];
    /** Sorted procedure/namespace keys on the last node reached; empty when it is a query. */
    available: readonly string[];
    /** Sorted procedure/namespace keys on the query factory export itself. */
    topLevel: readonly string[];
  }>;

/** Runtime used to load the selected client module under the application's own config. */
export interface QueryProcedureRuntime {
  readonly process: ProcessPort;
  /** Deno executable that evaluates the probe (normally `Deno.execPath()`). */
  readonly executable: string;
}

/** Validate a dotted `--procedure` value into identifier segments. */
export function parseQueryProcedurePath(procedure: string): [string, ...string[]] {
  const path = procedure.split('.').filter(Boolean);
  if (
    path.length === 0 ||
    path.some((segment) => !/^[A-Za-z_$][\w$]*$/.test(segment)) ||
    path.join('.') !== procedure
  ) {
    throw new Error(`Invalid query procedure '${procedure}'.`);
  }
  return path as [string, ...string[]];
}

/**
 * Walk `path` over a query factory export using own keys only.
 *
 * This function is serialized into the probe child process with
 * `Function.prototype.toString()`, so it must stay self-contained: no imports,
 * no references to module scope.
 */
export function inspectQueryProcedure(
  root: unknown,
  path: readonly string[],
): QueryProcedureInspection {
  const isNode = (value: unknown): value is object =>
    (typeof value === 'object' && value !== null) || typeof value === 'function';
  const isQuery = (value: unknown): boolean =>
    typeof value === 'function' &&
    typeof Reflect.get(value, 'queryOptions') === 'function' &&
    typeof Reflect.get(value, 'clientKey') === 'function';
  // Lists only addressable children: query procedures and namespace objects
  // (factory helpers such as `resource` and `invalidate` are neither).
  const keysOf = (value: unknown): string[] =>
    isNode(value) && !isQuery(value)
      ? Object.keys(value).filter((key) => {
        const child: unknown = Reflect.get(value, key);
        return isQuery(child) || (typeof child === 'object' && child !== null);
      }).sort()
      : [];
  let node: unknown = root;
  const resolved: string[] = [];
  for (const segment of path) {
    if (!isNode(node) || !Object.hasOwn(node, segment)) break;
    node = Reflect.get(node, segment);
    resolved.push(segment);
  }
  if (resolved.length === path.length && isQuery(node)) return { kind: 'query' };
  return { kind: 'unresolved', resolved, available: keysOf(node), topLevel: keysOf(root) };
}

/** Explain an unresolved procedure: what was requested, where it was searched, and what exists. */
export function describeUnresolvedQueryProcedure(
  procedure: string,
  client: SelectedResourceClient,
  inspection: Extract<QueryProcedureInspection, { kind: 'unresolved' }>,
): string {
  const path = procedure.split('.');
  const searched =
    `client '${client.serviceName}' (${client.queryFactoryName} in ${client.moduleSpecifier})`;
  const stop = inspection.resolved.length === path.length
    ? `'${procedure}' resolves to a ${
      inspection.available.length ? 'namespace' : 'value'
    }, not a query procedure`
    : inspection.resolved.length
    ? `'${inspection.resolved.join('.')}' has no '${path[inspection.resolved.length]}'`
    : `${client.queryFactoryName} has no top-level '${path[0]}'`;
  const nested = inspection.resolved.length && inspection.available.length
    ? ` Keys under '${inspection.resolved.join('.')}': ${listKeys(inspection.available)}.`
    : '';
  return `Query procedure '${procedure}' does not exist on ${searched}: ${stop}.${nested} ` +
    `Available top-level keys: ${listKeys(inspection.topLevel)}. ` +
    `A client fronting several namespaces is addressed as --procedure <namespace>.<procedure>.`;
}

/**
 * Resolve `procedure` against the selected client module by loading it in a
 * child Deno process configured by the application's `deno.json`.
 */
export async function resolveQueryProcedure(
  input: Readonly<{ appRoot: string; client: SelectedResourceClient; procedure: string }>,
  runtime: QueryProcedureRuntime,
): Promise<SelectedResourceProcedure> {
  const path = parseQueryProcedurePath(input.procedure);
  const modulePath = join(input.appRoot, input.client.moduleSpecifier.replace(/^@app\//, ''));
  const result = await runtime.process.exec(
    runtime.executable,
    [
      'eval',
      `--config=${join(input.appRoot, 'deno.json')}`,
      probeScript(toFileUrl(modulePath).href, input.client.queryFactoryName, path),
    ],
    { cwd: input.appRoot, timeoutMs: PROBE_TIMEOUT_MS },
  );
  const report = result.stdout.split('\n').findLast((line) => line.startsWith(REPORT_PREFIX));
  if (result.code !== 0 || report === undefined) {
    const detail = result.stderr.trim().split('\n').slice(0, 3).join(' ').trim();
    throw new Error(
      `Could not load client module ${input.client.moduleSpecifier} to resolve query procedure '${input.procedure}'${
        detail ? `: ${detail}` : '.'
      }`,
    );
  }
  const inspection = JSON.parse(report.slice(REPORT_PREFIX.length)) as QueryProcedureInspection;
  if (inspection.kind !== 'query') {
    throw new Error(describeUnresolvedQueryProcedure(input.procedure, input.client, inspection));
  }
  return { path, kind: 'query' };
}

function probeScript(moduleUrl: string, exportName: string, path: readonly string[]): string {
  return `const inspect = ${inspectQueryProcedure.toString()};
const module = await import(${JSON.stringify(moduleUrl)});
const report = inspect(module[${JSON.stringify(exportName)}], ${JSON.stringify(path)});
console.log(${JSON.stringify(REPORT_PREFIX)} + JSON.stringify(report));
`;
}

function listKeys(keys: readonly string[]): string {
  if (!keys.length) return '(none)';
  const shown = keys.slice(0, LISTED_KEYS).join(', ');
  return keys.length > LISTED_KEYS ? `${shown}, … (${keys.length - LISTED_KEYS} more)` : shown;
}
