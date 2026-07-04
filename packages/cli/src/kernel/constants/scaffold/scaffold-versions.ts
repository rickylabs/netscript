/**
 * Version constants for scaffold dependencies.
 */
export const SCAFFOLD_VERSIONS = {
  ASPIRE_SDK: '13.4.6',
  DOTNET_SDK: '10.0.0',
  NETSCRIPT_NUGET: '1.0.0',
  OTEL_COLLECTOR: '0.115.0',
  ASPIRE_HOSTING_DENO: '13.4.0',
  ASPIRE_HOSTING_SQLITE: '13.4.0',
  MICROSOFT_EXTENSIONS: '10.0.0',
  OTEL_INSTRUMENTATION: '1.14.0',
  SCALAR_ASPIRE: '0.10.3',
  SWASHBUCKLE: '10.0.1',
  /** garnet-server dotnet tool pin for the Docker-less Garnet executable arm (#372). */
  GARNET_TOOL: '1.1.10',
} as const;
