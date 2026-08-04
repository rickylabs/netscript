# Run resource leak report

Generated: 2026-08-04T07:06:18.968Z
Worktree: `/home/codex/repos/ns005-sagas`
Aspire probe: ok
Docker probe: ok

## container: postgres-da3108cc (4f3a66255600e59cac2e01c5a97fd5e56863f55281ab46ee56eb7167b65cae7c)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 76795 ms
- Stale: false
- User command: `docker rm -f '4f3a66255600e59cac2e01c5a97fd5e56863f55281ab46ee56eb7167b65cae7c'`

## container: postgres-39683b53 (7585b4bd24e5065aebc0b4b246bd0a1e1ab4bfd8ba9a29235560fcf7442d7d5d)

- Ownership: `owned`
- Apparent owner: `/home/codex/repos/ns005-sagas`
- Age: 224479 ms
- Stale: false
- User command: `docker rm -f '7585b4bd24e5065aebc0b4b246bd0a1e1ab4bfd8ba9a29235560fcf7442d7d5d'`

## container: postgres-a72ab450 (9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 40127425 ms
- Stale: true
- User command: `docker rm -f '9e035d32c708ff2bf25991329a0bc55eab088b30efbc1d4f110ba8efa27fc4de'`

## container: postgres-9c6839ec (7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/wave4-deepseek-004`
- Age: 40580637 ms
- Stale: true
- User command: `docker rm -f '7d13b6b4b5b48f3287f181fa24467c07b3369e424a6a32c8f500a537e3e889d5'`

