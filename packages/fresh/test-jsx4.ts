import type { JSX } from 'preact';
/**
 * My attrs.
 * @ignore
 */
export interface MyAttrs extends JSX.HTMLAttributes<HTMLAnchorElement> {
  /** foo */
  foo?: string;
}
