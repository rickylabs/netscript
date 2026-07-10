# Drift Log: PR 0A canonical WSL agentic foundation

## 2026-07-10 — Owner-authorized Tier-D route override

- **What:** PR 0A uses GPT-5.6 Sol high instead of the checked-in GPT-5.5-high Tier-D binding.
- **Source:** Owner directive; `.llm/harness/workflow/lane-policy.md`.
- **Expected:** Checked policy and selected route match.
- **Actual:** Canonical GPT-5.6 migration is deferred to #581.
- **Severity:** significant
- **Action:** accept as an explicit run override; require thread-start model/effort proof.
- **Evidence:** `supervisor.md`, issue #581.

## 2026-07-10 — Codex CLI/app-server version skew

- **What:** Managed Codex and CLI are `0.144.1`; app-server reports `0.142.5`.
- **Source:** `codex app-server daemon version`.
- **Expected:** The doctor classifies component compatibility.
- **Actual:** Existing status output exposes but does not classify the skew.
- **Severity:** minor
- **Action:** report in PR 0A doctor; durable repair remains #580.
- **Evidence:** `research.md`.

## 2026-07-10 — Launcher record write and unmanaged daemon recovery

- **What:** `launch-codex-slice.ts` created the thread but its Windows process lacked permission to
  write `codex-thread-ids.md` through the UNC path. The client closed before a rollout persisted,
  and passive verification exposed an unmanaged app-server state.
- **Source:** launcher output, `codex-status.ts`, `codex remote-control start --json`.
- **Expected:** The launcher records the thread immediately and the daemon remains managed.
- **Actual:** Thread identity was captured from stdout; no implementation turn or rollout started.
- **Severity:** significant
- **Action:** active-work/rollout checks confirmed no live turn; the skill's anchored PID and known
  socket repair restored managed remote control. The same thread is retained for resume.
- **Evidence:** `codex-thread-ids.md`; managed environment
  `env_e_6a2d7485c5a0832a82505a12442cd3ec`; versions all `0.144.1`.

## 2026-07-10 — Requested Codex effort was not applied

- **What:** The sole persisted worker thread reports `model_reasoning_effort=medium` although the
  launcher requested `high` for the temporary GPT-5.6 Sol route.
- **Source:** thread-start metadata for `019f4b4b-6375-7373-aab5-6750c3fdaf04`.
- **Expected:** Per-launch effort `high`.
- **Actual:** Model `gpt-5.6-sol` is correct; effort remained the daemon default `medium`.
- **Severity:** significant
- **Action:** do not overstate the route; continue under the owner's sole-worker authorization.
  Durable route enforcement remains #581 and is outside #575.
- **Evidence:** PR/issue worker-attached comments and `codex-thread-ids.md`.

## 2026-07-10 — Coordinator-created run artifacts were root-owned

- **What:** The child run directory and tracked Markdown artifacts were owned by `root:root` and
  could not be updated by the `codex` implementation worker.
- **Source:** filesystem ownership and the first failed `apply_patch`.
- **Expected:** run artifacts are writable by the sole WSL worker on every slice.
- **Actual:** source files were writable, but mandatory harness evidence was not.
- **Severity:** minor
- **Action:** changed ownership only for this run directory to the existing `codex:codex` owner via
  a one-shot local Docker bind-mount command; file contents and modes were preserved.
- **Evidence:** post-repair `stat` reports `codex:codex` and mode `0644` for all run Markdown files.

## 2026-07-10 — Active-thread reconnect probe reports unmanaged app-server

- **What:** Passive evidence shows the managed `--remote-control` app-server, daemon loop, control
  socket, matching `0.144.1` versions, and this thread's rollout. During the active worker turn,
  `codex remote-control start --json` nevertheless returned "app server is running but is not
  managed by codex app-server daemon".
- **Source:** S3 process/status/reconnect canaries.
- **Expected:** Idempotent reconnect returns `connected` while managed state is healthy.
- **Actual:** The active thread also owns proxy/standalone app-server children; reconnect cannot be
  safely distinguished or repaired until the worker is idle.
- **Severity:** significant
- **Action:** do not restart or repair during active work. Re-run the reconnect canary after this
  turn is idle; durable single-sender diagnosis/repair remains #580.
- **Evidence:** raw reconnect exit `1`; passive status/process/socket checks exit `0`.

## 2026-07-10 — Worker environment cannot execute Windows rollback command

- **What:** The native WSL worker has no `WSLInterop` binfmt registration, so invoking Windows
  `powershell.exe` returns `Exec format error`.
- **Source:** S3 Windows rollback canary.
- **Expected:** Re-verify Windows Claude `2.1.205` from the host.
- **Actual:** Research retains the coordinator's pre-mutation `2.1.205` evidence, but this worker
  cannot independently execute the host binary.
- **Severity:** significant
- **Action:** owner/coordinator runs `claude --version` in native Windows PowerShell after S3; no
  Windows files or Claude installation were changed by this run.
- **Evidence:** absent `/proc/sys/fs/binfmt_misc/WSLInterop`; raw PowerShell exit `126`.

## 2026-07-10 — Owner-authorized external evaluator waiver

- **What:** The owner personally reviewed the run and explicitly instructed the coordinator not to
  dispatch PLAN-EVAL or IMPL-EVAL agents.
- **Source:** owner direction in the creator conversation.
- **Expected:** Harness evaluator passes use separate OpenHands sessions.
- **Actual:** `plan-eval.md` and `evaluate.md` record owner-review `PASS` waivers; no evaluator was
  dispatched.
- **Severity:** significant
- **Action:** preserve the waiver as explicit process drift. Do not treat it as waiving the four
  remaining interactive #575 acceptance checks or the merge close-gate.
- **Evidence:** owner conversation; PR #584 phase comments; `evaluate.md`.

## 2026-07-10 — Coordinator post-idle evidence resolves reconnect ambiguity

- **What:** After this worker became idle, the coordinator performed the skill-authorized anchored
  daemon repair and re-ran the managed reconnect and same-thread canary.
- **Source:** coordinator follow-up in thread `019f4b4b-6375-7373-aab5-6750c3fdaf04`.
- **Expected:** Managed remote control reconnects and the existing thread remains resumable without
  a second sender.
- **Actual:** Remote control returned `status=connected` on `YogaBook9i` environment
  `env_e_6a2d7485c5a0832a82505a12442cd3ec`; CLI/app-server were `0.144.1`; same-thread resume returned
  exactly `CODEX_PR0A_RECONNECT_OK` with no edits.
- **Severity:** resolution evidence for the significant active-thread reconnect drift above.
- **Action:** treat the PR 0A post-idle Codex reconnect canary as passed. Durable generalized repair
  remains #580; do not expand #575 into that controller.
- **Evidence:** coordinator-managed daemon and exact sentinel report; this reconciliation commit.

## 2026-07-10 — Coordinator partially resolves Windows rollback boundary

- **What:** The coordinator verified the native Windows Claude path remains present and version/help
  pass at `2.1.205`, bypassing this worker's unavailable WSLInterop route.
- **Source:** coordinator host-side follow-up.
- **Expected:** Windows Claude remains available as break-glass rollback.
- **Actual:** Path/version/help pass; the owner-only no-edit interactive Windows session is still
  pending and is not claimed complete.
- **Severity:** partial resolution evidence for the significant worker-environment limitation above.
- **Action:** retain the owner boundary until the Windows interactive canary is recorded.
- **Evidence:** coordinator path/version/help report; this reconciliation commit.
