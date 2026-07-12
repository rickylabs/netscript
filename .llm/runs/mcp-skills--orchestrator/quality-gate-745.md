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
