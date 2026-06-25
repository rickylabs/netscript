/**
 * @module templates/service/generators_test
 *
 * Unit tests for service-level scaffold generators and templates.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { generateServiceDenoJson } from './generate-service-deno-json.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
const serviceMainTemplate =
  "/**\r\n * {{serviceName | pascalCase}} Service\r\n *\r\n * Type-safe {{serviceName}} API with oRPC.\r\n */\r\n\r\nimport { defineService } from '@netscript/service';\r\nimport { router } from './router.ts';\r\n\r\nawait defineService(router, {\r\n  name: '{{serviceName}}',\r\n  version: '1.0.0',\r\n  port: parseInt(Deno.env.get('PORT') || '{{servicePort}}'),\r\n  openapi: {\r\n    title: '{{serviceName | pascalCase}} API',\r\n    description: '{{serviceName}} service',\r\n  },\r\n  debug: true,\r\n});\r\n";
const serviceRouterTemplate =
  "/**\r\n * {{serviceName | pascalCase}} router\r\n *\r\n * Aggregates version routers into a single router shape for the oRPC\r\n * server. Add new versions (`v2`, `v3`, …) alongside `v1` as the API\r\n * evolves; existing clients keep talking to their pinned version.\r\n *\r\n * The generated showcase keeps `health` under the service namespace because\r\n * the validated Step 5 contract baseline already owns that path at\r\n * `v1.{{serviceName | camelCase}}.health`.\r\n *\r\n * @see https://orpc.unnoq.com/docs/router\r\n */\r\n\r\nimport { health } from './routers/health.ts';\r\nimport { {{serviceName | pascalCase}}V1 } from './routers/v1.ts';\r\n\r\nexport const v1 = {\r\n  {{serviceName | camelCase}}: {\r\n    ...{{serviceName | pascalCase}}V1,\r\n    health,\r\n  },\r\n};\r\n\r\nexport const router = {\r\n  v1,\r\n};\r\n\r\nexport type Router = typeof router;\r\n";

const SAMPLE_SERVICE_VARS: Record<string, string> = {
  projectName: 'test-project',
  serviceName: 'team-members',
  servicePort: '3000',
};

function makeAdapter(): StringTemplateAdapter {
  return new StringTemplateAdapter(new MemoryFileSystemAdapter());
}

describe('generateServiceDenoJson', () => {
  it('should produce valid JSON with scoped name and direct imports only', () => {
    const config = JSON.parse(generateServiceDenoJson({
      projectName: 'test-project',
      serviceName: 'team-members',
      importMode: 'jsr',
    }));

    assertEquals(config.name, '@test-project/team-members');
    assertEquals(config.exports, './src/main.ts');
    assertEquals(config.imports['@test-project/contracts'], '../../contracts/mod.ts');
    assertEquals(config.imports['@netscript/service'], netscriptJsrSpecifier('service'));
    assert(!('@netscript/telemetry' in config.imports));
  });

  it('should resolve service imports against local packages when using copied workspace members', () => {
    const config = JSON.parse(generateServiceDenoJson({
      projectName: 'test-project',
      serviceName: 'team-members',
      importMode: 'local',
      localBase: '../..',
      packagesAsWorkspaceMembers: true,
    }));

    assertEquals(config.imports['@netscript/service'], '../../packages/service/mod.ts');
  });

  it('should end with a trailing newline', () => {
    assert(
      generateServiceDenoJson({
        projectName: 'test-project',
        serviceName: 'team-members',
        importMode: 'jsr',
      }).endsWith('\n'),
    );
  });
});

describe('service template rendering', () => {
  it('main.ts uses defineService as the only boot primitive', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceMainTemplate, SAMPLE_SERVICE_VARS);

    assertStringIncludes(output, "import { defineService } from '@netscript/service';");
    assertStringIncludes(output, "import { router } from './router.ts';");
    assertStringIncludes(output, "name: 'team-members'");
    assertStringIncludes(output, "title: 'TeamMembers API'");
    assertStringIncludes(output, "description: 'team-members service'");
    assertStringIncludes(output, 'debug: true');
    assert(!output.includes('createService('));
    assert(!output.includes('Deno.serve('));
    assert(!output.includes('@orpc/server/fetch'));
    assert(
      output.indexOf("import { defineService } from '@netscript/service';") <
        output.indexOf("import { router } from './router.ts';"),
    );
    assert(
      output.indexOf("name: 'team-members'") <
          output.indexOf("title: 'TeamMembers API'") &&
        output.indexOf("title: 'TeamMembers API'") <
          output.indexOf("description: 'team-members service'") &&
        output.indexOf("description: 'team-members service'") < output.indexOf('debug: true'),
    );
  });

  it('router.ts preserves the validated service-local health contract shape', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceRouterTemplate, SAMPLE_SERVICE_VARS);

    assertStringIncludes(output, "import { health } from './routers/health.ts';");
    assertStringIncludes(output, "import { TeamMembersV1 } from './routers/v1.ts';");
    assertStringIncludes(output, 'export const v1 = {');
    assertStringIncludes(output, 'teamMembers: {');
    assertStringIncludes(output, '...TeamMembersV1,');
    assertStringIncludes(output, 'health,');
    assertStringIncludes(output, 'export const router = {');
  });
});
