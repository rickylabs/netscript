# Run resource leak report

Generated: 2026-08-03T22:53:01.596Z
Worktree: `/home/codex/repos/ns005-ffi`
Aspire probe: ok
Docker probe: ok

## container: postgres-94744ae0 (d18eb7afef93cecbaed98e98662e47055de255b4051b7f2697e073fc5fc71dda)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 177038 ms
- Stale: false
- User command: `docker rm -f 'd18eb7afef93cecbaed98e98662e47055de255b4051b7f2697e073fc5fc71dda'`

## container: postgres-a33c4906 (00ac57e0417b55ed41b3b391dd47fce65e56c14fc188ba102d0490e8c6755bd5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 511409 ms
- Stale: false
- User command: `docker rm -f '00ac57e0417b55ed41b3b391dd47fce65e56c14fc188ba102d0490e8c6755bd5'`

## container: postgres-a72ab450 (9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 10530053 ms
- Stale: true
- User command: `docker rm -f '9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de'`

## container: postgres-9c6839ec (7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 10983265 ms
- Stale: true
- User command: `docker rm -f '7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5'`

