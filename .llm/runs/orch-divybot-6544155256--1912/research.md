# Research

Issue 1912 coordinator re-check confirms boxes 1–7 shipped in 0.0.8; box 8 lacks published Linux/Windows evidence. Related PRs 2217, 2277, 2331 and 2330 are merged and deliver implementation, not this missing smoke. No duplicate verification PR was found.

NetScript MCP guidance and documentation search were consulted. Public CLI documentation defines JSON status current/0, drift/1 with bytes findings, and generated project-relative inventory paths.

The deps/latest.ts wrapper, run against an isolated manifest importing @netscript/cli, reports stable 0.0.8. GitHub's latest release is v0.0.8; select that approved stable artifact explicitly. The published CLI help confirms version 0.0.8 and init/plugin install options.

No workflow contains windows-latest. Existing e2e-cli-prod.yml accepts a published-version dispatch input and runs Ubuntu release smoke. Add an opt-in dispatch-only Windows parity lane there; preserve default release dispatch behavior. A standalone new workflow cannot be dispatched until registered on the default branch.
