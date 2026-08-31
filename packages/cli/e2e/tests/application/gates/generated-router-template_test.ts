import { assertEquals, assertStringIncludes } from '@std/assert';

const routerTemplate = await Deno.readTextFile(
  new URL('../../../../src/kernel/assets/service/routers/v1.ts.template', import.meta.url),
);
const contractTemplate = await Deno.readTextFile(
  new URL('../../../../src/kernel/assets/service/contract.ts.template', import.meta.url),
);
const contractPrimitives = await Deno.readTextFile(
  new URL(
    '../../../../../contracts/src/application/contract-primitives.ts',
    import.meta.url,
  ),
);

Deno.test('persistent router maps all missing by-id operations to defined NOT_FOUND', () => {
  assertStringIncludes(routerTemplate, "import { notFound } from '@netscript/contracts';");
  assertStringIncludes(
    routerTemplate,
    'getById.handler(async ({ input, context, errors })',
  );
  assertStringIncludes(routerTemplate, 'resourceId: input.id');
  assertEquals(routerTemplate.match(/notFound\(\{/g)?.length, 3);
  assertEquals(
    routerTemplate.includes('throw new Error(`{{modelName}} ${input.id} not found`)'),
    false,
  );
});

Deno.test('persistent router translates only Prisma P2025 and rethrows other failures', () => {
  assertStringIncludes(
    routerTemplate,
    'function isPrismaNotFound(error: unknown): boolean',
  );
  assertStringIncludes(routerTemplate, "error.code === 'P2025'");
  assertEquals(routerTemplate.match(/if \(isPrismaNotFound\(error\)\)/g)?.length, 2);
  assertEquals(routerTemplate.match(/throw error;/g)?.length, 2);
});

Deno.test('generated CRUD contract retains the common 404 OpenAPI projection', () => {
  assertStringIncludes(contractTemplate, "import { baseContract } from '@netscript/contracts';");
  assertStringIncludes(contractTemplate, 'createCrudContract({');
  assertStringIncludes(contractPrimitives, 'NOT_FOUND: {');
  assertStringIncludes(contractPrimitives, 'status: 404');
});
