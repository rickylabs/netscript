import { Partial } from 'fresh/runtime';
import type { FormContent } from './form.tsx';

/** Props accepted by the form partial-region helper. */
export interface FormRegionProps {
  /** Fresh partial name used as the update target. */
  readonly name: string;
  /** How Fresh applies incoming partial content. */
  readonly mode?: 'replace' | 'prepend' | 'append';
  /** Region content rendered inside the partial boundary. */
  readonly children: FormContent;
}

/** Render a Fresh partial boundary for form-driven updates. */
export function FormRegion({ name, mode = 'replace', children }: FormRegionProps): object {
  return (
    <Partial name={name} mode={mode}>
      {children}
    </Partial>
  );
}
