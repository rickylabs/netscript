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
    'getById.handler(async ({ input, errors })',
  );
  assertStringIncludes(routerTemplate, 'resourceId: input.id');
  assertEquals(routerTemplate.match(/notFound\(\{/g)?.length, 3);
  assertEquals(
    routerTemplate.includes('throw new Error(`{{modelName}} ${input.id} not found`)'),
    false,
  );
});

const repositoryTemplate = await Deno.readTextFile(
  new URL(
    '../../../../src/kernel/assets/service/adapters/prisma-entity-repository.ts.template',
    import.meta.url,
  ),
);

Deno.test('persistent repository translates only Prisma P2025 and rethrows other failures', () => {
  assertStringIncludes(repositoryTemplate, "error.code === 'P2025'");
  assertStringIncludes(repositoryTemplate, 'return null;');
  assertEquals(repositoryTemplate.match(/missingAsNull\(\(\)/g)?.length, 2);
  assertStringIncludes(repositoryTemplate, 'throw error;');
});

Deno.test('generated CRUD contract retains the common 404 OpenAPI projection', () => {
  assertStringIncludes(contractTemplate, "import { baseContract } from '@netscript/contracts';");
  assertStringIncludes(contractTemplate, 'createCrudContract({');
  assertStringIncludes(contractPrimitives, 'NOT_FOUND: {');
  assertStringIncludes(contractPrimitives, 'status: 404');
});
