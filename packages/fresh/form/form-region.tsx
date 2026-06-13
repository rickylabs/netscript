import { Partial } from 'fresh/runtime';
import type { ComponentChildren } from 'preact';

export interface FormRegionProps {
  readonly name: string;
  readonly mode?: 'replace' | 'prepend' | 'append';
  readonly children: ComponentChildren;
}

export function FormRegion({ name, mode = 'replace', children }: FormRegionProps): object {
  return (
    <Partial name={name} mode={mode}>
      {children}
    </Partial>
  );
}
