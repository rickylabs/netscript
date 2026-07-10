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

S1 is pushed at `ac48bd6`. S2 is ready to commit: Node `26.5.0`, Claude `2.1.206`, and Gemini
`0.50.0` are installed user-locally in native WSL, with an immediate second bootstrap returning no
actions. All toolchain/state probes are ready; Claude and Gemini remain explicitly `AUTH_REQUIRED`
for owner browser sign-in. The sole worker is thread `019f4b4b-6375-7373-aab5-6750c3fdaf04`.

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

## In Progress

- Commit, explicitly push, and comment S2; then run S3 mobile/auth/reconnect/Windows rollback canaries.

## Next Steps

1. Land S2 with explicit-refspec push and per-slice GitHub evidence.
2. Run all safe S3 canaries; classify owner-only browser login and host reconnect actions exactly.
3. Update PR acceptance evidence without dispatching IMPL-EVAL.

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

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | S1 PASS | scoped wrapper exits 0; `worklog.md` |
| Fitness | planned | `plan.md` |
| Runtime | S2 PASS / AUTH_REQUIRED | idempotent bootstrap; provider browser sign-in pending |
| Consumer | S2 PASS | clean non-login WSL shell resolves all installed tools |

## Open Questions

- Owner browser interaction may be needed for provider-native sign-in, but it does not block
  implementation, installation, doctor, or rollback work.
- Native WSL Claude Remote Control identifies the exact owner action: sign in with the claude.ai
  subscription, then repeat the remote-control/worktree canary.

## Drift and Debt

- Drift: model override, launcher recovery, and ignored requested-effort override recorded.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
