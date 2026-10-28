import { assert, assertEquals, assertThrows } from '@std/assert';
import { assertCodeLanguage, codeFilename, LANGUAGE_LABELS } from './code-languages.ts';

Deno.test('every maintained docs fence uses a registered public language', async () => {
  let fences = 0;
  const registered = Object.keys(LANGUAGE_LABELS);
  async function visit(directory: URL): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      if (entry.name.startsWith('_')) continue;
      const path = new URL(entry.name + (entry.isDirectory ? '/' : ''), directory);
      if (entry.isDirectory) await visit(path);
      else if (entry.name.endsWith('.md')) {
        const source = await Deno.readTextFile(path);
        let fence: { marker: string; length: number } | undefined;
        for (const line of source.split('\n')) {
          if (fence) {
            if (new RegExp(`^\\s{0,3}${fence.marker}{${fence.length},}\\s*$`).test(line)) {
              fence = undefined;
            }
            continue;
          }
          const match = line.match(/^\s{0,3}(`{3,}|~{3,})([\w-]*)/);
          if (!match) continue;
          fence = { marker: match[1][0], length: match[1].length };
          if (!match[2]) continue;
          assertCodeLanguage(match[2], registered);
          fences++;
        }
      }
    }
  }
  await visit(new URL('../../docs/site/', import.meta.url));
  assert(fences > 100, 'The guard must inspect the real documentation corpus');
});

Deno.test('unregistered fences and missing highlighter registrations fail closed', () => {
  assertThrows(
    () => assertCodeLanguage('tyepscript', Object.keys(LANGUAGE_LABELS)),
    Error,
    'Unregistered code fence',
  );
  assertThrows(() => assertCodeLanguage('python', ['ts']), Error, 'Unregistered code fence');
  for (
    const language of [
      'python',
      'powershell',
      'jsonc',
      'markdown',
      'dotenv',
      'yaml',
      'css',
      'diff',
      'sql',
      'html',
      'xml',
    ]
  ) {
    assertCodeLanguage(language, Object.keys(LANGUAGE_LABELS));
  }
  assertEquals(LANGUAGE_LABELS.tsx, 'TypeScript');
  assertEquals(
    codeFilename('// services/users.contract.ts\nexport const users = {};'),
    'services/users.contract.ts',
  );
});
