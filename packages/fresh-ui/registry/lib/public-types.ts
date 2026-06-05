import type { VNode } from 'preact';

/**
 * Public renderable content accepted by the `@netscript/fresh-ui` package surface.
 */
export type Renderable =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | VNode
  | readonly Renderable[];

/**
 * Public component result used by the `@netscript/fresh-ui` package surface.
 */
export type ComponentResult = VNode | null;
