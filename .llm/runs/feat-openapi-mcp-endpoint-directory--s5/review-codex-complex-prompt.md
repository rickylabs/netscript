# Opposite-family substantive review — OMB S5 / PR #1194

You are the independent Claude-family reviewer for Codex-authored implementation on the canonical
`review_codex_complex` lane (Anthropic Fable 5, medium effort). Work read-only except for the one
review artifact named below. Do not modify product code, tests, docs, lockfiles, or other harness
artifacts.

Route note: the primary `fable-5` launch (session `1abc6d8e-4c4a-4677-81dd-057eaab9145d`)
returned provider `model_not_found` before review or token use. This turn is the configured
Claude-family Opus 4.8 fallback at the same medium effort. Record both identities and the fallback
reason explicitly.

Review the complete changeset from baseline `2c8865e8c` through current `HEAD` for issue #1131,
epic #1126, RFC PR #1123. Read the issue and RFC with `gh` first, then read:

- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md`
- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P3-verdict.md`
- `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/plan.md`
- `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/design.md`
- relevant implementation, public exports, fixtures, and package documentation

Adversarially assess contract correctness, all four source outcomes, qualified F1(b) precedence,
manifest identity safety, Aspire CLI failure states/parsing, deterministic conflict reporting,
exclusion-before-network behavior, row-local hard timeouts including a non-cooperative hanging spec
fetch, parent cancellation, credential/redirect/response bounds, spec-first reused-port identity,
exact P3 `spec_unavailable` guidance, public API/JSDoc quality, A2 layering/S4 independence, and
whether the issue acceptance boxes are actually proven. Run focused read-only validation when it
materially strengthens a finding.

Write only
`.llm/runs/feat-openapi-mcp-endpoint-directory--s5/review-codex-complex.md` with:

1. requested and observed route identity;
2. findings ordered by severity, each with exact file/line evidence and a concrete remedy;
3. acceptance-box verdicts;
4. final `PASS` only if there are no unresolved substantive findings, otherwise `FAIL`.

Do not post to GitHub, commit, push, change PR state, or mark the issue complete.
