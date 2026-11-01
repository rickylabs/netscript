import { DEFAULT_PRESET, type PresetCatalog } from './catalog.ts';

async function enhance(): Promise<void> {
  const catalog: PresetCatalog = await (await fetch(new URL('../presets.json', import.meta.url)))
    .json();
  const frame = document.querySelector<HTMLIFrameElement>('[data-component-preview]');
  if (!frame) return;
  // The built src already carries the deployment base path; data attributes do not.
  const previewUrl = new URL(frame.src, location.href);
  const theme = document.querySelector<HTMLSelectElement>('[data-preset-choice]');
  const flavor = document.querySelector<HTMLSelectElement>('[data-flavor-choice]');
  const scheme = document.querySelector<HTMLSelectElement>('[data-preview-scheme]');
  const code = document.querySelector<HTMLTextAreaElement>('[data-preset-code]');
  const status = document.querySelector<HTMLElement>('[data-builder-status]');
  const form = document.querySelector<HTMLFormElement>('[data-preset-import]');
  let selected = DEFAULT_PRESET;
  const setStatus = (message: string): void => {
    if (status) status.textContent = message;
  };
  const refresh = (): void => {
    const preset = catalog.presets.find((entry) => entry.id === selected)!;
    const currentScheme = scheme?.value === 'light' || scheme?.value === 'dark'
      ? scheme.value
      : document.documentElement.dataset.scheme ?? 'light';
    const url = new URL(previewUrl);
    url.searchParams.set('theme', selected);
    url.searchParams.set('scheme', currentScheme);
    url.searchParams.set('component', frame.dataset.component ?? 'workspace');
    frame.src = url.href;
    if (theme) theme.value = selected;
    if (flavor) flavor.value = preset.flavor ?? '';
    const encoded = preset.code;
    if (code) code.value = encoded;
    const values: Record<string, string> = {
      accent: preset.accent,
      radius: preset.values['radius-control'] ?? preset.values['radius-md'],
      fonts: `${preset.values['font-sans']} / ${preset.values['font-mono']}`,
      density: preset.sourceDensity ?? preset.density,
      icons: 'Component glyphs',
      menu: preset.values['menu-style'] ?? 'Component default',
    };
    for (const node of document.querySelectorAll<HTMLElement>('[data-effective]')) {
      node.textContent = values[node.dataset.effective!] ?? '';
    }
    for (const node of document.querySelectorAll<HTMLElement>('[data-preset-command]')) {
      const command = node.dataset.presetCommand === 'init'
        ? 'init my-app'
        : node.dataset.presetCommand;
      node.textContent = `netscript ${command} --preset ${encoded}`;
    }
    if (theme) {
      const share = new URL(location.href);
      share.searchParams.set('preset', encoded);
      history.replaceState(null, '', share);
    }
  };
  const query = new URL(location.href).searchParams.get('preset');
  if (query && theme) {
    try {
      // Share links produced by this builder already have a validated build-time code.
      selected = catalog.presets.find((preset) => preset.code === query)?.id ??
        (await import('./preset.ts')).supportedPreset(query, catalog);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invalid preset code.');
    }
  }
  theme?.addEventListener('change', () => {
    selected = theme.value;
    setStatus('');
    refresh();
  });
  flavor?.addEventListener('change', () => {
    const next = catalog.presets.find((p) => p.flavor === flavor.value);
    if (next) {
      selected = next.id;
      setStatus('');
      refresh();
    }
  });
  scheme?.addEventListener('change', refresh);
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = new FormData(form).get('preset');
    try {
      selected = (await import('./preset.ts')).supportedPreset(String(input ?? ''), catalog);
      refresh();
      setStatus('Preset applied.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invalid preset code.');
    }
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-preset]')) {
    button.addEventListener('click', async () => {
      const value = button.dataset.copyPreset === 'link' ? location.href : code?.value ?? '';
      try {
        await navigator.clipboard.writeText(value);
        setStatus('Copied.');
      } catch {
        code?.focus();
        code?.select();
        setStatus('Select and copy the preset code above.');
      }
    });
  }
  new MutationObserver(refresh).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-scheme'],
  });
  addEventListener('message', (event) => {
    if (
      event.origin !== location.origin || event.source !== frame.contentWindow ||
      event.data?.type !== 'ns-doc-preview-size'
    ) return;
    const height = Number(event.data.height);
    if (Number.isFinite(height)) frame.style.height = `${Math.max(240, Math.min(2000, height))}px`;
  });
  refresh();
  for (const select of [theme, flavor, scheme]) if (select) select.disabled = false;
  document.documentElement.dataset.builderReady = 'true';
}

if (typeof document !== 'undefined') {
  enhance().catch(() => {
    const status = document.querySelector('[data-builder-status]');
    if (status) status.textContent = 'Preview could not load. Reload this page to try again.';
  });
}
