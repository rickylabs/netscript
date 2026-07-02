/**
 * `render_ui` tool **wire contract** — input type, JSON-Schema parameters, and a
 * dependency-free Standard Schema validator.
 *
 * This is the transport shape the fresh-ui generative-UI renderer will consume;
 * it deliberately carries **no** design vocabulary (the enumerated component set
 * and the renderer land in the fresh-ui slices). The core ships only a generic
 * `{ component, props, title }` envelope so a model can request a UI surface and
 * the server can validate the request without a renderer present.
 *
 * The Standard Schema here is hand-written against the {@link StandardSchemaV1}
 * interface so the zero-runtime-dependency core needs no schema library.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ToolParameters } from '../../contracts/tool.ts';

/**
 * Validated input a model supplies when calling the `render_ui` tool. The
 * `component` name is resolved against the design vocabulary by the downstream
 * renderer (fresh-ui); the core treats it as an opaque string.
 */
export interface RenderUiToolInput {
  /** Name of the component/widget the renderer should mount. */
  readonly component: string;
  /** Serializable props forwarded to the component. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Optional human-readable title for the rendered surface. */
  readonly title?: string;
}

/**
 * JSON-Schema `parameters` for the `render_ui` tool, surfaced to providers so a
 * model knows the argument shape.
 */
export const RENDER_UI_PARAMETERS: ToolParameters = {
  type: 'object',
  properties: {
    component: {
      type: 'string',
      description: 'Name of the component/widget to render.',
    },
    props: {
      type: 'object',
      description: 'Serializable props passed to the component.',
      additionalProperties: true,
    },
    title: {
      type: 'string',
      description: 'Optional human-readable title for the rendered surface.',
    },
  },
  required: ['component'],
  additionalProperties: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Standard Schema (v1) validator for {@linkcode RenderUiToolInput}. Implements
 * the `~standard` interface directly — no schema-library dependency.
 */
export const renderUiInputSchema: StandardSchemaV1<unknown, RenderUiToolInput> = {
  '~standard': {
    version: 1,
    vendor: 'netscript-ai',
    validate(
      value: unknown,
    ): { readonly value: RenderUiToolInput } | {
      readonly issues: readonly { readonly message: string; readonly path: readonly [string] }[];
    } {
      const issues: { readonly message: string; readonly path: readonly [string] }[] = [];
      if (!isRecord(value)) {
        return { issues: [{ message: 'render_ui input must be an object.', path: ['component'] }] };
      }
      const { component, props, title } = value;
      if (typeof component !== 'string' || component.length === 0) {
        issues.push({
          message: '"component" is required and must be a non-empty string.',
          path: ['component'],
        });
      }
      if (props !== undefined && !isRecord(props)) {
        issues.push({ message: '"props" must be an object when present.', path: ['props'] });
      }
      if (title !== undefined && typeof title !== 'string') {
        issues.push({ message: '"title" must be a string when present.', path: ['title'] });
      }
      if (issues.length > 0) {
        return { issues };
      }
      const validated: RenderUiToolInput = {
        component: component as string,
        ...(props === undefined ? {} : { props: props as Record<string, unknown> }),
        ...(title === undefined ? {} : { title: title as string }),
      };
      return { value: validated };
    },
  },
};
