---
name: codex-wsl-remote
description: Use for NetScript Codex Desktop/mobile remote-control through WSL SSH, especially when launching or supervising mobile-visible Codex app-server sessions, choosing native WSL worktree paths, recovering unmanaged app-server daemon state without interrupting active sessions, verifying full-access app-server settings, or running Deno/Aspire CLI E2E gates without `/mnt/c` DrvFS failures.
---

# Codex WSL Remote

## Purpose

Use this skill when a NetScript task needs Codex Desktop or mobile to steer local work through WSL.
The verified path is:

```text
Codex Desktop/mobile -> SSH target codex-wsl -> WSL Ubuntu codex user -> codex app-server remote-control
```

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

## Verified Baseline

- WSL distro: `Ubuntu-24.04`
- WSL user: `codex`
- SSH alias: `codex-wsl`
- SSH endpoint: `127.0.0.1:2222`
- SSH identity: `C:\Users\chaut\.ssh\codex_wsl_ed25519`
- WSL Codex home: `/home/codex/.codex`
- Codex CLI/app-server: `0.140.0` (managed daemon verified 2026-06-16)
- App-server config: `approval_policy = "never"`, `sandbox_mode = "danger-full-access"`,
  `model_reasoning_effort = "medium"`, `plan_mode_reasoning_effort = "medium"`,
  `model_reasoning_summary = "auto"`, and `model_verbosity = "medium"`.
- Native WSL wave5 worktree root: `/home/codex/repos/netscript-wave5-apps`
- Deno toolchain: `2.8.x` (PR #44 upgrade). Other tool versions below are the wave5 snapshot —
  re-verify per branch with the toolchain command in [Verification Commands](#verification-commands).
- Wave5 snapshot toolchain: Deno `2.7.11`, .NET SDK `10.0.109`, Aspire CLI `13.3.0`, Docker `29.1.3`, Node `18.19.1`, npm `9.2.0`

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

The helper starts a hidden WSL keepalive, restarts WSL `ssh.service`, verifies `ssh codex-wsl`,
writes the full-access Codex app-server config with medium reasoning defaults, restarts the managed
daemon, starts `codex remote-control`, and checks the toolchain.

## Native Worktree Rule

Run full NetScript Deno/npm/Aspire gates from native WSL ext4 paths under `/home/codex/repos/`.
Do not run full CLI E2E from `/mnt/c`: Deno's internal npm materialization can hit DrvFS
`Operation not permitted (os error 1)` even when ordinary shell copy/write commands work.

Known good full E2E smoke:

```text
Cwd: /home/codex/repos/netscript-wave5-apps
Command: deno task e2e:cli run scaffold.runtime --cleanup --format pretty
Raw exit code: 0
Summary: passed=41 failed=0
Elapsed: 224s
Thread: 019ec234-4e7f-70c0-91a0-97de455702f8
Marker: CODEX_WSL_NATIVE_WORKTREE_E2E_SMOKE_PASS
```

## Verification Commands

From Windows PowerShell, verify transport:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 2222
ssh.exe codex-wsl 'echo SSH_OK; export PATH="$HOME/.local/bin:$PATH"; codex --version'
```

Verify app-server remote-control:

```powershell
ssh.exe codex-wsl 'export PATH="$HOME/.local/bin:$PATH"; codex remote-control start --json; codex app-server daemon version'
```

Expected remote-control output includes:

```text
"status":"connected"
"remoteControlEnabled":true
"serverName":"YogaBook9i"
"environmentId":"env_e_6a2d7485c5a0832a82505a12442cd3ec"
```

For passive health checks, prefer daemon status and process inspection:

```powershell
ssh.exe codex-wsl 'export PATH="$HOME/.local/bin:$PATH"; codex app-server daemon version; ps -eo user,pid,ppid,etime,cmd | grep -E "[c]odex app-server|[a]pp-server daemon" || true'
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
ssh.exe codex-wsl 'cd /home/codex/repos/netscript-wave5-apps; deno --version; dotnet --version; aspire --version; docker version --format "{{.Client.Version}} / {{.Server.Version}}"; node --version; npm --version; git status --short --branch'
```

A `send-message-v2` turn against a managed daemon is both the **launch path** for a mobile-visible
session and, with a no-edit prompt, a connectivity smoke. The `thread/start` response should report
`approvalPolicy: "never"` and `sandbox.type: "dangerFullAccess"`, emit a `threadId`, and end with
`turn/completed` / `[codex app-server exited: exit status: 0]`:

```powershell
ssh.exe codex-wsl 'cd /home/codex/repos/netscript-wave5-apps; codex debug app-server send-message-v2 "Remote smoke only. Do not edit files. Do not run validation. Reply with exactly CODEX_WSL_REMOTE_SMOKE_OK and no other prose."'
```

Capture the `threadId` from the output — that is the handle for `codex exec resume <thread-id>` if
you later need to steer the session. Confirm the thread on your phone to prove mobile visibility.

## Launching Supervisor Or Implementation Sessions

Start Desktop/mobile-visible Codex sessions from the native WSL worktree path for the relevant
branch. The wave5 family uses these native worktrees:

```text
/home/codex/repos/netscript-wave5-apps
/home/codex/repos/netscript-wave5-apps-5a-service
/home/codex/repos/netscript-wave5-apps-5b-sdk
/home/codex/repos/netscript-wave5-apps-5c-fresh-ui
/home/codex/repos/netscript-wave5-apps-5c1-ui-foundation
/home/codex/repos/netscript-wave5-apps-5c2-design-system
/home/codex/repos/netscript-wave5-apps-5d-fresh
/home/codex/repos/netscript-wave5-apps-5d1-support
/home/codex/repos/netscript-wave5-apps-5d2-builders
/home/codex/repos/netscript-wave5-apps-5d3-route
/home/codex/repos/netscript-wave5-apps-5d4-streaming
/home/codex/repos/netscript-wave5-apps-5d5-form
/home/codex/repos/netscript-wave5-apps-5d6-query
```

Launch one with a single `send-message-v2` carrying the full brief, run as a background SSH job so
the supervisor turn is not blocked. Pattern (one per worktree, sequential):

```powershell
ssh.exe codex-wsl 'export PATH="$HOME/.local/bin:$PATH"; cd <native-worktree>; codex debug app-server send-message-v2 "<full self-contained brief: use harness, activate skills, pre-flight git fetch+reset, task, constraints, reporting>"' 2>&1 | Tee-Object <log>
```

Supervise without polling: run `.llm/tools/watch-run.ts <run-dir>` as a background process — it
wakes the supervisor when the sub-agent appends `commits.md`/`worklog.md`. Steer only with
`codex exec resume <thread-id>`; never fire a second `send-message-v2` at the same worktree.

For full CLI E2E, use the `netscript-cli` skill and run:

```powershell
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

Keep `--cleanup` unless the user explicitly wants the generated runtime left running. Do not delete
lock files or caches, and do not run `deno cache --reload` without approval.

## Troubleshooting

If mobile says connection is impossible or Desktop shows a failed SSH connection:

1. Run the Windows helper above.
2. Confirm `ssh codex-wsl` reaches the `codex` user, not root.
3. Confirm `/home/codex/.codex/config.toml` contains the quoted full-access TOML values.
4. Restart only the `codex` user's app-server if remote-control reports an unmanaged daemon:

   ```powershell
   wsl.exe -d Ubuntu-24.04 -- sh -lc 'pkill -u codex -f "codex.*app-server" || true; pkill -u codex -f "app-server" || true'
   ssh.exe codex-wsl 'export PATH="$HOME/.local/bin:$PATH"; codex remote-control start --json; codex app-server daemon version'
   ```

Before restarting app-server while implementation agents are running, check whether active work would
be interrupted:

```powershell
ssh.exe codex-wsl 'ps -eo user,pid,ppid,stat,etime,cmd | grep -E "[d]eno|[d]otnet|[a]spire|[d]ocker compose|[n]pm|[n]ode|[g]it |[c]odex" | sed -n "1,200p"'
ssh.exe codex-wsl 'find ~/.codex/sessions -type f -name "*.jsonl" -printf "%T@ %TY-%Tm-%Td %TH:%TM:%TS %p\n" 2>/dev/null | sort -nr | head -20'
```

If there are no active child jobs and the latest relevant session has completed, repair an unmanaged
remote-control daemon by killing only the `codex` user's app-server processes by anchored PID match
and then starting remote-control fresh:

```powershell
ssh.exe codex-wsl 'set -e; export PATH="$HOME/.local/bin:$PATH"; pids=$(pgrep -u codex -f "^/home/codex/.codex/packages/standalone/current/codex app-server" || true); if [ -n "$pids" ]; then echo "killing app-server pids: $pids"; kill $pids; sleep 2; fi; rm -f ~/.codex/app-server-control/app-server-control.sock; codex remote-control start --json; codex app-server daemon version'
```

Do not use a broad `pkill -f "codex app-server"` inside an SSH one-liner. The pattern can match the
SSH shell command itself and terminate the repair command before it restarts remote-control.

Avoid root-owned app-server daemons for normal Desktop/mobile work. They create duplicate host chips
and stale mobile entries.

## Known Incidents

### 2026-06-14 unmanaged app-server after mobile disconnect

Symptoms:

- Mobile lost connection to the green `YogaBook9i` host.
- `Test-NetConnection 127.0.0.1 -Port 2222` passed.
- `ssh codex-wsl` passed.
- `ssh.service` was active.
- `codex app-server daemon version` reported a running app-server.
- `codex remote-control start --json` failed with:

  ```text
  Error: app server is running but is not managed by codex app-server daemon
  ```

Safe recovery used:

1. Confirmed the latest 5d2 session had completed and no `deno`, `dotnet`, `aspire`, `node`, or
   child worker commands were running.
2. Killed only the `codex` user's app-server PIDs matched by
   `^/home/codex/.codex/packages/standalone/current/codex app-server`.
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
