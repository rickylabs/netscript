import { join } from '@std/path';

export interface PackageMapping {
  name: string;
  packagePath: string;      // relative to root, e.g. "packages/plugin"
  docPath: string;          // relative to root, e.g. "docs/site/reference/plugin/index.md"
  packageName: string;      // e.g. "@netscript/plugin"
  excludedExports?: string[]; // list of exported keys to ignore, e.g. ["./internal"]
  checkSymbols?: boolean;   // if true, verifies every exported symbol is listed in the doc
  excludedSymbols?: string[]; // list of symbol names to ignore
}

export const AUTHORITATIVE_MAPPING: PackageMapping[] = [
  {
    name: 'fresh-ui',
    packagePath: 'packages/fresh-ui',
    docPath: 'docs/site/reference/fresh-ui/index.md',
    packageName: '@netscript/fresh-ui',
    excludedExports: [],
    checkSymbols: false,
    excludedSymbols: [],
  },
  {
    name: 'plugin',
    packagePath: 'packages/plugin',
    docPath: 'docs/site/reference/plugin/index.md',
    packageName: '@netscript/plugin',
    excludedExports: [],
    checkSymbols: false,
    excludedSymbols: [],
  },
  {
    name: 'config',
    packagePath: 'packages/config',
    docPath: 'docs/site/reference/config/index.md',
    packageName: '@netscript/config',
    excludedExports: [],
    checkSymbols: true,
    excludedSymbols: [],
  },
  {
    name: 'contracts',
    packagePath: 'packages/contracts',
    docPath: 'docs/site/reference/contracts/index.md',
    packageName: '@netscript/contracts',
    excludedExports: [],
    checkSymbols: true,
    excludedSymbols: [],
  },
  {
    name: 'queue',
    packagePath: 'packages/queue',
    docPath: 'docs/site/reference/queue/index.md',
    packageName: '@netscript/queue',
    excludedExports: [],
    checkSymbols: false,
    excludedSymbols: [],
  },
  {
    name: 'sdk',
    packagePath: 'packages/sdk',
    docPath: 'docs/site/reference/sdk/index.md',
    packageName: '@netscript/sdk',
    excludedExports: [],
    checkSymbols: false,
    excludedSymbols: [],
  },
  {
    name: 'service',
    packagePath: 'packages/service',
    docPath: 'docs/site/reference/service/index.md',
    packageName: '@netscript/service',
    excludedExports: [],
    checkSymbols: false,
    excludedSymbols: [],
  },
  {
    name: 'telemetry',
    packagePath: 'packages/telemetry',
    docPath: 'docs/site/reference/telemetry/index.md',
    packageName: '@netscript/telemetry',
    excludedExports: [],
    checkSymbols: true,
    excludedSymbols: [
      'OtelAiTracer',
      'TelemetryQueryPort',
      'TelemetryQueryOptions',
      'otelDenoDescriptor',
      'OtelDenoTracerProvider',
      'OtelDenoPropagator',
      'OtelDenoMeter',
      'OtelDenoSpanLink',
      'createOtelDenoProvider',
      'createOtelDenoPropagator',
      'createOtelDenoMeter',
      'createOtelDenoSpanLink',
      'SdkTracerProviderHandle',
      'SdkMeterProviderHandle',
      'SdkBinding',
      'SdkLoader',
      'defaultSdkLoader',
      'otelSdkDescriptor',
      'OtelSdkTracerProvider',
      'OtelSdkSpanLink',
      'createOtelSdkProvider',
      'createOtelSdkSpanLink',
      'TelemetryProviderSelection',
      'CreateTelemetryProviderInput',
      'createTelemetryProvider',
      'metricQueryFilterSchema',
      'resourceQueryFilterSchema',
      'TelemetryQueryValidationError',
      'traceQueryFilterSchema',
      'validateMetricQueryFilter',
      'validateResourceQueryFilter',
      'validateTraceQueryFilter',
      'MetricQueryFilter',
      'ResourceQueryFilter',
      'TelemetryAttributeValue',
      'TelemetryLog',
      'TelemetryMetric',
      'TelemetryMetricPoint',
      'TelemetryMetricType',
      'TelemetryOtlpJson',
      'TelemetryResource',
      'TelemetrySpan',
      'TelemetrySpanEvent',
      'TelemetrySpanKind',
      'TelemetrySpanLink',
      'TelemetryTrace',
      'TraceQueryFilter',
      'AspireTelemetryQuery',
      'createAspireTelemetryQuery',
      'AspireTelemetryQueryOptions',
      'createTelemetryQuery',
      'RecordedSpanEvent',
      'RecordedSpanSnapshot',
      'InMemorySpanRecorder',
      'createInMemorySpanRecorder',
      'getTriggerTracer',
      'getTraceContext',
      'parseTraceState',
      'DeprecatedMessagingAttributeAliases',
      'DeprecatedJobAttributeAliases',
      'DeprecatedExecutionAttributeAliases',
      'DeprecatedSagaAttributeAliases',
      'SagaAttributeName',
      'GenAiAttributeName',
      'TelemetryAttributeBuilderValue',
      'TelemetryAttributeBuilderMap',
      'OTEL_SEMCONV_STABILITY_OPT_IN',
      'NETSCRIPT_SEMCONV_STABILITY_OPT_IN',
      'NETSCRIPT_ATTRIBUTE_ROOT',
      'NETSCRIPT_ATTRIBUTE_ALIAS_WINDOW',
      'NETSCRIPT_ATTRIBUTE_ALIAS_MODE',
      'TelemetryConventionId',
      'NetScriptAttributeDomain',
      'MessageContext',
      'EnqueueOptions',
      'ListenOptions',
      'MessageQueue',
      'TracedQueueOptions',
      'TracedMessageContext',
      'TracedQueue',
      'traceQueue',
      'ScheduledJobDefinition',
      'SchedulerTickContext',
      'JobDispatchContext',
      'TracedDispatchOptions',
      'traceSchedulerTick',
      'TracedJobDefinition',
      'TracedJobExecution',
      'JobExecutionOptions',
      'TracedJobResult',
      'TracedWorkerConfig',
      'WorkerMetricValues',
      'WorkerMetricInstruments',
      'createWorkerMetricInstruments',
      'getWorkerMetricInstruments',
      'recordSharedWorkerMetrics',
      'withChildSpan',
      'createProviderRegistration',
      'TELEMETRY_PROVIDER_REGISTRATION_NAME',
      'registerORPCInstrumentation',
      'ErrorClassification',
      'ErrorClassifier',
      'LogLevel',
      'RootInterceptorOptions',
      'RootInterceptor',
      'ClientInterceptorOptions',
      'AnyInterceptor',
      'GenericHandlerOptions',
      'createHonoTracingMiddleware',
      'HonoTracingMiddleware',
      'HonoTracingMiddlewareOptions',
      'AiTelemetryAttributes',
      'AiTelemetryAttributeValue',
      'createOtelAiTelemetryPort',
      'CreateOtelAiTelemetryPortOptions',
      'OtelAiTelemetryPort',
      'OtelAiTelemetrySpan',
      'AttributeValue',
      'Exception',
      'SpanContext',
      'SpanOptions',
      'SpanStatus',
      'TimeInput',
      'TraceState',
      'Counter',
      'Histogram',
      'Meter',
      'MeterPort',
      'MetricInstrumentOptions',
      'ObservableCallback',
      'ObservableGauge',
      'ObservableResult',
      'PropagationExtractCarrier',
      'PropagationInjectCarrier',
      'PropagatorPort',
      'SpanLinkPort',
      'TelemetryProviderDescriptor',
      'TelemetryProviderOptions',
      'TracerProviderPort',
      'createFanInLinks',
      'FanInLinkMessage',
      'getParentContextFromHeaders',
      'PropagationHeaders',
      'NETSCRIPT_TELEMETRY_ENV_VARS',
      'TelemetryProviderId',
      'DEFAULT_TELEMETRY_PROVIDER_ID',
      'OTEL_SEMCONV_STABILITY_OPT_IN_VALUE',
      'markProviderRegistered',
      'clearProviderRegistration',
      'isProviderRegistered',
      'telemetryConfigSchema',
      'TelemetryConfigError',
      'validateTelemetryConfig',
      'TracedResult'
    ],
  },
];

export function parseDocContent(docContent: string): { docExports: Map<string, string>; docSymbols: Set<string> } {
  const docExports = new Map<string, string>();
  const docSymbols = new Set<string>();
  const lines = docContent.split('\n');
  let insideExportsTable = false;

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

    if (line.startsWith('|') && !line.includes('---') && !line.includes('Symbol |')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 1) {
        const firstCol = parts[0];
        const matches = firstCol.matchAll(/`([^`]+)`/g);
        for (const m of matches) {
          const val = m[1];
          if (val.includes('@netscript/') || val.startsWith('.')) continue;
          const syms = val.split(/[\/,\|]/).map(s => s.trim()).filter(Boolean);
          for (const s of syms) {
            docSymbols.add(s);
          }
        }
      }
    }
  }
  return { docExports, docSymbols };
}

export function deriveExpectedExports(packageName: string, exportsObj: any, excludedExports: string[] = []): Map<string, string> {
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
      expectedExports.set(exportName, typeof value === 'string' ? value : (value as any).default || '');
    }
  }
  return expectedExports;
}

export function checkExportsDrift(pkgName: string, docPath: string, expectedExports: Map<string, string>, docExports: Map<string, string>): string[] {
  const errors: string[] = [];
  for (const [name, path] of expectedExports.entries()) {
    if (!docExports.has(name)) {
      errors.push(`Drift Error [${pkgName}]: Document at ${docPath} OMITS exported entrypoint '${name}' (${path})`);
    } else {
      const docPathVal = docExports.get(name);
      if (docPathVal !== path) {
        errors.push(`Drift Error [${pkgName}]: Document at ${docPath} has mismatching path for '${name}'. Expected: '${path}', Doc: '${docPathVal}'`);
      }
    }
  }

  for (const name of docExports.keys()) {
    if (!expectedExports.has(name)) {
      errors.push(`Drift Error [${pkgName}]: Document at ${docPath} INVENTS nonexistent/omitted entrypoint '${name}'`);
    }
  }
  return errors;
}

export function checkSymbolsDrift(pkgName: string, docPath: string, expectedSymbols: Set<string>, docSymbols: Set<string>): string[] {
  const errors: string[] = [];
  for (const sym of expectedSymbols) {
    if (!docSymbols.has(sym)) {
      errors.push(`Symbol Drift Error [${pkgName}]: Document at ${docPath} OMITS exported symbol '${sym}'`);
    }
  }

  for (const sym of docSymbols) {
    if (sym === 'Symbol' || sym === 'Kind' || sym === 'Signature' || sym === 'Description' || sym === 'Export' || sym === 'Entrypoint' || sym === 'Purpose') continue;
    if (sym.includes('/') || sym.startsWith('@')) continue;
    
    if (!expectedSymbols.has(sym)) {
      errors.push(`Symbol Drift Error [${pkgName}]: Document at ${docPath} INVENTS nonexistent/unexported symbol '${sym}'`);
    }
  }
  return errors;
}

async function checkDrift() {
  let hasErrors = false;
  const root = Deno.cwd();

  for (const pkg of AUTHORITATIVE_MAPPING) {
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
    if (pkg.checkSymbols) {
      const expectedSymbols = new Set<string>();
      const excludedSymbolsSet = new Set(pkg.excludedSymbols ?? []);

      for (const [exportName, relativePath] of expectedExports.entries()) {
        const fullEntrypointPath = join(pkg.packagePath, relativePath);
        try {
          const cmd = new Deno.Command('deno', {
            args: ['doc', '--json', fullEntrypointPath],
          });
          const { stdout, code } = await cmd.output();
          if (code !== 0) {
            console.error(`Failed to run deno doc --json for ${exportName} at ${fullEntrypointPath}`);
            hasErrors = true;
            continue;
          }
          const docJson = JSON.parse(new TextDecoder().decode(stdout));
          const fileUrl = Object.keys(docJson.nodes)[0];
          if (fileUrl && docJson.nodes[fileUrl]?.symbols) {
            for (const sym of docJson.nodes[fileUrl].symbols) {
              if (sym.name && !excludedSymbolsSet.has(sym.name)) {
                expectedSymbols.add(sym.name);
              }
            }
          }
        } catch (err) {
          console.error(`Error processing deno doc for ${exportName}:`, err);
          hasErrors = true;
        }
      }

      const symbolsErrors = checkSymbolsDrift(pkg.name, pkg.docPath, expectedSymbols, docSymbols);
      for (const err of symbolsErrors) {
        console.error(err);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    Deno.exit(1);
  } else {
    console.log('Exports & Symbols drift check: PASS');
  }
}

if (import.meta.main) {
  await checkDrift();
}
