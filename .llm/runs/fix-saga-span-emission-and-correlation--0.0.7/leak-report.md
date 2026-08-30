# Run resource leak report

Generated: 2026-08-30T20:03:58.322Z
Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1368`
Aspire probe: ok
Docker probe: ok

## apphost: /home/agent/projects/netscript/worktrees/007-leaf-1368/.llm/tmp/cli-e2e/plugin-smoke-20260830-215928/aspire/apphost.mts (pid 3675218)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/netscript/worktrees/007-leaf-1368`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/agent/projects/netscript/worktrees/007-leaf-1368/.llm/tmp/cli-e2e/plugin-smoke-20260830-215928/aspire/apphost.mts' --non-interactive --nologo`

## container: postgres-ea82a7a4 (8191b5b4ee7b52f231847f688ba08038c1182ece9340076ea785d1cb71296263)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/netscript/worktrees/007-leaf-1368`
- Age: 156956 ms
- Stale: false
- User command: `docker rm -f '8191b5b4ee7b52f231847f688ba08038c1182ece9340076ea785d1cb71296263'`

## container: garnet-yuzxeuph (e648d4bdb835e878dd63cd1639b9d9e4cfa0b7b2b352fbee005a77a94ecf99e3)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 156988 ms
- Stale: false
- User command: `docker rm -f 'e648d4bdb835e878dd63cd1639b9d9e4cfa0b7b2b352fbee005a77a94ecf99e3'`

## container: redis-xtkbqusu (3af5f32b2db77c5cbb2d107c0475e7549965b85b651f5719c3420ef73bf2225f)

- Ownership: `owned`
- Apparent owner: `/home/agent/projects/netscript/worktrees/007-leaf-1368`
- Age: 156992 ms
- Stale: false
- User command: `docker rm -f '3af5f32b2db77c5cbb2d107c0475e7549965b85b651f5719c3420ef73bf2225f'`

