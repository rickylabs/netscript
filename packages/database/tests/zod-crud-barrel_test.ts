import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { fixZodImports, runWriteCrudZodBarrel } from '../scripts/mod.ts';

Deno.test('runWriteCrudZodBarrel emits scaffold CRUD aliases', async () => {
  const dir = await Deno.makeTempDir();
  try {
    const barrelPath = await runWriteCrudZodBarrel(dir, 'Product');
    const content = await Deno.readTextFile(join(dir, 'crud.ts'));

    assertEquals(barrelPath, undefined);
    assertStringIncludes(
      content,
      "export { ProductSchema } from './schemas/models/Product.schema.ts';",
    );
    assertStringIncludes(
      content,
      'ProductInputSchema as ProductCreateInput',
    );
    assertStringIncludes(
      content,
      'ProductUpdateInputObjectZodSchema as ProductUpdateInput',
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('fixZodImports makes every generated model importable from the complete barrel', async () => {
  const root = await Deno.makeTempDir();
  const zodDir = join(root, 'schema', '.generated', 'zod');
  const modelsDir = join(zodDir, 'schemas', 'models');
  const inputsDir = join(zodDir, 'schemas', 'variants', 'input');
  const objectsDir = join(zodDir, 'schemas', 'objects');

  try {
    await Promise.all([
      Deno.mkdir(modelsDir, { recursive: true }),
      Deno.mkdir(inputsDir, { recursive: true }),
      Deno.mkdir(objectsDir, { recursive: true }),
    ]);
    await Promise.all(
      ['Issue', 'Cycle'].flatMap((modelName) => [
        Deno.writeTextFile(
          join(modelsDir, `${modelName}.schema.ts`),
          `import { z } from 'zod';\nexport const ${modelName}Schema = z.object({ id: z.number() });\n`,
        ),
        Deno.writeTextFile(
          join(inputsDir, `${modelName}.input.ts`),
          `import { z } from 'zod';\nexport const ${modelName}InputSchema = z.object({ id: z.number() });\n`,
        ),
        Deno.writeTextFile(
          join(objectsDir, `${modelName}UpdateInput.schema.ts`),
          `import { z } from 'zod';\nexport const ${modelName}UpdateInputObjectZodSchema = z.object({ id: z.number().optional() });\n`,
        ),
      ]),
    );
    await Deno.writeTextFile(
      join(modelsDir, 'index.ts'),
      [
        "export { IssueSchema } from './Issue.schema';",
        "export { CycleSchema } from './Cycle.schema';",
        '',
      ].join('\n'),
    );
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        imports: {
          '@database/zod': './schema/.generated/zod/schemas/models/index.ts',
          zod: 'jsr:@zod/zod@4.4.3',
        },
      }),
    );

    await fixZodImports(zodDir, { verbose: false, fixDecimalImports: false });
    const firstPass = await Deno.readTextFile(join(modelsDir, 'index.ts'));
    await fixZodImports(zodDir, { verbose: false, fixDecimalImports: false });
    assertEquals(await Deno.readTextFile(join(modelsDir, 'index.ts')), firstPass);

    const consumer = await new Deno.Command(Deno.execPath(), {
      cwd: root,
      args: [
        'eval',
        '--config',
        'deno.json',
        "import { CycleCreateInput, CycleSchema, CycleUpdateInput, IssueSchema } from '@database/zod'; if (!CycleSchema.safeParse({ id: 1 }).success || !IssueSchema.safeParse({ id: 2 }).success || !CycleCreateInput.safeParse({ id: 3 }).success || !CycleUpdateInput.safeParse({}).success) Deno.exit(1);",
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    assertEquals(consumer.code, 0, new TextDecoder().decode(consumer.stderr));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
