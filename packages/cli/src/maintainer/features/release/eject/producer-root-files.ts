import { join } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { LOCKSTEP_VERSION } from './release-eject-constants.ts';

const ROOT_WORKSPACE = [
  'packages/*',
  'packages/cli/e2e',
  'plugins/*',
  'examples/*',
  'apps/*',
] as const;

const PRODUCER_TASKS = {
  check: 'deno check --unstable-kv ./packages ./plugins',
  test: 'deno test --allow-all',
  'publish:dry-run': 'deno publish --dry-run --allow-dirty',
  'e2e:cli': 'deno run --allow-all packages/cli/e2e/cli.ts',
  fmt: 'deno fmt',
  lint: 'deno lint',
  'arch:check': 'deno run --allow-read tools/fitness/check-doctrine.ts',
} as const;

interface DenoJson {
  version?: string;
  publish?: unknown;
  workspace?: unknown;
  tasks?: unknown;
  imports?: Record<string, string>;
  compilerOptions?: Record<string, unknown>;
  lint?: Record<string, unknown>;
  fmt?: unknown;
  unstable?: unknown;
}

export async function writeProducerRootFiles(
  targetPath: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const files = new Map<string, string>([
    ['deno.json', JSON.stringify(producerDenoJson(), null, 2) + '\n'],
    ['LICENSE', mitLicense()],
    ['README.md', readme()],
    ['CONTRIBUTING.md', contributing()],
    ['SECURITY.md', security()],
    ['CODE_OF_CONDUCT.md', codeOfConduct()],
    ['AGENTS.md', agents()],
    ['.gitignore', gitignore()],
    ['.gitleaks.toml', gitleaksConfig()],
  ]);

  const written: string[] = [];
  for (const [path, content] of files) {
    const fullPath = join(targetPath, path);
    await fs.writeFile(fullPath, content);
    written.push(fullPath);
  }
  written.push(...await resetNestedWorkspaceMembers(targetPath, fs));
  return written;
}

export async function resetMemberVersions(
  targetPath: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const written: string[] = [];
  for (const root of ['packages', 'plugins']) {
    const rootPath = join(targetPath, root);
    if (!await fs.exists(rootPath)) continue;
    for (const entry of await fs.readDir(rootPath)) {
      if (!entry.isDirectory || entry.name.startsWith('.')) continue;
      const denoJsonPath = join(rootPath, entry.name, 'deno.json');
      if (!await fs.exists(denoJsonPath)) continue;
      const json = JSON.parse(await fs.readFile(denoJsonPath)) as DenoJson;
      json.version = LOCKSTEP_VERSION;
      await fs.writeFile(denoJsonPath, JSON.stringify(json, null, 2) + '\n');
      written.push(denoJsonPath);
    }
  }
  return written;
}

export async function removeScaffoldOnlyRoots(
  targetPath: string,
  fs: FileSystemPort,
): Promise<void> {
  for (
    const root of [
      '.netscript',
      'config',
      'sagas',
      'triggers',
      'workers',
      'background',
      'contracts',
      'services',
      'database',
      'dotnet',
      'aspire',
      'tasks',
    ]
  ) {
    const path = join(targetPath, root);
    if (await fs.exists(path)) {
      await fs.remove(path);
    }
  }
}

export async function markExamplesNonPublishable(
  targetPath: string,
  fs: FileSystemPort,
): Promise<void> {
  const examplesRoot = join(targetPath, 'examples');
  if (!await fs.exists(examplesRoot)) return;
  for (const entry of await fs.readDir(examplesRoot)) {
    if (!entry.isDirectory || entry.name.startsWith('.')) continue;
    const denoJsonPath = join(examplesRoot, entry.name, 'deno.json');
    if (!await fs.exists(denoJsonPath)) continue;
    const json = JSON.parse(await fs.readFile(denoJsonPath)) as DenoJson;
    json.publish = false;
    await fs.writeFile(denoJsonPath, JSON.stringify(json, null, 2) + '\n');
  }
}

async function resetNestedWorkspaceMembers(
  targetPath: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const members = [join('packages', 'cli', 'e2e')];
  const written: string[] = [];
  for (const member of members) {
    const denoJsonPath = join(targetPath, member, 'deno.json');
    if (!await fs.exists(denoJsonPath)) continue;
    const json = JSON.parse(await fs.readFile(denoJsonPath)) as DenoJson;
    json.version = LOCKSTEP_VERSION;
    json.publish = false;
    await fs.writeFile(denoJsonPath, JSON.stringify(json, null, 2) + '\n');
    written.push(denoJsonPath);
  }
  return written;
}

function producerDenoJson(): DenoJson {
  return {
    version: LOCKSTEP_VERSION,
    workspace: [...ROOT_WORKSPACE],
    unstable: ['kv', 'temporal', 'tsgo', 'worker-options', 'raw-imports'],
    tasks: PRODUCER_TASKS,
    imports: {},
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      isolatedDeclarations: true,
      lib: ['dom', 'deno.ns', 'deno.unstable'],
    },
    lint: {
      rules: {
        tags: ['recommended', 'jsr'],
        include: ['no-process-global', 'no-node-globals'],
      },
    },
    fmt: {
      useTabs: false,
      lineWidth: 100,
      indentWidth: 2,
      semiColons: true,
      singleQuote: true,
    },
    publish: false,
  };
}

function mitLicense(): string {
  return [
    'MIT License',
    '',
    'Copyright (c) 2026 RickyLabs',
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction, including without limitation the rights',
    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
    'copies of the Software, and to permit persons to whom the Software is',
    'furnished to do so, subject to the following conditions:',
    '',
    'The above copyright notice and this permission notice shall be included in all',
    'copies or substantial portions of the Software.',
    '',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
    'SOFTWARE.',
    '',
  ].join('\n');
}

function readme(): string {
  return `# NetScript

NetScript is a Deno-first framework workspace for contracts, services, plugins,
background processing, Fresh applications, and Aspire orchestration.

This repository is the public producer workspace for the \`@netscript/*\`
packages and first-party plugins. Package sources live under \`packages/\` and
plugin sources live under \`plugins/\`.
`;
}

function contributing(): string {
  return `# Contributing

Use the harness workflow in \`.llm/harness/\` for substantial changes. Package
and plugin work follows the Architecture Doctrine under \`docs/architecture/\`
once Group B carries the governance payload.

Before opening a PR, run the narrowest affected \`deno task check\`, then run
\`deno task fmt\` and \`deno task lint\` for changed files.
`;
}

function security(): string {
  return `# Security

Do not open public issues for active vulnerabilities. Send a private report to
the repository maintainers with reproduction steps, affected versions, and any
available mitigation.
`;
}

function codeOfConduct(): string {
  return `# Code of Conduct

Be direct, respectful, and technical. Keep review focused on the code, the
architecture doctrine, and the public framework quality bar.
`;
}

function agents(): string {
  return `# AGENTS.md

Use \`.llm/harness/\` for harnessed work. Use \`.agents/skills/netscript-doctrine\`
for package and plugin architecture decisions, and follow \`.agents/rules/*.mdc\`
where present.
`;
}

function gitignore(): string {
  return `node_modules/
coverage/
.env
.env.*
.deno/
dist/
`;
}

function gitleaksConfig(): string {
  return `[allowlist]
description = "NetScript test fixture identifiers"
regexes = [
  '''compensating-1'''
]
`;
}
