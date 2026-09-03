# Merge packet — PR #1975 (README install-root isolation, #1881 / #863 gate 3)

- PR: https://github.com/rickylabs/netscript/pull/1975 — non-draft, base `main`, milestone 0.0.7
- **Exact head: `8e54ccfa19ea84bfb18fc9a06ba75f4c01fb32e6`** (`8e54ccfa1`) — merge this SHA only
- Commits over main `45e57377f`: `b1aafaaa6` RED · `0650f6f7b` GREEN · `2e2bb84c8` harness docs · `8e54ccfa1` manifest regen
- Product/gate diff: `packages/cli/e2e` only (readme-command.ts, aspire-walk.ts optional `env`, readme-quickstart-suite.ts `--allow-env=PATH`, two tests). README.md / workflows / cleanup gates untouched.
- Exact-head CI (run 33707890868 + 33707890827): quality ✅ check-test ✅ code-quality ✅ close-gate ✅ (rerun after label, PASS at head) · classify ✅ · runtime tiers skipping (no runtime-relevant change)
- IMPL-EVAL: PASS, separate opposite-family session (GLM 5.3 Flash xhigh) — issuecomment-5519404999; verdict `slices/leaf-1881-fix/impl-eval-verdict.md`; F1–F4 informational
- Review threads: 0 · mergeStateStatus CLEAN · labels `status:ready-merge type:fix area:cli area:aspire gate:e2e priority:p0 orchestrator:aspire`
- Closing keywords: none (`Part of #1881`, `Part of #863`) — #1881 stays open until the hosted transcript is attached
- Post-merge: no Canary 10, no republish. Dispatch from main: `gh workflow run e2e-cli-prod.yml --ref main -f published-version=0.0.7-canary.9`
