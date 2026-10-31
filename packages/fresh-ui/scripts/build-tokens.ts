import { buildTokens } from '../tokens.ts';

const directory = new URL('../registry/theme/', import.meta.url);
const check = Deno.args.includes('--check');
try {
  const build = await buildTokens();
  const stale: string[] = [];
  for (const [name, content] of Object.entries(build.files)) {
    const destination = new URL(name, directory);
    if (check) {
      const actual = await Deno.readTextFile(destination).catch((error: unknown) => {
        if (error instanceof Deno.errors.NotFound) return undefined;
        throw error;
      });
      if (actual !== content) stale.push(name);
    } else {
      await Deno.mkdir(new URL('./', destination), { recursive: true });
      await Deno.writeTextFile(destination, content);
    }
  }
  if (stale.length) throw new Error(`Stale token artifacts: ${stale.join(', ')}`);
  console.log(
    `${check ? 'Checked' : 'Built'} ${
      Object.keys(build.files).length
    } SD outputs from ${build.contexts.length} scheme × preset × density inputs.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  Deno.exitCode = 1;
}
