import { z } from 'zod';
import { TOKEN_PRESETS } from '../../../packages/fresh-ui/src/tokens/domain/token-presets.ts';
import {
  exportFigmaTokenBundle,
  importFigmaTokenBundle,
} from '../../../packages/fresh-ui/src/tokens/adapters/figma/figma-round-trip.ts';
import { validateFigmaSnapshot } from '../../../packages/fresh-ui/src/tokens/domain/figma/figma-snapshot.ts';
import { dtcgFiles, snapshotFiles } from './snapshot.ts';
import { themeItem } from './theme-item.ts';
import { pushThemePullRequest } from './github-export.ts';
import type { FigmaCollection } from '../../../packages/fresh-ui/src/tokens/domain/token-contract.ts';

const element = (id: string): HTMLElement => {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing plugin control: ${id}`);
  return value;
};
const input = (id: string): HTMLInputElement => {
  const value = element(id);
  if (!(value instanceof HTMLInputElement)) throw new Error(`Invalid plugin input: ${id}`);
  return value;
};
const preset: HTMLSelectElement = (() => {
  const value = element('preset');
  if (!(value instanceof HTMLSelectElement)) throw new Error('Missing preset selection');
  return value;
})();
for (const entry of TOKEN_PRESETS) {
  const option = document.createElement('option');
  option.value = entry.id;
  option.textContent = entry.id;
  preset.append(option);
}
preset.value = 'studio-utility';
input('date').value = new Date().toISOString().slice(0, 10);
let snapshot: readonly FigmaCollection[] | undefined;
let urls: string[] = [];
const status = (message: string) => {
  element('status').textContent = message;
};
const send = (message: unknown) => parent.postMessage({ pluginMessage: message }, '*');
function download(name: string, bytes: string, container = 'downloads'): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/json' }));
  urls.push(url);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.textContent = name;
  element(container).append(link, document.createElement('br'));
}
function render(): void {
  for (const url of urls) URL.revokeObjectURL(url);
  urls = [];
  for (const id of ['downloads', 'theme-downloads', 'dtcg-downloads']) {
    element(id).replaceChildren();
  }
  if (!snapshot) return;
  const item = themeItem(snapshot, preset.value);
  download(`theme-${preset.value}.json`, JSON.stringify(item, null, 2) + '\n', 'theme-downloads');
  for (const [name, bytes] of Object.entries(dtcgFiles(exportFigmaTokenBundle(snapshot)))) {
    download(name, bytes, 'dtcg-downloads');
  }
  if (input('file-key').value.trim()) {
    for (
      const [name, bytes] of Object.entries(
        snapshotFiles(snapshot, input('file-key').value.trim(), input('date').value),
      )
    ) download(name, bytes);
  }
  status(
    `${
      snapshot.reduce((count, collection) => count + collection.variables.length, 0)
    } variables exported. Download the theme or open a values-only PR. Enter the current file key for snapshot downloads.`,
  );
}
globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (event.source !== parent) return;
  try {
    const envelope = z.object({ pluginMessage: z.unknown() }).passthrough().parse(event.data);
    const result = z.discriminatedUnion('type', [
      z.object({ type: z.literal('snapshot'), snapshot: z.unknown(), fileKey: z.string() }),
      z.object({ type: z.literal('error'), message: z.string() }),
    ]).parse(envelope.pluginMessage);
    if (result.type === 'error') {
      status(result.message);
      return;
    }
    snapshot = validateFigmaSnapshot(result.snapshot);
    if (result.fileKey) input('file-key').value = result.fileKey;
    render();
  } catch (error) {
    status(error instanceof Error ? error.message : 'Invalid export');
  }
});
element('refresh').onclick = () => send({ type: 'export' });
preset.onchange = render;
input('date').onchange = render;
input('file-key').onchange = render;
input('import').onchange = async () => {
  try {
    const file = input('import').files?.[0];
    if (!file) return;
    const data: unknown = JSON.parse(await file.text());
    const item = z.object({ meta: z.object({ netscript: z.object({ figma: z.unknown() }) }) })
      .safeParse(data);
    send({
      type: 'import',
      snapshot: importFigmaTokenBundle(item.success ? item.data.meta.netscript.figma : data),
    });
    status('Importing variables…');
  } catch (error) {
    status(error instanceof Error ? error.message : 'Invalid theme file');
  }
};
element('push').onclick = async () => {
  const token = input('token').value;
  input('token').value = '';
  try {
    if (!snapshot) throw new Error('Export variables first');
    status('Validating baseline and creating PR…');
    const url = await pushThemePullRequest({
      repository: input('repository').value,
      token,
      branch: `figma/${Date.now()}`,
      path: input('path').value,
      item: themeItem(snapshot, preset.value),
    });
    status(`Pull request created: ${url}`);
  } catch (error) {
    status(error instanceof Error ? error.message : 'GitHub export failed');
  }
};
send({ type: 'export' });
