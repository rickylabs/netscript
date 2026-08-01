# Run resource leak report

Generated: 2026-08-01T22:22:36.581Z
Worktree: `/home/codex/repos/fix-1046`

## apphost: /home/codex/repos/fix-1018/.llm/tmp/cli-e2e/plugin-smoke-20260802-001712/aspire/apphost.mts (pid 121710)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1018`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/fix-1018/.llm/tmp/cli-e2e/plugin-smoke-20260802-001712/aspire/apphost.mts' --non-interactive --nologo`

## container: redis-zgvgzgxu (6ceff5cb60a56c2b5e0516b4e4bbcfdd2d0f8c8017be1619822a2038ab38fc6a)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1018`
- Age: 48753 ms
- Stale: false
- User command: `docker rm -f '6ceff5cb60a56c2b5e0516b4e4bbcfdd2d0f8c8017be1619822a2038ab38fc6a'`

## container: garnet-cvgkbpae (45e504cdbdbbb66aff57e421eaee423d23ff2037466f5bf2bbb9480f0b182cb6)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 48853 ms
- Stale: false
- User command: `docker rm -f '45e504cdbdbbb66aff57e421eaee423d23ff2037466f5bf2bbb9480f0b182cb6'`

## container: postgres-a49c78cb (8915712d0036c9de463cfbff7d2bb753153578d228e55f2d17d66020966fdab5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1018`
- Age: 273592 ms
- Stale: false
- User command: `docker rm -f '8915712d0036c9de463cfbff7d2bb753153578d228e55f2d17d66020966fdab5'`

## container: postgres-bc75ea00 (d8ff61336f8b9ff653c173c7ee6ee38d252af79931218dd3b1f264dc3ff98b13)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1025`
- Age: 1939812 ms
- Stale: false
- User command: `docker rm -f 'd8ff61336f8b9ff653c173c7ee6ee38d252af79931218dd3b1f264dc3ff98b13'`

