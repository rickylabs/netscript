use harness

## SKILL

Run under `netscript-harness` + `netscript-doctrine` + `netscript-cli` + `netscript-tools`. Read
`AGENTS.md` and the doctrine before changing framework code. If a skill is not mirrored into
`.claude/skills/`, read `.agents/skills/<name>/SKILL.md` directly.

You are a **Tier-D implementation lane**. You do not self-certify. Commit and push your branch; do
**not** open a PR and do **not** merge.

# Slice brief — F4: `netscript agent init` writes an MCP config that cannot resolve

**Worktree:** `/home/codex/repos/b10-715-f4`
**Branch:** `fix/715-f4-pin-agent-specifiers` (base: `feat/netscript-mcp-skills` @ `d81bb2bd`)
**Source:** IMPL-EVAL finding **F4** on PR #715 (opposite-family Codex evaluator).

## The bug (already root-caused — do not re-derive)

This is the **same defect class as #763**, in two more places. A bare `jsr:@netscript/cli` specifier
carries no version constraint, so Deno resolves it as `*` — and **semver `*` does not match
pre-release versions**. Every `@netscript/*` package is on a `0.0.1-beta.x` pre-release line, so JSR
reports `latest: null` and resolution **fails outright**:

```text
error: Could not find version of '@netscript/cli' that matches specified version constraint '*'
```

Two unversioned specifiers ship today:

1. **`packages/cli/src/public/features/agent/init/init-agent.ts`** (~lines 117–123) — `netscript
   agent init` writes the MCP host config with
   `args: ['run', '-A', 'jsr:@netscript/cli', 'agent', 'mcp', …]`. **The `.mcp.json` /
   `.vscode/mcp.json` it generates is therefore broken as written** on the current pre-release line.
   This is the headline user-facing consequence: the flagship "install the agent tooling" command
   emits a config that cannot start.

2. **`packages/mcp/src/infrastructure/spawn-command-executor.ts`** (~lines 7–13) —
   `DEFAULT_CLI_COMMAND = ['deno', 'run', '-A', 'jsr:@netscript/cli']`, the default executor behind
   the MCP `execute_command` tool. Same failure.

Verify in one command before changing anything:

```bash
deno run -A jsr:@netscript/cli --version    # reproduces the resolution error
```

## Prior art — reuse it, do not reinvent

The #763 slice (branch `fix/763-pin-plugin-cli-specifier`, commit `40ecc87c`, **not** on this base)
fixed the sibling case in `resolvePluginCliSpecifier` by pinning unpinned `@netscript/*` specs to
`NETSCRIPT_RELEASE_VERSION`, imported from the CLI's own `deno.json`
(`packages/cli/src/kernel/constants/jsr-specifiers.ts`). Follow that pattern. **Do not invent a
second version source.**

## Scope

1. **`packages/cli` — `init-agent.ts`.** Pin the specifier it writes into host config, from the same
   `NETSCRIPT_RELEASE_VERSION` source of truth.

2. **`packages/mcp` — `spawn-command-executor.ts`.** Pin `DEFAULT_CLI_COMMAND`.

   **Layering constraint — this is the part to get right.** `packages/mcp` must **NOT** import from
   `packages/cli`. `mcp` is the inner package; `cli` composes it (that is exactly why `@netscript/mcp`
   can expose `list_commands`/`execute_command` without depending on the CLI — see the ports design
   in `packages/mcp/README.md`). Importing `cli` here would invert the dependency and break Archetype
   6 layering.

   Two acceptable options — pick one and **justify it in your report**:
   - accept the CLI version through the existing `McpCliOptions` composition seam, which
     `packages/cli` already fills at its composition root (`createMcpCliServer`), keeping the default
     as a fallback; or
   - read `@netscript/mcp`'s own `deno.json` version (packages are lockstep-versioned, so it equals
     the CLI's).

   Say which you chose and why. If you believe both are wrong, say so rather than inverting the
   dependency.

3. **Extend the version-drift guard.** The #763 guard test
   (`no version-less NetScript JSR specifiers in CLI command sources`) does **not** cover these two
   files — that is why they survived. Extend it (or add an equivalent in `packages/mcp`) so **every**
   `jsr:@netscript/*` specifier the framework emits or spawns must carry a version. The guard is what
   makes this class non-recurring; a fix without it will simply regress in a third place.

4. **Test the generated config.** `init-agent`'s existing tests should assert the written
   `.mcp.json` / `.vscode/mcp.json` args contain a **versioned** specifier — not just that the file
   exists.

## Boundaries

- Do **not** touch `.llm/tools/**`, the lint/fmt wrappers, or `deno.lock` (they were just corrected
  on this branch; you will conflict).
- Do **not** touch `plugins/dashboard`, `tools/design-sync/`, or any dashboard/DDX issue.
- Do **not** modify `packages/mcp/tests/fixtures/**` (intentionally malformed; excluded from
  lint/fmt selections by design).
- Do not weaken types to make this compile — no `as any` / `as unknown as` / `@ts-ignore`.

## Gates (run before you report)

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --root packages/mcp --ext ts,tsx
deno task lint
deno task fmt:check
cd packages/cli && deno test --allow-all
cd packages/mcp && deno test --allow-env --allow-net --allow-run --allow-read tests/
deno task quality:scan
deno task arch:check
```

`arch:check` matters here — it is what would catch an mcp→cli dependency inversion.

## Report back

Commit, push the branch, and report: which composition option you chose for `packages/mcp` and why;
the exact specifier now written by `agent init`; how the guard test was extended; gate verdicts; and
anything that contradicts this brief. Do **not** open a PR, do **not** merge, do **not**
self-certify.
