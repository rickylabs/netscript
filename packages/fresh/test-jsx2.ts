import type { JSX } from 'preact';
/** My attrs. @public */
export interface MyAttrs extends JSX.HTMLAttributes<HTMLAnchorElement> {
  /** foo */
  foo?: string;
}
