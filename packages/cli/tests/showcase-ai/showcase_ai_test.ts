import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { createFixture, repository } from './fixture.ts';

Deno.test('rendered showcase AI templates: real framework transport, MCP and stub provider', async () => {
  const fixture = await createFixture();
  try {
    const scenarios = await Deno.readTextFile(new URL('./scenarios.ts.template', import.meta.url));
    await fixture.write('scenarios_test.ts', scenarios);
    const check = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-all',
        join(repository, '.llm/tools/run-deno-check.ts'),
        '--cwd',
        fixture.root,
        '--root',
        'ai',
        '--root',
        'apps/portal/routes',
        '--root',
        'apps/portal/islands',
        '--ext',
        'ts,tsx',
        '--deno-arg',
        '--no-lock',
      ],
      cwd: repository,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(
      check.code,
      0,
      new TextDecoder().decode(check.stdout) + new TextDecoder().decode(check.stderr),
    );
    const evidence = Deno.env.get('SHOWCASE_AI_EVIDENCE_DIR');
    if (evidence) await Deno.writeFile(join(evidence, 'rendered-check.json'), check.stdout);
    for (const gate of ['lint', 'fmt']) {
      const result = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-all',
          join(repository, `.llm/tools/run-deno-${gate}.ts`),
          '--cwd',
          fixture.root,
          '--root',
          'ai',
          '--root',
          'apps/portal/routes',
          '--root',
          'apps/portal/islands',
          '--file',
          'apps/portal/lib/showcase-ai.ts',
          '--ext',
          'ts,tsx',
        ],
        cwd: repository,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      if (evidence) await Deno.writeFile(join(evidence, `rendered-${gate}.json`), result.stdout);
      assertEquals(
        result.code,
        0,
        new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
      );
    }
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-all',
        join(repository, '.llm/tools/run-deno-test.ts'),
        '--cwd',
        fixture.root,
        '--',
        '--allow-all',
        '--unstable-kv',
        '--no-lock',
        'scenarios_test.ts',
      ],
      cwd: repository,
      stdout: 'piped',
      stderr: 'piped',
    });
    const output = await command.output();
    const report = new TextDecoder().decode(output.stdout);
    if (evidence) await Deno.writeTextFile(join(evidence, 'rendered-tests.json'), report);
    assertEquals(output.code, 0, report + new TextDecoder().decode(output.stderr));
    const parsed = JSON.parse(report);
    assertEquals(parsed.summary.failed, 0);
    assertEquals(parsed.summary.passed >= 15, true, report);
  } finally {
    await fixture.close();
  }
});
