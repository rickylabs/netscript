---
name: codex-wsl-remote
description: Use for NetScript Codex Desktop/mobile remote-control through WSL SSH, especially when launching or supervising mobile-visible Codex app-server sessions, choosing native WSL worktree paths, recovering unmanaged app-server daemon state without interrupting active sessions, verifying full-access app-server settings, or running Deno/Aspire CLI E2E gates without `/mnt/c` DrvFS failures.
---

# Codex WSL Remote

## Purpose

Use this skill when a NetScript task needs Codex Desktop or mobile to steer local work through WSL.
The verified path is:

```text
Codex Desktop/mobile -> SSH target <CODEX_SSH_HOST> -> WSL <WSL_DISTRO> <WSL_USER> user -> codex app-server remote-control
```

## Local machine profile (example — replace with your own)

This skill teaches the **pattern**. Everything below references placeholders; the values are
per-operator and per-machine. Fill in your own — put them in a git-ignored local profile
(`.llm/tmp/codex-wsl.env`) or export them in your shell — then read the rest verbatim, substituting
your values for the placeholders. **Nothing in this table is baked into the shipped prose.** The
right-hand column is one operator's working example, not a required value.

| Placeholder | What it is | How to obtain it | Example value |
| ----------- | ---------- | ---------------- | ------------- |
| `<WSL_DISTRO>` | WSL distro name | `wsl.exe -l -v` | `Ubuntu-24.04` |
| `<WSL_USER>` | Linux username that runs Codex | your WSL login | `codex` |
| `<WSL_HOME>` | that user's home dir | `echo $HOME` inside WSL | `/home/codex` |
| `<CODEX_SSH_HOST>` | SSH host alias in `~/.ssh/config` | your `Host` block | `codex-wsl` |
| `<SSH_PORT>` | port sshd listens on in WSL | your sshd config | `2222` |
| `<SSH_IDENTITY>` | Windows path to the SSH key | your key location | `C:\Users\<you>\.ssh\codex_wsl_ed25519` |
| `<HOST>` | device/server name remote-control reports | `serverName` in `remote-control start --json` | `YogaBook9i` |
| `<ENV_ID>` | remote-control environment id | `environmentId` in `remote-control start --json` | `env_e_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `<REPO_WSL>` | native ext4 worktree root for the branch family | `git worktree list` inside WSL | `/home/codex/repos/netscript-wave5-apps` |
| `<THREAD_ID>` | a session thread uuid | printed by `send-message-v2` / `codex-status.ts` | `019ec234-4e7f-70c0-91a0-97de455702f8` |
| `<CODEX_BIN_DIR>` | dir holding the `codex` binary | `command -v codex` inside a login shell (then take its dirname) | `$HOME/.local/bin` |

Notes:

- **PATH in non-login shells.** `ssh.exe <CODEX_SSH_HOST> '<cmd>'` runs a non-login shell that may
  not have `codex` on `PATH`. The examples below prepend `export PATH="<CODEX_BIN_DIR>:$PATH"`.
  Resolve `<CODEX_BIN_DIR>` once with `command -v codex` in a login shell and reuse it; on many
  setups it is `$HOME/.local/bin`, which is already `$HOME`-relative and safe to keep verbatim.
- **`$HOME` inside single-quoted `ssh.exe '…'` strings** is passed literally to the remote shell,
  which expands it to `<WSL_HOME>` for `<WSL_USER>`. Prefer `$HOME` over a hardcoded path where a
  command runs remotely; use the literal `<WSL_HOME>` placeholder only where a value must be spelled
  out (e.g. an anchored `pgrep` pattern).

### Launch model (the one rule that matters)

| Goal | Command | Visibility |
| ---- | ------- | ---------- |
| **Start a new session** | `codex debug app-server send-message-v2 "<prompt>"` (in the worktree, against the managed daemon) | **Mobile + Desktop visible, steerable** |
| **Steer an existing session** | `codex exec resume <thread-id> "<follow-up>"` | continues the same thread |
| Headless one-off (no phone) | `codex exec ...` (standalone) | **Desktop sync only — never reaches mobile** |

- `send-message-v2` registers a thread with the running remote-control daemon, so it appears on
  your phone. This is the correct launcher for supervisor/implementation sessions.
- **Never run two `send-message-v2` calls against the same worktree concurrently.** Each call
  spawns a *new* thread; two live threads in one worktree fork rival agents that fight over the
  same files and git index (race / clobber). One active send per worktree, sequential.
- To continue or correct a running session, **resume it** (`codex exec resume`) — do *not* fire a
  second `send-message-v2`, which forks a rival rather than steering the original.
- Bare `codex exec` (no resume) spawns a standalone process the daemon does not manage; it is
  Desktop-sync only and never appears on mobile. Use it only for headless work you don't need to
  watch from the phone.

### Default tooling — the agentic suite (use this before hand-rolling PowerShell)

`.llm/tools/agentic/` is the **default mechanism** for staging, launching, watching, steering, and
inspecting Codex slices (and dispatching/reading OpenHands). It defends every landmine below in code
(PowerShell `<`/`$()` parse errors, CRLF-corrupted bash scripts, inherited-upstream push-to-main,
rival concurrent sends, leaked tokens) and is unit-tested. Reach for these before writing a fresh
`ssh.exe`/`wsl.exe` one-liner. **Used together they fully cover the supervision loop** — launch,
progress, finish, steer, evaluate, merge — so you should rarely need a raw shell call. Full flags and
exit codes: `.llm/tools/agentic/README.md`.

| Phase | Need | Tool |
| ----- | ---- | ---- |
| **Launch** | Validate brief → push-safety gate → stage (CRLF-stripped) → launch a slice → record thread id | `launch-codex-slice.ts` (`--dry-run`, `--parse-log <log>`) |
| **Inspect** | Read-only daemon health, worktree git state + logs path, recent session rollouts | `codex-status.ts` (`--worktree`, `--pretty`) |
| **Watch — progress** | Wake on the worktree's next **git** event (commit/ref) — *slice made progress* | `codex-watch.ts --worktree <wt>` (**run inside WSL**) |
| **Watch — finish** | Wake when the agent's **turn finishes** (rollout `task_complete`) — *agent is idle/done* | `codex-watch.ts --mode turn --thread-id <uuid>` (**run inside WSL**) |
| **Steer** | Continue/correct an existing thread (never forks a rival) | `codex-resume.ts --thread-id <uuid> --message …` (`--dry-run`) |
| **Evaluate** | Dispatch an `@openhands-agent` PLAN/IMPL-EVAL; read its verdict | `dispatch-openhands.ts`, `openhands-status.ts` |
| **Merge** | Eval-gated, clean-gated, base-guarded leaf-PR lifecycle | `gh-pr.ts create\|verdict\|merge` |

**The watch distinction is the one that bites you.** `codex-watch` has two signals and they answer
different questions:

- `--mode git` (default) watches the worktree's gitdir `logs` and fires on the next commit/ref write.
  It tells you the slice *progressed* — it does **not** tell you the agent stopped. A turn can commit
  mid-flight and keep working, or finish a whole turn with no commit at all. Re-arm it after each
  event to keep surfacing commits as the slice runs.
- `--mode turn` watches the thread's session rollout `.jsonl` (`rollout-<ts>-<uuid>.jsonl` under
  `~/.codex/sessions`, resolved from `--thread-id`) and fires when the latest record is
  `task_complete` — the daemon's end-of-turn marker. This is the **"agent finished / is idle"** signal.
  If the thread is already idle when armed it returns at once with `alreadyIdle:true`. Use this to
  know when a steered turn is actually done (vs. just having committed), and before deciding whether
  the thread is free to steer again.

Run **both** in parallel when supervising: git-mode to narrate commits, turn-mode to detect idle.
Both exit `0` on their event, `2` on the `--timeout-seconds` heartbeat (re-arm; a hung agent still
re-wakes you), `1` on bad args / unresolved worktree|rollout. Determine a thread's live state any
time with `codex-status.ts` (daemon proc count + newest rollouts) — and remember its non-login shell
may not resolve `~`/PATH; a one-off `wsl.exe --cd <WSL_HOME> -u <WSL_USER> -- bash -lc '…'` with a
literal absolute sessions path is the fallback (avoid `$`/`@{}`/`~` inside a PowerShell-wrapped bash
string — PowerShell expands them before WSL sees them).

The suite enforces the one-active-send-per-worktree and explicit-refspec-push rules described in
this skill; `codex-resume.ts` is the supported steering path (it issues exactly one
`codex exec resume`, never a second `send-message-v2`).

### Brief authoring (MANDATORY for every prompt file you hand to a Codex session)

Every prompt/brief file passed to `send-message-v2` MUST:

- Begin with `use harness` (harness is always-on for every agent).
- Include a dedicated `## SKILL` chapter: a **bullet list naming each relevant repo skill** the
  agent should activate, each with a one-line note of why/when it applies. **Be generous** — list
  every plausibly-relevant skill (`netscript-harness`, `netscript-doctrine`, `jsr-audit`,
  `netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `netscript-cli`, `rtk`,
  `codex-wsl-remote`, etc.). The rule: the more relevant skills you pass, the more efficient the
  agent. Skills are thin and the agents are capable of using them appropriately, so under-listing is
  the failure mode, not over-listing. There is no penalty for too many.
- Strip CRLF before staging the file into WSL (`tr -d '\r' < src > dest`); CRLF in a brief or in a
  `bash -lc` here-string breaks `cd`/redirects (see push-safety + line-ending landmines).

## Verified Baseline

The tool/config snapshot below is one verified machine's baseline (recorded on Codex `0.140.0`,
2026-06-16). Re-verify per branch with the [Verification Commands](#verification-commands); treat the
identifiers as your local-profile placeholders, not fixed values.

- WSL distro: `<WSL_DISTRO>`
- WSL user: `<WSL_USER>`
- SSH alias: `<CODEX_SSH_HOST>`
- SSH endpoint: `127.0.0.1:<SSH_PORT>`
- SSH identity: `<SSH_IDENTITY>`
- WSL Codex home: `<WSL_HOME>/.codex`
- Codex CLI/app-server: `0.140.0` (managed daemon verified 2026-06-16)
- App-server config: `approval_policy = "never"`, `sandbox_mode = "danger-full-access"`,
  `model_reasoning_effort = "medium"`, `plan_mode_reasoning_effort = "medium"`,
  `model_reasoning_summary = "auto"`, and `model_verbosity = "medium"`.
- Native WSL worktree root: `<REPO_WSL>`
- Deno toolchain: `2.8.x` (PR #44 upgrade). Other tool versions below are a captured snapshot —
  re-verify per branch with the toolchain command in [Verification Commands](#verification-commands).
- Snapshot toolchain: Deno `2.7.11`, .NET SDK `10.0.109`, Aspire CLI `13.3.0`, Docker `29.1.3`, Node `18.19.1`, npm `9.2.0`

Default reasoning remains `medium`. Override per launch only when the task calls for it:

| Task | Effort |
| ---- | ------ |
| Mechanical launch, status, prompt steering, or no-edit smoke | `low` |
| Daily implementation and ordinary supervision | `medium` |
| Debugging, self-evaluation, or ambiguous solution finding | `high` |
| Explicit user request or unusually complex/high-risk work | `xhigh` |

The Windows-side helper lives at:

```powershell
$env:USERPROFILE\.codex\skills\codex-wsl-remote\scripts\start-codex-wsl-remote.ps1
```

Run it from Windows PowerShell when transport needs restoration:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.codex\skills\codex-wsl-remote\scripts\start-codex-wsl-remote.ps1"
```

The helper starts a hidden WSL keepalive, restarts WSL `ssh.service`, verifies `ssh <CODEX_SSH_HOST>`,
writes the full-access Codex app-server config with medium reasoning defaults, restarts the managed
daemon, starts `codex remote-control`, and checks the toolchain.

## Native Worktree Rule

Run full NetScript Deno/npm/Aspire gates from native WSL ext4 paths under `<WSL_HOME>/repos/`.
Do not run full CLI E2E from `/mnt/c`: Deno's internal npm materialization can hit DrvFS
`Operation not permitted (os error 1)` even when ordinary shell copy/write commands work.

Known good full E2E smoke:

```text
Cwd: <REPO_WSL>
Command: deno task e2e:cli run scaffold.runtime --cleanup --format pretty
Raw exit code: 0
Summary: passed=41 failed=0
Elapsed: 224s
Thread: <THREAD_ID>
Marker: CODEX_WSL_NATIVE_WORKTREE_E2E_SMOKE_PASS
```

## Verification Commands

From Windows PowerShell, verify transport:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port <SSH_PORT>
ssh.exe <CODEX_SSH_HOST> 'echo SSH_OK; export PATH="<CODEX_BIN_DIR>:$PATH"; codex --version'
```

Verify app-server remote-control:

```powershell
ssh.exe <CODEX_SSH_HOST> 'export PATH="<CODEX_BIN_DIR>:$PATH"; codex remote-control start --json; codex app-server daemon version'
```

Expected remote-control output includes (`serverName`/`environmentId` are your machine's — they will
differ from the example placeholders):

```text
"status":"connected"
"remoteControlEnabled":true
"serverName":"<HOST>"
"environmentId":"<ENV_ID>"
```

For passive health checks, prefer daemon status and process inspection:

```powershell
ssh.exe <CODEX_SSH_HOST> 'export PATH="<CODEX_BIN_DIR>:$PATH"; codex app-server daemon version; ps -eo user,pid,ppid,etime,cmd | grep -E "[c]odex app-server|[a]pp-server daemon" || true'
```

A single `codex debug app-server send-message-v2` against a managed daemon is **safe** and leaves
remote-control managed — verified 2026-06-16 on Codex `0.140.0`: a no-edit smoke completed and
`codex app-server daemon version` still reported the same managed pid with `--remote-control` and
the control socket intact. `send-message-v2` is the *launcher* for mobile-visible sessions, not a
forbidden command.

The real hazard is **concurrency, not the command**: two `send-message-v2` calls live against the
same worktree at once fork rival agents and can leave the daemon in an unmanaged state where
`codex remote-control start --json` later fails with:

```text
Error: app server is running but is not managed by codex app-server daemon
```

So: one active send per worktree, sequential; steer with `codex exec resume`, never a second send.
Use Desktop/mobile itself to confirm the new thread is user-visible once passive checks show
remote-control is connected.

Verify the native NetScript toolchain:

```powershell
ssh.exe <CODEX_SSH_HOST> 'cd <REPO_WSL>; deno --version; dotnet --version; aspire --version; docker version --format "{{.Client.Version}} / {{.Server.Version}}"; node --version; npm --version; git status --short --branch'
```

A `send-message-v2` turn against a managed daemon is both the **launch path** for a mobile-visible
session and, with a no-edit prompt, a connectivity smoke. The `thread/start` response should report
`approvalPolicy: "never"` and `sandbox.type: "dangerFullAccess"`, emit a `threadId`, and end with
`turn/completed` / `[codex app-server exited: exit status: 0]`:

```powershell
ssh.exe <CODEX_SSH_HOST> 'cd <REPO_WSL>; codex debug app-server send-message-v2 "Remote smoke only. Do not edit files. Do not run validation. Reply with exactly CODEX_WSL_REMOTE_SMOKE_OK and no other prose."'
```

Capture the `threadId` from the output — that is the handle for `codex exec resume <thread-id>` if
you later need to steer the session. Confirm the thread on your phone to prove mobile visibility.

## Launching Supervisor Or Implementation Sessions

Start Desktop/mobile-visible Codex sessions from the native WSL worktree path for the relevant
branch. A branch family keeps one native worktree per slice under `<WSL_HOME>/repos/`; list them with
`git worktree list` inside WSL. For example, a multi-slice family looks like:

```text
<REPO_WSL>
<REPO_WSL>-5a-service
<REPO_WSL>-5b-sdk
<REPO_WSL>-5c-fresh-ui
<REPO_WSL>-5d-fresh
```

Launch one with a single `send-message-v2` carrying the full brief, run as a background SSH job so
the supervisor turn is not blocked. Pattern (one per worktree, sequential):

```powershell
ssh.exe <CODEX_SSH_HOST> 'export PATH="<CODEX_BIN_DIR>:$PATH"; cd <native-worktree>; codex debug app-server send-message-v2 "<full self-contained brief: use harness, activate skills, pre-flight git fetch+reset, task, constraints, reporting>"' 2>&1 | Tee-Object <log>
```

Prefer the agentic suite: `launch-codex-slice.ts` validates the brief, runs the push-safety gate,
stages with CRLF stripped, launches, and records the thread id for you (see the table above).

Supervise without polling: run `.llm/tools/watch-run.ts <run-dir>` (run-artifact watcher), or
`.llm/tools/agentic/codex-watch.ts` from inside WSL — `--worktree <wsl path>` to wake on git
activity (progress), and `--mode turn --thread-id <uuid>` to wake when the turn finishes (idle). The
git event alone does not mean the agent stopped; pair the two. Steer only with
`.llm/tools/agentic/codex-resume.ts` (or `codex exec resume <thread-id>`); never fire a second
`send-message-v2` at the same worktree.

For full CLI E2E, use the `netscript-cli` skill and run:

```powershell
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Keep `--cleanup` unless the user explicitly wants the generated runtime left running. Do not delete
lock files or caches, and do not run `deno cache --reload` without approval.

## Troubleshooting

If mobile says connection is impossible or Desktop shows a failed SSH connection:

1. Run the Windows helper above.
2. Confirm `ssh <CODEX_SSH_HOST>` reaches the `<WSL_USER>` user, not root.
3. Confirm `<WSL_HOME>/.codex/config.toml` contains the quoted full-access TOML values.
4. Restart only the `<WSL_USER>` user's app-server if remote-control reports an unmanaged daemon:

   ```powershell
   wsl.exe -d <WSL_DISTRO> -- sh -lc 'pkill -u <WSL_USER> -f "codex.*app-server" || true; pkill -u <WSL_USER> -f "app-server" || true'
   ssh.exe <CODEX_SSH_HOST> 'export PATH="<CODEX_BIN_DIR>:$PATH"; codex remote-control start --json; codex app-server daemon version'
   ```

Before restarting app-server while implementation agents are running, check whether active work would
be interrupted:

```powershell
ssh.exe <CODEX_SSH_HOST> 'ps -eo user,pid,ppid,stat,etime,cmd | grep -E "[d]eno|[d]otnet|[a]spire|[d]ocker compose|[n]pm|[n]ode|[g]it |[c]odex" | sed -n "1,200p"'
ssh.exe <CODEX_SSH_HOST> 'find ~/.codex/sessions -type f -name "*.jsonl" -printf "%T@ %TY-%Tm-%Td %TH:%TM:%TS %p\n" 2>/dev/null | sort -nr | head -20'
```

If there are no active child jobs and the latest relevant session has completed, repair an unmanaged
remote-control daemon by killing only the `<WSL_USER>` user's app-server processes by anchored PID
match and then starting remote-control fresh (the anchored pattern is `^$HOME/.codex/…` so it matches
only the real app-server binary; `$HOME` expands to `<WSL_HOME>` in the remote shell):

```powershell
ssh.exe <CODEX_SSH_HOST> 'set -e; export PATH="<CODEX_BIN_DIR>:$PATH"; pids=$(pgrep -u <WSL_USER> -f "^$HOME/.codex/packages/standalone/current/codex app-server" || true); if [ -n "$pids" ]; then echo "killing app-server pids: $pids"; kill $pids; sleep 2; fi; rm -f ~/.codex/app-server-control/app-server-control.sock; codex remote-control start --json; codex app-server daemon version'
```

Do not use a broad `pkill -f "codex app-server"` inside an SSH one-liner. The pattern can match the
SSH shell command itself and terminate the repair command before it restarts remote-control.

Avoid root-owned app-server daemons for normal Desktop/mobile work. They create duplicate host chips
and stale mobile entries.

## Known Incidents

### 2026-06-14 unmanaged app-server after mobile disconnect

Symptoms:

- Mobile lost connection to the green `<HOST>` host.
- `Test-NetConnection 127.0.0.1 -Port <SSH_PORT>` passed.
- `ssh <CODEX_SSH_HOST>` passed.
- `ssh.service` was active.
- `codex app-server daemon version` reported a running app-server.
- `codex remote-control start --json` failed with:

  ```text
  Error: app server is running but is not managed by codex app-server daemon
  ```

Safe recovery used:

1. Confirmed the latest session had completed and no `deno`, `dotnet`, `aspire`, `node`, or
   child worker commands were running.
2. Killed only the `<WSL_USER>` user's app-server PIDs matched by
   `^<WSL_HOME>/.codex/packages/standalone/current/codex app-server`.
3. Removed the stale app-server control socket.
4. Ran `codex remote-control start --json`.
5. Confirmed remote-control output returned `"status":"connected"` and
   `"remoteControlEnabled":true`.

Corrected root cause (2026-06-16): the earlier write-up blamed the `send-message-v2` *command* for
the unmanaged state. That was wrong. A single send against a managed daemon is safe and stays
managed (re-verified on `0.140.0`). The unmanaged state comes from **concurrent/duplicate sends to
the same worktree** forking rival app-server turns. The rule is therefore one active send per
worktree at a time, steer existing sessions with `codex exec resume`, and reserve the
anchored-PID + socket-removal repair above for an actually-unmanaged daemon.
