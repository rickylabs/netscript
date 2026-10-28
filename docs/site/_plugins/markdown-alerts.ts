import { type CalloutType, calloutType } from '../../../tools/docs-site/callout-types.ts';
import { CALLOUT_CLOSE_HTML, calloutOpenHtml } from './callout.ts';

/**
 * GitHub-style Markdown alerts, rendered with the site's callout markup (`./callout.ts`).
 *
 * Two forms, both read the same on GitHub:
 *
 * ```md
 * > [!WARNING]
 * > Body text, lists and code blocks.
 *
 * > [!WARNING]
 * > **Optional title**
 * >
 * > Body text.
 * ```
 *
 * As on GitHub, the marker must be alone on the first line of a top-level blockquote and be
 * followed by a body. In the second form, a first body paragraph that is only bold text
 * becomes the callout's label and leaves the body; GitHub shows it as a bold first line.
 *
 * Types follow the callout contract, case-insensitively: `NOTE`, `TIP`, `IMPORTANT`,
 * `WARNING` and `CAUTION` as on GitHub, plus `DANGER` (destructive) and `ERROR`.
 *
 * Anything GitHub would not render as an alert stays a plain blockquote, and the build warns:
 * text after the marker, a marker with no body, a nested alert, or an unknown type. An unknown
 * type never downgrades to Note.
 */

/** `[!TYPE]` at the start of a quote's first line. */
const MARKER = /^\[!([A-Za-z]+)\]/;
/** The marker alone on its line. */
const MARKER_LINE = /^\[!([A-Za-z]+)\][ \t]*(?:\n|$)/;
/** A paragraph that is only bold text: `**Title**` or `__Title__`. */
const BOLD_ONLY = /^(\*\*|__)(\S(?:[^\n]*\S)?)\1$/;

interface AlertMeta {
  readonly kind: CalloutType;
  readonly marker: string;
  readonly title?: string;
}

interface Token {
  type: string;
  content: string;
  level: number;
  map: [number, number] | null;
  meta: Record<string, unknown> | null;
}

interface StateCore {
  tokens: Token[];
  env: unknown;
}

interface Renderer {
  renderToken(tokens: Token[], index: number, options: unknown): string;
}

type RenderRule = (
  tokens: Token[],
  index: number,
  options: unknown,
  env: unknown,
  self: Renderer,
) => string;

/** The part of a markdown-it instance this plugin touches. */
interface MarkdownItAlertsHost {
  readonly core: {
    readonly ruler: {
      after(afterName: string, ruleName: string, rule: (state: StateCore) => void): void;
    };
  };
  readonly renderer: { rules: Record<string, RenderRule | undefined> };
  renderInline(source: string, env?: unknown): string;
}

/** Options for {@link markdownAlerts}. */
export interface MarkdownAlertsOptions {
  /** Receives build warnings for quotes that look like alerts but are not. */
  readonly warn?: (message: string) => void;
}

function closingIndex(tokens: readonly Token[], openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < tokens.length; index++) {
    if (tokens[index].type === 'blockquote_open') depth++;
    else if (tokens[index].type === 'blockquote_close' && --depth === 0) return index;
  }
  throw new Error('Unclosed blockquote');
}

function isParagraph(tokens: readonly Token[], index: number): boolean {
  return tokens[index]?.type === 'paragraph_open' && tokens[index + 1]?.type === 'inline' &&
    tokens[index + 2]?.type === 'paragraph_close';
}

function boldTitle(text: string): string | undefined {
  const match = text.trim().match(BOLD_ONLY);
  return match && !match[2].includes(match[1]) ? match[2] : undefined;
}

function alertOf(token: Token): AlertMeta | undefined {
  return token.meta?.alert as AlertMeta | undefined;
}

/** markdown-it plugin: render GitHub-style `> [!TYPE]` alerts as callouts. */
export function markdownAlerts(instance: object, options: MarkdownAlertsOptions = {}): void {
  const md = instance as MarkdownItAlertsHost;
  const warn = options.warn ?? ((message: string) => console.warn(message));

  // After block parsing and before inline parsing, so only marker and title text are removed.
  md.core.ruler.after('block', 'ns_markdown_alerts', (state) => {
    const tokens = state.tokens;
    const filename = (state.env as { filename?: string } | undefined)?.filename;
    for (let index = 0; index < tokens.length; index++) {
      const open = tokens[index];
      if (open.type !== 'blockquote_open' || !isParagraph(tokens, index + 1)) continue;
      const inline = tokens[index + 2];
      const marker = inline.content.match(MARKER)?.[1];
      if (!marker) continue;

      const where = `${filename ?? 'Markdown'}:${(open.map?.[0] ?? 0) + 1}`;
      const plain = (reason: string) =>
        warn(`${where}: [!${marker}] ${reason}; it renders as a plain blockquote.`);

      let kind: CalloutType;
      try {
        kind = calloutType(marker);
      } catch {
        plain('is not a supported alert type');
        continue;
      }
      const line = inline.content.match(MARKER_LINE);
      if (!line) {
        plain('must be alone on the first line of the quote');
        continue;
      }
      if (open.level !== 0) {
        plain('is nested inside another block, and alerts cannot be nested');
        continue;
      }

      const close = closingIndex(tokens, index);
      const rest = inline.content.slice(line[0].length);
      const firstBlockAfter = index + 4;
      if (!rest.trim() && firstBlockAfter >= close) {
        plain('has no body');
        continue;
      }

      // The first body paragraph is the rest of the marker's paragraph, or the next block.
      let title: string | undefined;
      let drop: [number, number] | undefined;
      if (rest.trim()) {
        title = boldTitle(rest);
        if (title && firstBlockAfter < close) drop = [index + 1, 3];
        else title = undefined;
      } else {
        drop = [index + 1, 3];
        if (isParagraph(tokens, firstBlockAfter)) {
          const candidate = boldTitle(tokens[firstBlockAfter + 1].content);
          if (candidate && firstBlockAfter + 3 < close) {
            title = candidate;
            drop = [index + 1, 6];
          }
        }
      }

      const alert: AlertMeta = { kind, marker, ...(title ? { title } : {}) };
      open.meta = { ...open.meta, alert };
      tokens[close].meta = { ...tokens[close].meta, alert };
      if (drop) tokens.splice(drop[0], drop[1]);
      else inline.content = rest;
    }
  });

  const open = md.renderer.rules.blockquote_open;
  const close = md.renderer.rules.blockquote_close;
  md.renderer.rules.blockquote_open = (tokens, index, options, env, self) => {
    const alert = alertOf(tokens[index]);
    if (!alert) {
      return open
        ? open(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options);
    }
    const label = alert.title ? md.renderInline(alert.title, env) : undefined;
    return calloutOpenHtml(alert.kind, label, alert.marker);
  };
  md.renderer.rules.blockquote_close = (tokens, index, options, env, self) => {
    if (!alertOf(tokens[index])) {
      return close
        ? close(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options);
    }
    return `${CALLOUT_CLOSE_HTML}\n`;
  };
}
