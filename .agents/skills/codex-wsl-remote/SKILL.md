---
name: codex-wsl-remote
description: Use for NetScript Codex Desktop/mobile remote-control through WSL SSH, especially when launching or supervising mobile-visible Codex app-server sessions, choosing native WSL worktree paths, verifying full-access app-server settings, or running Deno/Aspire CLI E2E gates without `/mnt/c` DrvFS failures.
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

Verify the native NetScript toolchain:

```powershell
ssh.exe codex-wsl 'cd /home/codex/repos/netscript-wave5-apps; deno --version; dotnet --version; aspire --version; docker version --format "{{.Client.Version}} / {{.Server.Version}}"; node --version; npm --version; git status --short --branch'
```

Verify app-server turns are full access. The `thread/start` response should report
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

Avoid root-owned app-server daemons for normal Desktop/mobile work. They create duplicate host chips
and stale mobile entries.
