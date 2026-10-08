import { assertEquals } from '@std/assert';

Deno.test({
  name: 'real PostgreSQL generated-client command-store conformance',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
  async fn() {
    const fixture = 'packages/database/tests/fixtures/command-store/';
    const temp = await Deno.makeTempDir();
    try {
      await Deno.copyFile(fixture + 'schema.prisma', temp + '/schema.prisma');
      const generated = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--no-lock',
          '-A',
          'npm:prisma@7.8.0',
          'generate',
          '--schema',
          temp + '/schema.prisma',
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(generated.code, 0, new TextDecoder().decode(generated.stderr));
      for (const name of ['command-store', 'postgres-conformance']) {
        const source = await Deno.readTextFile(fixture + name + '.ts.template');
        await Deno.writeTextFile(
          temp + '/' + name + (name === 'postgres-conformance' ? '_test' : '') + '.ts',
          source.replaceAll('../../../commands.ts', new URL('../commands.ts', import.meta.url).href)
            .replaceAll(
              '../../../commands-postgres.ts',
              new URL('../commands-postgres.ts', import.meta.url).href,
            ),
        );
      }
      await Deno.writeTextFile(
        temp + '/deno.json',
        JSON.stringify({
          compilerOptions: { strict: true, isolatedDeclarations: false },
          imports: { '@prisma/client': 'npm:@prisma/client@7.8.0' },
        }),
      );
      const filter = Deno.env.get('COMMAND_POSTGRES_TEST_FILTER');
      const tested = await new Deno.Command(Deno.execPath(), {
        args: [
          'test',
          '--no-lock',
          '--config',
          temp + '/deno.json',
          '--allow-all',
          ...(filter ? ['--filter', filter] : []),
          temp + '/postgres-conformance_test.ts',
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const evidence = Deno.env.get('COMMAND_POSTGRES_EVIDENCE');
      if (evidence) {
        await Deno.writeTextFile(
          evidence,
          new TextDecoder().decode(tested.stdout) + new TextDecoder().decode(tested.stderr),
        );
      }
      assertEquals(
        tested.code,
        0,
        new TextDecoder().decode(tested.stdout) + new TextDecoder().decode(tested.stderr),
      );
    } finally {
      await Deno.remove(temp, { recursive: true });
    }
  },
});
