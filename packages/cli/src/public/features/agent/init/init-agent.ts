import { basename, join } from '@std/path';
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
import type { AgentDocsGenerator } from './agent-docs-generator.ts';
import type { AgentInitFileSystem } from './agent-init-file-system.ts';
import { ASPIRE_WORKFLOW_SKILLS, type AspireAgentInitializer } from './aspire-agent-initializer.ts';
import type { InitAgentInput, InitAgentResult } from './init-agent-input.ts';
import {
  AGENT_PROJECT_MARKERS,
  type AgentEnvironment,
  type AgentProjectMarker,
  resolveAgentInit,
} from './hosts/agent-host-resolution.ts';
import {
  OPENCODE_CONFIG_FILE,
  OPENCODE_JSONC_CONFIG_FILE,
  type OpenCodeConfigWrite,
  planOpenCodeConfig,
} from './hosts/opencode-config.ts';
import { mergeClaudeGuidance } from './hosts/claude-guidance.ts';

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
  /** Invoking-environment snapshot used to detect the host; empty when omitted. */
  readonly environment?: AgentEnvironment;
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
  const resolution = resolveAgentInit(
    input,
    await findProjectMarkers(input.projectRoot, dependencies.fs),
    dependencies.environment ?? {},
  );
  const editor = resolution.editor.value;
  const hosts = resolution.hosts.value;
  const openCodeWrites = hosts.includes('opencode')
    ? await readOpenCodeConfigPlan(
      input.projectRoot,
      dependencies.fs,
      [
        'deno',
        ...netscriptMcpArgs(
          input.projectRoot,
          dependencies.cliSpecifier ?? netscriptJsrSpecifier('cli'),
          installedDocsRoot,
        ),
      ],
    )
    : [];
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
    const skillNames = [
      ...new Set([
        ...(skillManifest.files ?? []).filter((path) => path.endsWith('/SKILL.md')).map(
          (path) => path.split('/')[0],
        ),
        ...ASPIRE_WORKFLOW_SKILLS,
      ]),
    ];
    messages.push(
      ...await legacyClaudeSkillWarnings(input.projectRoot, skillNames, dependencies.fs),
    );
    await writeHostConfig(
      dependencies.fs,
      join(input.projectRoot, '.mcp.json'),
      'mcpServers',
      input.projectRoot,
      changedFiles,
      dependencies.cliSpecifier,
      installedDocsRoot,
    );
    await writeChanged(
      dependencies.fs,
      join(input.projectRoot, '.claude', 'skills', 'repo-skills', 'SKILL.md'),
      EMBEDDED_TEMPLATE_CONTENT[TEMPLATE_KEYS.agentClaudeSkillBridge].replace(
        '{{PROJECT_NAME}}',
        () => basename(input.projectRoot),
      ).replace('{{SKILL_NAMES}}', () => skillNames.join(', ')),
      changedFiles,
    );
    const claudePath = join(input.projectRoot, 'CLAUDE.md');
    await writeChanged(
      dependencies.fs,
      claudePath,
      mergeClaudeGuidance(
        await dependencies.fs.readText(claudePath) ?? '',
        EMBEDDED_TEMPLATE_CONTENT[TEMPLATE_KEYS.agentClaudeGuidance],
      ),
      changedFiles,
    );
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
  for (const write of openCodeWrites) {
    await writeChanged(dependencies.fs, write.path, write.content, changedFiles);
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
  return { hosts, resolution, changedFiles, messages };
}

async function legacyClaudeSkillWarnings(
  projectRoot: string,
  skillNames: readonly string[],
  fs: AgentInitFileSystem,
): Promise<string[]> {
  const present = await Promise.all(
    skillNames.map((name) => fs.exists(join(projectRoot, '.claude', 'skills', name))),
  );
  return skillNames.filter((_, index) => present[index]).map((name) =>
    `Legacy .claude/skills/${name} is no longer refreshed; use the canonical .agents/skills/${name} through repo-skills. The legacy directory was preserved.`
  );
}

async function hasAspireWorkflowSkills(
  projectRoot: string,
  fs: AgentInitFileSystem,
): Promise<boolean> {
  for (const skill of ASPIRE_WORKFLOW_SKILLS) {
    if (!await fs.exists(join(projectRoot, '.agents', 'skills', skill, 'SKILL.md'))) return false;
  }
  return true;
}

/** Read both OpenCode config files and plan their writes before any project file is touched. */
async function readOpenCodeConfigPlan(
  projectRoot: string,
  fs: AgentInitFileSystem,
  netscriptCommand: readonly string[],
): Promise<readonly OpenCodeConfigWrite[]> {
  const read = async (name: string) => {
    const path = join(projectRoot, name);
    return { path, text: await fs.readText(path) };
  };
  return planOpenCodeConfig(
    await read(OPENCODE_CONFIG_FILE),
    await read(OPENCODE_JSONC_CONFIG_FILE),
    netscriptCommand,
  );
}

async function findProjectMarkers(
  projectRoot: string,
  fs: AgentInitFileSystem,
): Promise<ReadonlySet<AgentProjectMarker>> {
  const present = await Promise.all(
    AGENT_PROJECT_MARKERS.map((marker) => fs.exists(join(projectRoot, marker))),
  );
  return new Set(AGENT_PROJECT_MARKERS.filter((_, index) => present[index]));
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
