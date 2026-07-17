import { TOOL_INPUT_SCHEMAS, TOOL_OUTPUT_SCHEMAS } from '../domain/tool-contracts.ts';
import {
  TOOL_NAMES,
  type ToolDefinition,
  type ToolFlow,
  type ToolKind,
  type ToolName,
} from '../domain/tool-types.ts';
import { createPlannedFlow } from './flows/planned-flow.ts';

const kinds: Readonly<Record<ToolName, ToolKind>> = {
  get_app_status: 'read',
  list_runs: 'read',
  get_run: 'read',
  get_recent_errors: 'read',
  get_last_job_result: 'read',
  analyze_service_performance: 'read',
  analyze_db_bottlenecks: 'read',
  doctor: 'meta',
  search_docs: 'read',
  list_docs: 'read',
  get_doc: 'read',
  list_commands: 'meta',
  execute_command: 'mutate',
};
const summaries: Readonly<Record<ToolName, string>> = {
  get_app_status: 'Summarize NetScript app health.',
  list_runs: 'List recent bounded execution summaries.',
  get_run: 'Summarize one execution end to end.',
  get_recent_errors: 'Group recent application errors.',
  get_last_job_result: 'Summarize the latest result for a job.',
  analyze_service_performance: 'Compute bounded service performance statistics.',
  analyze_db_bottlenecks: 'Rank bounded database and KV bottlenecks.',
  doctor: 'Check NetScript diagnostic prerequisites.',
  search_docs: 'Search public NetScript documentation.',
  list_docs: 'List public NetScript documentation summaries.',
  get_doc: 'Get one public document or documentation section.',
  list_commands: 'List bounded CLI command descriptors from the injected command catalog.',
  execute_command:
    'Execute one CLI command through an explicit allowlist gate and return only a bounded combined output tail.',
};

/** Build the immutable enumerable v1 tool registry. */
export function createToolRegistry(
  flows: Partial<Record<ToolName, ToolFlow>> = {},
): readonly ToolDefinition[] {
  return Object.freeze(TOOL_NAMES.map((name) =>
    Object.freeze({
      name,
      kind: kinds[name],
      description: `${
        summaries[name]
      } Returns a bounded summary; do not print raw output to the user.`,
      inputSchema: TOOL_INPUT_SCHEMAS[name],
      outputSchema: TOOL_OUTPUT_SCHEMAS[name],
      flow: flows[name] ?? createPlannedFlow(name),
    })
  ));
}
