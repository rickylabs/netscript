import { join } from "@std/path";
import {
  EMBEDDED_SKILL_BUNDLE_HASH,
  EMBEDDED_SKILL_FILES,
} from "../../../../kernel/assets/skills.generated.ts";
import { netscriptJsrSpecifier } from "../../../../kernel/constants/jsr-specifiers.ts";
import type { AgentInitFileSystem } from "./agent-init-file-system.ts";
import {
  type AgentHost,
  type InitAgentInput,
  type InitAgentResult,
} from "./init-agent-input.ts";

const START_MARKER = "<!-- netscript-agent:start -->";
const END_MARKER = "<!-- netscript-agent:end -->";
const AGENTS_SECTION =
  `${START_MARKER}\n## NetScript agent tooling\n\nUse the installed NetScript skills and MCP server for framework-aware build, diagnostics, and operations.\n${END_MARKER}`;

/** Embedded skill bundle accepted by the installer and its integrity test seam. */
export interface AgentSkillBundle {
  readonly files: Readonly<Record<string, string>>;
  readonly hash: string;
}

/** Dependencies for the agent installer use case. */
export interface InitAgentDependencies {
  readonly fs: AgentInitFileSystem;
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
  return { hosts, changedFiles };
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
        },
      },
      null,
      2,
    )
  }\n`;
  await writeChanged(fs, path, content, changed);
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
