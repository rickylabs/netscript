/**
 * Version constants for scaffold dependencies.
 */
export const SCAFFOLD_VERSIONS = {
  ASPIRE_SDK: '13.5.3',
  DOTNET_SDK: '10.0.0',
  NETSCRIPT_NUGET: '1.0.0',
  OTEL_COLLECTOR: '0.115.0',
  ASPIRE_HOSTING_DENO: '13.5.0',
  ASPIRE_HOSTING_SQLITE: '13.5.0',
  MICROSOFT_EXTENSIONS: '10.0.0',
  OTEL_INSTRUMENTATION: '1.14.0',
  SCALAR_ASPIRE: '0.10.3',
  SWASHBUCKLE: '10.0.1',
  /** garnet-server dotnet tool pin for the Docker-less Garnet executable arm. */
  GARNET_TOOL: '1.1.10',
  /**
   * node-postgres pin the TypeScript AppHost loads for the `<name>_auth` PostgreSQL
   * credential readiness check. Exact, like `tsx`: the AppHost has no lockfile.
   */
  APPHOST_PG: '8.23.1',
} as const;
