# Run resource leak report

Generated: 2026-08-04T08:22:19.598Z
Worktree: `/home/codex/repos/ns005-sagas`
Aspire probe: ok
Docker probe: ok

## container: postgres-304cc72a (efaa4f2fa0ba03376cc4a37fcc0957059b3e0481fcf5e3df5b5d35714fda4bb8)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: 2545438 ms
- Stale: false
- User command: `docker rm -f 'efaa4f2fa0ba03376cc4a37fcc0957059b3e0481fcf5e3df5b5d35714fda4bb8'`

## container: postgres-1e56f686 (9c7402de5502a4ba8f254066c8abdf7fe4a81bd5a47e7ed93970186b0e52653a)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/ns005-s7`
- Age: 2754706 ms
- Stale: false
- User command: `docker rm -f '9c7402de5502a4ba8f254066c8abdf7fe4a81bd5a47e7ed93970186b0e52653a'`

