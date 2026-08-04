# Run resource leak report

Generated: 2026-08-04T08:38:21.745Z
Worktree: `/home/codex/repos/ns005-ports`
Aspire probe: ok
Docker probe: ok

## apphost: /home/codex/repos/ns005-s7/.llm/tmp/cli-e2e/plugin-smoke-20260804-103101/aspire/apphost.mts (pid 812507)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/ns005-s7/.llm/tmp/cli-e2e/plugin-smoke-20260804-103101/aspire/apphost.mts' --non-interactive --nologo`

## apphost: /home/codex/repos/ns005-s7/.llm/tmp/cli-e2e/plugin-smoke-20260804-103101/aspire/db-operation/apphost.mts (pid 817422)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/ns005-s7/.llm/tmp/cli-e2e/plugin-smoke-20260804-103101/aspire/db-operation/apphost.mts' --non-interactive --nologo`

## container: redis-qqcdszxr (e7d523738d9092daeb68f5c0e31c25f590fea2c055d15824deddf4f8d571fdcc)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: 64246 ms
- Stale: false
- User command: `docker rm -f 'e7d523738d9092daeb68f5c0e31c25f590fea2c055d15824deddf4f8d571fdcc'`

## container: garnet-bzvukrsc (5e942140739822c871ceffbce60363b2c4ca3919c322e7f899f570bf138c6e92)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 64274 ms
- Stale: false
- User command: `docker rm -f '5e942140739822c871ceffbce60363b2c4ca3919c322e7f899f570bf138c6e92'`

## container: postgres-255d3245 (f8092bce923777d1f29a4c2bcbb35824fcb193a69f6845540f313b581d84d187)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: 153855 ms
- Stale: false
- User command: `docker rm -f 'f8092bce923777d1f29a4c2bcbb35824fcb193a69f6845540f313b581d84d187'`

## container: garnet-fkrupktk (b6708d49fef660e74f59cd10dc0692c7b4e1af9384f694e05f86b70d3f617b62)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 154254 ms
- Stale: false
- User command: `docker rm -f 'b6708d49fef660e74f59cd10dc0692c7b4e1af9384f694e05f86b70d3f617b62'`

## container: redis-nxhpbghf (b90022b84ec9ceb17c8f2a72c24995168d2d34ab2cc8c5e4ac947f9e66e932bd)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: 154267 ms
- Stale: false
- User command: `docker rm -f 'b90022b84ec9ceb17c8f2a72c24995168d2d34ab2cc8c5e4ac947f9e66e932bd'`

## container: postgres-0a57a038 (d81b647c0ef8c4fe24dcceb6f9ab4faa064a7a4503af0c5de5018cf705a71d0d)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: 398179 ms
- Stale: false
- User command: `docker rm -f 'd81b647c0ef8c4fe24dcceb6f9ab4faa064a7a4503af0c5de5018cf705a71d0d'`

