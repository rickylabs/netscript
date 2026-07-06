/**
 * OpenTelemetry GenAI semantic-convention attribute names.
 */
export const GenAiAttributes = {
  PROVIDER_NAME: 'gen_ai.provider.name',
  OPERATION_NAME: 'gen_ai.operation.name',
  REQUEST_MODEL: 'gen_ai.request.model',
  RESPONSE_MODEL: 'gen_ai.response.model',
  USAGE_INPUT_TOKENS: 'gen_ai.usage.input_tokens',
  USAGE_OUTPUT_TOKENS: 'gen_ai.usage.output_tokens',
  TOOL_NAME: 'gen_ai.tool.name',
  SYSTEM: 'gen_ai.system',
} as const;

/**
 * Literal union of supported GenAI telemetry attribute names.
 */
export type GenAiAttributeName = (typeof GenAiAttributes)[keyof typeof GenAiAttributes];
