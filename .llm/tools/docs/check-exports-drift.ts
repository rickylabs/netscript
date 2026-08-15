import { join } from '@std/path';

export interface SymbolOmissionGroup {
  reason: string;
  symbols: readonly string[];
}

export type SymbolCoverage =
  | {
    mode: 'complete';
    reason: string;
    omittedSymbols?: readonly SymbolOmissionGroup[];
    documentedNonExports?: readonly SymbolOmissionGroup[];
  }
  | {
    mode: 'entrypoints-only';
    reason: string;
  };

export interface PackageMapping {
  name: string;
  packagePath: string; // relative to root, e.g. "packages/plugin"
  docPath: string; // relative to root, e.g. "docs/site/reference/plugin/index.md"
  packageName: string; // e.g. "@netscript/plugin"
  excludedExports?: readonly string[]; // exported keys intentionally outside the public reference
  symbolCoverage: SymbolCoverage;
}

export const AUTHORITATIVE_MAPPING: readonly PackageMapping[] = [
  {
    name: 'fresh-ui',
    packagePath: 'packages/fresh-ui',
    docPath: 'docs/site/reference/fresh-ui/index.md',
    packageName: '@netscript/fresh-ui',
    excludedExports: [],
    symbolCoverage: {
      mode: 'complete',
      reason: 'All six published entrypoints are maintained as one complete reference surface.',
      documentedNonExports: [{
        reason:
          'Dropzone is an explicitly labeled copy-source registry component, not a package export.',
        symbols: [
          'DROPZONE_INGEST_SOURCES',
          'DROPZONE_REJECTED_REASONS',
          'DropzoneIngestDetails',
          'DropzoneIngestSource',
          'DropzoneProps',
          'DropzoneRejectedFile',
          'DropzoneRejectedReason',
        ],
      }],
    },
  },
  {
    name: 'plugin',
    packagePath: 'packages/plugin',
    docPath: 'docs/site/reference/plugin/index.md',
    packageName: '@netscript/plugin',
    excludedExports: [],
    symbolCoverage: {
      mode: 'entrypoints-only',
      reason:
        'This page currently guarantees package entrypoint coverage; complete symbol prose is tracked separately.',
    },
  },
  {
    name: 'config',
    packagePath: 'packages/config',
    docPath: 'docs/site/reference/config/index.md',
    packageName: '@netscript/config',
    excludedExports: [],
    symbolCoverage: {
      mode: 'complete',
      reason: 'The config reference is maintained as a complete published-symbol inventory.',
    },
  },
  {
    name: 'contracts',
    packagePath: 'packages/contracts',
    docPath: 'docs/site/reference/contracts/index.md',
    packageName: '@netscript/contracts',
    excludedExports: [],
    symbolCoverage: {
      mode: 'complete',
      reason: 'The contracts reference is maintained as a complete published-symbol inventory.',
    },
  },
  {
    name: 'queue',
    packagePath: 'packages/queue',
    docPath: 'docs/site/reference/queue/index.md',
    packageName: '@netscript/queue',
    excludedExports: [],
    symbolCoverage: {
      mode: 'entrypoints-only',
      reason:
        'This page currently guarantees package entrypoint coverage; complete symbol prose is tracked separately.',
    },
  },
  {
    name: 'sdk',
    packagePath: 'packages/sdk',
    docPath: 'docs/site/reference/sdk/index.md',
    packageName: '@netscript/sdk',
    excludedExports: [],
    symbolCoverage: {
      mode: 'entrypoints-only',
      reason:
        'This page currently guarantees package entrypoint coverage; complete symbol prose is tracked separately.',
    },
  },
  {
    name: 'service',
    packagePath: 'packages/service',
    docPath: 'docs/site/reference/service/index.md',
    packageName: '@netscript/service',
    excludedExports: [],
    symbolCoverage: {
      mode: 'entrypoints-only',
      reason:
        'This page currently guarantees package entrypoint coverage; complete symbol prose is tracked separately.',
    },
  },
  {
    name: 'telemetry',
    packagePath: 'packages/telemetry',
    docPath: 'docs/site/reference/telemetry/index.md',
    packageName: '@netscript/telemetry',
    excludedExports: [],
    symbolCoverage: {
      mode: 'complete',
      reason:
        'The telemetry reference curates stable entrypoints and primary APIs while classifying lower-level contracts explicitly.',
      omittedSymbols: [{
        reason:
          'Low-level provider, query, instrumentation, compatibility, and framework integration contracts remain API-reference-only.',
        symbols: [
          'AiTelemetryAttributes',
          'AiTelemetryAttributeValue',
          'AnyInterceptor',
          'AspireTelemetryQuery',
          'AspireTelemetryQueryOptions',
          'AttributeValue',
          'clearProviderRegistration',
          'ClientInterceptorOptions',
          'Counter',
          'createAspireTelemetryQuery',
          'createFanInLinks',
          'createHonoTracingMiddleware',
          'createInMemorySpanRecorder',
          'createOtelAiTelemetryPort',
          'CreateOtelAiTelemetryPortOptions',
          'createOtelDenoMeter',
          'createOtelDenoPropagator',
          'createOtelDenoProvider',
          'createOtelDenoSpanLink',
          'createOtelSdkProvider',
          'createOtelSdkSpanLink',
          'createProviderRegistration',
          'createTelemetryProvider',
          'CreateTelemetryProviderInput',
          'createTelemetryQuery',
          'createWorkerMetricInstruments',
          'DEFAULT_TELEMETRY_PROVIDER_ID',
          'defaultSdkLoader',
          'DeprecatedExecutionAttributeAliases',
          'DeprecatedJobAttributeAliases',
          'DeprecatedMessagingAttributeAliases',
          'DeprecatedSagaAttributeAliases',
          'EnqueueOptions',
          'ErrorClassification',
          'ErrorClassifier',
          'Exception',
          'FanInLinkMessage',
          'GenAiAttributeName',
          'GenericHandlerOptions',
          'getParentContextFromHeaders',
          'getTraceContext',
          'getTriggerTracer',
          'getWorkerMetricInstruments',
          'Histogram',
          'HonoTracingMiddleware',
          'HonoTracingMiddlewareOptions',
          'InMemorySpanRecorder',
          'isProviderRegistered',
          'JobDispatchContext',
          'JobExecutionOptions',
          'ListenOptions',
          'LogLevel',
          'markProviderRegistered',
          'MessageContext',
          'MessageQueue',
          'Meter',
          'MeterPort',
          'MetricInstrumentOptions',
          'MetricQueryFilter',
          'metricQueryFilterSchema',
          'NETSCRIPT_ATTRIBUTE_ALIAS_MODE',
          'NETSCRIPT_ATTRIBUTE_ALIAS_WINDOW',
          'NETSCRIPT_ATTRIBUTE_ROOT',
          'NETSCRIPT_SEMCONV_STABILITY_OPT_IN',
          'NETSCRIPT_TELEMETRY_ENV_VARS',
          'NetScriptAttributeDomain',
          'ObservableCallback',
          'ObservableGauge',
          'ObservableResult',
          'OTEL_SEMCONV_STABILITY_OPT_IN',
          'OTEL_SEMCONV_STABILITY_OPT_IN_VALUE',
          'OtelAiTelemetryPort',
          'OtelAiTelemetrySpan',
          'OtelAiTracer',
          'otelDenoDescriptor',
          'OtelDenoMeter',
          'OtelDenoPropagator',
          'OtelDenoSpanLink',
          'OtelDenoTracerProvider',
          'otelSdkDescriptor',
          'OtelSdkSpanLink',
          'OtelSdkTracerProvider',
          'parseTraceState',
          'PropagationExtractCarrier',
          'PropagationHeaders',
          'PropagationInjectCarrier',
          'PropagatorPort',
          'RecordedSpanEvent',
          'RecordedSpanSnapshot',
          'recordSharedWorkerMetrics',
          'registerORPCInstrumentation',
          'ResourceQueryFilter',
          'resourceQueryFilterSchema',
          'RootInterceptor',
          'RootInterceptorOptions',
          'SagaAttributeName',
          'ScheduledJobDefinition',
          'SchedulerTickContext',
          'SdkBinding',
          'SdkLoader',
          'SdkMeterProviderHandle',
          'SdkTracerProviderHandle',
          'SpanContext',
          'SpanLinkPort',
          'SpanOptions',
          'SpanStatus',
          'TELEMETRY_PROVIDER_REGISTRATION_NAME',
          'TelemetryAttributeBuilderMap',
          'TelemetryAttributeBuilderValue',
          'TelemetryAttributeValue',
          'TelemetryConfigError',
          'telemetryConfigSchema',
          'TelemetryConventionId',
          'TelemetryLog',
          'TelemetryMetric',
          'TelemetryMetricPoint',
          'TelemetryMetricType',
          'TelemetryOtlpJson',
          'TelemetryProviderDescriptor',
          'TelemetryProviderId',
          'TelemetryProviderOptions',
          'TelemetryProviderSelection',
          'TelemetryQueryOptions',
          'TelemetryQueryPort',
          'TelemetryQueryValidationError',
          'TelemetryResource',
          'TelemetrySpan',
          'TelemetrySpanEvent',
          'TelemetrySpanKind',
          'TelemetrySpanLink',
          'TelemetryTrace',
          'TimeInput',
          'TracedDispatchOptions',
          'TracedJobDefinition',
          'TracedJobExecution',
          'TracedJobResult',
          'TracedMessageContext',
          'TracedQueue',
          'TracedQueueOptions',
          'TracedResult',
          'TracedWorkerConfig',
          'TraceQueryFilter',
          'traceQueryFilterSchema',
          'traceQueue',
          'TracerProviderPort',
          'traceSchedulerTick',
          'TraceState',
          'validateMetricQueryFilter',
          'validateResourceQueryFilter',
          'validateTelemetryConfig',
          'validateTraceQueryFilter',
          'withChildSpan',
          'WorkerMetricInstruments',
          'WorkerMetricValues',
        ],
      }],
    },
  },
];

export function parseDocContent(
  docContent: string,
): { docExports: Map<string, string>; docSymbols: Set<string> } {
  const docExports = new Map<string, string>();
  const docSymbols = new Set<string>();
  const lines = docContent.split('\n');
  let insideExportsTable = false;
  let insideSymbolsTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## Sub-path exports') || trimmed.startsWith('## Exports')) {
      insideExportsTable = true;
      continue;
    }
    if (insideExportsTable && trimmed.startsWith('---')) {
      insideExportsTable = false;
    }
    if (insideExportsTable) {
      const match = line.match(/^\|\s*`?(@netscript\/[^`|]+)`?\s*\|\s*`?([^`|]+)`?\s*\|/);
      if (match) {
        const name = match[1].trim();
        const path = match[2].trim();
        docExports.set(name, path);
      }
    }

    if (!trimmed.startsWith('|')) {
      insideSymbolsTable = false;
      continue;
    }

    const tableCells = trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
    if (tableCells[0] === 'Symbol') {
      insideSymbolsTable = true;
      continue;
    }
    if (!insideSymbolsTable || tableCells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      continue;
    }

    for (const match of tableCells[0].matchAll(/`([^`]+)`/g)) {
      const groupedSymbols = match[1].split(/[\/,|]/).map((symbol) => symbol.trim()).filter(
        Boolean,
      );
      for (const displaySymbol of groupedSymbols) {
        const normalizedSymbol = displaySymbol.replace(/<[^<>]*>$/, '').trim();
        if (normalizedSymbol && !normalizedSymbol.includes('@netscript/')) {
          docSymbols.add(normalizedSymbol);
        }
      }
    }
  }
  return { docExports, docSymbols };
}

export function deriveExpectedExports(
  packageName: string,
  exportsObj: any,
  excludedExports: readonly string[] = [],
): Map<string, string> {
  const expectedExports = new Map<string, string>();
  const excludedSet = new Set(excludedExports);

  if (typeof exportsObj === 'string') {
    if (!excludedSet.has('.')) {
      expectedExports.set(packageName, exportsObj);
    }
  } else {
    for (const [key, value] of Object.entries(exportsObj)) {
      if (excludedSet.has(key)) continue;
      const exportName = key === '.' ? packageName : `${packageName}/${key.slice(2)}`;
      expectedExports.set(
        exportName,
        typeof value === 'string' ? value : (value as any).default || '',
      );
    }
  }
  return expectedExports;
}

export function checkExportsDrift(
  pkgName: string,
  docPath: string,
  expectedExports: Map<string, string>,
  docExports: Map<string, string>,
): string[] {
  const errors: string[] = [];
  for (const [name, path] of expectedExports.entries()) {
    if (!docExports.has(name)) {
      errors.push(
        `Drift Error [${pkgName}]: Document at ${docPath} OMITS exported entrypoint '${name}' (${path})`,
      );
    } else {
      const docPathVal = docExports.get(name);
      if (docPathVal !== path) {
        errors.push(
          `Drift Error [${pkgName}]: Document at ${docPath} has mismatching path for '${name}'. Expected: '${path}', Doc: '${docPathVal}'`,
        );
      }
    }
  }

  for (const name of docExports.keys()) {
    if (!expectedExports.has(name)) {
      errors.push(
        `Drift Error [${pkgName}]: Document at ${docPath} INVENTS nonexistent/omitted entrypoint '${name}'`,
      );
    }
  }
  return errors;
}

export function checkSymbolsDrift(
  pkgName: string,
  docPath: string,
  expectedSymbols: Set<string>,
  docSymbols: Set<string>,
  omittedSymbols: ReadonlySet<string> = new Set(),
  documentedNonExports: ReadonlySet<string> = new Set(),
): string[] {
  const errors: string[] = [];
  for (const sym of expectedSymbols) {
    if (!omittedSymbols.has(sym) && !docSymbols.has(sym)) {
      errors.push(
        `Symbol Drift Error [${pkgName}]: Document at ${docPath} OMITS exported symbol '${sym}'`,
      );
    }
  }

  for (const sym of docSymbols) {
    if (
      sym === 'Symbol' || sym === 'Kind' || sym === 'Signature' || sym === 'Description' ||
      sym === 'Export' || sym === 'Entrypoint' || sym === 'Purpose'
    ) continue;
    if (sym.includes('/') || sym.startsWith('@')) continue;

    if (!expectedSymbols.has(sym) && !documentedNonExports.has(sym)) {
      errors.push(
        `Symbol Drift Error [${pkgName}]: Document at ${docPath} INVENTS nonexistent/unexported symbol '${sym}'`,
      );
    }
  }
  return errors;
}

interface ValidatedMapping {
  mappings: PackageMapping[];
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseOmissionGroups(
  value: unknown,
  field: string,
  errors: string[],
): SymbolOmissionGroup[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array when present`);
    return [];
  }

  const groups: SymbolOmissionGroup[] = [];
  for (const [index, candidate] of value.entries()) {
    const path = `${field}[${index}]`;
    if (!isRecord(candidate)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    if (!isNonemptyString(candidate.reason)) {
      errors.push(`${path}.reason must be a nonempty string`);
    }
    if (!Array.isArray(candidate.symbols) || candidate.symbols.length === 0) {
      errors.push(`${path}.symbols must be a nonempty array`);
      continue;
    }
    const symbols: string[] = [];
    for (const [symbolIndex, symbol] of candidate.symbols.entries()) {
      if (!isNonemptyString(symbol)) {
        errors.push(`${path}.symbols[${symbolIndex}] must be a nonempty string`);
      } else {
        symbols.push(symbol);
      }
    }
    if (isNonemptyString(candidate.reason) && symbols.length === candidate.symbols.length) {
      groups.push({ reason: candidate.reason.trim(), symbols });
    }
  }
  return groups;
}

export function validateAuthoritativeMapping(mapping: unknown): ValidatedMapping {
  const errors: string[] = [];
  const mappings: PackageMapping[] = [];
  if (!Array.isArray(mapping) || mapping.length === 0) {
    return { mappings, errors: ['Authoritative mapping must be a nonempty array'] };
  }

  const names = new Set<string>();
  for (const [index, candidate] of mapping.entries()) {
    const path = `mapping[${index}]`;
    if (!isRecord(candidate)) {
      errors.push(`${path} must be an object`);
      continue;
    }

    const requiredFields = ['name', 'packagePath', 'docPath', 'packageName'] as const;
    let fieldsValid = true;
    for (const field of requiredFields) {
      if (!isNonemptyString(candidate[field])) {
        errors.push(`${path}.${field} must be a nonempty string`);
        fieldsValid = false;
      }
    }

    if (isNonemptyString(candidate.name)) {
      if (names.has(candidate.name)) errors.push(`${path}.name duplicates '${candidate.name}'`);
      names.add(candidate.name);
    }

    let excludedExports: string[] | undefined;
    if (candidate.excludedExports !== undefined) {
      if (
        !Array.isArray(candidate.excludedExports) ||
        !candidate.excludedExports.every(isNonemptyString)
      ) {
        errors.push(`${path}.excludedExports must contain only nonempty strings`);
      } else {
        excludedExports = [...candidate.excludedExports];
      }
    }

    if (!isRecord(candidate.symbolCoverage)) {
      errors.push(`${path}.symbolCoverage must be an object`);
      continue;
    }
    const coverage = candidate.symbolCoverage;
    if (!isNonemptyString(coverage.reason)) {
      errors.push(`${path}.symbolCoverage.reason must be a nonempty string`);
    }

    let symbolCoverage: SymbolCoverage | undefined;
    if (coverage.mode === 'complete') {
      const omittedSymbols = parseOmissionGroups(
        coverage.omittedSymbols,
        `${path}.symbolCoverage.omittedSymbols`,
        errors,
      );
      const documentedNonExports = parseOmissionGroups(
        coverage.documentedNonExports,
        `${path}.symbolCoverage.documentedNonExports`,
        errors,
      );
      if (isNonemptyString(coverage.reason)) {
        symbolCoverage = {
          mode: 'complete',
          reason: coverage.reason.trim(),
          omittedSymbols,
          documentedNonExports,
        };
      }
    } else if (coverage.mode === 'entrypoints-only') {
      if (coverage.omittedSymbols !== undefined || coverage.documentedNonExports !== undefined) {
        errors.push(`${path}.symbolCoverage entrypoints-only mode cannot define symbol groups`);
      }
      if (isNonemptyString(coverage.reason)) {
        symbolCoverage = { mode: 'entrypoints-only', reason: coverage.reason.trim() };
      }
    } else {
      errors.push(`${path}.symbolCoverage.mode is unknown: '${String(coverage.mode)}'`);
    }

    if (fieldsValid && symbolCoverage) {
      mappings.push({
        name: String(candidate.name),
        packagePath: String(candidate.packagePath),
        docPath: String(candidate.docPath),
        packageName: String(candidate.packageName),
        excludedExports,
        symbolCoverage,
      });
    }
  }

  return { mappings, errors };
}

function printCoverageReport(mapping: unknown): void {
  if (!Array.isArray(mapping) || mapping.length === 0) {
    console.log('Coverage [mapping]: mode=<invalid>; reason=<invalid>; omission-groups=0');
    return;
  }
  for (const [index, candidate] of mapping.entries()) {
    const record = isRecord(candidate) ? candidate : {};
    const coverage = isRecord(record.symbolCoverage) ? record.symbolCoverage : {};
    const name = isNonemptyString(record.name) ? record.name : `#${index}`;
    const mode = typeof coverage.mode === 'string' ? coverage.mode : '<invalid>';
    const reason = isNonemptyString(coverage.reason) ? coverage.reason.trim() : '<invalid>';
    const omittedCount = Array.isArray(coverage.omittedSymbols)
      ? coverage.omittedSymbols.length
      : 0;
    const nonExportCount = Array.isArray(coverage.documentedNonExports)
      ? coverage.documentedNonExports.length
      : 0;
    console.log(
      `Coverage [${name}]: mode=${mode}; reason=${JSON.stringify(reason)}; ` +
        `omitted-symbol-groups=${omittedCount}; documented-non-export-groups=${nonExportCount}`,
    );
  }
}

function flattenGroups(
  pkgName: string,
  kind: string,
  groups: readonly SymbolOmissionGroup[],
): { symbols: Set<string>; errors: string[] } {
  const symbols = new Set<string>();
  const errors: string[] = [];
  for (const group of groups) {
    const sorted = [...group.symbols].sort((a, b) => a.localeCompare(b));
    if (group.symbols.some((symbol, index) => symbol !== sorted[index])) {
      errors.push(`Coverage Policy Error [${pkgName}]: ${kind} symbols must be sorted`);
    }
    for (const symbol of group.symbols) {
      if (symbols.has(symbol)) {
        errors.push(
          `Coverage Policy Error [${pkgName}]: ${kind} repeats symbol '${symbol}'`,
        );
      }
      symbols.add(symbol);
    }
  }
  return { symbols, errors };
}

export async function checkDrift(mapping: unknown): Promise<number> {
  printCoverageReport(mapping);
  const validated = validateAuthoritativeMapping(mapping);
  if (validated.errors.length > 0) {
    for (const error of validated.errors) console.error(`Coverage Policy Error: ${error}`);
    return 1;
  }

  let hasErrors = false;
  const root = Deno.cwd();

  for (const pkg of validated.mappings) {
    const denoJsonPath = join(root, pkg.packagePath, 'deno.json');
    const docPath = join(root, pkg.docPath);

    let denoJson;
    try {
      denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
    } catch (err) {
      console.error(`Failed to read deno.json for ${pkg.name} at ${denoJsonPath}:`, err);
      hasErrors = true;
      continue;
    }

    let docContent;
    try {
      docContent = await Deno.readTextFile(docPath);
    } catch (err) {
      console.error(`Failed to read doc for ${pkg.name} at ${docPath}:`, err);
      hasErrors = true;
      continue;
    }

    const exportsObj = denoJson.exports;
    if (!exportsObj) {
      console.error(`No exports field found in deno.json for ${pkg.name}`);
      hasErrors = true;
      continue;
    }

    const expectedExports = deriveExpectedExports(pkg.packageName, exportsObj, pkg.excludedExports);
    const { docExports, docSymbols } = parseDocContent(docContent);

    const exportsErrors = checkExportsDrift(pkg.name, pkg.docPath, expectedExports, docExports);
    for (const err of exportsErrors) {
      console.error(err);
      hasErrors = true;
    }

    // Run deno doc to collect all actually exported symbols from this package's entrypoints
    if (pkg.symbolCoverage.mode === 'complete') {
      const expectedSymbols = new Set<string>();
      const omitted = flattenGroups(
        pkg.name,
        'omitted-symbol group',
        pkg.symbolCoverage.omittedSymbols ?? [],
      );
      const documentedNonExports = flattenGroups(
        pkg.name,
        'documented-non-export group',
        pkg.symbolCoverage.documentedNonExports ?? [],
      );
      for (const error of [...omitted.errors, ...documentedNonExports.errors]) {
        console.error(error);
        hasErrors = true;
      }
      for (const symbol of omitted.symbols) {
        if (documentedNonExports.symbols.has(symbol)) {
          console.error(
            `Coverage Policy Error [${pkg.name}]: symbol '${symbol}' is both omitted and documented as a non-export`,
          );
          hasErrors = true;
        }
      }

      for (const [exportName, relativePath] of expectedExports.entries()) {
        const fullEntrypointPath = join(root, pkg.packagePath, relativePath);
        try {
          const cmd = new Deno.Command('deno', {
            args: ['doc', '--no-lock', '--json', fullEntrypointPath],
          });
          const { stdout, stderr, code } = await cmd.output();
          if (code !== 0) {
            console.error(
              `Failed to run deno doc --json for ${exportName} at ${fullEntrypointPath}`,
            );
            console.error(new TextDecoder().decode(stderr));
            hasErrors = true;
            continue;
          }
          const docJson = JSON.parse(new TextDecoder().decode(stdout));
          const fileUrl = Object.keys(docJson.nodes)[0];
          const symbols = fileUrl ? docJson.nodes[fileUrl]?.symbols : undefined;
          if (!Array.isArray(symbols) || symbols.length === 0) {
            console.error(
              `Empty symbol selection from deno doc --json for ${exportName} at ${fullEntrypointPath}`,
            );
            hasErrors = true;
            continue;
          }
          for (const sym of symbols) {
            if (sym.name) expectedSymbols.add(sym.name);
          }
        } catch (err) {
          console.error(`Error processing deno doc for ${exportName}:`, err);
          hasErrors = true;
        }
      }

      for (const symbol of omitted.symbols) {
        if (!expectedSymbols.has(symbol)) {
          console.error(
            `Coverage Policy Error [${pkg.name}]: omitted symbol '${symbol}' is not exported`,
          );
          hasErrors = true;
        } else if (docSymbols.has(symbol)) {
          console.error(
            `Coverage Policy Error [${pkg.name}]: omitted symbol '${symbol}' is documented and no longer omitted`,
          );
          hasErrors = true;
        }
      }
      for (const symbol of documentedNonExports.symbols) {
        if (expectedSymbols.has(symbol)) {
          console.error(
            `Coverage Policy Error [${pkg.name}]: documented non-export '${symbol}' is now exported`,
          );
          hasErrors = true;
        } else if (!docSymbols.has(symbol)) {
          console.error(
            `Coverage Policy Error [${pkg.name}]: documented non-export '${symbol}' is absent from the reference`,
          );
          hasErrors = true;
        }
      }

      const symbolsErrors = checkSymbolsDrift(
        pkg.name,
        pkg.docPath,
        expectedSymbols,
        docSymbols,
        omitted.symbols,
        documentedNonExports.symbols,
      );
      for (const err of symbolsErrors) {
        console.error(err);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    return 1;
  }
  console.log('Exports & Symbols drift check: PASS');
  return 0;
}

if (import.meta.main) {
  Deno.exit(await checkDrift(AUTHORITATIVE_MAPPING));
}
