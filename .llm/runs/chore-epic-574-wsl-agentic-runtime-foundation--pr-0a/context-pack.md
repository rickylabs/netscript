# Context Pack: PR 0A canonical WSL agentic foundation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-epic-574-wsl-agentic-runtime-foundation--pr-0a` |
| Branch | `chore/epic-574-wsl-agentic-runtime-foundation` |
| Current phase | `impl-eval` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Current State

S1 (`ac48bd6`), S2 (`3f18b1b`), and S3 (`5a72828`) are pushed. Coordinator post-idle evidence now
confirms managed remote control `status=connected` on `YogaBook9i` environment
`env_e_6a2d7485c5a0832a82505a12442cd3ec`, matching CLI/app-server `0.144.1`, and same-thread resume
returned exactly `CODEX_PR0A_RECONNECT_OK` without edits. Native Windows Claude path/version/help
also passed at `2.1.205`. Owner-only provider login/mobile steering, sleep/network reconnect, and a
Windows no-edit interactive session remain pending. Coordinator substantive review found one doctor
false-green; the surgical classifier/test remediation is pushed as `6ea5224`. The owner's explicit
no-evaluator instruction is recorded as an IMPL-EVAL `PASS` waiver in `evaluate.md` without waiving
the remaining interactive acceptance checks.

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
- Recorded coordinator post-idle anchored repair, managed reconnect, exact same-thread sentinel, and
  Windows Claude path/version/help evidence.
- Fixed the coordinator-identified version-probe false-green: successful unparseable output is now
  unavailable with a sanitized bounded diagnostic; focused tests and scoped wrappers pass.

## In Progress

- Owner completes the four interactive provider/mobile/host canaries in `worklog.md`.

## Next Steps

1. Owner completes the four exact canaries remaining in `worklog.md`.
2. Record the raw outcomes, complete the PR Definition of Done, and move to merge readiness.
3. Keep the owner-authorized evaluator waiver explicit; do not dispatch OpenHands.

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
| Static | S1-S3 + review fix PASS | prior 68-test gate plus focused 12-test remediation; scoped wrappers exit 0 |
| Fitness | PASS | internal-tool size/scope boundary and review remediation recorded in `worklog.md` |
| Runtime | PARTIAL / OWNER CANARIES | Codex post-idle reconnect passes; provider mobile and sleep/network checks pending |
| Consumer | PASS | clean non-login WSL shell resolves all installed tools |

## Open Questions

- Owner browser interaction may be needed for provider-native sign-in, but it does not block
  implementation, installation, doctor, or rollback work.
- Native WSL Claude Remote Control identifies the exact owner action: sign in with the claude.ai
  subscription, then repeat the remote-control/worktree canary.
- Native Gemini identifies Google browser sign-in as the remaining action; settings enforce
  `oauth-personal`, and forbidden environment routes are redaction-tested.
- Codex post-idle managed reconnect and exact same-thread no-edit sentinel pass by coordinator
  evidence. Windows Claude path/version/help pass at `2.1.205`; interactive no-edit use remains.
- No open implementation question remains from coordinator substantive review; owner browser/mobile
  boundaries are unchanged and unclaimed.

## Drift and Debt

- Drift: model override and launcher recovery remain recorded; post-idle reconnect and Windows
  path/version/help now have coordinator resolution evidence.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.

## 2026-07-10 Desired-State Reconciliation

- Future desired component: Google Antigravity CLI (`agy`), not Gemini CLI.
- Historical Gemini installation/auth evidence remains true historical evidence.
- Canonical proof target: `/home/codex/.local/bin/agy` owned and executed by user `codex`; never
  mutate `/root/.local/bin/agy`.
- Preserve `~/.gemini`; Antigravity uses it for shared and CLI-private configuration.
- Future refactor surfaces:
  `.llm/tools/agentic/wsl-foundation-lib.ts`, `wsl-foundation.ts`,
  `wsl-foundation_test.ts`, and `.llm/tools/agentic/README.md`.
- Replace component/version/install/auth/state probes and rollback ownership with `agy` semantics;
  retain a bounded compatibility reader for already-recorded Gemini ownership state if required.
- Owner reported Antigravity and Claude login, but canonical `codex`-user `agy` path/auth/headless
  proof is not yet recorded. Authentication, quota, structured output, and research capabilities
  remain acceptance canaries.
- PR #584 stays draft; no implementation resumes until scope review.
