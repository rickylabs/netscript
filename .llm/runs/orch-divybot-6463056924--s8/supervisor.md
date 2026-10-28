# S8 supervisor

- Assignment: #2430; one feature-tier leaf, one PR to main.
- Baseline: `2560bf564d3c99d6c021fd3f6a0966303ee9b569`.
- Branch: `orch/divybot-6463056924`.
- Implementer: Codex, requested `gpt-6.1-sol`, xhigh.
- Evaluator: separate read-only Claude session, `claude-opus-5-5`, high, per owner override.
- Public identity excludes machine names, absolute operator paths and session identifiers.

## Writable surface

- `docs/site/_includes/**`
- `docs/site/_components/**` except `_components/design/**`
- `docs/site/styles/**`
- `docs/site/assets/**` except `assets/design-system/**`
- `docs/site/_config.ts`, `docs/site/_data.ts`, top-level docs site pages
- `.llm/runs/orch-divybot-6463056924--s8/**`
- Docs-specific gate/browser tooling and CI integration if required, with exact paths declared in the plan before changes.

Never edit `docs/site/design-system/**` or `docs/site/reference/fresh-ui/**`. Never stage the assignment file. No labels, force pushes, merges, tags or releases.

## Routing

Resolved with `deno task agentic:matrix --tier feature --json`: implementation primary `sol` / xhigh; plan evaluation `glm_5_3` then `fable_5_1`; implementation evaluation `muse_spark_1_3` then `opus_5`. Owner explicitly overrides both evaluation routes: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.”

Exact additional writable paths: `tools/docs-site/**`, `tools/fresh-ui-browser/docs.playwright.config.ts`, `tools/fresh-ui-browser/tests/docs.spec.ts`, `.github/workflows/pages.yml`. These docs-specific gates are necessary to deliver CI evidence without editing framework code.

## Owner-directed continuation

After both plan failures were surfaced, the owner directed: “If more work remains, keep going and mark ready when done.” This resumes the work on the concrete B3 amendment. Preserve both historical FAIL_PLAN verdicts and get independent confirmation of the corrected plan before implementation. Keep the PR in draft until the actual revamp and gates are complete.

Coordinator disposition: “approves amendment B3 with two conditions: the source img uses the hidden attribute and loading=lazy, and IMPL-EVAL verifies the twin and accessible-name assertions. The plan gate is closed by this approval. Proceed through slices 1-5 now from head 74d15bd, push every step to PR 2439, and stop at READY. Everything is approved, never wait.”
