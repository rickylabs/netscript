use harness

## SKILL

Run under `netscript-harness` + `netscript-doctrine` + `netscript-cli` + `netscript-tools`. Read
`AGENTS.md` and the doctrine before changing framework code. If a skill is not mirrored into
`.claude/skills/`, read `.agents/skills/<name>/SKILL.md` directly.

You are a **Tier-D implementation lane**. You do not self-certify. Commit and push; do **not** open a
PR, do **not** merge.

# Slice brief — NF1: the MCP command policy allowlists verbs that do not exist

**Worktree:** `/home/codex/repos/b10-nf1`
**Branch:** `fix/715-nf1-mcp-command-policy` (base: `feat/netscript-mcp-skills` @ `6f5c3ebf`)
**Source:** IMPL-EVAL cycle-2 finding **NF1** on PR #715.

## The bug — installing a plugin through MCP does not work

`packages/mcp/src/domain/command-policy.ts` allowlists **`plugin add`** — a verb that **does not
exist** — and does **not** allowlist **`plugin install`**, the verb that does.

So this, through our own MCP server, is denied:

```ts
execute_command({ command: 'plugin', args: ['install', 'workers'] })  // -> default_deny
```

**Plugin installation via MCP is dead in the shipped policy.** That is a headline capability of the
beta.10 agentic combo. "Just run the CLI directly" is not a work-around for *an MCP tool whose entire
purpose is to run the CLI* — it is an admission the tool does not do its job.

## The audit is already done. NF1 was NOT alone.

**Do not fix only the verb the evaluator named.** I verified every allow rule against the shipped CLI
(`deno run -A bin/netscript.ts <verb> --help`). **Three of seventeen allow rules are phantoms:**

| Allow rule | Verdict |
| --- | --- |
| `allow_plugin_add` → `plugin add` | ✗ **PHANTOM** — real verb is `plugin install`, which is **not** allowlisted |
| `allow_service_status` → `service status` | ✗ **PHANTOM** — `service` has `add, list, ref, set, remove, add-handler, generate`; no `status` |
| `allow_ui` → `ui` | ✗ **PHANTOM** — there is no bare `ui` command; the verbs are top-level `ui:add`, `ui:init`, `ui:list`, `ui:update`, `ui:remove` |

Everything else checks out: `db init|generate|migrate|seed|status|introspect`, `generate`, `contract`,
`service list`, `plugin list|sync|doctor`, `ui:add`, `ui:init` all exist.

**Also a coverage gap:** `ui:list`, `ui:update`, `ui:remove` exist and are **not** allowlisted, while
only `ui:add` and `ui:init` are — yet the MCP README claims "and the `ui` verbs". Decide deliberately
whether the read-only/idempotent `ui:*` verbs should be allowed, and say what you chose and why. Do
not silently widen the policy; `execute_command` is a security boundary.

## Scope

1. **Fix the three phantom rules.** `allow_plugin_add` → `allow_plugin_install` (`plugin install`).
   Remove or correct `allow_service_status` and `allow_ui`. The CLI's framework verbs are
   `FRAMEWORK_VERBS` in `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts`
   (`install`, `remove`, `enable`, `disable`, `sync`, `setup`, `update`, `doctor`, `info`).

2. **The durable fix — a cross-check test.** Add a test asserting that **every verb in the MCP
   allowlist exists in the CLI's real command surface.** This is the whole point: make the *class* of
   defect structurally impossible, not the instance. Same shape as #769's specifier guard.

   **Layering:** `packages/mcp` must **NOT** import `packages/cli` — mcp is the inner package. But
   `packages/cli` already depends on `@netscript/mcp`, so the cross-check test belongs in
   **`packages/cli`**, importing `DEFAULT_COMMAND_POLICY` from `@netscript/mcp` and comparing it
   against the CLI's own command tree. Do not invert the dependency, and do not duplicate the verb
   list into a third place — derive it.

3. **Correct the MCP README** (`packages/mcp/README.md`, ~line 216 and the tool-catalog prose). It
   currently documents `plugin add|list|sync|doctor` — i.e. it *accurately documents a broken policy*.
   It must document the real one.

4. **Deny rules:** `deny_plugin_remove` → `plugin remove` **does** exist, so that one is correct.
   Verify the other deny rules (`deploy`, `init`, `marketplace`, `db reset`) name real verbs too — a
   deny rule for a phantom verb is dead code that gives false assurance.

## Boundaries

- Do **not** touch `.llm/tools/run-deno-lint.ts`, `run-deno-fmt.ts`, or the #769 specifier guard.
- Do **not** touch `plugins/dashboard` or `tools/design-sync/`.
- Do not weaken types (`as any` / `as unknown as` / `@ts-ignore`) to make anything compile.
- Do not widen the allowlist beyond what you can justify. This is a **default-deny security
  boundary**, and a destructive verb reachable through MCP is a far worse bug than a missing one.

## Gates

```bash
cd packages/mcp && deno test --allow-env --allow-net --allow-run --allow-read tests/
cd packages/cli && deno test --allow-all
deno task lint
deno task fmt:check
deno task arch:check     # must stay green — mcp must not import cli
deno task quality:scan
```

## Report back

Commit, push, and report: the final allow/deny policy; **whether you found any phantom beyond the
three I listed**; what you decided about the `ui:*` verbs and why; how the cross-check test derives
the CLI verb set; and gate verdicts. Say plainly whether `plugin install` now works through
`execute_command`.
