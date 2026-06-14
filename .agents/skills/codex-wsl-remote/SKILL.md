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

Do not use Windows `codex exec --json` threads as the sync mechanism for Desktop/mobile. Those
threads can persist and resume locally, but Desktop deep links can hang while loading `codex_exec`
sessions. Use the WSL app-server remote-control workflow for user-visible, steerable sessions.

## Verified Baseline

- WSL distro: `Ubuntu-24.04`
- WSL user: `codex`
- SSH alias: `codex-wsl`
- SSH endpoint: `127.0.0.1:2222`
- SSH identity: `C:\Users\chaut\.ssh\codex_wsl_ed25519`
- WSL Codex home: `/home/codex/.codex`
- Codex CLI/app-server: `0.139.0`
- App-server config: `approval_policy = "never"` and `sandbox_mode = "danger-full-access"`
- Native WSL wave5 worktree root: `/home/codex/repos/netscript-wave5-apps`
- Verified toolchain: Deno `2.7.11`, .NET SDK `10.0.109`, Aspire CLI `13.3.0`, Docker `29.1.3`, Node `18.19.1`, npm `9.2.0`

The Windows-side helper lives at:

```powershell
$env:USERPROFILE\.codex\skills\codex-wsl-remote\scripts\start-codex-wsl-remote.ps1
```

Run it from Windows PowerShell when transport needs restoration:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.codex\skills\codex-wsl-remote\scripts\start-codex-wsl-remote.ps1"
```

The helper starts a hidden WSL keepalive, restarts WSL `ssh.service`, verifies `ssh codex-wsl`,
writes the full-access Codex app-server config, restarts the managed daemon, starts
`codex remote-control`, and checks the toolchain.

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

Do not use `codex debug app-server send-message-v2` as a routine health check after remote-control
has been restored. On Codex CLI `0.139.0`, that debug client can leave the running app-server in a
state where `codex remote-control start --json` later fails with:

```text
Error: app server is running but is not managed by codex app-server daemon
```

Use Desktop/mobile itself to verify user-visible remote threads once the passive checks show
remote-control is connected.

Verify the native NetScript toolchain:

```powershell
ssh.exe codex-wsl 'cd /home/codex/repos/netscript-wave5-apps; deno --version; dotnet --version; aspire --version; docker version --format "{{.Client.Version}} / {{.Server.Version}}"; node --version; npm --version; git status --short --branch'
```

Only run a debug app-server turn when explicitly diagnosing app-server turn startup, and expect to
restore remote-control afterward. The `thread/start` response should report
`approvalPolicy: "never"` and `sandbox.type: "dangerFullAccess"`:

```powershell
ssh.exe codex-wsl 'cd /home/codex/repos/netscript-wave5-apps; codex debug app-server send-message-v2 "Remote smoke only. Do not edit files. Do not run validation. Reply with exactly CODEX_WSL_REMOTE_SMOKE_OK and no other prose."'
```

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

Additional lesson: a later `codex debug app-server send-message-v2` smoke returned the expected
marker, but immediately put remote-control back into the unmanaged state. Treat debug app-server
turns as diagnostic only, not as the normal mobile-connectivity smoke.
