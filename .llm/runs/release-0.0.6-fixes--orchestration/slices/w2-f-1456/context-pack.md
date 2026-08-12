# Context pack — W2-F #1456

- Branch is clean at `origin/main@3c9dc1f39` at bootstrap.
- PLAN-EVAL is N/A by owner direction and deterministic issue contract.
- Implementation route matches Codex GPT-5.6 Sol medium.
- Root cause: exact version rejected by resolver; validator cannot see requested version; generated root imports may also substitute CLI release.
- Required negative control: requested `0.0.6-canary.2` versus `latest: 0.0.5`.
- IMPL-EVAL remains automatic on draft → ready; do not waive or manually duplicate.

