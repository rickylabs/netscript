import { Head } from 'fresh/runtime';
import type { ComponentChildren, ComponentType, JSX } from 'preact';
import type { DefinePageMetaDescriptor, DefinePageSlot, UnknownRecord } from '../types.ts';

function defaultFallback(label: string): JSX.Element {
  return (
    <section aria-live='polite' aria-busy='true'>
      <p>Loading {label}...</p>
    </section>
  );
}

/** Resolve the fallback element for a deferred layer. */
export function resolveFallback(
  fallback: JSX.Element | ComponentType<Record<string, never>> | undefined,
  label: string,
): JSX.Element {
  if (!fallback) {
    return defaultFallback(label);
  }

  if (typeof fallback === 'function') {
    const FallbackComponent = fallback;
    return <FallbackComponent />;
  }

  return fallback;
}

/** Render a layer component with optional loader data. */
export function renderLayerComponent(
  component: ComponentType<UnknownRecord>,
  data: UnknownRecord | undefined,
): JSX.Element | null {
  const Component = component;

  if (data) {
    return <Component {...data} />;
  }

  return <Component />;
}

/** Create a stable DOM id for a streamed layer slot. */
export function createStreamSlotId(id: string): string {
  const normalized = id.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `ns-stream-slot-${normalized}`;
}

/** Create a callable slot wrapper for rendered layer content. */
export function createLayerSlot(
  data: UnknownRecord | undefined,
  element: JSX.Element | null,
): DefinePageSlot<UnknownRecord> {
  const slot = (() => element) as DefinePageSlot<UnknownRecord>;
  if (data) {
    slot.data = data;
  }
  return slot;
}

/** Convert renderable component children into an element. */
export function toElement(node: ComponentChildren): JSX.Element {
  if (typeof node === 'object' && node !== null && 'type' in node) {
    return node as JSX.Element;
  }

  return <>{node}</>;
}

/** Render metadata into Fresh head elements. */
export function renderHead(meta: DefinePageMetaDescriptor): JSX.Element {
  const jsonLdEntries = Array.isArray(meta.jsonLd) ? meta.jsonLd : meta.jsonLd ? [meta.jsonLd] : [];

  return (
    <Head>
      {meta.title ? <title>{meta.title}</title> : null}
      {meta.description ? <meta name='description' content={meta.description} /> : null}
      {meta.robots ? <meta name='robots' content={meta.robots} /> : null}
      {meta.canonicalUrl ? <link rel='canonical' href={meta.canonicalUrl} /> : null}
      {meta.meta?.map((entry) => (
        <meta
          key={`${entry.name ?? entry.property ?? 'meta'}:${entry.content}`}
          name={entry.name}
          property={entry.property}
          content={entry.content}
        />
      ))}
      {meta.links?.map((entry) => (
        <link
          key={`${entry.rel}:${entry.href}`}
          rel={entry.rel}
          href={entry.href}
          title={entry.title}
          type={entry.type}
        />
      ))}
      {jsonLdEntries.map((entry, index) => (
        <script key={`jsonld:${index}`} type='application/ld+json'>
          {JSON.stringify(entry)}
        </script>
      ))}
    </Head>
  );
}

/** Merge response header values with later entries overriding earlier ones. */
export function mergeHeaders(values: HeadersInit[]): Headers {
  const headers = new Headers();
  for (const value of values) {
    const next = new Headers(value);
    for (const [key, entry] of next.entries()) {
      headers.set(key, entry);
    }
  }
  return headers;
}
