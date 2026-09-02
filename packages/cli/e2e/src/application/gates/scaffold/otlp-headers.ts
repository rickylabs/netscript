import { scanResourceProcesses } from './service-env/process-evidence.ts';
import { SCAFFOLD_DIRS } from '../../../../../src/kernel/constants/scaffold/scaffold-dirs.ts';

/**
 * Parses the W3C-style `OTEL_EXPORTER_OTLP_HEADERS` value (`key=value[,key=value]`) that the
 * Aspire AppHost hands each resource (carrying `x-otlp-api-key` when the dashboard runs with
 * anonymous access disabled) into request headers for an OTLP/HTTP export.
 */
export function parseOtlpHeaders(value: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!value) return headers;
  for (const pair of value.split(',')) {
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;
    const key = pair.slice(0, separator).trim();
    const raw = pair.slice(separator + 1).trim();
    if (!key) continue;
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // Not percent-encoded; keep the raw value.
    }
    headers[key] = decoded;
  }
  return headers;
}

/**
 * Reads `OTEL_EXPORTER_OTLP_HEADERS` from the environment of the process the AppHost started
 * for `resourceName`, using the same `/proc`-backed evidence the service-env gate relies on.
 * Returns no headers when the resource process cannot be found or carries none (anonymous
 * dashboard mode), so the export attempt itself stays the authority on whether auth was needed.
 * `caller` labels the diagnostic when nothing is found.
 */
export async function resolveOtlpHeadersFromResource(
  root: string,
  resourceName: string,
  caller: string,
): Promise<Record<string, string>> {
  // Services run in `services/<name>`; plugin-backed resources (`generate-register-background`)
  // default to the project root. Try both rather than guess which one the resource is.
  const workdirs = [`${root}/${SCAFFOLD_DIRS.SERVICES}/${resourceName}`, root];
  const notes: string[] = [];
  for (const workdir of workdirs) {
    try {
      const scan = await scanResourceProcesses(workdir, resourceName);
      for (const process of scan.processes) {
        const value = process.environment.get('OTEL_EXPORTER_OTLP_HEADERS');
        if (value) return parseOtlpHeaders(value);
      }
      notes.push(
        `${workdir}: examined ${scan.diagnostics.examined}, identified ${scan.diagnostics.identified}, none carried OTEL_EXPORTER_OTLP_HEADERS`,
      );
    } catch (error: unknown) {
      notes.push(`${workdir}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.error(
    `${caller}: no OTLP API key found on the ${resourceName} process ` +
      `(${notes.join('; ')}); exporting without one`,
  );
  return {};
}
