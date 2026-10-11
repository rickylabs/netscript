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
import { EMBEDDED_TEMPLATE_CONTENT } from '../../assets/embedded.generated.ts';
import { SERVICE_PUBLIC_REASON, serviceAuthTemplate } from '../../adapters/service/auth-policy.ts';
const serviceMainTemplate = EMBEDDED_TEMPLATE_CONTENT['service/main.memory.ts.template'];
const serviceRouterTemplate = EMBEDDED_TEMPLATE_CONTENT['service/router.ts.template'];

const SAMPLE_SERVICE_VARS: Record<string, string> = {
  projectName: 'test-project',
  serviceName: 'team-members',
  entityName: 'team-members',
  servicePort: '3000',
  ...serviceAuthTemplate(),
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
    assert(!('@netscript/plugin-auth-core' in config.imports));
  });

  it('declares the guarded service authenticator dependency in both source modes', () => {
    for (const importMode of ['jsr', 'local'] as const) {
      const config = JSON.parse(generateServiceDenoJson({
        projectName: 'test-project',
        serviceName: 'team-members',
        importMode,
        localBase: '../..',
        authServiceName: 'auth',
      }));
      assertEquals(
        config.imports['@netscript/plugin-auth-core'],
        importMode === 'jsr'
          ? netscriptJsrSpecifier('plugin-auth-core')
          : '../../packages/plugin-auth-core/mod.ts',
      );
    }
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

  it('should run the server with --unstable-no-legacy-abort (Deno 2.9, #176)', () => {
    const config = JSON.parse(generateServiceDenoJson({
      projectName: 'test-project',
      serviceName: 'team-members',
      importMode: 'jsr',
    }));

    // The oRPC runtime observes request.signal for cancellation; opting into the
    // non-legacy Deno.serve behavior avoids the per-request deprecation warning
    // while preserving genuine client-disconnect cancellation.
    assertStringIncludes(config.tasks.start, '--unstable-no-legacy-abort');
    assertStringIncludes(config.tasks.dev, '--unstable-no-legacy-abort');
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
    assertStringIncludes(output, "import { createRouter } from './router.ts';");
    assertStringIncludes(output, "name: 'team-members'");
    assertStringIncludes(output, "title: 'TeamMembers API'");
    assertStringIncludes(output, "description: 'team-members service'");
    assertStringIncludes(output, 'debug: true');
    assert(!output.includes('createService('));
    assert(!output.includes('Deno.serve('));
    assert(!output.includes('@orpc/server/fetch'));
    assert(
      output.indexOf("import { defineService } from '@netscript/service';") <
        output.indexOf("import { createRouter } from './router.ts';"),
    );
    assert(
      output.indexOf("name: 'team-members'") <
          output.indexOf("title: 'TeamMembers API'") &&
        output.indexOf("title: 'TeamMembers API'") <
          output.indexOf("description: 'team-members service'") &&
        output.indexOf("description: 'team-members service'") < output.indexOf('debug: true'),
    );
  });

  it('new service entrypoints opt into a bounded request-body limit', async () => {
    const adapter = makeAdapter();
    for (const key of ['service/main.ts.template', 'service/main.memory.ts.template'] as const) {
      const output = await adapter.render(EMBEDDED_TEMPLATE_CONTENT[key], SAMPLE_SERVICE_VARS);

      assertStringIncludes(output, 'bodyLimit: { maxBytes: 1024 * 1024 },', key);
    }
  });

  it('both shipped service entrypoints record a user-facing public opt-out', async () => {
    const adapter = makeAdapter();
    for (const key of ['service/main.ts.template', 'service/main.memory.ts.template'] as const) {
      const output = await adapter.render(EMBEDDED_TEMPLATE_CONTENT[key], SAMPLE_SERVICE_VARS);
      assertStringIncludes(output, 'auth: { public: true, reason:', key);
      assertStringIncludes(output, SERVICE_PUBLIC_REASON, key);
    }
  });

  it('router.ts preserves the validated service-local health contract shape', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceRouterTemplate, SAMPLE_SERVICE_VARS);

    assertStringIncludes(output, "import { health } from './routers/health.ts';");
    assertStringIncludes(output, "import { createTeamMembersV1 } from './routers/v1.ts';");
    assertStringIncludes(output, 'v1: {');
    assertStringIncludes(output, 'teamMembers: {');
    assertStringIncludes(output, '...createTeamMembersV1(application), health');
    assertStringIncludes(output, 'health }');
    assertStringIncludes(output, 'export function createRouter(');
  });
});
