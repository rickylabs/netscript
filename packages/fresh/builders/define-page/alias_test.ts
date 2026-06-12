import type { ComponentType as PreactComponentType, ComponentChildren as PreactComponentChildren, JSX as PreactJSX } from 'preact';

/** Local alias for Preact component type. */
export type ComponentType<P = {}> = PreactComponentType<P>;
/** Local alias for Preact component children. */
export type ComponentChildren = PreactComponentChildren;
/** Local alias for Preact JSX namespace. */
export type JSX = PreactJSX;
