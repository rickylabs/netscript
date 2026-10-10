import { assertEquals } from '@std/assert';

Deno.test('check task type-checks every published entrypoint', async () => {
  const config = JSON.parse(await Deno.readTextFile(new URL('../deno.json', import.meta.url)));
  const checked = new Set(
    (config.tasks.check as string).split(/\s+/).map((arg) => arg.replace(/^\.\//, '')),
  );
  const missing = Object.values(config.exports as Record<string, string>)
    .map((path) => path.replace(/^\.\//, ''))
    .filter((path) => !checked.has(path));
  assertEquals(missing, []);
});
