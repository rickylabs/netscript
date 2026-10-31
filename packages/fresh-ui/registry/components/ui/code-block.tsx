/**
 * @component CodeBlock
 * @layer 2
 * @depends theme-seed
 * @description Fenced code surface with a filename/language header and a copy
 * affordance. Presentational — clipboard + "Copied" state are hydrated by an app
 * island (the button exposes data-part='copy' and data-clipboard); recognized languages use escaped highlight.js syntax markup.
 */

import type { JSX, VNode } from 'preact';
import { useMemo } from 'preact/hooks';
import hljs from 'highlight.js/lib/common';
import { cn } from '../../lib/cn.ts';

interface CodeBlockProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  /** Raw source to display (and copy). */
  code: string;
  /** Optional filename shown in the header. */
  filename?: string;
  /** Language label and highlight.js common-language name or alias; unknown names stay plain. */
  lang?: string;
  class?: string;
}

/**
 * Renders a code surface with header metadata and a copy button.
 */
export function CodeBlock(
  { code, filename, lang, class: className, ...props }: CodeBlockProps,
): VNode {
  // highlight.js escapes source before adding its own spans; unknown languages use Preact text.
  // A streaming parent may re-render while this completed code block is unchanged.
  const highlighted = useMemo(
    () =>
      lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        : undefined,
    [code, lang],
  );
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
      >{highlighted === undefined
          ? <code data-part='code' data-scope='code-block'>{code}</code>
          : (
            <code
              data-part='code'
              data-scope='code-block'
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          )}</pre>
    </div>
  );
}
