/** Bundle the minimal Figma sandbox entry separately from its browser iframe. */
const root = new URL('../../', import.meta.url);
const output = new URL('.llm/tmp/figma-plugin/', root);
await Deno.mkdir(output, { recursive: true });
for (const name of ['main', 'ui']) {
  const result = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      'bundle',
      '--frozen',
      '--platform',
      'browser',
      '--format',
      name === 'main' ? 'iife' : 'esm',
      '--output',
      new URL(`${name}.js`, output).pathname,
      `tools/figma-plugin/src/${name}.ts`,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
}
const html = await Deno.readTextFile(new URL('ui.html', import.meta.url));
const script = (await Deno.readTextFile(new URL('ui.js', output))).replaceAll(
  '</script',
  '<\\/script',
);
await Deno.writeTextFile(
  new URL('ui.html', output),
  html.replace('<!-- SCRIPT -->', `<script type="module">${script}</script>`),
);
await Deno.copyFile(new URL('manifest.json', import.meta.url), new URL('manifest.json', output));
console.log('Figma development plugin built in .llm/tmp/figma-plugin/');
