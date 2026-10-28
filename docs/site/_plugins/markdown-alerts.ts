import {
  CALLOUT_ICONS,
  CALLOUT_TYPES,
  type CalloutType,
  calloutType,
} from '../../../tools/docs-site/callout-types.ts';

/**
 * GitHub-style Markdown alerts, rendered as the site's callout component.
 *
 * ```md
 * > [!WARNING] Optional title
 * > Body text, lists and code blocks.
 * ```
 *
 * Every type of the callout contract is accepted, case-insensitively: `NOTE`, `TIP`,
 * `IMPORTANT`, `WARNING`, `CAUTION`, `DANGER` (destructive) and `ERROR`. Text after the
 * marker on the same line replaces the visible label. The rendered `<aside>` matches
 * `comp.callout` and also carries the authored marker in `data-alert`, so the page's
 * Markdown twin can write the alert back as `> [!TYPE]`.
 *
 * An unknown marker, such as `[!NOTES]`, never downgrades to Note. The quote stays a plain
 * blockquote with its marker visible, and the build prints a warning.
 */

/** Attribute holding the authored alert marker, such as `NOTE` or `DANGER`. */
export const ALERT_ATTRIBUTE = 'data-alert';

/** `[!TYPE]` at the very start of a quote, then an optional title on the same line. */
const ALERT_MARKER = /^\[!([A-Za-z]+)\][ \t]*([^\n]*)(?:\n|$)/;

const CALLOUT_SVG_ATTRIBUTES = 'width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"';

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/**
 * The callout component's opening markup, up to and including the body's opening tag.
 * `labelHtml` replaces the type's label; `marker` records the authored alert marker.
 */
export function calloutOpenHtml(kind: CalloutType, labelHtml?: string, marker?: string): string {
  const definition = CALLOUT_TYPES[kind];
  const alert = marker === undefined ? '' : ` ${ALERT_ATTRIBUTE}="${escapeAttribute(marker)}"`;
  return `<aside class="ns-callout" data-variant="${kind}" data-tone="${definition.tone}" ` +
    `role="note" aria-label="${definition.label}"${alert}>\n` +
    '  <div class="ns-callout__head"><span class="ns-callout__icon" aria-hidden="true">' +
    `<svg data-icon="${definition.icon}" ${CALLOUT_SVG_ATTRIBUTES}>` +
    `${CALLOUT_ICONS[definition.icon]}</svg></span>` +
    `<span class="ns-callout__label">${labelHtml ?? definition.label}</span></div>\n` +
    '  <div class="ns-callout__body">';
}

/** The callout component's closing markup. */
export const CALLOUT_CLOSE_HTML = '</div>\n</aside>\n';

interface AlertMeta {
  readonly kind: CalloutType;
  readonly marker: string;
  readonly title: string;
}

interface Token {
  type: string;
  content: string;
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
  /** Receives unknown-marker warnings. Defaults to `console.warn`. */
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

function alertOf(token: Token): AlertMeta | undefined {
  return token.meta?.alert as AlertMeta | undefined;
}

/**
 * markdown-it plugin: render `> [!TYPE]` blockquotes with the callout component's markup.
 * Typed loosely so this module stays free of the site's markdown-it import.
 */
export function markdownAlerts(instance: object, options: MarkdownAlertsOptions = {}): void {
  const md = instance as MarkdownItAlertsHost;
  const warn = options.warn ?? ((message: string) => console.warn(message));

  // After block parsing and before inline parsing, so only the marker line is removed.
  md.core.ruler.after('block', 'ns_markdown_alerts', (state) => {
    const tokens = state.tokens;
    for (let index = 0; index < tokens.length; index++) {
      if (tokens[index].type !== 'blockquote_open') continue;
      const paragraph = tokens[index + 1];
      const inline = tokens[index + 2];
      if (paragraph?.type !== 'paragraph_open' || inline?.type !== 'inline') continue;
      const match = inline.content.match(ALERT_MARKER);
      if (!match) continue;

      let kind: CalloutType;
      try {
        kind = calloutType(match[1]);
      } catch {
        const filename = (state.env as { filename?: string } | undefined)?.filename;
        warn(
          `Unsupported Markdown alert [!${match[1]}]${filename ? ` in ${filename}` : ''}; ` +
            'it renders as a plain blockquote.',
        );
        continue;
      }

      const close = closingIndex(tokens, index);
      const alert: AlertMeta = { kind, marker: match[1], title: match[2].trim() };
      tokens[index].meta = { ...tokens[index].meta, alert };
      tokens[close].meta = { ...tokens[close].meta, alert };
      inline.content = inline.content.slice(match[0].length);
      // A marker on its own line leaves an empty first paragraph; drop it.
      if (!inline.content.trim() && tokens[index + 3]?.type === 'paragraph_close') {
        tokens.splice(index + 1, 3);
      }
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
    return CALLOUT_CLOSE_HTML;
  };
}
