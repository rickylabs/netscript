import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { fixZodImports, runWriteCrudZodBarrel } from '../scripts/mod.ts';

Deno.test('runWriteCrudZodBarrel emits scaffold CRUD aliases', async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(dir, 'schemas', 'models'), { recursive: true });
    await Deno.mkdir(join(dir, 'schemas', 'variants', 'input'), { recursive: true });
    await Deno.mkdir(join(dir, 'schemas', 'objects'), { recursive: true });
    await Promise.all(
      ['Product', 'Warehouse'].flatMap((modelName) => [
        Deno.writeTextFile(join(dir, 'schemas', 'models', `${modelName}.schema.ts`), ''),
        Deno.writeTextFile(join(dir, 'schemas', 'variants', 'input', `${modelName}.input.ts`), ''),
        Deno.writeTextFile(
          join(dir, 'schemas', 'objects', `${modelName}UpdateInput.schema.ts`),
          '',
        ),
      ]),
    );
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
    assertStringIncludes(content, 'WarehouseSchema');
    assertStringIncludes(content, 'WarehouseInputSchema as WarehouseCreateInput');
    assertStringIncludes(
      content,
      'WarehouseUpdateInputObjectZodSchema as WarehouseUpdateInput',
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('fixZodImports leaves the upstream model barrel generator-owned', async () => {
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
    await fixZodImports(zodDir, { verbose: false, fixDecimalImports: false });
    const firstPass = await Deno.readTextFile(join(modelsDir, 'index.ts'));
    await fixZodImports(zodDir, { verbose: false, fixDecimalImports: false });
    assertEquals(await Deno.readTextFile(join(modelsDir, 'index.ts')), firstPass);
    assertEquals(firstPass.includes('CreateInput'), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
