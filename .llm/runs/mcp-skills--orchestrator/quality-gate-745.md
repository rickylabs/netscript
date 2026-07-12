# Quality gate #745 — pre-audit + compliance plan for this epic

Owner escalation 2026-07-12 (#745): the beta.9 CLI wave merged two prohibited classes the scoped
check/lint/fmt wrappers don't catch. Owner directive to THIS orchestrator: watch #745, pull the
fixing PR once it lands in main, follow it strictly, and do NOT claim the umbrella (PR #715) ready
for merge until this epic is compliant + `quality:scan` (from that PR) passes.

## Pre-audit of this epic's merged code (2026-07-12, umbrella @ cf55fe69)

### Violation class 1 — `any` + manual casting: **PRESENT** (must fix)

- `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:13` — return type
  `Command<any, any, any, any, any, any, any, any>`
- `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:33` — `as unknown as
  Command<any, …>`
- `packages/cli/src/public/features/agent/init/init-agent-command.ts:14,34` — same pair
- `packages/cli/src/public/features/agent/agent-group.ts:35` — `as unknown as Command`
- `packages/mcp/src/presentation/json-rpc.ts:46` — `return value as unknown as JsonRpcRequest`
  (this one is a JSON-RPC parse boundary — candidate for an honest `// quality-allow: <reason>`
  after a real runtime-validated narrowing, OR a proper type guard; decide against the PR's rule).

Root cause: the S7 Codex agents mirrored the repo's existing baseline `AnyCliffyCommand` pattern
(the very alias #745 consolidates). Same class the wave propagated.

### Violation class 2 — host-side hardcoded plugin names: **CLEAN**

Grep for `.name === '…'` / `kind === '…'` / `.includes('plugin-…')` over `packages/mcp` +
`packages/cli/src/public/features/agent` returns only MCP **tool-name** comparisons in tests
(`tool.name === 'list_commands'`), which are legitimate. My S5 doctor deliberately used the
`ProjectDoctorPort` inversion (no host-side plugin identity), and S7 injects the CLI plugin-doctor
use-case — it does not add new name branches. NOTE: the pre-existing anchors #745 cites
(`doctor-plugin-use-case.ts:111`, `install-plugin-command.ts:72`) are in files S7 *calls* but does
not modify; the #745 PR fixes those. After I pull the PR, re-verify my injection still compiles
against the capability-seam refactor.

## Canonical patterns from the fixing PR #747 (open, status:ready-merge; base main)

- Typed helper: **`CliffyCommand = Command['cmd']`** in
  `packages/cli/src/kernel/presentation/command-types.ts` — replaces every `Command<any,…>` /
  `AnyCliffyCommand`. Remove `as unknown as` / `as any`. Target: zero `Command<any` in
  `packages/cli/src`.
- Plugin capability seam: `plugin.cli.doctorChecks` capability on the manifest;
  `install-plugin-command.ts` uses a generic `--mcp` flag (no `kind === 'ai'`). (Pre-existing
  files, fixed by #747; my S7 injection must recompile against the new use-case signature.)
- Gate: **`deno task quality:gate`** = `quality:scan` + `arch:check`; scanner at
  `.llm/tools/quality/scan-code-quality.ts` (repo mode `quality:scan:repo`, PR changed-file
  mode). Honest escape: inline `// quality-allow: <reason>` (bounded by `--max-allow`).
- Gate is REQUIRED per-slice for `packages/**`/`plugins/**` per updated `run-loop.md` +
  Tier-A slice-review checklist + `.github/workflows/code-quality.yml`.
- Merge commit (once landed): `fed76a91…`.

## Compliance plan (blocks umbrella ready-for-merge)

1. **Watch #745** → capture the fixing PR number; wait for it to merge to main.
2. `git fetch origin main` → merge (or rebase) main into `feat/netscript-mcp-skills`; resolve
   conflicts (esp. plugin-doctor use-case capability seam vs my S7 injection adapter).
3. Apply the PR's **canonical typed Cliffy command** helper to the four agent-group command
   factories — remove every `Command<any,…>` and `as unknown as Command`. No blanket
   `deno-lint-ignore no-explicit-any`.
4. Resolve `json-rpc.ts:46` per the PR's rule (type guard or honest `// quality-allow:`).
5. Run the PR's `deno task quality:scan` + `deno task arch:check` + `doc:lint` over
   `packages/mcp` + `packages/cli` — all GREEN, evidence in the run dir.
6. Re-run full mcp + agent test suites; re-run S9 e2e smoke.
7. Only then flip PR #715 to ready-for-review and request the separate-session IMPL-EVAL.

Until step 5 is green, S9 completes as normal but the umbrella stays DRAFT and no
ready-for-merge claim is made.

## Compliance RESULT (2026-07-12, umbrella @ cf762f47)

Executed:
1. Watched #745 → fixing PR **#747** merged to main as `e4dbe7a3`.
2. Merged `origin/main` into the umbrella (`925d9e21`); resolved one conflict in
   `public-command-tree.ts` (union of my `agent` group with main's `config` + `ui:list/update/remove`).
3. Applied the canonical **`CliffyCommand`** helper to the three agent command factories
   (`agent-group.ts`, `mcp/agent-mcp-command.ts`, `init/init-agent-command.ts`) — removed every
   `Command<any,…>` and `as unknown as` cast.
4. `json-rpc.ts` parse: replaced `as unknown as JsonRpcRequest` with an explicit typed
   construction after the existing validation (no cast, no `quality-allow` needed).
5. Gates GREEN (evidence):
   - `quality:scan` over `packages/mcp` + agent group → `{ok:true, findings:[], allowCount:0}`.
   - `deno task quality:scan` (repo mode) exit 0, 0 findings (19 pre-existing allowances, none
     mine); `deno task arch:check` exit 0 → **`quality:gate` PASS**.
   - `deno check --unstable-kv` clean; `doc:lint --root packages/mcp` totalErrors 0;
     `deno publish --dry-run` (packages/mcp) Success.
   - Tests: packages/mcp 39/39, agent group 4/4, stdio e2e smoke 1/1.

Class 2 (host-side plugin names) re-verified post-merge: my S5 `ProjectDoctorPort` injection still
compiles against #747's plugin capability seam; no name branching in my code. **Epic is
#745-compliant.**

## Umbrella IMPL-EVAL — lane deviation (2026-07-12)

- Dispatched OpenHands qwen-3.7-max (Tier E canonical IMPL-EVAL) on PR #715 → **workflow FAILURE**
  (`conclusion:failure state:agent-failed verdict:NONE`, run 29191209531 — agent failed before
  producing a summary; consistent with the known-flaky OpenRouter agentic lanes).
- Fallback per lane-policy (deviations recorded here): **separate-session WSL Codex evaluator**
  (gpt-5.6-sol high, review lane), evaluate-only in a fresh worktree at the umbrella tip. Distinct
  session from every slice generator → #306 generator≠evaluator invariant preserved. Opposite-family
  external re-check (OpenHands) to be retried at owner discretion if the lane recovers.
