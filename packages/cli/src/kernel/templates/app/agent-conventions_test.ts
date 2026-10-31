import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import {
  type AppConventionsInput,
  appConventionsReferencedPaths,
  buildAppAgentsMarkdown,
  buildWebLayerMarkdown,
} from './agent-conventions.ts';

const GUIDANCE =
  'Before manually constructing this path, run `netscript generate resource <resource> --procedure <query> --client <service> --partial --app <app>`.';

Deno.test('rendered app conventions lead with generate resource before manual construction', () => {
  const input = serviceInput();
  const agents = buildAppAgentsMarkdown(input);
  const webLayer = buildWebLayerMarkdown(input);

  for (const rendered of [agents, webLayer]) {
    assertStringIncludes(rendered, GUIDANCE);
    assert(
      rendered.indexOf(GUIDANCE) < rendered.indexOf('1. '),
      'generate resource guidance must precede the manual architecture steps',
    );
  }
});

Deno.test('service app convention references are exact and rendered', () => {
  const input = serviceInput();
  const paths = appConventionsReferencedPaths(input);

  assertEquals(paths, [
    'routes/examples/users/index.route.ts',
    'routes/examples/users/(_lib)/service-query.ts',
    'routes/examples/users/index.tsx',
    'routes/examples/users/(_islands)/UsersIsland.tsx',
    'routes/examples/users/(_shared)/users-loaders.ts',
    'routes/examples/users/(_components)/users-form.tsx',
    'routes/partials/examples/users/summary.tsx',
    'routes/examples/telemetry/index.tsx',
    'routes/examples/orders/[id].tsx',
    'routes/(_components)/dashboard-view.tsx',
    'components/ui/mod.ts',
    '/design/composition',
  ]);

  const rendered = `${buildAppAgentsMarkdown(input)}\n${buildWebLayerMarkdown(input)}`;
  for (const path of paths) assertStringIncludes(rendered, `\`${path}\``);
});

Deno.test('service-free app conventions retain only shared resolvable references', () => {
  const input: AppConventionsInput = {
    appName: 'dashboard',
    dbEngine: 'none',
    includeExampleService: false,
  };

  assertEquals(appConventionsReferencedPaths(input), [
    'routes/examples/orders/[id].tsx',
    'routes/(_components)/dashboard-view.tsx',
    'components/ui/mod.ts',
    '/design/composition',
  ]);
  assertStringIncludes(buildAppAgentsMarkdown(input), GUIDANCE);
  assertStringIncludes(buildWebLayerMarkdown(input), GUIDANCE);
});

function serviceInput(): AppConventionsInput {
  return {
    appName: 'dashboard',
    dbEngine: 'postgres',
    includeExampleService: true,
    serviceName: 'users',
  };
}
