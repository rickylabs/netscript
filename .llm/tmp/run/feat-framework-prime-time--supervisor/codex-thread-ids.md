# Live Codex Daemon Thread IDs (steering handles)

Daemon: `codex app-server --remote-control` (Ubuntu codex user). Steer a thread with:
`codex exec resume <thread-id> "<message>"` from the thread's worktree (use `--cd /home/codex`
+ base64 launch pattern; `setsid ... </dev/null &` so the client survives wsl session teardown).

Launched 2026-06-20. Full thread→worktree map recovered from rollout session files
(`/home/codex/.codex/sessions/2026/06/20/`):

| Slice | Thread id | Worktree | PR |
| --- | --- | --- | --- |
| ci-e2e-cli-gate (e2e green-up) | `019ee313-5d2f-7c80-be4c-038c575f5774` | /home/codex/repos/netscript-ci-e2e-cli-gate | #81 |
| sagas-durable-store | `019ee2b9-1c34-7b82-b8bc-6c54a1c5cde5` | /home/codex/repos/netscript-pt-sagas-durable-store | #74 (merged) |
| sagas-idempotency-e2e | `019ee2b9-2ae6-7353-8662-0e0bbf6cf6bd` | /home/codex/repos/netscript-pt-sagas-idempotency-e2e | #75 (merged 9b3bde45) |
| sagas-telemetry-spans | `019ee2b9-3a95-7ed0-ab8c-c98bbffd13da` | /home/codex/repos/netscript-pt-sagas-telemetry-spans | #76 |
| service-auth-seam | `019ee2b9-4a4a-7f11-87af-bd3b2a6f558e` | /home/codex/repos/netscript-pt-service-auth-seam | #77 |
| service-graceful-shutdown | `019ee2b9-59f1-70c1-834d-33653e916846` | /home/codex/repos/netscript-pt-service-graceful-shutdown | #78 (merged) |
| worker-applied-keys-dedup | `019ee2b9-699e-7011-98d1-3971a362db9f` | /home/codex/repos/netscript-pt-worker-applied-keys-dedup | #79 (merged) |
| rbp-dlq-contract | `019ee2b9-7949-79f0-96a4-ef91b3903d11` | /home/codex/repos/netscript-pt-rbp-dlq-contract | #80 (merged) |

### Active rebase-onto-umbrella steers (2026-06-20 ~04:2x UTC)

After #75 merged at `9b3bde45`, the two remaining blocker slices were re-based onto the live umbrella:

- **#76 sagas-telemetry-spans** — telemetry edits conflict with #75 idempotency on `saga-engine.ts`,
  `plugins/sagas/services/src/main.ts`, `saga-supervisor.ts`. Steered thread `…3a95` to rebase +
  resolve (keep both span emission and applied-key guards) + push explicit refspec. Log:
  `/home/codex/pt-sagas-telemetry-spans-rebase2.log`. Prior IMPL-EVAL produced no verdict → re-eval after.
- **#77 service-auth-seam** — supervisor test-rebase showed CLEAN replay (0 conflicts), type-check clean,
  58/58 service tests green (auth + #78 graceful-shutdown together). Steered thread `…4a4a` for the
  mechanical rebase + explicit-refspec push. Log: `/home/codex/pt-service-auth-seam-rebase5.log`.
  Prior PASS was on stale base `fe89b6b4` (missing #78) → re-eval after.

### Steer-launch landmine (verified 2026-06-20)

`codex exec resume <id> <prompt>` works **foreground** (prompt as arg) but the
`setsid … </dev/null &` **detached** form silently no-ops for some sessions (writes only the launch
header, no codex process). Workaround: run the resume as a harness-tracked background job
(foreground-style, prompt passed as `"$(cat brief)"` argument — not stdin `-`), which survives across
turns. `#76` happened to engage via detached stdin-pipe; `#77` only engaged via tracked-background arg-mode.

## GitHub-credential reality (verified 2026-06-20)

- Codex agents push via **SSH** (`git@github.com:rickylabs/netscript.git`). No gh auth, no
  `GITHUB_TOKEN`/`GH_TOKEN`, no `~/.config/gh`, no `codex mcp` server. They CANNOT hit the GitHub
  API (comment / watch Actions) without an injected token.
- Past agent PR comments worked only by embedding the PAT inline in the brief → leaks into codex
  logs + session JSONL. Do NOT repeat that.
- Supervisor holds the PAT (Credential Manager); supervisor mirrors PRs + verifies CI. Agents stay
  API-blind. If agent CI self-verify is wanted: write token to non-tracked chmod 600
  `/home/codex/.gh_token`, reference the path (not the value) in the steer.
