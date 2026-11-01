import { type ComponentChildren, type ComponentType, h, render } from 'preact';
import { type ComponentCatalog, DEFAULT_PRESET } from './catalog.ts';

/** Mount actual copy-mode registry components inside a CSS-isolated static document. */
export async function start(examples: Readonly<Record<string, ComponentType>>): Promise<void> {
  const catalog: ComponentCatalog = await (await fetch(new URL('./catalog.json', import.meta.url)))
    .json();
  const query = new URL(location.href).searchParams;
  const preset = catalog.presets.find((p) => p.id === query.get('theme')) ??
    catalog.presets.find((p) => p.id === DEFAULT_PRESET)!;
  const stylesheet = document.querySelector<HTMLLinkElement>('#preview-tokens')!;
  const cssUrl = new URL(preset.id + '.css', stylesheet.href).href;
  if (stylesheet.href !== cssUrl || !stylesheet.sheet) {
    await new Promise<void>((resolve, reject) => {
      stylesheet.onload = () => resolve();
      stylesheet.onerror = () => reject(new Error('Cannot load preset stylesheet: ' + preset.id));
      stylesheet.href = cssUrl;
    });
  }
  Object.assign(document.documentElement.dataset, {
    preset: preset.id,
    theme: preset.language,
    flavor: preset.flavor ?? '',
    density: preset.density.toLowerCase(),
    scheme: query.get('scheme') === 'dark' ? 'dark' : 'light',
  });
  const name = query.get('component') ?? 'workspace';
  const mount = document.querySelector<HTMLElement>('#preview')!;
  mount.replaceChildren();
  const sample = (key: string): ComponentChildren => examples[key] ? h(examples[key], {}) : null;
  const content = name === 'workspace'
    ? (
      <section class='demo-workspace'>
        <header>
          <p class='demo-eyebrow'>Commerce / Orders</p>
          <h1>Orders</h1>
          <p>Fulfillment, payments and refunds across every channel.</p>
        </header>
        {sample('stats-grid')}
        {sample('data-table')}
        <div class='demo-detail'>
          <div>{sample('card')}{sample('checkbox')}{sample('switch')}</div>
          <div>{sample('alert')}{sample('chart-block')}</div>
        </div>
      </section>
    )
    : sample(name);
  if (name !== 'workspace' && !examples[name]) {
    throw new Error(`Unknown component preview: ${name}`);
  }
  render(content, mount);
  document.documentElement.dataset.previewReady = name;
  const resize = (): void =>
    parent.postMessage({
      type: 'ns-doc-preview-size',
      height: document.documentElement.scrollHeight,
    }, location.origin);
  new ResizeObserver(resize).observe(mount);
  resize();
}
