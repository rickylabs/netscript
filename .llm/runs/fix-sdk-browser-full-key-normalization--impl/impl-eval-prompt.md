use harness

## SKILL

- netscript-harness — execute the mandatory separate-session IMPL-EVAL protocol and write `evaluate.md`.
- netscript-doctrine — evaluate Archetype 2 framework code, public/internal boundaries, helper justification, anti-patterns, and debt delta.
- netscript-pr — verify the draft PR commit/comment trail, closing keyword, labels/milestone, and close-gate posture without changing lifecycle state.
- netscript-tools — independently run structured/static/fitness gates, preserve lock hygiene, and report exact exit codes.

You are the formal IMPL-EVAL session for issue #1824 and draft PR #1831. You must be a fresh native
Claude Fable 5 medium session, distinct from Codex generator session
`01a05611-ee74-7ff2-9234-8e00691a3523` and all Opus slice-review sessions.

Read and follow completely:

- `.llm/harness/evaluator/protocol.md`
- `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/workflow/run-loop.md`
- `.llm/harness/archetypes/ARCHETYPE-2-integration.md`
- `.llm/harness/archetypes/SCOPE-frontend.md`
- `.llm/harness/gates/archetype-gate-matrix.md`
- `.llm/harness/debt/arch-debt.md` (relevant SDK/Aspire entries)
- every tracked file in `.llm/runs/fix-sdk-browser-full-key-normalization--impl/`

Evaluate branch head `b05ae25b88de089781ab581e77b3f0567628f780` against the run plan, baseline,
and current `main`. Verify `PLAN-EVAL: N/A` was justified before implementation, the Design
checkpoint and two commit slices were followed, RED preceded GREEN, all owner-required contracts
are covered, every recorded gate result is truthful, no public/dependency/lock/debt drift exists,
and no forbidden `any`, unsafe cast, or lint-ignore was introduced.

The live commit trail is:

- `e5dd8dbc591e856698cda8b8c1e58b03e95d09f8` — contract tests + RED + harness bootstrap.
- `b05ae25b88de089781ab581e77b3f0567628f780` — source normalization + GREEN/gate evidence.
- PR #1831 per-slice IMPL comments: IDs `5473870091` and `5473934006`.

PR #1831 is intentionally draft with exactly these labels: `type:fix`, `area:sdk`, `area:aspire`,
`priority:p2`, `status:impl`, `orchestrator:aspire`; milestone 0.0.7; `Closes #1824` in Scope. The
owner explicitly forbids marking ready-for-review. Issue #1824 has no acceptance/gate checkboxes.

Run the smallest independent gate set sufficient to substantiate the verdict. Do not start Aspire,
Docker, Playwright, browser tooling, or any runtime service; runtime is an explicit owner-constrained
N/A for this pure string contract. Do not edit product source, tests, plan, worklog, context pack,
drift, PR, issue, or labels. Write exactly one repository file:

`.llm/runs/fix-sdk-browser-full-key-normalization--impl/evaluate.md`

Use `.llm/harness/templates/evaluate.md`, keep evidence concise but complete, and emit exactly one
verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. In your final response also state the
observed model, effort, session id, commands with exit codes, findings, and verdict.
