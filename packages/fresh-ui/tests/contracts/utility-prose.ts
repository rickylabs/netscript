import { assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

// Prose ships as a copy-only template with consumer-only markdown dependencies. Exercise that
// actual template through the public install path rather than substituting invented markup.
export const PROSE_MARKDOWN: string = [
  '# Webhooks',
  'Receive signed events and read `event.type` before processing.',
  '## Configure a destination',
  'Send events to a [verified endpoint](#prose-target).',
  '### Select events',
  '- Verify the signature.\n- Record the event ID.',
  '1. Create a destination.\n2. Send a test event.',
  '#### Retry policy',
  '> Keep handlers idempotent. Retries may deliver the same event again.',
  'Use **strong text**, *emphasis* and an `inline.code` chip.',
  '```ts\n// Keep the raw request body.\nconst message: string = "received";\nconst greeting = "hello"; // note\nconst count = 42;\nfunction acknowledge() { return 42; }\n```',
  '| Event | Status |\n| --- | --- |\n| order.created | Ready |',
  '---',
  '[Continue reading](#prose-target)',
  '<script>alert(1)</script><img src=x onerror=alert(1)>',
].join('\n\n');

/** Actual installed renderer output, shared by contract and browser fixtures. */
export async function renderCopiedProse(
  markdown: string = PROSE_MARKDOWN,
  options: { readonly streaming?: boolean; readonly activeCite?: number; readonly class?: string } =
    {},
): Promise<string> {
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
    const source =
      "import {render} from 'preact-render-to-string'; import {Markdown} from './components/ui/markdown.tsx'; console.log(render(Markdown(" +
      JSON.stringify({ children: markdown, ...options }) + ')));';
    return (await run(root, ['eval', '--node-modules-dir=auto', '--config', 'deno.json', source]))
      .trim();
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

export const proseFixture: ContractRenderFixture = {
  component: 'prose',
  props: ['children', 'streaming', 'activeCite', 'class'],
  scenario: 'copied Markdown',
  renderHtml: () =>
    renderCopiedProse(undefined, { streaming: true, activeCite: 12, class: 'ns-lede' }),
};

export const proseKeyboard: readonly ContractKeyboardFixture[] = [{
  component: 'prose',
  scenario: 'prose/native-links-and-host-anchors',
  keys: ['Tab/Shift+Tab', 'Enter'],
  expectation:
    'Native links retain tab order and destinations; host-generated heading anchors appear on keyboard focus as well as hover.',
}];
