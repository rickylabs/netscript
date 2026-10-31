# Published generated-surface verification — issue 1912

Implementation: Codex, owner-assigned existing branch `orch/divybot-6544155256`.
Baseline: `eb9a1299b04a48ffe51348d15bb542606b7a6f82`.
Tier: straightforward; matrix implementation primary sol (effort xhigh), declared fallback glm_5_3_flash. Owner explicitly requests medium implementation effort.
Evaluator override, verbatim: "run the final IMPL-EVAL with claude -p --model claude-opus-5-5 --effort high (read-only, stdin closed) ending in VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>". This different-family, separate-session owner override supersedes the matrix implementation evaluator route.

Allowed tracked writes: `.github/workflows/e2e-cli-prod.yml`, `.github/scripts/check-published-generated-surface.ts`, and `.llm/runs/orch-divybot-6544155256--1912/**`.
Allowed untracked scratch: project run evidence outside Git and system temporary directories; excluded final-report handoff files.
No product code, labels, milestones, releases or merges. Public evidence excludes machine identity, absolute paths and session identities.

CI-repair scope extension (owner request to fix red quality): `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv`, regenerated only by the canonical aspire-surface-manifest.ts. The new smoke script is an Aspire mention and requires its generated manifest row. No product code or scan-policy exemption is authorized.
