import { z } from 'npm:zod@^4.6.5';
import type { ImportReceipt, LibraryBundle, LibraryInput } from '../src/contract.ts';
import { generateLibrary } from '../src/generate.ts';
import { serializeLibrary, validateLibrary } from '../src/validate-library.ts';
import { codeConnectFiles, validateReceipt } from '../src/code-connect.ts';

const sourceSchema: z.ZodType<LibraryInput> = z.object({
  catalog: z.unknown(),
  registry: z.unknown(),
  collections: z.unknown(),
  style: z.string().min(1),
  aliases: z.record(z.string(), z.string()),
}).strict();
const messageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('sources'), sources: sourceSchema, fileKey: z.string() }).strict(),
  z.object({
    type: z.literal('digest-request'),
    request: z.number().int().positive(),
    text: z.string(),
  }).strict(),
  z.object({ type: z.literal('result'), bundle: z.unknown(), receipt: z.unknown() }).strict(),
  z.object({ type: z.literal('error'), message: z.string() }).strict(),
]);

function element(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element;
}
function input(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) throw new Error(`Missing input: ${id}`);
  return element;
}
function button(id: string): HTMLButtonElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Missing button: ${id}`);
  return element;
}
const status = element('status');
const downloads = element('downloads');
const fileKey = input('file-key');
const items = input('items');
const connect = button('connect');
const urls: string[] = [];
let sources: LibraryInput | undefined;
let bundle: LibraryBundle | undefined;
let receipt: ImportReceipt | undefined;

function report(error: unknown): void {
  status.textContent = error instanceof Error
    ? error.message
    : 'Component-library operation failed';
}
function download(files: Readonly<Record<string, string>>): void {
  for (const url of urls.splice(0)) URL.revokeObjectURL(url);
  downloads.replaceChildren();
  for (const [name, content] of Object.entries(files)) {
    const url = URL.createObjectURL(
      new Blob([content], { type: name.endsWith('.json') ? 'application/json' : 'text/plain' }),
    );
    urls.push(url);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.textContent = name;
    downloads.appendChild(anchor);
  }
}
function currentBundle(): LibraryBundle {
  if (!sources) throw new Error('Code-owned sources are still loading');
  if (!bundle) {
    bundle = generateLibrary(
      sources,
      items.value.trim() ? { items: items.value.split(',').map((s) => s.trim()) } : {},
    );
  }
  return bundle;
}
function send(type: 'import' | 'export'): void {
  try {
    const document = currentBundle();
    receipt = undefined;
    connect.disabled = true;
    parent.postMessage(
      { pluginMessage: { type, bundle: document, fileKey: fileKey.value.trim() } },
      '*',
    );
    status.textContent = `${
      type === 'import' ? 'Importing' : 'Inspecting'
    } ${document.components.length} registry components…`;
  } catch (error) {
    report(error);
  }
}
items.oninput = () => {
  bundle = undefined;
  receipt = undefined;
  connect.disabled = true;
};
button('generate').onclick = () => {
  try {
    bundle = undefined;
    receipt = undefined;
    connect.disabled = true;
    const document = currentBundle();
    download({ 'library.json': serializeLibrary(document) });
    status.textContent = `${document.components.length} components; ${
      document.coverage.complete ? 'current registry inventory' : 'selected subset (partial)'
    }. Editor import has not run.`;
  } catch (error) {
    report(error);
  }
};
input('library').onchange = async () => {
  try {
    bundle = undefined;
    receipt = undefined;
    connect.disabled = true;
    const file = input('library').files?.[0];
    if (!file || !sources) throw new Error('Choose a library file after sources load');
    const parsed: unknown = JSON.parse(await file.text());
    bundle = validateLibrary(parsed, sources);
    status.textContent =
      `Validated ${bundle.components.length} components. Ready for native import.`;
  } catch (error) {
    report(error);
  }
};
button('import').onclick = () => send('import');
button('export').onclick = () => send('export');
connect.onclick = async () => {
  try {
    if (!sources || !bundle || !receipt) throw new Error('Inspect the editor library first');
    download(await codeConnectFiles(bundle, receipt, sources));
    status.textContent =
      'Code Connect files generated. Review and publish with the documented owner command.';
  } catch (error) {
    report(error);
  }
};
globalThis.onmessage = async (event: MessageEvent<unknown>) => {
  if (event.source !== parent) return;
  try {
    const envelope = z.object({ pluginMessage: z.unknown() }).passthrough().parse(event.data);
    const message = messageSchema.parse(envelope.pluginMessage);
    if (message.type === 'digest-request') {
      const bytes = new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message.text)),
      );
      const hash = [...bytes].map((v) => v.toString(16).padStart(2, '0')).join('');
      parent.postMessage({
        pluginMessage: { type: 'digest-result', request: message.request, hash },
      }, '*');
    } else if (message.type === 'sources') {
      sources = message.sources;
      fileKey.value = message.fileKey;
      status.textContent =
        'Sources loaded. Choose explicit items or generate the full inventory; missing bindings stop before import.';
    } else if (message.type === 'result') {
      if (!sources) throw new Error('Missing code-owned source context');
      bundle = validateLibrary(message.bundle, sources);
      receipt = await validateReceipt(message.receipt, bundle);
      connect.disabled = false;
      download({
        'library.json': serializeLibrary(bundle),
        'receipt.json': serializeLibrary(receipt),
      });
      status.textContent =
        `Native inspection completed for ${bundle.components.length} components. ${
          bundle.coverage.complete
            ? 'Current registry inventory.'
            : 'Selected subset: partial coverage.'
        }`;
    } else report(new Error(message.message));
  } catch (error) {
    report(error);
  }
};
parent.postMessage({ pluginMessage: { type: 'init' } }, '*');
