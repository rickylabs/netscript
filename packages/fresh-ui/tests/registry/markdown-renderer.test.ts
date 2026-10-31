/**
 * Capability contract for `deno task test` in this package.
 *
 * The task grants exactly `--allow-read`, `--allow-write`, and `--allow-run`: these tests create
 * temporary workspaces (write) and spawn Deno child processes for scaffold/build (run).
 * `--allow-env` and `--allow-net` are measured as unnecessary; do not widen without measuring.
 *
 * This rationale lives here rather than in `deno.json` because the repo's publish-asset generator
 * parses that manifest as strict JSON, so a JSONC comment breaks `deno task check:publish-assets`.
 */
import { checkGeneratedFiles } from '../../../../.llm/tools/testing/check-generated-files.ts';
import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { walk } from 'jsr:@std/fs@^1/walk';
import { fromFileUrl, join } from 'jsr:@std/path@^1';

const REPO_ROOT = fromFileUrl(new URL('../../../../', import.meta.url));
const CLI_ENTRY = join(REPO_ROOT, 'packages/cli/bin/netscript-dev.ts');
const REGISTRY_ROOT = join(REPO_ROOT, 'packages/fresh-ui');
const decoder = new TextDecoder();

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function run(
  cwd: string,
  args: readonly string[],
): Promise<CommandResult> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return commandResult(output);
}

function commandResult(output: Deno.CommandOutput): CommandResult {
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

function commandFailureMessage(
  label: string,
  args: readonly string[],
  result: CommandResult,
): string {
  return [
    `${label} failed with exit code ${result.code}`,
    `Command: deno ${args.join(' ')}`,
    '--- stdout ---',
    result.stdout || '<empty>',
    '--- stderr ---',
    result.stderr || '<empty>',
  ].join('\n');
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

    const lintArgs = ['lint', '--rules-include=jsx-curly-braces', 'components/ui/markdown.tsx'];
    const lint = await run(projectRoot, lintArgs);
    assertEquals(lint.code, 0, commandFailureMessage('copied Markdown lint', lintArgs, lint));
    const copied = join(projectRoot, 'components/ui/markdown.tsx');
    const source = await Deno.readTextFile(copied);
    const broken = source.replace(/data-part=(['"])root\1/, "data-part={'root'}");
    assert(broken !== source, 'negative control must change the copied attribute');
    await Deno.writeTextFile(copied, broken);
    const negative = await run(projectRoot, lintArgs);
    assert(negative.code !== 0, 'the consumer lint guard must reject string-in-braces attributes');
    assertStringIncludes(negative.stderr, 'jsx-curly-braces');
    await Deno.writeTextFile(copied, source);

    const config = JSON.parse(await Deno.readTextFile(join(projectRoot, 'deno.json')));
    const imports: Record<string, string> = config.imports;
    assertEquals(imports['unified'], 'npm:unified@^11');
    assertEquals(imports['remark-parse'], 'npm:remark-parse@^11');
    assertEquals(imports['remark-rehype'], 'npm:remark-rehype@^11');
    assertEquals(imports['rehype-react'], 'npm:rehype-react@^8');
    assertFalse('react-markdown' in imports);
    assertFalse('react' in imports);
    assertFalse('react-dom' in imports);

    const check = commandResult(
      await checkGeneratedFiles({
        cwd: projectRoot,
        args: ['check', '--unstable-kv', 'components/ui/markdown.tsx'],
      }),
    );
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
  const tempRoot = join(REPO_ROOT, '.llm/tmp');
  await Deno.mkdir(tempRoot, { recursive: true });
  const parent = await Deno.makeTempDir({
    dir: tempRoot,
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
      '--app-name',
      'dashboard',
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

    const check = commandResult(
      await checkGeneratedFiles({
        cwd: dashboardRoot,
        args: [
          'check',
          '--unstable-kv',
          'islands/MarkdownHydrationFixture.tsx',
          'routes/markdown-hydration.tsx',
        ],
      }),
    );
    assertEquals(check.code, 0, check.stderr || check.stdout);

    const buildArgs = ['task', 'build'] as const;
    const build = await run(dashboardRoot, buildArgs);
    assertEquals(
      build.code,
      0,
      commandFailureMessage('Fresh Markdown production build', buildArgs, build),
    );
    const serverBundle = await Deno.stat(join(dashboardRoot, '_fresh/server.js'));
    assert(serverBundle.isFile, 'Fresh production server bundle was not emitted');
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

Deno.test('registry TSX templates pass jsx-curly-braces before installation', async () => {
  const root = await Deno.makeTempDir({ prefix: 'registry-template-lint-' });
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ lint: { rules: { tags: [], include: ['jsx-curly-braces'] } } }),
    );
    const paths: string[] = [];
    for await (
      const file of walk(join(REGISTRY_ROOT, 'registry'), { match: [/\.tsx\.template$/] })
    ) {
      if (!file.isFile) continue;
      const target = join(root, `${paths.length}.tsx`);
      await Deno.writeTextFile(target, await Deno.readTextFile(file.path));
      paths.push(target);
    }
    assert(paths.length > 0, 'the guard must inspect shipped templates');
    const args = ['lint', '--config', join(root, 'deno.json'), ...paths];
    const lint = await run(root, args);
    assertEquals(lint.code, 0, commandFailureMessage('registry template lint', args, lint));
    // A fresh template with the reported regression proves that this guard enforces the rule.
    const control = join(root, 'negative.tsx');
    await Deno.writeTextFile(control, `export const view = <div data-part={"root"} />;`);
    const negative = await run(root, [...args, control]);
    assert(negative.code !== 0, 'the template guard must reject string-in-braces attributes');
    assertStringIncludes(negative.stderr, 'jsx-curly-braces');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
