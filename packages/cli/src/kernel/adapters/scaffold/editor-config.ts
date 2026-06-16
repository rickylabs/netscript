/**
 * @module infra/scaffold/editor-config
 *
 * Generates optional editor-specific workspace config files for scaffolded
 * projects. These files stay root-local and generic so a fresh scaffold is
 * immediately usable in the chosen editor without repo-specific assumptions.
 */

import type { EditorChoice } from '../../domain/scaffold/workspace-config.ts';

const DENO_CONFIG_SCHEMA_SOURCE = new URL(
  '../../../../assets/schema/config-file.v1.json',
  import.meta.url,
);
const DENO_CONFIG_SCHEMA_TARGET = '.netscript/schema/config-file.v1.json';
const DENO_CONFIG_SCHEMA_CONTENT = Deno.readTextFileSync(DENO_CONFIG_SCHEMA_SOURCE);

/** A single editor config file to be written relative to the workspace root. */
export interface EditorConfigFile {
  /** Root-relative path such as `.zed/settings.json`. */
  readonly path: string;
  /** Serialized file contents. */
  readonly content: string;
}

function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function createDenoConfigSchemaFile(): EditorConfigFile {
  return {
    path: DENO_CONFIG_SCHEMA_TARGET,
    content: DENO_CONFIG_SCHEMA_CONTENT.endsWith('\n')
      ? DENO_CONFIG_SCHEMA_CONTENT
      : `${DENO_CONFIG_SCHEMA_CONTENT}\n`,
  };
}

function createZedSettings(): string {
  return formatJson({
    lsp: {
      deno: {
        settings: {
          deno: {
            enable: true,
            config: './deno.json',
            unstable: true,
          },
        },
      },
      'json-language-server': {
        settings: {
          json: {
            schemas: [
              {
                fileMatch: ['deno.json', 'deno.jsonc'],
                url: `./${DENO_CONFIG_SCHEMA_TARGET}`,
              },
              {
                fileMatch: ['package.json'],
                url: 'http://json.schemastore.org/package',
              },
            ],
          },
        },
      },
    },
    languages: {
      JavaScript: {
        language_servers: ['deno', '!typescript-language-server', '!vtsls', '!eslint'],
        formatter: 'language_server',
      },
      TypeScript: {
        language_servers: ['deno', '!typescript-language-server', '!vtsls', '!eslint'],
        formatter: 'language_server',
      },
      TSX: {
        language_servers: ['deno', '!typescript-language-server', '!vtsls', '!eslint'],
        formatter: 'language_server',
      },
    },
  });
}

function createZedDebug(): string {
  return formatJson([
    {
      adapter: 'JavaScript',
      label: 'Deno',
      request: 'launch',
      type: 'pwa-node',
      cwd: '$ZED_WORKTREE_ROOT',
      program: '$ZED_FILE',
      runtimeExecutable: 'deno',
      runtimeArgs: ['run', '--allow-all', '--inspect-wait', '--unstable-kv'],
      attachSimplePort: 9229,
    },
  ]);
}

function createZedTasks(): string {
  return formatJson([
    {
      label: 'deno test',
      command: "deno test -A --filter '/^$ZED_CUSTOM_DENO_TEST_NAME$/' '$ZED_FILE'",
      tags: ['js-test'],
    },
  ]);
}

function createVsCodeSettings(): string {
  return formatJson({
    'deno.enable': true,
    'deno.unstable': true,
    'deno.config': './deno.json',
    'editor.defaultFormatter': 'denoland.vscode-deno',
    '[javascript]': {
      'editor.defaultFormatter': 'denoland.vscode-deno',
    },
    '[typescript]': {
      'editor.defaultFormatter': 'denoland.vscode-deno',
    },
    '[typescriptreact]': {
      'editor.defaultFormatter': 'denoland.vscode-deno',
    },
    'json.schemas': [
      {
        fileMatch: ['deno.json', 'deno.jsonc'],
        url: `./${DENO_CONFIG_SCHEMA_TARGET}`,
      },
    ],
  });
}

function createVsCodeExtensions(): string {
  return formatJson({
    recommendations: [
      'denoland.vscode-deno',
      'ms-dotnettools.csdevkit',
    ],
  });
}

function createVsCodeLaunch(): string {
  return formatJson({
    version: '0.2.0',
    configurations: [
      {
        name: 'Deno: Current File',
        type: 'pwa-node',
        request: 'launch',
        cwd: '${workspaceFolder}',
        program: '${file}',
        runtimeExecutable: 'deno',
        runtimeArgs: ['run', '--allow-all', '--unstable-kv', '--inspect-wait'],
        attachSimplePort: 9229,
      },
    ],
  });
}

function createVsCodeTasks(): string {
  return formatJson({
    version: '2.0.0',
    tasks: [
      {
        label: 'deno: check apps',
        type: 'shell',
        command: 'deno task check:apps',
        problemMatcher: [],
        group: 'build',
      },
      {
        label: 'deno: test',
        type: 'shell',
        command: 'deno task test',
        problemMatcher: [],
        group: 'test',
      },
    ],
  });
}

/**
 * Return the root-level editor config files for a scaffolded workspace.
 *
 * The returned files are always safe to check in: no absolute paths, no repo
 * checkout assumptions, and no secrets or environment-specific MCP config.
 */
export function generateEditorConfigFiles(editor: EditorChoice): EditorConfigFile[] {
  switch (editor) {
    case 'zed':
      return [
        createDenoConfigSchemaFile(),
        { path: '.zed/settings.json', content: createZedSettings() },
        { path: '.zed/debug.json', content: createZedDebug() },
        { path: '.zed/tasks.json', content: createZedTasks() },
      ];
    case 'vscode':
      return [
        createDenoConfigSchemaFile(),
        { path: '.vscode/settings.json', content: createVsCodeSettings() },
        { path: '.vscode/extensions.json', content: createVsCodeExtensions() },
        { path: '.vscode/launch.json', content: createVsCodeLaunch() },
        { path: '.vscode/tasks.json', content: createVsCodeTasks() },
      ];
    case 'none':
    default:
      return [];
  }
}
