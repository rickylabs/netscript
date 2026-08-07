# Context pack

- Baseline/main: `fc70a97d1664c1729c0c9c49cf0fba48fcaf2df3`
- Failed immutable canary: `v0.0.5-canary.15` → `85eb9352d301aeee470dd62aa5dd5e8257d47858`
- Release workflow: https://github.com/rickylabs/netscript/actions/runs/31196590524
- Pinned E2E: https://github.com/rickylabs/netscript/actions/runs/31196896495
- Owning issue: https://github.com/rickylabs/netscript/issues/1345
- Repair PR: https://github.com/rickylabs/netscript/pull/1346
- Frozen implementation head: `8f1c5785171938583f30c1a0a089bd296fb550d3`
- Local release gates: published quickstart 10/10 and canonical `scaffold.runtime` 76/76, both exit 0.
- Independent IMPL-EVAL: PASS; receipt commit `6adcc6ba8`, separate DeepSeek session `f990a3c2-a5c4-4684-8a68-554e5b1108a1`.
- PR #1346: ready for review; current-head required CI is the remaining merge boundary.
- Deferred external-checkout observation: #1343, milestone 0.0.6, untouched
- Writer: this sole root thread; no OpenHands or duplicate orchestrator
- Protected coordination/release locks and foreign worktrees remain untouched.
