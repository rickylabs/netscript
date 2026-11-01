import {
  CALLOUT_ICONS,
  CALLOUT_TYPES,
  calloutType,
} from '../../../tools/docs-site/callout-types.ts';
import { escapeHtml } from './escape-html.ts';

/**
 * The docs site's callout markup, shared by `comp.callout` (through the `calloutHtml` filter)
 * and by Markdown alerts, so both always render the same bytes for the same inputs.
 *
 * This module imports only relative paths, so root test discovery can load it.
 */

/** Attribute holding the authored Markdown alert marker, such as `NOTE` or `DANGER`. */
export const ALERT_ATTRIBUTE = 'data-alert';

const ICON_ATTRIBUTES = 'width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"';

/** Turn backtick spans into inline code; other author HTML passes through, as before. */
export function inlineCode(value: string): string {
  return value.replace(
    /<code\b[^>]*>[\s\S]*?<\/code>|`([^`]+)`/g,
    (original, text?: string) =>
      text === undefined ? original : '<code>' + escapeHtml(text) + '</code>',
  );
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

/**
 * Opening markup, up to and including the body's opening tag.
 *
 * `labelHtml` replaces the type's visible label. `alert` records the authored Markdown alert
 * marker so the page's Markdown twin can write the alert back as authored. Unknown types throw.
 */
export function calloutOpenHtml(type: unknown, labelHtml?: string, alert?: string): string {
  const kind = calloutType(type);
  const definition = CALLOUT_TYPES[kind];
  const marker = alert ? ` ${ALERT_ATTRIBUTE}="${escapeAttribute(alert)}"` : '';
  return `<aside class="ns-callout" data-variant="${kind}" data-tone="${definition.tone}" ` +
    `role="note" aria-label="${definition.label}"${marker}>\n` +
    '  <div class="ns-callout__head"><span class="ns-callout__icon" aria-hidden="true">' +
    `<svg data-icon="${definition.icon}" ${ICON_ATTRIBUTES}>${CALLOUT_ICONS[definition.icon]}` +
    '</svg></span>' +
    `<span class="ns-callout__label">${labelHtml || definition.label}</span></div>\n` +
    '  <div class="ns-callout__body">';
}

/** Closing markup after the body. */
export const CALLOUT_CLOSE_HTML = '</div>\n</aside>';

/**
 * The whole callout: the `calloutHtml` filter behind `comp.callout`.
 * A `title` replaces the label, with backtick spans rendered as inline code.
 */
export function renderCallout(
  content: unknown,
  type?: unknown,
  title?: unknown,
  alert?: unknown,
): string {
  const label = title ? inlineCode(String(title)) : undefined;
  return calloutOpenHtml(type, label, alert ? String(alert) : undefined) +
    inlineCode(String(content ?? '')) + CALLOUT_CLOSE_HTML;
}
