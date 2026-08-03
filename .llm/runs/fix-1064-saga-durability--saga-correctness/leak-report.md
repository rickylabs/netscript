# Run resource leak report

Generated: 2026-08-03T07:02:44.863Z Worktree: `/home/codex/repos/ns004-sagas` Aspire probe: ok
Docker probe: ok

## container: netscript-saga-1075-garnet (7df337717f038f817f4244570041bb292caad39a1728e9c414e89795aa8a67ee)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns004-sagas`
- Age: 8331 ms
- Stale: false
- User command: `docker rm -f '7df337717f038f817f4244570041bb292caad39a1728e9c414e89795aa8a67ee'`

## container: netscript-saga-1075-redis (be6df20c2f4f2fdb30e9bc6d299a18f5e9101f7851b449d01604563a0dfb9c34)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns004-sagas`
- Age: 1255987 ms
- Stale: false
- User command: `docker rm -f 'be6df20c2f4f2fdb30e9bc6d299a18f5e9101f7851b449d01604563a0dfb9c34'`
