# Run resource leak report

Generated: 2026-08-04T00:18:10.734Z
Worktree: `/home/codex/repos/ns005-sagas`
Aspire probe: ok
Docker probe: ok

## container: postgres-a72ab450 (9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 15639191 ms
- Stale: true
- User command: `docker rm -f '9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de'`

## container: postgres-9c6839ec (7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 16092403 ms
- Stale: true
- User command: `docker rm -f '7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5'`

