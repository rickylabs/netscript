/**
 * The first-party `render_ui` tool definition.
 *
 * Built from the {@link render-ui} wire contract via {@link defineAiTool} as a
 * **client**-kind tool: the core validates the model's request but ships no
 * renderer — the fresh-ui generative-UI slice consumes {@linkcode renderUiTool}
 * as its wire contract and performs the actual rendering. This module adds no
 * design vocabulary and no fresh-ui dependency.
 *
 * @module
 */

import { RENDER_UI_TOOL_NAME } from '../../contracts/ui.ts';
import type { AiToolDefinition } from '../domain/definition.ts';
import {
  RENDER_UI_PARAMETERS,
  renderUiInputSchema,
  type RenderUiToolInput,
} from '../domain/render-ui.ts';
import { defineAiTool } from './builder.ts';

/**
 * The built-in `render_ui` tool definition: a schema-only, client-deferred tool
 * a model calls to request a generative-UI surface. Register it in a
 * {@link AiToolRegistry}; dispatch validates the request and defers rendering to
 * fresh-ui.
 */
export const renderUiTool: AiToolDefinition<RenderUiToolInput, never> = defineAiTool(
  RENDER_UI_TOOL_NAME,
)
  .describe(
    'Render an interactive UI surface instead of plain text. The component is resolved by the generative-UI renderer.',
  )
  .parameters(RENDER_UI_PARAMETERS)
  .input(renderUiInputSchema)
  .client();
