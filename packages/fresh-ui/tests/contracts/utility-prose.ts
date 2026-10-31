import { assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import type { ContractRenderFixture } from './style-provider.ts';

// Prose ships as a copy-only template with consumer-only markdown dependencies. Exercise that
// actual template through the public install path rather than substituting invented markup.
async function renderCopiedProse(): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-contract-prose-' });
  const repo = fromFileUrl(new URL('../../../../', import.meta.url));
  async function run(cwd: string, args: string[]): Promise<string> {
    const output = await new Deno.Command(Deno.execPath(), {
      cwd,
      args,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
    return new TextDecoder().decode(output.stdout);
  }
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        name: '@netscript/prose-contract-fixture',
        version: '0.0.0',
        imports: {
          preact: 'npm:preact@^10.29.2',
          'preact-render-to-string': 'npm:preact-render-to-string@^6.7.0',
        },
        compilerOptions: {
          jsx: 'precompile',
          jsxImportSource: 'preact',
          lib: ['dom', 'dom.iterable', 'deno.ns'],
        },
      }),
    );
    await run(repo, [
      'run',
      '-A',
      '--frozen',
      join(repo, 'packages/cli/bin/netscript-dev.ts'),
      'ui:add',
      'markdown',
      '--project-root',
      root,
      '--registry-root',
      join(repo, 'packages/fresh-ui'),
      '--force',
    ]);
    const markdown =
      '# Heading\n\nParagraph with **strong**, `code` and [link](/example).\n\n```ts\nconst greeting = "hello"; // note\nconst count = 42;\n```';
    const source =
      "import {render} from 'preact-render-to-string'; import {Markdown} from './components/ui/markdown.tsx'; console.log(render(Markdown(" +
      JSON.stringify({ children: markdown }) + ')));';
    return (await run(root, ['eval', '--config', 'deno.json', source])).trim();
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

export const proseFixture: ContractRenderFixture = {
  component: 'prose',
  props: [],
  scenario: 'copied Markdown',
  renderHtml: renderCopiedProse,
};
