import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from 'jsr:@std/path@^1';

const REPO_ROOT = fromFileUrl(new URL('../../../../', import.meta.url));
const CLI_ENTRY = join(REPO_ROOT, 'packages/cli/bin/netscript-dev.ts');
const REGISTRY_ROOT = join(REPO_ROOT, 'packages/fresh-ui');
const decoder = new TextDecoder();

async function run(
  cwd: string,
  args: readonly string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

Deno.test('copied Markdown type-checks and renders directly through Preact', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'fresh-ui-markdown-' });
  try {
    await Deno.writeTextFile(
      join(projectRoot, 'deno.json'),
      `${
        JSON.stringify(
          {
            name: '@netscript/fresh-ui-markdown-test',
            version: '0.0.0',
            imports: {
              preact: 'npm:preact@^10.29.2',
              'preact-render-to-string': 'npm:preact-render-to-string@^6.7.0',
            },
            compilerOptions: {
              lib: ['dom', 'dom.asynciterable', 'dom.iterable', 'deno.ns'],
              jsx: 'precompile',
              jsxImportSource: 'preact',
            },
          },
          null,
          2,
        )
      }\n`,
    );

    const install = await run(REPO_ROOT, [
      'run',
      '-A',
      CLI_ENTRY,
      'ui:add',
      'markdown',
      '--project-root',
      projectRoot,
      '--registry-root',
      REGISTRY_ROOT,
      '--force',
    ]);
    assertEquals(install.code, 0, install.stderr || install.stdout);

    const config = JSON.parse(await Deno.readTextFile(join(projectRoot, 'deno.json')));
    const imports: Record<string, string> = config.imports;
    assertEquals(imports['unified'], 'npm:unified@^11');
    assertEquals(imports['remark-parse'], 'npm:remark-parse@^11');
    assertEquals(imports['remark-rehype'], 'npm:remark-rehype@^11');
    assertEquals(imports['rehype-react'], 'npm:rehype-react@^8');
    assertFalse('react-markdown' in imports);
    assertFalse('react' in imports);
    assertFalse('react-dom' in imports);

    const check = await run(projectRoot, [
      'check',
      '--unstable-kv',
      'components/ui/markdown.tsx',
    ]);
    assertEquals(check.code, 0, check.stderr || check.stdout);

    const verifySource = [
      'import { render } from "preact-render-to-string";',
      'import { Markdown } from "./components/ui/markdown.tsx";',
      'const html = render(Markdown({',
      '  streaming: true,',
      '  activeCite: 12,',
      '  children: "# Hello\\n\\n- item\\n\\n$e^{i\\\\pi}+1=0$\\n\\n```ts\\nconst x = 1\\n```\\n\\nSee [12].\\n\\n<script>alert(1)</script><img src=x onerror=alert(1)>",',
      '}));',
      'const streamed = render(Markdown({ streaming: true, children: "**streamed" }));',
      'console.log(`${html}\\n${streamed}`);',
    ].join('\n');
    const render = await run(projectRoot, ['eval', '--config', 'deno.json', verifySource]);
    assertEquals(render.code, 0, render.stderr || render.stdout);
    assertStringIncludes(render.stdout, '<h1>Hello</h1>');
    assertStringIncludes(render.stdout, '<li>item</li>');
    assertStringIncludes(render.stdout, 'class="katex"');
    assertStringIncludes(render.stdout, 'style="height:');
    assertStringIncludes(render.stdout, 'class="hljs-keyword"');
    assertStringIncludes(render.stdout, 'aria-label="Source 12"');
    assertStringIncludes(render.stdout, '<strong>streamed</strong>');
    assertFalse(render.stdout.includes('<script'));
    assertFalse(render.stdout.includes('onerror'));
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('generated Fresh Markdown island production-builds for hydration', async () => {
  const parent = await Deno.makeTempDir({
    dir: join(REPO_ROOT, '.llm/tmp'),
    prefix: 'fresh-ui-markdown-browser-',
  });
  const projectName = 'markdown-browser';
  const projectRoot = join(parent, projectName);
  const dashboardRoot = join(projectRoot, 'apps/dashboard');
  try {
    const scaffold = await run(REPO_ROOT, [
      'run',
      '-A',
      CLI_ENTRY,
      'init',
      projectName,
      '--path',
      parent,
      '--db',
      'none',
      '--no-aspire',
      '--editor',
      'none',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
    ]);
    assertEquals(scaffold.code, 0, scaffold.stderr || scaffold.stdout);

    const install = await run(REPO_ROOT, [
      'run',
      '-A',
      CLI_ENTRY,
      'ui:add',
      'markdown',
      '--project-root',
      dashboardRoot,
      '--registry-root',
      REGISTRY_ROOT,
      '--force',
    ]);
    assertEquals(install.code, 0, install.stderr || install.stdout);

    await Deno.writeTextFile(
      join(dashboardRoot, 'islands/MarkdownHydrationFixture.tsx'),
      `import { useState } from 'preact/hooks';
import { Markdown } from '@app/components/ui/markdown.tsx';

export default function MarkdownHydrationFixture() {
  const [selected, setSelected] = useState(0);
  return (
    <main>
      <output data-testid='citation-count'>{selected}</output>
      <Markdown activeCite={selected} onCite={setSelected}>
        {'Hydrated citation [1].'}
      </Markdown>
    </main>
  );
}
`,
    );
    await Deno.writeTextFile(
      join(dashboardRoot, 'routes/markdown-hydration.tsx'),
      `import MarkdownHydrationFixture from '@app/islands/MarkdownHydrationFixture.tsx';

export default function MarkdownHydrationPage() {
  return <MarkdownHydrationFixture />;
}
`,
    );

    const check = await run(dashboardRoot, [
      'check',
      '--unstable-kv',
      'islands/MarkdownHydrationFixture.tsx',
      'routes/markdown-hydration.tsx',
    ]);
    assertEquals(check.code, 0, check.stderr || check.stdout);

    const build = await run(dashboardRoot, ['task', 'build']);
    assertEquals(build.code, 0, build.stderr || build.stdout);
    const serverBundle = await Deno.stat(join(dashboardRoot, '_fresh/server.js'));
    assert(serverBundle.isFile, 'Fresh production server bundle was not emitted');
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});
