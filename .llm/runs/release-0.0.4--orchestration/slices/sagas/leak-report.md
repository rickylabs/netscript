# Run resource leak report

Generated: 2026-08-03T08:47:40.034Z
Worktree: `/home/codex/repos/ns004-sagas`
Aspire probe: ok
Docker probe: ok

## apphost: /home/codex/repos/ns004-hygiene/.llm/tmp/cli-e2e/plugin-smoke-20260803-104336/aspire/apphost.mts (pid 3117069)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns004-hygiene`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/ns004-hygiene/.llm/tmp/cli-e2e/plugin-smoke-20260803-104336/aspire/apphost.mts' --non-interactive --nologo`

## container: redis-ghmmmvan (3d66b3244cefea028c8f15473a7181aab0f98b958623fb5f8a799f35211a42ec)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns004-hygiene`
- Age: 126510 ms
- Stale: false
- User command: `docker rm -f '3d66b3244cefea028c8f15473a7181aab0f98b958623fb5f8a799f35211a42ec'`

## container: postgres-ae2b327c (fb9a7257241c8f5d071d9951d654cce7b28f3656ecb9d9e8ef0ef6c14c4adbb0)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns004-hygiene`
- Age: 212486 ms
- Stale: false
- User command: `docker rm -f 'fb9a7257241c8f5d071d9951d654cce7b28f3656ecb9d9e8ef0ef6c14c4adbb0'`

