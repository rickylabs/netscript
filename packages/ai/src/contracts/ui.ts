/**
 * `render_ui` tool-descriptor **type seam**.
 *
 * The generative-UI capability lets a model return an interactive widget rather
 * than plain text. The concrete tool schema (parameters, validation) lands in
 * slice E4; this module defines only the cheap *type* surface those slices and
 * the renderer will target, so downstream code can name the seam today.
 *
 * @module
 */

import type { ToolDescriptor } from './tool.ts';

/**
 * Canonical name of the generative-UI tool. Kept as a typed literal so
 * descriptors and renderers can key off it without magic strings.
 */
export const RENDER_UI_TOOL_NAME = 'render_ui' as const;

/**
 * A {@linkcode ToolDescriptor} narrowed to the `render_ui` tool. The parameter
 * schema itself is provided by E4; here the name is pinned to the literal.
 */
export interface RenderUiToolDescriptor extends ToolDescriptor {
  /** Pinned to the `render_ui` literal. */
  readonly name: typeof RENDER_UI_TOOL_NAME;
}

/**
 * An MCP-native UI resource (the `ui://` object) produced by a render_ui call.
 * Mirrors the MCP resource shape so it can be fed straight to a renderer.
 */
export interface UiResource {
  /** The `ui://` resource URI. */
  readonly uri: string;
  /** MIME type of the resource payload. */
  readonly mimeType: string;
  /** Inline text payload, when text-based. */
  readonly text?: string;
  /** Inline base64 blob payload, when binary. */
  readonly blob?: string;
}

/**
 * The typed payload a render_ui tool result carries. Correlated to the
 * originating tool call via {@linkcode RenderUiResult.toolCallId}.
 */
export interface RenderUiResult {
  /** Id of the originating tool call. */
  readonly toolCallId: string;
  /** The UI resource to render. */
  readonly resource: UiResource;
  /** Pool prefix / config key routing interactive calls to the right MCP server. */
  readonly serverId?: string;
  /** Server-native tool name whose UI this resource renders. */
  readonly toolName?: string;
}
