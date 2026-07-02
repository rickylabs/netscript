/**
 * `defineAiTool` — the fluent builder that turns a name, a JSON-Schema parameter
 * description, and a {@link StandardSchemaV1} into an executable
 * {@link AiToolDefinition}.
 *
 * The builder is a two-phase type-state: an input schema **must** be supplied via
 * `.input(schema)` before a terminal (`.server(handler)` or `.client()`) becomes
 * available, so a definition can never exist without its validator. Validation
 * wraps the caller's Standard Schema — the core adds no bespoke schema DSL.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ToolDescriptor, ToolParameters } from '../../contracts/tool.ts';
import { type ToolInputIssue, ToolInputValidationError } from '../../contracts/errors.ts';
import type {
  AiToolDefinition,
  AiToolExecutionResult,
  AiToolInvocationContext,
  AiToolServerHandler,
} from '../domain/definition.ts';

const OPEN_OBJECT_PARAMETERS: ToolParameters = { type: 'object', additionalProperties: true };

/** Normalize a Standard Schema issue path into plain property keys. */
function normalizePath(
  path: readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined,
): readonly PropertyKey[] | undefined {
  if (path === undefined) {
    return undefined;
  }
  return path.map((segment) =>
    typeof segment === 'object' && segment !== null && 'key' in segment ? segment.key : segment
  );
}

/**
 * Validate `rawInput` against `schema`, throwing {@link ToolInputValidationError}
 * before any handler runs. Shared by every terminal so the pre-handler guarantee
 * holds uniformly.
 */
async function validateInput<TInput>(
  toolName: string,
  schema: StandardSchemaV1<unknown, TInput>,
  rawInput: unknown,
): Promise<TInput> {
  const result = await schema['~standard'].validate(rawInput);
  if (result.issues != null) {
    const issues: ToolInputIssue[] = result.issues.map((issue) => ({
      message: issue.message,
      ...(normalizePath(issue.path) === undefined ? {} : { path: normalizePath(issue.path) }),
    }));
    throw new ToolInputValidationError(toolName, issues);
  }
  return result.value;
}

/**
 * The `defineAiTool` builder after an input schema has been supplied. Exposes the
 * terminal methods that materialize an {@link AiToolDefinition}.
 */
export interface AiToolBuilderWithInput<TInput> {
  /** Set/override the human- and model-readable description. */
  describe(description: string): AiToolBuilderWithInput<TInput>;
  /** Set/override the provider-facing JSON-Schema parameters. */
  parameters(parameters: ToolParameters): AiToolBuilderWithInput<TInput>;
  /**
   * Terminal: attach a server handler and return a server-executable definition.
   * Input is validated against the Standard Schema before the handler runs.
   */
  server<TOutput>(
    handler: AiToolServerHandler<TInput, TOutput>,
  ): AiToolDefinition<TInput, TOutput>;
  /**
   * Terminal: return a client-deferred definition with no server handler (e.g.
   * `render_ui`). Dispatch validates input and defers execution downstream.
   */
  client(): AiToolDefinition<TInput, never>;
}

/**
 * The initial `defineAiTool` builder. An input schema is required via
 * {@linkcode AiToolBuilder.input} before a terminal is reachable.
 */
export interface AiToolBuilder {
  /** Set/override the human- and model-readable description. */
  describe(description: string): AiToolBuilder;
  /** Set/override the provider-facing JSON-Schema parameters. */
  parameters(parameters: ToolParameters): AiToolBuilder;
  /** Supply the Standard Schema that validates the tool's input arguments. */
  input<TInput>(schema: StandardSchemaV1<unknown, TInput>): AiToolBuilderWithInput<TInput>;
}

interface BuilderState<TInput> {
  readonly name: string;
  readonly description?: string;
  readonly parameters: ToolParameters;
  readonly schema?: StandardSchemaV1<unknown, TInput>;
}

function buildDescriptor(state: BuilderState<unknown>): ToolDescriptor {
  return {
    name: state.name,
    ...(state.description === undefined ? {} : { description: state.description }),
    parameters: state.parameters,
  };
}

function makeWithInput<TInput>(state: BuilderState<TInput>): AiToolBuilderWithInput<TInput> {
  const schema = state.schema as StandardSchemaV1<unknown, TInput>;
  return {
    describe(description: string): AiToolBuilderWithInput<TInput> {
      return makeWithInput({ ...state, description });
    },
    parameters(parameters: ToolParameters): AiToolBuilderWithInput<TInput> {
      return makeWithInput({ ...state, parameters });
    },
    server<TOutput>(
      handler: AiToolServerHandler<TInput, TOutput>,
    ): AiToolDefinition<TInput, TOutput> {
      const descriptor = buildDescriptor(state);
      return {
        descriptor,
        schema,
        kind: 'server',
        async execute(
          rawInput: unknown,
          context?: AiToolInvocationContext,
        ): Promise<AiToolExecutionResult<TOutput>> {
          const input = await validateInput(descriptor.name, schema, rawInput);
          const output = await handler(input, context ?? {});
          return { toolName: descriptor.name, kind: 'server', input, output, deferred: false };
        },
      };
    },
    client(): AiToolDefinition<TInput, never> {
      const descriptor = buildDescriptor(state);
      return {
        descriptor,
        schema,
        kind: 'client',
        async execute(rawInput: unknown): Promise<AiToolExecutionResult<never>> {
          const input = await validateInput(descriptor.name, schema, rawInput);
          return { toolName: descriptor.name, kind: 'client', input, deferred: true };
        },
      };
    },
  };
}

function makeBuilder(state: BuilderState<unknown>): AiToolBuilder {
  return {
    describe(description: string): AiToolBuilder {
      return makeBuilder({ ...state, description });
    },
    parameters(parameters: ToolParameters): AiToolBuilder {
      return makeBuilder({ ...state, parameters });
    },
    input<TInput>(schema: StandardSchemaV1<unknown, TInput>): AiToolBuilderWithInput<TInput> {
      return makeWithInput<TInput>({ ...state, schema });
    },
  };
}

/**
 * Start defining an AI tool named `name`. Chain `.describe()`, `.parameters()`,
 * then `.input(schema)` and a terminal (`.server(handler)` / `.client()`).
 *
 * @example A server tool
 * ```ts
 * import { defineAiTool } from "@netscript/ai/tools";
 *
 * const echo = defineAiTool("echo")
 *   .describe("Echo a message back")
 *   .parameters({ type: "object", properties: { text: { type: "string" } }, required: ["text"] })
 *   .input(myStandardSchema) // any StandardSchemaV1 (zod, valibot, hand-written…)
 *   .server(({ text }) => ({ echoed: text }));
 * ```
 */
export function defineAiTool(name: string): AiToolBuilder {
  return makeBuilder({ name, parameters: OPEN_OBJECT_PARAMETERS });
}
