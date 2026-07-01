import { assert, assertEquals } from '@std/assert';
import { Dropzone } from '../../../../registry/components/ui/dropzone.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function vnodeProps(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && 'props' in value, 'expected a vnode');
  return (value as VNodeLike).props;
}

function classes(value: unknown): string[] {
  return typeof value === 'string' ? value.split(' ').filter(Boolean) : [];
}

Deno.test('Dropzone renders a label target with default copy + icon', () => {
  const v = Dropzone({});
  assert(classes(vnodeProps(v).class).includes('ns-dropzone'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('ns-dropzone__icon'), 'icon');
  assert(json.includes('ns-dropzone__label'), 'label');
  assert(json.includes('Drop files or click to upload'), 'default label');
});

Deno.test('Dropzone shows hint + active state and keeps children (file input)', () => {
  const v = Dropzone({ hint: 'PDF, max 20MB', active: true });
  assert(vnodeProps(v)['data-active'] === '', 'active reflected');
  const json = JSON.stringify(v);
  assert(json.includes('ns-dropzone__hint'), 'hint part');
  assert(json.includes('PDF, max 20MB'), 'hint text');
});

Deno.test('Dropzone emits all accepted files from a multi-file drop', () => {
  const files = [
    new File(['one'], 'one.txt', { type: 'text/plain' }),
    new File(['two'], 'two.txt', { type: 'text/plain' }),
  ];
  const accepted: string[] = [];
  const v = Dropzone({
    multiple: true,
    onFiles(nextFiles) {
      accepted.push(...nextFiles.map((file) => file.name));
    },
  });

  const props = vnodeProps(v);
  const event = {
    dataTransfer: { files },
    preventDefault() {},
    currentTarget: null,
    target: null,
  } as unknown as DragEvent;
  (props.ondrop as (event: DragEvent) => void)(event);

  assertEquals(accepted, ['one.txt', 'two.txt']);
});

Deno.test('Dropzone ingests pasted files from clipboard items', () => {
  const pasted = new File(['pasted'], 'pasted.png', { type: 'image/png' });
  let source = '';
  let acceptedName = '';
  const v = Dropzone({
    onFiles(files, details) {
      source = details.source;
      acceptedName = files[0]?.name ?? '';
    },
  });

  const props = vnodeProps(v);
  const event = new Event('paste') as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: [],
      items: [{ kind: 'file', getAsFile: () => pasted }],
    },
  });
  (props.onpaste as (event: ClipboardEvent) => void)(event);

  assertEquals(source, 'paste');
  assertEquals(acceptedName, 'pasted.png');
});

Deno.test('Dropzone applies accept filtering and reports rejected files', () => {
  const files = [
    new File(['ok'], 'ok.pdf', { type: 'application/pdf' }),
    new File(['bad'], 'bad.exe', { type: 'application/x-msdownload' }),
  ];
  const accepted: string[] = [];
  const rejected: Array<[string, string]> = [];
  const v = Dropzone({
    accept: '.pdf, image/*',
    multiple: true,
    onFiles(nextFiles) {
      accepted.push(...nextFiles.map((file) => file.name));
    },
    onReject(nextFiles) {
      rejected.push(...nextFiles.map((file) => [file.file.name, file.reason] as [string, string]));
    },
  });

  const props = vnodeProps(v);
  const event = {
    dataTransfer: { files },
    preventDefault() {},
    currentTarget: null,
    target: null,
  } as unknown as DragEvent;
  (props.ondrop as (event: DragEvent) => void)(event);

  assertEquals(accepted, ['ok.pdf']);
  assertEquals(rejected, [['bad.exe', 'type']]);
});
