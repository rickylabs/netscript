/**
 * @module infra/scaffold/fresh-adapter_test
 *
 * Tests for Fresh adapter normalization and fallback logic.
 * Uses MemoryFileSystemAdapter to simulate Fresh output without subprocess.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { MemoryFileSystemAdapter } from '../memory-fs.ts';
import { normalizeFreshOutput } from '../fresh-adapter.ts';

const TARGET = '/test/apps/dashboard';

describe('normalizeFreshOutput', () => {
  it('should remove known demo files that exist', async () => {
    const fs = new MemoryFileSystemAdapter();
    // Simulate Fresh-created demo files
    await fs.writeFile(`${TARGET}/components/Button.tsx`, 'export const Button = () => <button/>;');
    await fs.writeFile(`${TARGET}/islands/Counter.tsx`, 'export default function Counter() {}');
    await fs.writeFile(`${TARGET}/routes/api/joke.ts`, 'export const handler = {};');
    await fs.writeFile(`${TARGET}/static/logo.svg`, '<svg/>');
    // Also create a file we want to keep
    await fs.writeFile(`${TARGET}/routes/index.tsx`, 'export default function Home() {}');
    await fs.writeFile(`${TARGET}/deno.json`, JSON.stringify({ name: 'fresh-app' }));

    const removed = await normalizeFreshOutput(TARGET, fs, 'my-project', 'dashboard');

    assertEquals(removed.length, 4);
    // Demo files should be gone
    assert(!await fs.exists(`${TARGET}/components/Button.tsx`));
    assert(!await fs.exists(`${TARGET}/islands/Counter.tsx`));
    assert(!await fs.exists(`${TARGET}/routes/api/joke.ts`));
    assert(!await fs.exists(`${TARGET}/static/logo.svg`));
    // Kept files should still exist
    assert(await fs.exists(`${TARGET}/routes/index.tsx`));
  });

  it('should skip demo files that do not exist', async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile(`${TARGET}/deno.json`, JSON.stringify({ name: 'fresh-app' }));

    const removed = await normalizeFreshOutput(TARGET, fs, 'my-project', 'dashboard');

    // No files to remove
    assertEquals(removed.length, 0);
  });

  it('should update deno.json with scoped name and exports', async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile(
      `${TARGET}/deno.json`,
      JSON.stringify({ name: 'fresh-app', tasks: { dev: 'deno run main.ts' } }),
    );

    await normalizeFreshOutput(TARGET, fs, 'my-project', 'dashboard');

    const content = await fs.readFile(`${TARGET}/deno.json`);
    const config = JSON.parse(content);
    assertEquals(config.name, '@my-project/dashboard');
    assertEquals(config.exports, './main.ts');
    // Tasks should be replaced with Vite-based workflow
    assertEquals(config.tasks.dev, 'deno run -A npm:vite --configLoader native');
    assertEquals(config.tasks.build, 'deno run -A npm:vite build');
    assertEquals(config.tasks.serve, 'deno run -A npm:vite preview');
    // Vite and Fresh plugin imports should be added
    assert(config.imports['@fresh/plugin-vite']);
    assert(config.imports['vite']);
  });

  it('should handle missing deno.json gracefully', async () => {
    const fs = new MemoryFileSystemAdapter();
    // No deno.json — should not throw
    const removed = await normalizeFreshOutput(TARGET, fs, 'my-project', 'dashboard');
    assertEquals(removed.length, 0);
  });
});
