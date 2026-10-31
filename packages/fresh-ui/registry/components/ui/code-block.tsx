/**
 * @component CodeBlock
 * @layer 2
 * @depends theme-seed
 * @description Fenced code surface with a filename/language header and a copy
 * affordance. Presentational — clipboard + "Copied" state are hydrated by an app
 * island (the button exposes data-part='copy' and data-clipboard); syntax
 * highlighting is layered at L4 if desired.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface CodeBlockProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  /** Raw source to display (and copy). */
  code: string;
  /** Optional filename shown in the header. */
  filename?: string;
  /** Optional language label. */
  lang?: string;
  class?: string;
}

/**
 * Renders a code surface with header metadata and a copy button.
 */
export function CodeBlock(
  { code, filename, lang, class: className, ...props }: CodeBlockProps,
): VNode {
  return (
    <div {...props} class={cn('ns-code', className)} data-part='root' data-scope='code-block'>
      <div class='ns-code__head' data-part='head' data-scope='code-block'>
        {filename
          ? <span class='ns-code__name' data-part='name' data-scope='code-block'>{filename}</span>
          : null}
        {lang
          ? <span class='ns-code__lang' data-part='lang' data-scope='code-block'>{lang}</span>
          : null}
        <button
          type='button'
          class='ns-code__copy'
          data-scope='code-block'
          data-part='copy'
          data-clipboard={code}
          aria-label='Copy code'
        >
          Copy
        </button>
      </div>
      <pre
        data-part='content'
        data-scope='code-block'
      ><code data-part='code' data-scope='code-block'>{code}</code></pre>
    </div>
  );
}
