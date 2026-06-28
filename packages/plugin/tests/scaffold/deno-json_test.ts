import { assertEquals } from '@std/assert';
import { buildPluginDenoJson, buildStandardScaffoldArtifacts } from '../../src/scaffold/mod.ts';

Deno.test('buildPluginDenoJson emits the generated-plugin envelope', () => {
  const json = buildPluginDenoJson({
    pluginName: 'example',
    exports: {
      '.': './mod.ts',
      './services': './services/src/main.ts',
    },
    tasks: {
      check: 'deno check mod.ts services/src/main.ts',
      test: 'deno test --allow-all',
    },
    imports: {
      '@netscript/plugin': 'jsr:@netscript/plugin@0.0.1-alpha.12',
      zod: 'jsr:@zod/zod@4.4.3',
    },
  }, '0.0.1-alpha.12');

  assertEquals(
    json,
    `{
  "name": "@netscript-app/plugin-example",
  "version": "0.1.0",
  "exports": {
    ".": "./mod.ts",
    "./services": "./services/src/main.ts"
  },
  "tasks": {
    "check": "deno check mod.ts services/src/main.ts",
    "test": "deno test --allow-all"
  },
  "imports": {
    "@netscript/plugin": "jsr:@netscript/plugin@0.0.1-alpha.12",
    "zod": "jsr:@zod/zod@4.4.3"
  },
  "compilerOptions": {
    "lib": [
      "deno.ns",
      "deno.unstable",
      "dom",
      "dom.iterable"
    ],
    "strict": true
  }
}
`,
  );
});

Deno.test('buildPluginDenoJson preserves the previous auth deno.json bytes', () => {
  const version = '0.0.1-alpha.12';
  const json = buildPluginDenoJson({
    pluginName: 'auth',
    packageName: '@netscript/plugin-auth',
    packageVersion: version,
    description:
      'NetScript plugin for a unified auth API, single-active backend selection, auth database schema, and auth session streams.',
    license: 'MIT',
    exports: {
      '.': './mod.ts',
      './public': './src/public/mod.ts',
      './plugin': './src/plugin/mod.ts',
      './contracts': './contracts.ts',
      './scaffold': './scaffold.ts',
      './services': './services/src/main.ts',
      './streams': './streams/mod.ts',
      './streams/server': './streams/server.ts',
    },
    imports: {
      '@netscript/contracts': `jsr:@netscript/contracts@${version}`,
      '@netscript/auth-better-auth': `jsr:@netscript/auth-better-auth@${version}`,
      '@netscript/auth-kv-oauth': `jsr:@netscript/auth-kv-oauth@${version}`,
      '@netscript/auth-workos': `jsr:@netscript/auth-workos@${version}`,
      '@netscript/kv': `jsr:@netscript/kv@${version}`,
      '@netscript/plugin': `jsr:@netscript/plugin@${version}`,
      '@netscript/plugin-auth-core': `jsr:@netscript/plugin-auth-core@${version}`,
      '@netscript/plugin-streams-core': `jsr:@netscript/plugin-streams-core@${version}`,
      '@netscript/service': `jsr:@netscript/service@${version}`,
      '@netscript/telemetry': `jsr:@netscript/telemetry@${version}`,
      '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
      '@orpc/server': 'npm:@orpc/server@^1.14.6',
      '@workos-inc/node': 'npm:@workos-inc/node@^10.4.0',
      '@durable-streams/state': 'npm:@durable-streams/state@^0.3.1',
      zod: 'jsr:@zod/zod@4.4.3',
    },
    tasks: {
      check:
        'deno check --unstable-kv mod.ts scaffold.ts src/public/mod.ts src/plugin/mod.ts src/scaffold/mod.ts contracts.ts services/src/main.ts streams/mod.ts streams/server.ts',
      test: 'deno test --unstable-kv --allow-all',
      dev: 'deno run --allow-net --allow-env --allow-read --watch services/src/main.ts',
      start: 'deno run --allow-net --allow-env --allow-read services/src/main.ts',
      'doc-lint':
        'deno doc --lint mod.ts scaffold.ts src/public/mod.ts src/plugin/mod.ts src/scaffold/mod.ts contracts.ts services/src/main.ts streams/mod.ts streams/server.ts',
      'publish:dry-run': 'deno publish --dry-run --allow-dirty',
      verify: 'deno run --allow-read verify-plugin.ts',
    },
    publish: {
      include: [
        'README.md',
        'deno.json',
        'scaffold.plugin.json',
        'package.json',
        'scaffold.ts',
        'mod.ts',
        'contracts.ts',
        'verify-plugin.ts',
        'src/**/*.ts',
        'services/**/*.ts',
        'streams/**/*.ts',
        'database/**/*.prisma',
      ],
      exclude: [
        '**/*_test.ts',
        '**/*.test.ts',
        '**/test_utils/**',
      ],
    },
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
    },
  }, version);

  assertEquals(json, previousAuthDenoJson(version));
});

Deno.test('buildStandardScaffoldArtifacts emits the stable root artifact trio', () => {
  assertEquals(
    buildStandardScaffoldArtifacts({
      pluginName: 'example',
      manifestJson: '{}\n',
      denoJson: '{"name":"example"}\n',
      modTs: 'export {};\n',
    }),
    [
      {
        path: 'plugins/example/scaffold.plugin.json',
        content: '{}\n',
      },
      {
        path: 'plugins/example/deno.json',
        content: '{"name":"example"}\n',
      },
      {
        path: 'plugins/example/mod.ts',
        content: 'export {};\n',
      },
    ],
  );
});

function previousAuthDenoJson(version: string): string {
  return `{
  "name": "@netscript/plugin-auth",
  "version": "${version}",
  "description": "NetScript plugin for a unified auth API, single-active backend selection, auth database schema, and auth session streams.",
  "license": "MIT",
  "exports": {
    ".": "./mod.ts",
    "./public": "./src/public/mod.ts",
    "./plugin": "./src/plugin/mod.ts",
    "./contracts": "./contracts.ts",
    "./scaffold": "./scaffold.ts",
    "./services": "./services/src/main.ts",
    "./streams": "./streams/mod.ts",
    "./streams/server": "./streams/server.ts"
  },
  "imports": {
    "@netscript/contracts": "jsr:@netscript/contracts@${version}",
    "@netscript/auth-better-auth": "jsr:@netscript/auth-better-auth@${version}",
    "@netscript/auth-kv-oauth": "jsr:@netscript/auth-kv-oauth@${version}",
    "@netscript/auth-workos": "jsr:@netscript/auth-workos@${version}",
    "@netscript/kv": "jsr:@netscript/kv@${version}",
    "@netscript/plugin": "jsr:@netscript/plugin@${version}",
    "@netscript/plugin-auth-core": "jsr:@netscript/plugin-auth-core@${version}",
    "@netscript/plugin-streams-core": "jsr:@netscript/plugin-streams-core@${version}",
    "@netscript/service": "jsr:@netscript/service@${version}",
    "@netscript/telemetry": "jsr:@netscript/telemetry@${version}",
    "@orpc/contract": "npm:@orpc/contract@^1.14.6",
    "@orpc/server": "npm:@orpc/server@^1.14.6",
    "@workos-inc/node": "npm:@workos-inc/node@^10.4.0",
    "@durable-streams/state": "npm:@durable-streams/state@^0.3.1",
    "zod": "jsr:@zod/zod@4.4.3"
  },
  "tasks": {
    "check": "deno check --unstable-kv mod.ts scaffold.ts src/public/mod.ts src/plugin/mod.ts src/scaffold/mod.ts contracts.ts services/src/main.ts streams/mod.ts streams/server.ts",
    "test": "deno test --unstable-kv --allow-all",
    "dev": "deno run --allow-net --allow-env --allow-read --watch services/src/main.ts",
    "start": "deno run --allow-net --allow-env --allow-read services/src/main.ts",
    "doc-lint": "deno doc --lint mod.ts scaffold.ts src/public/mod.ts src/plugin/mod.ts src/scaffold/mod.ts contracts.ts services/src/main.ts streams/mod.ts streams/server.ts",
    "publish:dry-run": "deno publish --dry-run --allow-dirty",
    "verify": "deno run --allow-read verify-plugin.ts"
  },
  "publish": {
    "include": [
      "README.md",
      "deno.json",
      "scaffold.plugin.json",
      "package.json",
      "scaffold.ts",
      "mod.ts",
      "contracts.ts",
      "verify-plugin.ts",
      "src/**/*.ts",
      "services/**/*.ts",
      "streams/**/*.ts",
      "database/**/*.prisma"
    ],
    "exclude": [
      "**/*_test.ts",
      "**/*.test.ts",
      "**/test_utils/**"
    ]
  },
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
`;
}
