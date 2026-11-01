// Ignored diagnostic only. Original Q4 owners and acceptance tests remain unchanged.
import { basename, dirname, join, resolve } from '@std/path';

const root = Deno.cwd();
const evidence = join(root, '.llm/tmp/native-service-qualification-sol-20261028');
const original = (await Deno.readTextFile(join(root, 'packages/service/tests/body-limit_test.ts')))
  .replaceAll('\r\n', '\n');
const start = original.indexOf('  Deno.test(`defineService bodyLimit rejects');
const end = original.indexOf("\n}\n\nDeno.test('defineService without bodyLimit", start);
if (start < 0 || end < 0) throw new Error('Could not identify exact real-listener diagnostic source');
const prefix = original.slice(0, original.indexOf('for (const projection of PROJECTIONS)'))
  .replace("'@orpc/server'", "'npm:@orpc/server@^1.15.5'")
  .replace("'zod'", "'npm:zod@^4.6.5'")
  .replace("'../mod.ts'", JSON.stringify(new URL('../../../packages/service/mod.ts', import.meta.url).href))
  .replace("'../src/auth/static-credential-authenticator.ts'", JSON.stringify(new URL('../../../packages/service/src/auth/static-credential-authenticator.ts', import.meta.url).href));

for (const mode of Deno.args.length ? Deno.args : ['declared-only', 'chunked-only', 'chunked-reader-cleanup']) {
  let test = original.slice(start, end);
  const underStart = test.indexOf('      const under = await fetch');
  const declaredStart = test.indexOf('      const declared = await fetch');
  const chunkedStart = test.indexOf('      const chunked = await fetch');
  const finallyStart = test.lastIndexOf('    } finally {');
  test = mode === 'declared-only'
    ? test.slice(0, underStart) + test.slice(declaredStart, chunkedStart) + test.slice(finallyStart)
    : test.slice(0, underStart) + test.slice(chunkedStart);
  test = test.replace('Deno.test(`defineService', `Deno.test({ name: \`diagnostic ${mode} defineService`)
    .replace('`, async () => {', '`, sanitizeOps: true, sanitizeResources: true, sanitizeExit: true, async fn() {');
  const closing = test.lastIndexOf('  });');
  test = test.slice(0, closing) + test.slice(closing).replace('  });', '  }});');
  if (mode.startsWith('chunked-reader-cleanup')) {
    test = test.replace('    const framing:', '    const readers: ReadableStreamDefaultReader<Uint8Array>[] = [];\n    const framing:')
      .replace('        await next();', `        const body = c.req.raw.body;
        if (body) {
          const getReader = body.getReader.bind(body);
          Object.defineProperty(body, 'getReader', {
            value() {
              const reader = getReader();
              readers.push(reader);
              return reader;
            },
          });
        }
        await next();
        assertEquals(readers.length, 1, 'exactly one native reader acquired by Hono');
        assertEquals(body?.locked, true, 'Hono retains the incoming body reader on rejection');
        await Deno.writeTextFile(${JSON.stringify(join(evidence, `q4-${mode}-ownership.jsonl`))}, JSON.stringify({ diagnostic: '${mode}', projection: projection.name, acquiredReaders: readers.length, rawBodyLocked: body?.locked }) + '\\n', { append: true });`)
      .replace('      await running.stop();', `      for (const reader of readers) {
        await reader.cancel('diagnostic real reader cleanup');
        reader.releaseLock();
      }
      await running.stop();`);
  }
  const source = `${prefix}\nfor (const projection of PROJECTIONS) {\n${test}\n}\n`;
  const saved = join(evidence, `q4-${mode}_test.ts`);
  await Deno.writeTextFile(saved, source);
  const temporary = await Deno.makeTempDir({ prefix: 'native-service-q4-attribution-' });
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 20_000);
  try {
    const target = join(temporary, 'attribution_test.ts');
    await Deno.copyFile(saved, target);
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--cached-only', '--frozen', '--allow-read', '--allow-write', '--allow-run',
        '.llm/tools/run-deno-test.ts', '--output', join(evidence, `q4-${mode}.json`), '--',
        '--config', join(root, 'deno.json'), '--cached-only', '--frozen', '--check', '--allow-all',
        '--sanitize-ops', '--sanitize-resources', '--trace-leaks', target],
      cwd: root,
      signal: controller.signal,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    await Deno.writeFile(join(evidence, `q4-${mode}.stdout.log`), result.stdout);
    await Deno.writeFile(join(evidence, `q4-${mode}.stderr.log`), result.stderr);
    console.log(JSON.stringify({ mode, code: result.code, temporary, originalOwnerUnchanged: true }));
  } finally {
    clearTimeout(deadline);
    if (dirname(resolve(temporary)) !== resolve(Deno.env.get('TEMP')!) ||
      !basename(temporary).startsWith('native-service-q4-attribution-')) {
      throw new Error('Temporary diagnostic path failed workspace boundary check');
    }
    await Deno.remove(temporary, { recursive: true });
  }
}
