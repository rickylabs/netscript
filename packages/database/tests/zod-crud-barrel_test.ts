import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { runWriteCrudZodBarrel } from '../scripts/mod.ts';

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
