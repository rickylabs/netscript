/**
 * @module
 *
 * Template registry for the default NetScript plugin skeleton.
 */

/** Paths for plugin skeleton template assets. */
export const PLUGIN_SKELETON_TEMPLATES: readonly [
  'README.md.template',
  'deno.json.template',
  'mod.ts.template',
  'src/public/mod.ts.template',
  'src/cli/{{plugin-name}}-cli.ts.template',
  'src/cli/composition/main.ts.template',
  'src/aspire/{{plugin-name}}-contribution.ts.template',
  'src/aspire/mod.ts.template',
  'src/e2e/mod.ts.template',
  'src/scaffolding/mod.ts.template',
  'src/testing/mod.ts.template',
  'docs/architecture.md.template',
  'tests/_fixtures/readme-examples_test.ts.template',
] = [
  'README.md.template',
  'deno.json.template',
  'mod.ts.template',
  'src/public/mod.ts.template',
  'src/cli/{{plugin-name}}-cli.ts.template',
  'src/cli/composition/main.ts.template',
  'src/aspire/{{plugin-name}}-contribution.ts.template',
  'src/aspire/mod.ts.template',
  'src/e2e/mod.ts.template',
  'src/scaffolding/mod.ts.template',
  'src/testing/mod.ts.template',
  'docs/architecture.md.template',
  'tests/_fixtures/readme-examples_test.ts.template',
];

/** Plugin skeleton template path. */
export type PluginSkeletonTemplatePath = typeof PLUGIN_SKELETON_TEMPLATES[number];
