/**
 * @module
 * L0 platform-contract primitives for `@netscript/fresh-ui`.
 *
 * L0 intentionally stays small: prefer Preact intrinsic elements and platform
 * attributes, and use these helpers only where they encapsulate real behavior.
 *
 * This is the stable `./primitives` entrypoint. The implementation lives in
 * `src/presentation/primitives.tsx`; this root module re-exports it so the
 * published subpath stays identical after the `src/` restructure.
 */

export {
  Show,
  type ShowProps,
  SrOnly,
  VisuallyHidden,
  type VisuallyHiddenProps,
  type VisuallyHiddenStyle,
} from './src/presentation/primitives.tsx';
export type {
  PrimitiveChild,
  PrimitiveChildren,
  PrimitiveNode,
} from './src/presentation/primitives.tsx';
