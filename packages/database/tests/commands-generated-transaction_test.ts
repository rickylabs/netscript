import { assertEquals } from '@std/assert';

Deno.test('generated Prisma bridge retains model delegates and excludes all root operations', async () => {
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
    for (const name of ['command-store', 'transaction-type']) {
      const source = await Deno.readTextFile(fixture + name + '.ts.template');
      const commands = new URL('../commands.ts', import.meta.url).href;
      await Deno.writeTextFile(
        temp + '/' + name + '.ts',
        source.replaceAll('../../../commands.ts', commands),
      );
    }
    // Prisma's generated declarations do not support isolatedDeclarations. This
    // consumer probe type-checks its unmodified generated output; framework gates keep it enabled.
    await Deno.writeTextFile(
      temp + '/deno.json',
      JSON.stringify({
        compilerOptions: { strict: true, isolatedDeclarations: false },
        imports: { '@prisma/client': 'npm:@prisma/client@7.8.0' },
      }),
    );
    const checked = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--no-lock', '--config', temp + '/deno.json', temp + '/transaction-type.ts'],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(checked.code, 0, new TextDecoder().decode(checked.stderr));
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});
