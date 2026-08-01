# Run resource leak report

Generated: 2026-08-01T22:28:44.603Z
Worktree: `/home/codex/repos/fix-1046`

## apphost: /home/codex/repos/fix-1025/.llm/tmp/cli-e2e/plugin-smoke-20260802-002324/aspire/apphost.mts (pid 146924)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1025`
- Age: unknown
- Stale: false
- User command: `aspire stop --apphost '/home/codex/repos/fix-1025/.llm/tmp/cli-e2e/plugin-smoke-20260802-002324/aspire/apphost.mts' --non-interactive --nologo`

## container: garnet-nuvrrafd (cd2ba25ba81cd282991a0c8c0465c20ce5e348137af0548221b0910788dc9729)

- Ownership: `unproven`
- Apparent owner: `unknown`
- Age: 106009 ms
- Stale: false
- User command: `docker rm -f 'cd2ba25ba81cd282991a0c8c0465c20ce5e348137af0548221b0910788dc9729'`

## container: redis-gacgwedg (0a53946f57a59f643247dda5f0191cdf803d6e6527ef9dc5fc29e1bbb6aac594)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1025`
- Age: 106078 ms
- Stale: false
- User command: `docker rm -f '0a53946f57a59f643247dda5f0191cdf803d6e6527ef9dc5fc29e1bbb6aac594'`

## container: postgres-dda83380 (97aacabc92098dfd66de0a639b2e763682a0083c177ac9786add0255605cc707)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1025`
- Age: 233447 ms
- Stale: false
- User command: `docker rm -f '97aacabc92098dfd66de0a639b2e763682a0083c177ac9786add0255605cc707'`

## container: postgres-bc75ea00 (d8ff61336f8b9ff653c173c7ee6ee38d252af79931218dd3b1f264dc3ff98b13)

- Ownership: `foreign`
- Apparent owner: `/home/codex/repos/fix-1025`
- Age: 2307834 ms
- Stale: false
- User command: `docker rm -f 'd8ff61336f8b9ff653c173c7ee6ee38d252af79931218dd3b1f264dc3ff98b13'`

