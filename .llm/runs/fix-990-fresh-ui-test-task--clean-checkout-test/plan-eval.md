# PLAN-EVAL — fix-990-fresh-ui-test-task--clean-checkout-test

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Phase: plan-eval · Run: `fix-990-fresh-ui-test-task--clean-checkout-test` ·
Branch: `fix/990-fresh-ui-test-task` · Baseline: `3ab64720f`

## Plan-Gate checklist

| # | Check | Result | Evidence |
| - | --- | --- | --- |
| 1 | Cause re-derived, not inherited from the issue | PASS | `research.md` Re-baseline + findings 1-4; it contradicts the brief on `--allow-env` (finding 3), which is the mark of an independent derivation rather than a restatement. |
| 2 | Both reported defects are covered | PASS | `plan.md` D1 (permissions) and D2 (`.llm/tmp` parent) map 1:1 onto issue body defect and issue comment defect. |
| 3 | Scope is bounded to the issue | PASS | `plan.md` Goal and Scope limits the diff to `packages/fresh-ui/deno.json` and `tests/registry/markdown-renderer.test.ts`; Deferred Scope explicitly excludes product source, CI, scaffold E2E. |
| 4 | Acceptance box 1 (`deno task test` exits 0 on a clean checkout) has a proof path | PASS | Validation Plan step 1 deletes `.llm/tmp` *before* the single full run — the only ordering that actually proves "clean checkout". |
| 5 | Acceptance box 2 (permission set justified, not widened by reflex) is genuinely satisfied | **FAIL** | See Finding A. The plan resolves the open decision *toward the widest option* while its own research (finding 3) records that a narrower, empirically-verified set passes. |
| 6 | Validation is scoped and non-redundant | PASS | Three commands, expensive suite run exactly once; `run-deno-check.ts` invoked without `--unstable-kv` as required. |
| 7 | Side effects controlled | PASS | Risk Register row 3 + Validation step 4 handle the `deno.lock` churn I observed at baseline. |
| 8 | No public/JSR surface change | PASS | `research.md` jsr-audit scan: no export, dependency, or publish-filter change. Confirmed read-only against `packages/fresh-ui/deno.json` — `exports`/`publish` untouched by the planned diff. |
| 9 | Open decisions swept, none left implicit | PARTIAL | Open-Decision Sweep is present, but the one decision it closes is closed on my brief's authority rather than on evidence (Finding A), and one decision it does not raise at all was foreclosed by my brief (Finding B). |

## Findings

### A. `--allow-all` is the reflex the issue's second box exists to prevent — and my brief caused it

`research.md` finding 3 records, empirically, that `--allow-read --allow-write --allow-run` is
sufficient for the first subprocess test, and that `--allow-env` is **not** required. The plan then
locks D1 to `--allow-all` anyway, on the rationale "subprocess internals may evolve".

That rationale is speculative, and issue #990's second acceptance box is worded precisely against
it: *"the permission set is justified ... so it is not widened again by reflex."* A task that grants
everything cannot be narrowed by reflex later because there is nothing left to widen — it satisfies
the letter of the box (a comment exists) while defeating its purpose.

I am not neutral here. My brief said repo convention is `--allow-all` and told the slice not to
"burn the slice hand-tuning scopes". The plan is doing what I asked. On review that instruction was
wrong: the slice had already *measured* the minimum set at no extra cost, so choosing the wider one
is not a saving, it is discarding evidence the run already paid for. Repo convention is a weak
argument against a measurement, and it is not what this issue asks for.

**Required amendment:** grant the empirically-minimum set, not `--allow-all`. Determine it against
*both* tests, not just the first — finding 3 only exercised the first.

### B. The `.llm/tmp` location was foreclosed by my brief, not by evidence

I instructed the slice not to change which directory the second test uses, asserting the in-repo
location is deliberate (scaffold + Fresh build resolution). `research.md` records this as "the owner
already locked the directory choice" — i.e. it was taken on my authority, and no evidence for the
in-repo requirement appears anywhere in the run.

This does **not** change the verdict. D2 (`mkdir` recursive before `makeTempDir`) removes the
dependency on ambient state regardless of which directory is used, so acceptance box 1 is satisfied
either way, and preserving the existing location is the lower-risk change. But the plan should say
the constraint is externally imposed and unverified rather than presenting it as settled, so a later
reader does not inherit my assumption as a finding.

### C. Minor — Risk Register mitigation for the JSONC comment is thin

"The edited config is parsed by both `deno task test` and the scoped check" proves Deno *reads* it.
It does not cover `deno publish`, and this package is published to JSR. The plan defers the publish
dry-run as "safe to defer" because no publish surface changed — reasonable, but the comment is a new
byte sequence in a file that is itself in the publish set. Cheap to close: run
`deno publish --dry-run` for the package, or drop the comment in favour of self-documenting scoped
flags (which the Finding A amendment produces anyway, largely dissolving this risk).

## What is good in this plan

Worth recording so the amendment does not overcorrect: the research phase disagreed with my brief on
`--allow-env` and said so, the clean-checkout proof ordering is correct, the expensive suite is run
exactly once, and the lockfile churn I hit at baseline was anticipated without being told twice.

## Verdict

**FAIL**

One required amendment (Finding A): replace D1's `--allow-all` with the empirically-minimum
permission set verified against **both** subprocess tests, with the justification comment naming the
specific capabilities (temp-workspace write, subprocess spawn) rather than the absence of a limit.
If the single full run surfaces a further `NotCapable`, add exactly the flag named in the message
and record it in `research.md` — do not fall back to `--allow-all` on the first denial.

Two recording amendments (Findings B, C): mark the `.llm/tmp` location constraint as externally
imposed and unverified; close the JSONC-comment risk by evidence or by dissolving it.

Everything else in the plan is approved as written. Re-submit for IMPL after amending — no re-plan
of scope, validation, or slicing is required.

## 2026-08-01 — Amendment closure

The owner-supervisor directed implementation to proceed after the three amendments were applied.
The separate IMPL-EVAL independently verified that all three landed before sign-off:

- Finding A: the task grants only measured read/write/run, proven across both subprocess tests by
  the clean-parent 166-test pass;
- Finding B: `.llm/tmp` is recorded as an owner-imposed, unverified location constraint; and
- Finding C: the rationale moved out of `deno.json`, the final manifest strict-parses, and both
  `publish:readiness` and `check:publish-assets` pass.

**Amended Plan-Gate disposition: PASS.** This is a retrospective process closure; the initial FAIL
above remains intact as the authoritative history of the required amendments.
