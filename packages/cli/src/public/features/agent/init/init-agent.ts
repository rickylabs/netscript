import { join } from "@std/path";
import {
  EMBEDDED_SKILL_BUNDLE_HASH,
  EMBEDDED_SKILL_FILES,
} from "../../../../kernel/assets/skills.generated.ts";
import { netscriptJsrSpecifier } from "../../../../kernel/constants/jsr-specifiers.ts";
import type { AgentInitFileSystem } from "./agent-init-file-system.ts";
import type { AspireAgentInitializer } from "./aspire-agent-initializer.ts";
import {
  type AgentHost,
  type InitAgentInput,
  type InitAgentResult,
} from "./init-agent-input.ts";

const START_MARKER = "<!-- netscript-agent:start -->";
const END_MARKER = "<!-- netscript-agent:end -->";
const AGENTS_SECTION =
  `${START_MARKER}\n## NetScript agent tooling\n\nInstalled skills: \`netscript\`, \`netscript-build\`, \`netscript-operate\`, \`aspire\`, and \`deno\`. Search \`.claude/skills/help.md\` through MCP \`search_docs\` when something hangs, stays silent, is Healthy but does not respond, or leaves a dangling AppHost.\n\nUse MCP \`doctor\` for NetScript, Aspire, project-wiring, and plugin prerequisites. Use \`get_app_status\` and \`get_recent_errors\` for live telemetry symptoms; use the \`analyze_*\` tools and \`aspire otel logs|spans|traces\` for performance and database evidence. Route Deno runtime, type, permission, and module-resolution symptoms to the \`deno\` skill.\n\nDrift is gated, not suggested: \`netscript agent drift record\` and MCP \`record_drift\` refuse unless the same resource has a successful \`netscript plugin doctor --resource <name>\` or MCP diagnostic receipt from the last 15 minutes. Receipts live under \`.netscript/agent/diagnostics/\`; accepted entries append to \`.netscript/agent/drift.jsonl\`.\n${END_MARKER}`;
const ASPIRE_INIT_TIMEOUT_MS = 60_000;
const PLAYWRIGHT_SKILL_PATH = ".claude/skills/playwright-cli/SKILL.md";

/** Embedded skill bundle accepted by the installer and its integrity test seam. */
export interface AgentSkillBundle {
  readonly files: Readonly<Record<string, string>>;
  readonly hash: string;
}

/** Dependencies for the agent installer use case. */
export interface InitAgentDependencies {
  readonly fs: AgentInitFileSystem;
  readonly aspireAgentInitializer: AspireAgentInitializer;
  readonly aspireTimeoutMs?: number;
  readonly bundle?: AgentSkillBundle;
}

/** Install MCP host configuration and agent skills without rewriting unchanged files. */
export async function initAgent(
  input: InitAgentInput,
  dependencies: InitAgentDependencies,
): Promise<InitAgentResult> {
  const bundle = dependencies.bundle ?? {
    files: EMBEDDED_SKILL_FILES,
    hash: EMBEDDED_SKILL_BUNDLE_HASH,
  };
  await verifyBundle(bundle);
  const hosts = await resolveHosts(input, dependencies.fs);
  const changedFiles: string[] = [];
  const messages: string[] = [];
  if (hosts.includes("claude")) {
    await writeHostConfig(
      dependencies.fs,
      join(input.projectRoot, ".mcp.json"),
      "mcpServers",
      input.projectRoot,
      changedFiles,
    );
    for (const [path, content] of Object.entries(bundle.files)) {
      if (path === "manifest.json") continue;
      await writeChanged(
        dependencies.fs,
        join(input.projectRoot, ".claude", "skills", path),
        content,
        changedFiles,
      );
    }
    const agentsPath = join(input.projectRoot, "AGENTS.md");
    const current = await dependencies.fs.readText(agentsPath) ?? "";
    await writeChanged(
      dependencies.fs,
      agentsPath,
      upsertMarkedSection(current),
      changedFiles,
    );
  }
  if (hosts.includes("vscode")) {
    await writeHostConfig(
      dependencies.fs,
      join(input.projectRoot, ".vscode", "mcp.json"),
      "servers",
      input.projectRoot,
      changedFiles,
    );
  }
  if (
    hosts.includes("claude") &&
    !await dependencies.fs.exists(
      join(input.projectRoot, PLAYWRIGHT_SKILL_PATH),
    )
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
        ? "aspire agent init timed out"
        : error instanceof Error
        ? error.message
        : String(error);
      messages.push(aspireSkipped(reason));
    }
  }
  return { hosts, changedFiles, messages };
}

async function resolveHosts(
  input: InitAgentInput,
  fs: AgentInitFileSystem,
): Promise<readonly AgentHost[]> {
  if (input.host === "all") return ["claude", "vscode"];
  if (input.host) return [input.host];
  const detected: AgentHost[] = [];
  if (await fs.exists(join(input.projectRoot, ".claude"))) {
    detected.push("claude");
  }
  if (await fs.exists(join(input.projectRoot, ".vscode"))) {
    detected.push("vscode");
  }
  return detected.length > 0 ? detected : ["claude", "vscode"];
}

async function writeHostConfig(
  fs: AgentInitFileSystem,
  path: string,
  key: "mcpServers" | "servers",
  projectRoot: string,
  changed: string[],
): Promise<void> {
  const currentText = await fs.readText(path);
  const current = currentText
    ? JSON.parse(currentText) as Record<string, unknown>
    : {};
  const existing = current[key] && typeof current[key] === "object"
    ? current[key] as Record<string, unknown>
    : {};
  const content = `${
    JSON.stringify(
      {
        ...current,
        [key]: {
          ...existing,
          netscript: {
            command: "deno",
            args: [
              "run",
              "--config",
              join(projectRoot, "deno.json"),
              "-A",
              netscriptJsrSpecifier("cli"),
              "agent",
              "mcp",
              "--project-root",
              projectRoot,
            ],
          },
          aspire: {
            command: "aspire",
            args: ["agent", "mcp"],
          },
        },
      },
      null,
      2,
    )
  }\n`;
  await writeChanged(fs, path, content, changed);
}

function aspireSkipped(reason: string): string {
  return `Aspire agent wiring was skipped: ${reason.replace(/[.]+$/, "")}.`;
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

function upsertMarkedSection(content: string): string {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start >= 0 && end >= start) {
    return `${content.slice(0, start)}${AGENTS_SECTION}${
      content.slice(end + END_MARKER.length)
    }`;
  }
  const prefix = content.trimEnd();
  return `${prefix}${prefix ? "\n\n" : ""}${AGENTS_SECTION}\n`;
}

async function verifyBundle(bundle: AgentSkillBundle): Promise<void> {
  const manifestText = bundle.files["manifest.json"];
  if (!manifestText) throw new Error("Embedded skill manifest is missing.");
  const manifest = JSON.parse(manifestText) as {
    readonly files: readonly string[];
  };
  const canonical = manifest.files.map((path) =>
    `${path}\0${bundle.files[path] ?? ""}`
  ).join("\0");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  const actual = [...new Uint8Array(digest)].map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  if (actual !== bundle.hash) {
    throw new Error(
      `Skill bundle hash mismatch: expected ${bundle.hash}, received ${actual}.`,
    );
  }
}
