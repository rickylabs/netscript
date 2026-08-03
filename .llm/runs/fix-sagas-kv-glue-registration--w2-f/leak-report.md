# Run resource leak report

Generated: 2026-08-03T23:16:38.579Z
Worktree: `/home/codex/repos/ns005-sagas`
Aspire probe: ok
Docker probe: ok

## container: postgres-eeb5d303 (28b23d70be9aaa0315a038d3d97c1922a523dc8c32543089d5fb4619f197deef)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 329886 ms
- Stale: false
- User command: `docker rm -f '28b23d70be9aaa0315a038d3d97c1922a523dc8c32543089d5fb4619f197deef'`

## container: postgres-4b152c74 (0cedb39362b0657fe1d816f88625e8158554b3873c2bda86a4b81f7d6f3a3e79)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 436597 ms
- Stale: false
- User command: `docker rm -f '0cedb39362b0657fe1d816f88625e8158554b3873c2bda86a4b81f7d6f3a3e79'`

## container: postgres-9366fbf8 (e73122377fda01ac03b9c2395980e988ac7e4ce25fb97973a34d8125d6b7bdd3)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 828180 ms
- Stale: false
- User command: `docker rm -f 'e73122377fda01ac03b9c2395980e988ac7e4ce25fb97973a34d8125d6b7bdd3'`

## container: postgres-94744ae0 (ae9e2cee69dec48bc157f706e85b7cc0bd106dc467eebcf607f06ec6d242889c)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 1370140 ms
- Stale: false
- User command: `docker rm -f 'ae9e2cee69dec48bc157f706e85b7cc0bd106dc467eebcf607f06ec6d242889c'`

## container: postgres-a72ab450 (9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 11947036 ms
- Stale: true
- User command: `docker rm -f '9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de'`

## container: postgres-9c6839ec (7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 12400248 ms
- Stale: true
- User command: `docker rm -f '7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5'`

