export const ASPIRE_MCP_BASELINE_TOOLS: readonly string[] = [
  'list_resources',
  'list_console_logs',
  'list_structured_logs',
  'list_traces',
  'list_trace_structured_logs',
  'execute_resource_command',
  'list_apphosts',
  'select_apphost',
  'list_integrations',
  'list_docs',
  'search_docs',
  'get_doc',
  'doctor',
  'refresh_tools',
];

export const ASPIRE_MCP_EXPECTED_TOOLS: readonly string[] = ASPIRE_MCP_BASELINE_TOOLS;
export const ASPIRE_MCP_DOCUMENTED_UNOBSERVED: readonly string[] = ['get_integration_docs'];

export const ASPIRE_MCP_DASHBOARD_TOOLS: readonly string[] = [
  'list_structured_logs',
  'list_traces',
  'list_trace_structured_logs',
];

/** Compare an observed Aspire MCP tool surface with a baseline. */
export function diffAspireMcpTools(
  observed: readonly string[],
  baseline: readonly string[],
): { added: string[]; removed: string[] } {
  return {
    added: observed.filter((name) => !baseline.includes(name)).sort(),
    removed: baseline.filter((name) => !observed.includes(name)).sort(),
  };
}
