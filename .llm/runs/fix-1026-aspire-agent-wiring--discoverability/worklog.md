# Worklog

## Design

### Public surface

The existing `netscript agent init` command and `InitAgentResult` remain the user-facing surface. Generated `.mcp.json`, `.vscode/mcp.json`, `.claude/skills/**`, and the marked `AGENTS.md` block are its file contracts.

### Domain vocabulary

- `AspireAgentInitializer`: consumed subprocess boundary.
- initialization outcome/skip reason: normalized non-fatal delegation result.
- installed skill names: manifest-owned finite set.

### Ports

`AgentInitFileSystem` remains the file boundary. `AspireAgentInitializer` is added because the external Aspire executable is both a real side effect and a required cancellation/test seam.

### Constants

The 60-second timeout, Aspire MCP command/args, and exact agent-init argument vector are named once at the adapter/use-case boundary. Installed names remain sourced from `skills/manifest.json`.

### Commit slices

See `plan.md` S1–S4. Each slice updates this worklog and `context-pack.md`, then is pushed and recorded on the draft PR.

### Deferred scope

No scaffold, MCP package, or `.llm/tools` changes.

### Contributor path

Start at `public/features/agent/init/init-agent.ts` for orchestration, follow the initializer port to its Deno adapter for process mechanics, and use `skills/manifest.json` as the shipped-bundle index.

## Evidence

PLAN-EVAL launch evidence:

- `claude-print` with `qwen/qwen3.7-max`: exit 1, `model_not_found` / no access.
- `agentic:provider-canary --live --profile claude-openrouter ...`: `status: blocked`, `credential: absent`, `auth_required`.
- No source implementation started.

Reconciliation: the owner waived the open-model evaluator lane for the 0.0.3 fix train. Opus supervisor commit `31adeb936` records PLAN-EVAL `PASS`; implementation is unblocked. Its four conditions are incorporated into S2–S4.

## S2 — shipped skills close routing loops

- Adapted the supplied Aspire, Deno, and symptom playbook drafts into `skills/`.
- Extended the manifest installed set and regenerated the embedded bundle/hash.
- Updated the NetScript router to resolve Aspire, Deno, and unknown-symptom handoffs locally.
- Evidence: `deno task gen:assets-barrel && deno task check:assets-barrel` exited 0; the focused agent suite passed its manifest-driven referential-integrity assertion in the S2/S3 working tree.
- Reconcile: #1026 remains fully resolved by this PR; #1023 is referenced only because this slice satisfies its installed-surface portion while leaving the sibling issue's remaining scope intact.

## S3 — unconditional MCP and bounded optional delegation

- Added the `AspireAgentInitializer` consumed port and a Deno adapter at the allowed public adapter edge. The use case contains no `Deno.Command`.
- Both host configs merge `aspire agent mcp` while preserving unrelated root/server keys.
- Delegation uses the exact verified argument vector, a 60-second `AbortSignal.timeout`, non-fatal result messages, and skips when `.claude/skills/playwright-cli/SKILL.md` exists.
- Expanded the marked AGENTS block and tests for merge/idempotence, referential integrity, timeout cancellation, swallowed failures, unconditional MCP, and required diagnostic terms.
- Evidence: focused agent tests 9/9 pass; scoped CLI check selects 744 files with zero diagnostics; scoped CLI lint selects 744 files with zero findings; `quality:gate` exits 0 with zero new quality findings.
- Doctrine note: the direct whole-CLI readiness scan still reports the package's pre-existing 48 FAIL / 42 WARN Restructure backlog; none names the new port, adapter, use case, or tests. No new debt is introduced.
- Reconcile: the draft PR retains `Closes #1026`; its `Refs #1023` paragraph explicitly scopes the overlap.

## S4 — acceptance and discoverability evidence

### Cold-start chain

Fresh root: `/tmp/netscript-agent-1026.mjAZ0z`.

1. **Unprompted entry:** generated `AGENTS.md` lines 4–8 name “Healthy but not responding”, `aspire`, `deno`, `help.md`, `netscript plugin doctor`, `aspire logs`, `aspire otel logs|spans|traces`, and `deno info`.
2. **Resolved routes:** installed `netscript/SKILL.md` lines 18–20 and 35–37 route Aspire → `aspire`, Deno → `deno`, and unexplained hang/vanish/silence → `help.md`; the manifest-driven test verifies those names exist in the installed set.
3. **Symptom beside command:** installed `help.md` maps “Healthy is not proof”, “Vite ... hangs”, and “An event does not fire” to `aspire logs`, `aspire otel traces`, and `aspire resource ... restart`; installed `aspire/SKILL.md` carries the same diagnostic commands.

The first real CLI run installed `playwright-cli`. The second printed `NetScript agent integration is already current.` with `elapsed=1.47 exit=0`, proving the product guard skipped the ~7-second delegation. Both generated host configs contain the exact Aspire MCP entry.

### Missing executable

With child `PATH=/usr/bin`, the real CLI printed exactly one line:

`Aspire agent wiring was skipped: the aspire executable was not found on PATH.`

The same run still wrote `{"command":"aspire","args":["agent","mcp"]}`.

### Final gates

| Gate | Exit | Evidence |
| --- | ---: | --- |
| assets generation + check | 0 | generation ran twice; no diff failure |
| scoped CLI check | 0 | 744 files, 7 batches, 0 diagnostics |
| scoped CLI lint | 0 | 744 files, 4 batches, 0 findings |
| focused agent tests | 0 | 9 passed, 0 failed |
| owned skill formatting | 0 | 5 files checked |
| scoped CLI TS formatting | 0 | 744 files, 0 findings |
| exact broad `deno fmt --check skills packages/cli` | 1 | pre-existing drift in `packages/cli/e2e/README.md`, `skills/netscript-operate/SKILL.md`, and `skills/netscript-build/SKILL.md`; no owned file is unformatted |
| quality gate | 0 | quality scan clean; architecture/dependency command completed with existing warnings |

No lockfile or unrelated source change was produced. `scaffold.runtime` was not run per explicit scope.

### Reconcile

PR #1030 closes #1026 and explicitly references the installed-surface portion of #1023 without closing it. S1–S4 are complete; final Opus supervisor IMPL-EVAL remains the merge gate.
