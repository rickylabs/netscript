/** Build a migration CSS fixture from an exact older source archive for parity replay. */
import { dirname, join } from 'jsr:@std/path@^1';
import { migrateVariantCss } from '../../packages/cli/src/public/features/ui/migrate/migrate-css.ts';

const [beforeRoot, outputRoot] = Deno.args;
if (!beforeRoot || !outputRoot) {
  throw new Error('Supply baseline Fresh UI root and new output root.');
}
for (const folder of ['styles', 'components/ui', 'islands']) {
  const source = join(beforeRoot, 'registry', folder);
  const output = join(outputRoot, 'registry', folder);
  await Deno.mkdir(output, { recursive: true });
  for await (const entry of Deno.readDir(source)) {
    if (!entry.isFile || !entry.name.endsWith('.css')) continue;
    const result = migrateVariantCss(await Deno.readTextFile(join(source, entry.name)));
    if (result.diagnostics.length) {
      throw new Error(`${entry.name}: ${result.diagnostics.join('; ')}`);
    }
    const path = join(output, entry.name);
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, result.content);
  }
}
