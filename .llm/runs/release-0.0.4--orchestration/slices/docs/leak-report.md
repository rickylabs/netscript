# Run resource leak report

Generated: 2026-08-03T09:02:55.495Z
Worktree: `/home/codex/repos/ns004-docs`
Aspire probe: ok
Docker probe: ok

## apphost: /home/codex/repos/ns004-hygiene/.llm/tmp/cli-e2e/plugin-smoke-20260803-105203/aspire/apphost.mts (pid 3175845)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns004-hygiene`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/ns004-hygiene/.llm/tmp/cli-e2e/plugin-smoke-20260803-105203/aspire/apphost.mts' --non-interactive --nologo`

## container: postgres-d38d9cd5 (5bf89c715f6593af49bdf3c6e101401fcbfcc66dc35747b1e435b489bdc2782f)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns004-hygiene`
- Age: 80772 ms
- Stale: false
- User command: `docker rm -f '5bf89c715f6593af49bdf3c6e101401fcbfcc66dc35747b1e435b489bdc2782f'`

## container: redis-vzrcrjhz (321702fe6c1267ae1228373bee8949f33c6b08c726daee022690968f217a2ba7)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns004-hygiene`
- Age: 81007 ms
- Stale: false
- User command: `docker rm -f '321702fe6c1267ae1228373bee8949f33c6b08c726daee022690968f217a2ba7'`

