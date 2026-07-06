use harness

## SKILL

Read these repo skills before evaluating (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — evaluator protocol context
- `netscript-tools` — scoped validation wrappers, lock hygiene
- `netscript-pr` — label taxonomy (`ci:skip-scaffold` addition)
- `openhands-handoff` — your own run mechanics

## Role

You are the **IMPL-EVAL evaluator** (separate session from the generator) for draft PR #487
(`chore/ci-skip-expensive-lanes`): CI classify job that lets docs-only PRs (or explicit
`ci:skip-scaffold` label) skip the expensive scaffold-static/scaffold-runtime lanes in
`.github/workflows/e2e-cli.yml`, while `ci:full` forces everything. Required checks
(quality / check-test / deps-report), publish.yml, and e2e-cli-prod are intentionally
untouched — verify that they ARE untouched; touching them is a FAIL.

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md` first, then evaluate:

1. **Classifier correctness** (`.github/scripts/ci-classify-changes.ts` + its test file):
   precedence `ci:full` > `ci:skip-*` > docs-only auto-detect; non-PR events always run;
   rename-aware parsing (`--name-status -M`, both sides of `R*`/`C*` count).
2. **Fail-closed guarantee**: if the classify job FAILS, both scaffold jobs must still run
   (`needs.classify.result != 'success'` forces RUN=true); a skip requires classify SUCCESS
   with explicit `run_*=false`; the pre-existing `skipped` applicability gate is preserved.
   Trace the workflow `if:`/`env:` expressions yourself.
3. **Injection safety**: the skip reason (contains raw changed-file names) is sanitized
   (control chars stripped, capped) and only ever printed via env + `printf '%s\n'`, never
   interpolated into shell source or expression context.
4. An adversarial Codex review found 3 CAVEATS (rename hole, fail-open, injection); all fixed
   in commits `a2f7f65` + `f022358` — see the fix-table comment on the PR. Verify the fixes.

Validation to reproduce:
`deno test --allow-read --allow-env --allow-write .github/scripts/ci-classify-changes.test.ts`
(25 tests) and a YAML sanity parse of `.github/workflows/e2e-cli.yml`.

Lock hygiene: do NOT commit deno.lock re-resolution or source churn; evaluation is read+run
only unless the protocol explicitly requires a reviewed fix.

Verdict: PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT per verdict-definitions.md, posted as a PR
comment. Single eval loop: report findings; do not iterate.
