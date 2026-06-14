export type { JSX } from 'preact';

import type { JSX as J } from 'preact';
/** My attrs. */
export interface MyAttrs extends J.HTMLAttributes<HTMLAnchorElement> {
  /** foo */
  foo?: string;
}
