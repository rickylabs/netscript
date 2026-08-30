# PLAN-EVAL — docs-background-reference-preflight--1770

- Plan evaluator session: native Anthropic Claude Fable 5, medium (requested) / native Anthropic
  Claude Fable 5, medium (observed) — session `017op5BRKMFMRHGH3TRdnBM3`, background job
  `d32bb113`, 2026-08-30. Fresh opposite-family session; generator was Codex GPT-5.6 Sol medium
  (`supervisor.md`, `codex-thread-ids.md`).
- Run: `docs-background-reference-preflight--1770`
- Surface / archetype: `docs/site` public troubleshooting prose + generator-owned derived assets /
  `N/A — docs-only`
- Scope overlays: `SCOPE-docs.md`

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` re-baselines at `3e5cbabf`; verified `git rev-parse HEAD origin/main` both `3e5cbabfcd0a…` and `git grep -c "background reference" -- docs/site` exits 1 with no matches. Findings 1–5 spot-checked (see Notes). |
| Decisions locked                        | PASS              | `plan.md` Locked Decisions D1–D5, each with rationale; mirrored in `worklog.md` Decisions. |
| Open-decision sweep                     | PASS              | `plan.md` Open-Decision Sweep lists new page / wording change / Aspire-version, all "safe to defer" with reasons. Evaluator sweep found no rework-forcing open decision (below). |
| Commit slices (< 30, gate + files each) | PASS              | `worklog.md` Design → Commit Slices: S1 (prose + run artifacts) and S2 (four derived files), each with proving gates and file lists. S1's gate list names the brief's gate set by category; the concrete commands are enumerated in the staged brief `/home/agent/docs-1770-brief.md` §Gates (12 commands) — see Notes. |
| Risk register                           | PASS              | `plan.md` Risk Register: six risks with mitigations (invented variant, misframing, stale generated list, wrong provenance, baseline red, lock churn). |
| Gate set selected                       | PASS              | Docs overlay gates (source alignment, scope separation, link integrity, terminology, drift log) named in `plan.md` Fitness Gates; concrete command set = brief §Gates + S2 checks (`check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`); all tasks verified present in root `deno.json`. Package/plugin fitness gates correctly N/A. |
| Deferred scope explicit                 | PASS              | `plan.md` Non-Scope and `worklog.md` Design → Deferred Scope. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | `research.md` marks N/A with reason: docs-only slice; the only `packages/**` changes are generator outputs. Correct. |

## Open-decision sweep (evaluator-run)

None that would force rework. Decisions checked and found closed:

- **Placement (D1).** `deploy-local-aspire.md:164` already carries the
  `Footguns when \`aspire start\` will not boot` callout as an HTML `<ul>` inside a Vento
  `{{ comp callout }}`; a new `<li>` there is the natural extension. The alternative surface
  `docs/site/background-processing/how-to/` contains only task-runtime recipes
  (`add-a-task-runtime-adapter`, `restrict-worker-task-permissions`, `run-a-polyglot-task`,
  `tune-worker-runtime`) — none about AppHost boot. D1 is the right call.
- **Message quoting (D2).** The source builds the two strings from `name`/`ref`; quoting them as
  templates with `'<processor>'`/`'<ref>'` matches the wording issue #1770 itself uses and keeps
  the searchable invariant substrings (`Background processor configuration error`,
  `could not resolve service reference`, `could not resolve plugin reference`, `HTTP endpoint`).
- **"Both causes" (D4).** Confirmed by optional chaining in the generated code — a missing map entry
  and a present resource whose `getEndpoint('http')` is falsy both hit the same `throw`.
- **Two-commit provenance (D5).** `build-agent-docs-bundle.ts` writes and compares
  `sourceCommit` (lines 24/33/114/128), so regeneration must follow the S1 commit. Closed.
- Not in scope and correctly left alone: `aspire run` (issue wording) vs `aspire start` (page
  wording) — the plan uses the page's own term, which matches the runbook's Step 3.

## Verdict

`PASS`

## Notes

Load-bearing spot-checks against
`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`:

- The preflight block (`// Declared reference preflight — fail before processor registration`) is
  emitted before the `builder.addExecutable(...)` line for the same processor — D3 "before
  processor registration" is accurate.
- Exact templates the prose must reproduce (only `${name}`/`${ref}` are substituted):
  - `Background processor configuration error: '${name}' could not resolve service reference '${ref}' HTTP endpoint.`
  - `Background processor configuration error: '${name}' could not resolve plugin reference '${ref}' HTTP endpoint.`
- Source comment verbatim: "A declared reference is required configuration, so missing resources
  and resources without an HTTP endpoint are equally fatal." — supports D3/D4 framing.
- Endpoint lookups: `_services.get('${ref}')?.getEndpoint('http')` and
  `_plugins.get('${ref}')?.getEndpoint('http')` — the endpoint name is literally `http`.

Non-blocking guidance for IMPL:

1. Copy the brief's twelve gate commands into `worklog.md` Gate Results with real exit codes so the
   run artifact is self-contained; `plan.md` currently points at "the slice brief" by reference.
2. The callout body is raw HTML inside Vento: use `<code>` for the messages and escape as needed;
   do not paste a Markdown fenced block inside the `<ul>`.
3. Include the literal phrase "background reference" in the new entry — the definition-of-done grep
   (`git grep -c "background reference" -- docs/site` > 0) depends on it, and the two source
   messages do not contain that phrase.
4. `check:assets-barrel` diffs seven generated files; if any file other than
   `agent-docs.generated.ts` changes, log it in `drift.md` as flagged under Drift Watch.
