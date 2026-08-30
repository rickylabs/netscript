use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push + PR comment trail,
  `worklog.md`/`drift.md`/`context-pack.md` in your own run dir; you never self-certify.
- netscript-doctrine — `packages/cli` is framework code: `quality:scan` + `arch:check` per slice; no
  `any`/casts/lint-ignores; IO only at the runtime/gate edge, never in generators.
- netscript-cli — `netscript agent init`, scaffold/E2E surface (`packages/cli/e2e`), gate classes in
  `cli-surface.ts`, `run-gate.ts` receipts.
- netscript-tools — scoped wrappers, `check:assets-barrel`, `check:mcp-export-corpus`,
  `check:publish-assets`, `agentic:sync-claude`, `agentic:check-claude`, `agentic:dogfood-skills`.
- aspire — 13.5 facts: MCP is `aspire agent mcp` (AppHost mode) /
  `aspire agent mcp --dashboard-url <url>` (dashboard-only); 15 expected tools = the 13.4.6 baseline
  14 + `get_integration_docs`; `excludeFromMcp()` = MCP exposure only (D-6, owned by S8, you only
  assert it). **No AppHost start, no containers, no live MCP session in this phase.**

## Context

- Slice **S9 — skills, corpora, and Aspire MCP alignment** (#1721, epic #1712). Contract =
  `sub-issues/09-skills-corpora-mcp-alignment.md` in the supervisor run dir (read it fully; it is
  the acceptance text). Decisions in force: D-6, D-7, D-12 (structured receipt vs baseline is the
  proof; prose rewrites alone do not close), D-13/D-16 (archival rows untouched), OF-1 = **(a)**
  keep NetScript's `aspire` skill name, install the four upstream workflow skills beside it by
  explicit name (`aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment`), never
  `aspire`/`all`.
- Supervisor run dir (read-only for you):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — `plan.md`, `sub-issues/09-*.md`, `receipts/aspire-13.4.6-mcp-baseline.json` (14-tool baseline;
  `toolsDiscovered` etc.), `aspire-surface-manifest.tsv` (owner `archival` rows are exempt),
  `drift.md` D-39/D-42/D-43, `slices/s8/handoff-phase-a.md`. S2 runtime receipts for citations:
  `origin/test/aspire-13-5-s2-runtime-verification:.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/`
  (`02-v4-otel-*`, `02-v5-aspire-describe-final.json`, `03-v8-*` MCP, `03-v12-*` CLI help).

### Your worktree / branch — STACKED ON S8 (→ S6 → S5)

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s9` (NAS `ai-agents`; work ONLY
  here).
- Branch: `fix/aspire-13-5-s9-skills-mcp-alignment`, based on **S8's settled phase-A head
  `9dd06647`** (`feat/aspire-13-5-s8-typed-resource-commands`) because visibility assertions need
  S8's `excludeFromMcp()` emission. No upstream — push only with
  `git push origin HEAD:refs/heads/fix/aspire-13-5-s9-skills-mcp-alignment`. Draft PR **base
  `feat/aspire-13-5-s8-typed-resource-commands`**; the supervisor retargets after S8 merges. Never
  touch S5/S6/S8 commits; if the supervisor says S8 moved, rebase onto the new S8 head.

### Host (authoritative, D-39)

- Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400, node 24.20.0 via
  `/home/agent/.local/bin/mise exec --` (the `mise` shell function is broken; use the binary).
  Docker 28.5.2 at `tcp://netscript-dind:2375`; inotify 1024; PID 1 tini, 0 zombies; lifecycle tests
  trustworthy — no inotify/zombie waiver exists.
- `aspire ps --format Json --nologo --non-interactive` must read `[]` and `docker ps -a` must be
  empty before and after any `aspire` command you run. **You never start an AppHost.** AppHost-boot
  gates are environment-blocked on this host by the remote-dind topology (D-42/D-43); that is not
  yours to solve.
- Non-runtime `aspire` commands are fine: `aspire --version`, `aspire agent mcp --help`,
  `aspire agent init --help`, `aspire docs …`, `aspire mcp tools --help`. A **stdio MCP session
  without an AppHost** (`aspire agent mcp` from a directory with no AppHost, `initialize` +
  `tools/list` + `doctor`, then close stdin) is allowed **once** for the static tool-surface receipt
  if it starts no process tree beyond the server; record `aspire ps []` after it.

### Phase split

- **Phase A (this dispatch, static):**
  1. **Part A gate code, RED-first.** `AGENT_ASPIRE_MCP_SMOKE = 'agent.aspire-mcp-smoke'` in
     `cli-surface.ts`; `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp-smoke.ts`
     implementing the locked lifecycle table (entry from `.mcp.json`, spawn cwd = project root,
     timeouts, shutdown SIGTERM→SIGKILL, redaction, receipt schema exactly as in the sub-issue,
     transcript file) with the JSON-RPC client isolated behind an injectable transport so unit tests
     drive it with a **recorded transcript fixture** (no live server). Register it in
     `scaffold.runtime` after `runtime.aspire-start` + wait gates and before cleanup, on both tiers;
     it must be **skipped with a recorded reason, never silently absent**, when the runtime phase
     does not run. Unit tests: 15-tool set, baseline diff == `+get_integration_docs`, visibility
     assertions (visible set / `<db>-cli` excluded / `describeListsExcluded`), redaction null-secret
     check, timeout → `fail` with partial receipt.
  2. **Static tool-surface receipt.** `receipts/aspire-13.5.3-mcp-tools-static.json` in your run dir
     from the single allowed stdio session (no AppHost): `serverInfo.version`, `tools/list` names,
     diff vs the 13.4.6 baseline, `doctor` JSON. This is **not** the D-12 smoke receipt (that needs
     the isolated AppHost = Phase B); say so in the file.
  3. **Part B artifacts through generators only:** `skills/aspire/SKILL.md` to 13.5.3 truth (tool
     table from the static receipt, `aspire agent mcp` argv, `aspire resources` alias,
     `stop --force`, orphan auto-cleanup, exit-12 per S2 V4,
     `aspire docs api search … --language typescript`; every claim cites an S2/S9 receipt path),
     `skills/help.md` markers; `.agents/skills/aspire/SKILL.md` + `.claude/skills/aspire` via
     `agentic:sync-claude`; `netscript agent init` explicit upstream skill list + `aspire/SKILL.md`
     hash-unchanged test; `init-agent.ts` AGENTS.md block (`aspire otel logs/spans/traces`,
     `aspire doctor --format Json`, workflow skills); regen `gen:assets-barrel`,
     `gen:mcp-export-corpus`, `gen:publish-assets`, `agentic:dogfood-skills` (fix stale absolute
     paths / `jsr:@netscript/cli@0.0.2` / missing `aspire` server) and add
     `agentic:dogfood-skills:check` or record why ungated.
  4. **Acceptance greps green:**
     `git grep -n '13\.4\.6' -- skills .agents/skills .claude/skills packages/cli/src/kernel/assets`
     → 0 hits **excluding** manifest `archival` rows (list any exempt hit with its manifest row);
     `check:assets-barrel`, `agentic:sync-claude:check`, `agentic:check-claude`,
     `check:mcp-export-corpus`, `check:publish-assets`, `quality:scan`, `arch:check`, scoped
     check/lint/fmt + raw lint/fmt on config-excluded files; tests for touched roots.
  5. **`docs_audit` note:** draft the audit request text (Codex Sol single pass over the skill
     prose) in your run dir; the supervisor dispatches it.
- **Phase B (lease-backed, later, same PR):** the live `agent.aspire-mcp-smoke` receipt in
  `scaffold.runtime` on the isolated AppHost (`receipts/aspire-13.5-mcp-smoke.json`, D-12),
  dashboard-only mode listing, `excludeFromMcp` visibility observed live. **Do not attempt.**

## Boundaries

No public docs prose (S11). No supported-host changes. No `excludeFromMcp()` emission changes (S8).
No archival-row edits. No hand-edited mirrors (`.claude/skills`, generated barrels, corpora). No
pins (S1). No runtime.

## Draft PR and receipts

- After commit 1: draft PR (base `feat/aspire-13-5-s8-typed-resource-commands`), title
  `fix(agent): align skills, corpora, and Aspire MCP surface to 13.5.3 with a smoke receipt gate (S9)`;
  body per `.github/pull_request_template.md`, `## Scope` = `Closes #1721`, `Part of #1712`; labels
  `type:fix`, `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:docs`, `priority:p1`,
  `status:impl`; milestone `0.0.7`. State the S8 stacking and that Phase B (live smoke receipt) is
  lease-backed and environment-blocked on the NAS.
- Commit by slice, push with the explicit refspec, one `## [PHASE: IMPL] S9 slice N` comment per
  commit (scope, hash, gates). Keep your run dir current per slice.

## Stop conditions

- Final non-empty line exactly `DONE` when Phase-A slices are pushed, the draft PR carries the
  commit trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not
  self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>`.
