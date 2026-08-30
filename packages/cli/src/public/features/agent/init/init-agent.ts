import { join } from '@std/path';
import {
  EMBEDDED_SKILL_BUNDLE_HASH,
  EMBEDDED_SKILL_FILES,
} from '../../../../kernel/assets/skills.generated.ts';
import { EMBEDDED_TEMPLATE_CONTENT } from '../../../../kernel/assets/embedded.generated.ts';
import { TEMPLATE_KEYS } from '../../../../kernel/assets/manifest.ts';
import {
  EMBEDDED_AGENT_TOOL_BUNDLE_HASH,
  EMBEDDED_AGENT_TOOL_FILES,
  EMBEDDED_AGENT_TOOL_PATHS,
} from '../../../../kernel/assets/agent-tools.generated.ts';
import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import { generateEditorConfigFiles } from '../../../../kernel/adapters/scaffold/editor-config.ts';
import type { EditorChoice } from '../../../../kernel/domain/scaffold/workspace-config.ts';
import type { AgentDocsGenerator } from './agent-docs-generator.ts';
import type { AgentInitFileSystem } from './agent-init-file-system.ts';
import { ASPIRE_WORKFLOW_SKILLS, type AspireAgentInitializer } from './aspire-agent-initializer.ts';
import type { AgentHost, InitAgentInput, InitAgentResult } from './init-agent-input.ts';

const START_MARKER = '<!-- netscript-agent:start -->';
const END_MARKER = '<!-- netscript-agent:end -->';
function agentsSection(withDocs: boolean): string {
  const docs = withDocs
    ? ' Offline framework and exact-version API docs are installed; start at `.netscript/docs/llms.txt`.'
    : ' Need offline framework or API guidance? Run `netscript agent init --with-docs`.';
  return EMBEDDED_TEMPLATE_CONTENT[TEMPLATE_KEYS.agentGuidance].replace(
    '{{OFFLINE_DOCS_GUIDANCE}}',
    docs,
  ).trimEnd();
}
const ASPIRE_INIT_TIMEOUT_MS = 60_000;

/** Embedded skill bundle accepted by the installer and its integrity test seam. */
export interface AgentSkillBundle {
  readonly files: Readonly<Record<string, string>>;
  readonly hash: string;
}

/** Embedded project tool bundle accepted by the installer and its integrity test seam. */
export interface AgentToolBundle extends AgentSkillBundle {
  readonly paths: readonly string[];
}

/** Dependencies for the agent installer use case. */
export interface InitAgentDependencies {
  readonly fs: AgentInitFileSystem;
  readonly aspireAgentInitializer: AspireAgentInitializer;
  readonly aspireTimeoutMs?: number;
  readonly bundle?: AgentSkillBundle;
  readonly toolBundle?: AgentToolBundle;
  readonly docsGenerator?: AgentDocsGenerator;
  /** Exact CLI specifier override used by migration fixtures. */
  readonly cliSpecifier?: string;
}

/** Install MCP host configuration and canonical agent skills without rewriting unchanged files. */
export async function initAgent(
  input: InitAgentInput,
  dependencies: InitAgentDependencies,
): Promise<InitAgentResult> {
  const bundle = dependencies.bundle ?? {
    files: EMBEDDED_SKILL_FILES,
    hash: EMBEDDED_SKILL_BUNDLE_HASH,
  };
  const skillManifest = JSON.parse(bundle.files['manifest.json'] ?? '{}') as {
    readonly files?: readonly string[];
  };
  await verifyBundle(bundle, skillManifest.files ?? [], 'Skill');
  const toolBundle = dependencies.toolBundle ?? {
    files: EMBEDDED_AGENT_TOOL_FILES,
    paths: EMBEDDED_AGENT_TOOL_PATHS,
    hash: EMBEDDED_AGENT_TOOL_BUNDLE_HASH,
  };
  await verifyBundle(toolBundle, toolBundle.paths, 'Agent tool');
  const docs = input.withDocs
    ? await dependencies.docsGenerator?.generate(input.projectRoot)
    : undefined;
  if (input.withDocs && !docs) {
    throw new Error('Offline documentation generation is not configured');
  }
  const installedDocsRoot = docs ? join(input.projectRoot, '.netscript', 'docs') : undefined;
  const editor = await resolveEditor(input, dependencies.fs);
  const hosts = await resolveHosts(input, dependencies.fs, editor);
  const changedFiles: string[] = [];
  const messages: string[] = [];
  for (const path of toolBundle.paths) {
    await writeChanged(
      dependencies.fs,
      join(input.projectRoot, '.llm', 'tools', path),
      toolBundle.files[path] ?? '',
      changedFiles,
    );
  }
  for (const [path, content] of Object.entries(docs?.files ?? {})) {
    if (path.startsWith('/') || path.split('/').includes('..')) {
      throw new Error(`Offline documentation bundle contains unsafe path: ${path}`);
    }
    await writeChanged(
      dependencies.fs,
      join(input.projectRoot, '.netscript', 'docs', path),
      content,
      changedFiles,
    );
  }
  for (const file of generateEditorConfigFiles(editor)) {
    if (file.path === '.zed/settings.json') continue;
    await writeChanged(
      dependencies.fs,
      join(input.projectRoot, file.path),
      file.content,
      changedFiles,
    );
  }
  const skillFiles = Object.entries(bundle.files).filter(
    ([path]) => path !== 'manifest.json',
  );
  for (const [path, content] of skillFiles) {
    await writeChanged(
      dependencies.fs,
      join(input.projectRoot, '.agents', 'skills', path),
      content,
      changedFiles,
    );
  }
  const agentsPath = join(input.projectRoot, 'AGENTS.md');
  const currentAgents = await dependencies.fs.readText(agentsPath) ?? '';
  await writeChanged(
    dependencies.fs,
    agentsPath,
    upsertMarkedSection(currentAgents, input.withDocs === true),
    changedFiles,
  );
  if (hosts.includes('claude')) {
    await writeHostConfig(
      dependencies.fs,
      join(input.projectRoot, '.mcp.json'),
      'mcpServers',
      input.projectRoot,
      changedFiles,
      dependencies.cliSpecifier,
      installedDocsRoot,
    );
    for (const [path] of skillFiles) {
      const canonicalPath = join(input.projectRoot, '.agents', 'skills', path);
      const content = await dependencies.fs.readText(canonicalPath);
      if (content == null) {
        throw new Error(`Canonical skill was not installed: ${canonicalPath}`);
      }
      await writeChanged(
        dependencies.fs,
        join(input.projectRoot, '.claude', 'skills', path),
        content,
        changedFiles,
      );
    }
  }
  if (editor === 'vscode') {
    await writeHostConfig(
      dependencies.fs,
      join(input.projectRoot, '.vscode', 'mcp.json'),
      'servers',
      input.projectRoot,
      changedFiles,
      dependencies.cliSpecifier,
      installedDocsRoot,
    );
  }
  if (editor === 'zed') {
    await writeZedConfig(
      dependencies.fs,
      input.projectRoot,
      changedFiles,
      dependencies.cliSpecifier,
      installedDocsRoot,
    );
  }
  if (
    hosts.includes('claude') &&
    !await hasAspireWorkflowSkills(input.projectRoot, dependencies.fs)
  ) {
    const signal = AbortSignal.timeout(
      dependencies.aspireTimeoutMs ?? ASPIRE_INIT_TIMEOUT_MS,
    );
    try {
      const result = await dependencies.aspireAgentInitializer.initialize(
        input.projectRoot,
        signal,
      );
      if (!result.ok) messages.push(aspireSkipped(result.reason));
    } catch (error) {
      const reason = signal.aborted
        ? 'aspire agent init timed out'
        : error instanceof Error
        ? error.message
        : String(error);
      messages.push(aspireSkipped(reason));
    }
  }
  if (docs) {
    messages.push(
      `Installed offline NetScript ${docs.frameworkVersion} documentation at .netscript/docs (${docs.proseFileCount} prose files, ${docs.apiPackageCount} API packages / ${docs.apiExportCount} export subpaths).`,
    );
  }
  return { hosts, changedFiles, messages };
}

async function hasAspireWorkflowSkills(
  projectRoot: string,
  fs: AgentInitFileSystem,
): Promise<boolean> {
  for (const skill of ASPIRE_WORKFLOW_SKILLS) {
    if (!await fs.exists(join(projectRoot, '.agents', 'skills', skill, 'SKILL.md'))) return false;
    if (!await fs.exists(join(projectRoot, '.claude', 'skills', skill, 'SKILL.md'))) return false;
  }
  return true;
}

async function resolveEditor(
  input: InitAgentInput,
  fs: AgentInitFileSystem,
): Promise<EditorChoice> {
  if (input.editor) return input.editor;
  if (input.host === 'vscode' || input.host === 'all') return 'vscode';
  const hasZed = await fs.exists(join(input.projectRoot, '.zed'));
  const hasVsCode = await fs.exists(join(input.projectRoot, '.vscode'));
  if (hasZed && hasVsCode) {
    throw new Error(
      'Both .zed and .vscode exist; pass --editor zed, --editor vscode, or --editor none.',
    );
  }
  if (hasZed) return 'zed';
  if (hasVsCode) return 'vscode';
  return 'none';
}

async function resolveHosts(
  input: InitAgentInput,
  fs: AgentInitFileSystem,
  editor: EditorChoice,
): Promise<readonly AgentHost[]> {
  if (input.host === 'all') return ['claude', 'vscode'];
  if (input.host) return [input.host];
  const detected: AgentHost[] = [];
  if (await fs.exists(join(input.projectRoot, '.claude'))) {
    detected.push('claude');
  }
  if (editor === 'vscode') {
    detected.push('vscode');
  }
  return detected.length > 0 ? detected : ['claude'];
}

async function writeHostConfig(
  fs: AgentInitFileSystem,
  path: string,
  key: 'mcpServers' | 'servers',
  projectRoot: string,
  changed: string[],
  cliSpecifier = netscriptJsrSpecifier('cli'),
  docsRoot?: string,
): Promise<void> {
  const currentText = await fs.readText(path);
  const current = currentText ? JSON.parse(currentText) as Record<string, unknown> : {};
  const existing = current[key] && typeof current[key] === 'object'
    ? current[key] as Record<string, unknown>
    : {};
  const content = `${
    JSON.stringify(
      {
        ...current,
        [key]: {
          ...existing,
          netscript: {
            command: 'deno',
            args: netscriptMcpArgs(projectRoot, cliSpecifier, docsRoot),
          },
          aspire: {
            command: 'aspire',
            args: ['agent', 'mcp'],
          },
        },
      },
      null,
      2,
    )
  }\n`;
  await writeChanged(fs, path, content, changed);
}

async function writeZedConfig(
  fs: AgentInitFileSystem,
  projectRoot: string,
  changed: string[],
  cliSpecifier = netscriptJsrSpecifier('cli'),
  docsRoot?: string,
): Promise<void> {
  const path = join(projectRoot, '.zed', 'settings.json');
  const generated = JSON.parse(
    generateEditorConfigFiles('zed').find((file) => file.path === '.zed/settings.json')?.content ??
      '{}',
  ) as Record<string, unknown>;
  const currentText = await fs.readText(path);
  const current = currentText ? JSON.parse(currentText) as Record<string, unknown> : {};
  const contextServers = current.context_servers && typeof current.context_servers === 'object'
    ? current.context_servers as Record<string, unknown>
    : {};
  const command = (name: 'netscript' | 'aspire') =>
    name === 'netscript'
      ? {
        command: 'deno',
        args: netscriptMcpArgs(projectRoot, cliSpecifier, docsRoot),
      }
      : { command: 'aspire', args: ['agent', 'mcp'] };
  const content = `${
    JSON.stringify(
      {
        ...generated,
        ...current,
        context_servers: {
          ...contextServers,
          netscript: command('netscript'),
          aspire: command('aspire'),
        },
      },
      null,
      2,
    )
  }\n`;
  await writeChanged(fs, path, content, changed);
}

function netscriptMcpArgs(
  projectRoot: string,
  cliSpecifier: string,
  docsRoot?: string,
): string[] {
  return [
    'run',
    '--no-lock',
    '--minimum-dependency-age=0',
    '--config',
    join(projectRoot, 'deno.json'),
    '-A',
    cliSpecifier,
    'agent',
    'mcp',
    '--project-root',
    projectRoot,
    ...(docsRoot ? ['--docs-root', docsRoot] : []),
  ];
}

function aspireSkipped(reason: string): string {
  return `Aspire agent wiring was skipped: ${reason.replace(/[.]+$/, '')}.`;
}

async function writeChanged(
  fs: AgentInitFileSystem,
  path: string,
  content: string,
  changed: string[],
): Promise<void> {
  if (await fs.readText(path) === content) return;
  await fs.writeText(path, content);
  changed.push(path);
}

function upsertMarkedSection(content: string, withDocs = false): string {
  const section = agentsSection(withDocs);
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start >= 0 && end >= start) {
    return `${content.slice(0, start)}${section}${content.slice(end + END_MARKER.length)}`;
  }
  const prefix = content.trimEnd();
  return `${prefix}${prefix ? '\n\n' : ''}${section}\n`;
}

async function verifyBundle(
  bundle: AgentSkillBundle,
  paths: readonly string[],
  label: string,
): Promise<void> {
  if (paths.length === 0) throw new Error(`${label} bundle manifest is missing or empty.`);
  const canonical = paths.map((path) => `${path}\0${bundle.files[path] ?? ''}`).join('\0');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical),
  );
  const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
  if (actual !== bundle.hash) {
    throw new Error(
      `${label} bundle hash mismatch: expected ${bundle.hash}, received ${actual}.`,
    );
  }
}
