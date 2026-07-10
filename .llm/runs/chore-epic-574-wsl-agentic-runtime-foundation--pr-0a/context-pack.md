# Context Pack: PR 0A canonical WSL agentic foundation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Current phase | `implement` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Current State

S1 (`ac48bd6`) and S2 (`3f18b1b`) are pushed. S3's safe independent implementation/canaries are
ready to commit. Node `26.5.0`, Claude `2.1.206`, and Gemini `0.50.0` are native and user-local;
Gemini settings enforce `oauth-personal`; repeated bootstrap is idempotent. Claude/Gemini browser
sign-in, post-idle Codex reconnect, host sleep/network reconnect, and Windows Claude execution are
explicit owner/coordinator canaries. The sole worker is thread
`019f4b4b-6375-7373-aab5-6750c3fdaf04`.

## Completed

- Captured WSL and Windows rollback toolchain versions.
- Confirmed managed Codex remote-control process/control socket and no active worker for this run.
- Locked the #575/#576 boundary and three implementation slices.
- Implemented and validated S1's read-only doctor contract (7 unit tests; scoped check/lint/fmt
  wrappers all exit 0).
- Captured the pre-mutation doctor baseline: native ext4 ready; Node outdated; Claude/Gemini absent
  and auth-required; Codex managed at `0.144.1`; raw doctor exit 2 as designed.
- Installed checksum-verified Node 26.5.0 and exact npm-stable Claude/Gemini releases below the
  owned user-local root; preserved Deno/Codex.
- Proved bootstrap idempotence (`actions: []`) and emitted a non-destructive rollback plan.
- Proved non-login native WSL resolution for all six agent/runtime commands.
- Enforced and tested Gemini's Google-subscription-only policy without credentials.
- Recorded native Codex/Claude/Gemini command, path, thread, socket, and auth-boundary evidence.
- Ran every safe independent S3 gate; documented exact owner/coordinator actions for host/browser
  boundaries without dispatching an evaluator.

## In Progress

- Commit, explicitly push, and comment S3; hand owner/coordinator the remaining browser/host canaries.

## Next Steps

1. Land S3 with explicit-refspec push and per-slice GitHub evidence.
2. Owner/coordinator completes the five exact canaries in `worklog.md` and performs slice sign-off.
3. Coordinator dispatches separate-session IMPL-EVAL only after acceptance evidence is complete.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Node 26.5.0 user-local/checksummed | Plan D1 | Latest stable at run start. |
| Google subscription Gemini auth only | Owner directive | Forbidden auth presence is classified without printing values. |
| One attach thread, same-thread implementation resumes | Plan D6 | Satisfies mobile identity and single-sender invariants. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/chore-epic-574-wsl-agentic-runtime-foundation--pr-0a/` | new | Child harness plan artifacts. |
| `.llm/tools/agentic/wsl-foundation*.ts` | new | S1 contract, CLI edge, and semantic tests. |
| `.llm/tools/agentic/README.md`, `deno.json` | modified | Doctor usage and task entry. |
| `~/.local/share/netscript-agentic`, `~/.local/bin/*` | machine-local | Owned Node/npm CLI installation and symlinks. |
| `~/.config/netscript-agentic/foundation-state.json` | machine-local | Mode-0600 rollback ownership manifest. |
| `~/.gemini/settings.json` | machine-local | Mode-0600 enforced `oauth-personal` policy; rollback-recorded. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | S1-S3 PASS | 68 tests and scoped wrapper exits 0; `worklog.md` |
| Fitness | planned | `plan.md` |
| Runtime | PARTIAL / OWNER CANARIES | native installs/policy pass; browser/reconnect/host checks pending |
| Consumer | PASS | clean non-login WSL shell resolves all installed tools |

## Open Questions

- Owner browser interaction may be needed for provider-native sign-in, but it does not block
  implementation, installation, doctor, or rollback work.
- Native WSL Claude Remote Control identifies the exact owner action: sign in with the claude.ai
  subscription, then repeat the remote-control/worktree canary.
- Native Gemini identifies Google browser sign-in as the remaining action; settings enforce
  `oauth-personal`, and forbidden environment routes are redaction-tested.
- Codex passive managed evidence passes, but active-turn reconnect returned exit 1; retry only when
  this worker is idle. Windows rollback proof requires the host because WSLInterop is absent here.

## Drift and Debt

- Drift: model override, launcher recovery, and ignored requested-effort override recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
