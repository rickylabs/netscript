/**
 * @component CodeBlock
 * @layer 2
 * @depends theme-seed
 * @description Escaped code, file tabs, diff rows and native clipboard feedback. Hydrate for tabs/copy.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Tabs } from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import hljs from 'highlight.js/lib/common';
import { cn } from '../../lib/cn.ts';

export type CodeLineVariant = 'default' | 'added' | 'removed' | 'highlighted';
export type CodeSyntax =
  | 'keyword'
  | 'function'
  | 'type'
  | 'string'
  | 'number'
  | 'comment'
  | 'punctuation';
export interface CodeLineData {
  text: string;
  variant?: CodeLineVariant;
  number?: number;
  /** Trusted syntax content; plain text remains the raw-source fallback. */
  content?: ComponentChildren;
}
export interface CodeFile {
  value: string;
  label: string;
  code?: string;
  filename?: string;
  lang?: string;
  lines?: readonly CodeLineData[];
}
export interface CodeBlockProps extends
  Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'children' | 'size' | 'value' | 'defaultValue'
  > {
  /** Exact clipboard source; absent text derives from rows excluding removals. */
  code?: string;
  filename?: string;
  lang?: string;
  lines?: readonly CodeLineData[];
  tabs?: readonly CodeFile[];
  variant?:
    | 'single'
    | 'tabbed'
    | 'diff'
    | 'default'
    | 'destructive'
    | 'added'
    | 'removed'
    | 'highlighted';
  tone?: 'default' | 'destructive';
  size?: 'md' | 'sm';
  /** File tabs remain available when metadata/copy chrome is hidden. */
  header?: boolean | 'none' | 'title' | 'tabs';
  copy?: boolean;
  lineNumbers?: boolean;
  footer?: boolean;
  footerContent?: ComponentChildren;
  scrollbar?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Optional controlled visual snapshot; actual outcomes use result callbacks. */
  state?: 'rest' | 'copied';
  onCopied?: (source: string) => void;
  onCopyError?: (error: unknown) => void;
  class?: string;
}
export interface CodeLineProps extends CodeLineData {
  lineNumbers?: boolean;
}
export interface CodeTokenProps {
  type: CodeSyntax;
  children: ComponentChildren;
  class?: string;
}

/** Explicit caller syntax takes precedence over automatic language highlighting. */
function CodeToken({ type, children, class: className }: CodeTokenProps): VNode {
  return (
    <span class={className} data-scope='code-block' data-part='syntax' data-syntax={type}>
      {children}
    </span>
  );
}

/** Numbers are decorative; visible plus/minus marks supplement diff colour. */
function CodeLine(
  { text, content, variant = 'default', number = 1, lineNumbers = false }: CodeLineProps,
): VNode {
  return (
    <span
      class='ns-code__line'
      data-scope='code-block'
      data-part='line'
      data-line-variant={variant}
    >
      {lineNumbers && (
        <span aria-hidden='true' data-scope='code-block' data-part='line-number'>{number}</span>
      )}
      <span data-scope='code-block' data-part='sign'>
        {variant === 'added' ? '+' : variant === 'removed' ? '−' : ''}
      </span>
      <span data-scope='code-block' data-part='code'>{content ?? text}</span>
    </span>
  );
}

function rowsFromText(source: string): readonly CodeLineData[] {
  return source.split(/\r?\n/).map((text) => ({ text }));
}

/** Transfer only the upstream escaped span output; preserve whole-source lexical state. */
function highlightedLines(source: string, language: string): readonly string[] {
  const markup = hljs.highlight(source, { language, ignoreIllegals: true }).value;
  const spans: string[] = [];
  const lines: string[] = [];
  let line = '';
  let cursor = 0;
  for (const match of markup.matchAll(/<span class="[^"]*">|<\/span>|\n/g)) {
    line += markup.slice(cursor, match.index);
    const token = match[0];
    if (token === '\n') {
      lines.push(line + '</span>'.repeat(spans.length));
      line = spans.join('');
    } else {
      line += token;
      if (token === '</span>') spans.pop();
      else spans.push(token);
    }
    cursor = match.index + token.length;
  }
  lines.push(line + markup.slice(cursor));
  return lines;
}

/** Each tab body owns stable hooks, including when the host adds or removes files. */
function CodeRows({ rows, language, variant, lineNumbers }: {
  rows: readonly CodeLineData[];
  language: string | undefined;
  variant: CodeLineVariant;
  lineNumbers: boolean;
}): VNode {
  const source = rows.map((row) => row.text).join('\n');
  const highlighted = useMemo(
    () => language && hljs.getLanguage(language) ? highlightedLines(source, language) : undefined,
    [source, language],
  );
  let cursor = 0;
  return (
    <>
      {rows.map((line, index) => {
        const count = line.text.split('\n').length;
        const markup = highlighted?.slice(cursor, cursor + count).join('\n');
        cursor += count;
        return (
          <CodeLine
            key={index}
            {...line}
            content={line.content ?? (markup === undefined
              ? undefined
              : <span dangerouslySetInnerHTML={{ __html: markup }} />)}
            variant={line.variant ?? variant}
            number={line.number ?? index + 1}
            lineNumbers={lineNumbers}
          />
        );
      })}
    </>
  );
}

function textFromRows(lines: readonly CodeLineData[] | undefined): string {
  return (lines ?? []).filter((line) => line.variant !== 'removed').map((line) => line.text).join(
    '\n',
  );
}

/** Native attributes, including ClipboardEvent onCopy, keep their original meaning. */
function CodeBlockRoot({
  code,
  filename,
  lang,
  lines,
  tabs = [],
  variant,
  tone,
  size = 'md',
  header = true,
  copy = true,
  lineNumbers = false,
  footer = false,
  footerContent,
  scrollbar = true,
  value,
  defaultValue,
  onValueChange,
  state,
  onCopied,
  onCopyError,
  class: className,
  ...props
}: CodeBlockProps): VNode {
  const [localValue, setLocalValue] = useState(defaultValue ?? tabs[0]?.value ?? '');
  const [result, setResult] = useState<'rest' | 'copied' | 'error'>('rest');
  const request = useRef(0);
  const mode = variant === 'single' || variant === 'tabbed' || variant === 'diff'
    ? variant
    : variant === 'added' || variant === 'removed' || variant === 'highlighted'
    ? 'diff'
    : variant === 'default' || variant === 'destructive'
    ? 'single'
    : tabs.length
    ? 'tabbed'
    : 'single';
  const tabbed = mode === 'tabbed';
  if (
    tabbed &&
    (!tabs.length || new Set(tabs.map((file) => file.value)).size !== tabs.length ||
      tabs.some((file) => !file.value.trim()))
  ) {
    throw new RangeError('Tabbed code requires unique nonempty file values.');
  }
  const active = tabbed
    ? tabs.find((file) => file.value === (value ?? localValue)) ?? tabs[0]
    : undefined;
  const raw = active ? active.code ?? textFromRows(active.lines) : code ?? textFromRows(lines);
  const key = active ? `file:${active.value}` : 'single';
  const name = active ? active.filename || active.label || active.value : filename;
  const language = active?.lang ?? lang;
  const rows = active?.lines ?? (tabbed ? undefined : lines) ?? rowsFromText(raw);
  const defaultLine = variant === 'added' || variant === 'removed' || variant === 'highlighted'
    ? variant
    : 'default';
  const copied = state === undefined ? result === 'copied' : state === 'copied';
  const chrome = header !== false && header !== 'none';
  useLayoutEffect(() => {
    request.current++;
    setResult('rest');
    return () => {
      request.current++;
    };
  }, [key, raw]);
  const copySource = async () => {
    const pending = ++request.current;
    setResult('rest');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(raw);
    } catch (error) {
      if (pending === request.current) setResult('error');
      onCopyError?.(error);
      return;
    }
    if (pending === request.current) setResult('copied');
    onCopied?.(raw);
  };
  const body = (
    source: string,
    display: readonly CodeLineData[] | undefined,
    syntaxLanguage = lang,
  ) => (
    <pre><code><CodeRows rows={display ?? rowsFromText(source)} language={syntaxLanguage} variant={defaultLine} lineNumbers={lineNumbers} /></code></pre>
  );
  const fileTabs = tabbed
    ? (
      <Tabs.List
        aria-label='Code files'
        class='ns-code__tabs'
        data-scope='code-block'
        data-part='tabs'
      >
        {tabs.map((file) => (
          <Tabs.Trigger
            key={file.value}
            value={encodeURIComponent(file.value)}
            data-scope='code-block'
            data-part='tab'
          >
            {file.label || file.filename || file.value}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    )
    : null;
  const additions = rows.filter((line) => (line.variant ?? defaultLine) === 'added').length;
  const removals = rows.filter((line) => (line.variant ?? defaultLine) === 'removed').length;
  const head = chrome
    ? (
      <div class='ns-code__head' data-scope='code-block' data-part='head'>
        {tabbed
          ? fileTabs
          : name
          ? <span class='ns-code__name' data-scope='code-block' data-part='name'>{name}</span>
          : null}
        {mode === 'diff' && (
          <span class='ns-code__counts'>
            <span
              data-scope='code-block'
              data-part='added-count'
              title={`${additions} ${additions === 1 ? 'addition' : 'additions'}`}
            >
              +{additions}
            </span>
            <span
              data-scope='code-block'
              data-part='removed-count'
              title={`${removals} ${removals === 1 ? 'deletion' : 'deletions'}`}
            >
              −{removals}
            </span>
          </span>
        )}
        <span class='ns-code__actions'>
          {language && (
            <span class='ns-code__lang' data-scope='code-block' data-part='lang'>{language}</span>
          )}
          {copy && (
            <button
              type='button'
              class='ns-code__copy'
              data-scope='code-block'
              data-part='copy'
              data-clipboard={raw}
              data-state={copied ? 'copied' : 'rest'}
              aria-label='Copy code'
              title={copied ? 'Copied' : 'Copy code'}
              onClick={(event) => {
                if (!event.defaultPrevented) void copySource();
              }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={16} />
            </button>
          )}
        </span>
      </div>
    )
    : fileTabs;
  return (
    <div
      {...props}
      role={props.role ?? 'group'}
      aria-label={props['aria-label'] ?? name ?? 'Code block'}
      class={cn('ns-code', className)}
      data-scope='code-block'
      data-part='root'
      data-variant={variant ?? mode}
      data-tone={tone ?? (variant === 'destructive' ? 'destructive' : 'default')}
      data-size={size}
      data-header={tabbed ? 'tabs' : chrome ? 'title' : 'none'}
      data-state={copied ? 'copied' : 'rest'}
      data-scrollbar={String(scrollbar)}
    >
      {tabbed && active
        ? (
          <Tabs.Root
            value={encodeURIComponent(active.value)}
            onValueChange={(encoded) => {
              const file = tabs.find((candidate) =>
                encodeURIComponent(candidate.value) === encoded
              );
              if (!file) return;
              if (value === undefined) setLocalValue(file.value);
              onValueChange?.(file.value);
            }}
          >
            {head}
            {tabs.map((file) => (
              <Tabs.Content
                key={file.value}
                value={encodeURIComponent(file.value)}
                dir='ltr'
                class='ns-code__content'
                data-scope='code-block'
                data-part='content'
              >
                {body(file.code ?? textFromRows(file.lines), file.lines, file.lang ?? lang)}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        )
        : (
          <>
            {head}
            <div
              class='ns-code__content'
              data-scope='code-block'
              data-part='content'
              dir='ltr'
              role='region'
              aria-label={`${name ?? 'Code'} content${
                mode === 'diff' ? '; plus marks additions, minus marks removals' : ''
              }`}
              tabIndex={0}
            >
              {body(raw, lines)}
            </div>
          </>
        )}
      {footer && (
        <div data-scope='code-block' data-part='footer'>
          {footerContent ?? `${rows.length} ${rows.length === 1 ? 'line' : 'lines'}`}
        </div>
      )}
      <span
        class='ns-code__status'
        data-scope='code-block'
        data-part='status'
        role='status'
        aria-live='polite'
        aria-atomic='true'
      >
        {result === 'copied'
          ? 'Copied code.'
          : result === 'error'
          ? 'Could not copy code. Select the text to copy it manually.'
          : ''}
      </span>
    </div>
  );
}

/** Code surface and optional syntax/line helpers, all copied into the application. */
export const CodeBlock: ((props: CodeBlockProps) => VNode) & {
  Line: typeof CodeLine;
  Token: typeof CodeToken;
} = Object.assign(CodeBlockRoot, { Line: CodeLine, Token: CodeToken });
