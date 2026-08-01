/**
 * @module infra/templates/app/generate-app-tsconfig
 *
 * Tier 1 generator for the Fresh/Vite application's TypeScript project boundary.
 */

/** Generates the app-local Vite/Fresh TypeScript transform configuration. */
export function generateAppTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        allowImportingTsExtensions: true,
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        noEmit: true,
      },
      files: [],
    },
    null,
    2,
  ) + '\n';
}
