use harness

# FINAL all-slices IMPL-EVAL — #1466, PR #1731

You are a **fresh, separate** `formal_impl_evaluation` session. The generator is Codex
(`gpt-5.6-sol`); you are Claude Fable 5 · medium — native opposite-family per
`.llm/harness/workflow/lane-policy.md:46`. You did not author any of this and you must not fix it:
you evaluate and rule.

This is the **terminal gate for the whole leaf**, not a slice re-check. Your verdict decides whether
#1466 can move toward close.

## SKILL

`netscript-harness` (evaluator protocol, verdict vocabulary, `evaluate.md` template),
`netscript-doctrine` (Archetype 1/2, public surface, doctrine 04),
`netscript-deno-toolchain` (`deno doc --lint` as the publish bar, `publish --dry-run`),
`jsr-audit`, `netscript-pr` (close-gate rules).

## Where to work

**Your own detached worktree.** Do not touch `/home/agent/projects/netscript/worktrees/007-leaf-1731`
(D-19). Previous evaluator worktrees `ns1466-impleval` and `ns1466-impleval-c2` exist; make your own.

Establish the head yourself from live GitHub and git — do not take a SHA from this brief as authority.
Record `git rev-parse HEAD`, `origin/feat/sdk-procedure-meta`, and the PR `headRefOid`, and state that
they agree.

## What you are evaluating

**All three slices together**, which no single evaluation has yet covered:

| Slice | Content head | State entering this gate |
| --- | --- | --- |
| S1 — contracts vocabulary + builder soundness | `42874803` | IMPL-EVAL cycle 2 **`PASS`** + addendum |
| S2 — SDK declaration propagation (+ G-1) | `2863d29e` | supervisor Tier-A **`ACCEPTED`**; **never formally evaluated** |
| S3 — publish & compatibility evidence (+ G-4, AF-1) | `9ab779ce` | supervisor Tier-A **`ACCEPTED`**; **never formally evaluated** |

**S2 and S3 are the substance of this gate.** S1 has a standing `PASS`; do not re-litigate it, but do
verify that S2 and S3 did not regress it.

Read first: `context-pack.md`, then `evaluate.md` **in full including both cycle-2 sections and the
addendum**, then `drift.md`, then `worklog.md`'s tail. The supervisor's Tier-A reviews are in the
features orchestration run (`slices/tier-a-review-1466-s2.md`, `…-s3.md`) — read them as claims to
test, not as findings to accept.

## Settled inputs — do not reopen

- **R-1** — `public-doc-lint` is baseline-red on `main` at **12** findings; **delta 0 with set
  identity** is the bar, not green. The exact set is in `evaluate.md`. Verify it at the final head.
  R-1's **root-`test` half is void** — the host defect is fixed (PID 1 `tini`, zero zombies) and the
  addendum ruled `SKIPPED` no longer acceptable.
- **R-2 / F-1** — `commonErrorMap`'s value export is withdrawn. It stays private. If a consumer need
  is ever stated it ships frozen per doctrine 04, never "read-only by contract".
- **R-3** — `docs:exports-drift` is named supplemental evidence; the catalog entry is a coordinator
  follow-up, not a plan amendment.
- **AP-14** — no upstream oRPC type may be re-exported.

## Re-measure; do not accept

The supervisor measured all of this and reports it green. **That is not evidence for you.**

1. **`public-doc-lint` at the final head vs `main`** — the receipt's exact 16-entrypoint argv at both
   ends. Verify the **set**, not just the count: a matching count with a different set is a regression
   wearing a passing number.
2. **The G-1 anchored pin must fail.** Apply perturbation B2 (initializer meta →
   `NetScriptProcedureMeta & { readonly extra?: string }`) **plus** the dead decoy
   `const _legacyBase = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap); void _legacyBase;`
   — the forgery your predecessor used to defeat the file-wide pin. It must go red. Then try to defeat
   the **anchored** form; if you find a working forgery, that is a finding.
3. **AF-1's brittleness claim** — the anchor spans the annotation with `[^=;]+?`. Confirm whether a
   `=` in that annotation breaks the pin on correct code, and whether the comment the author added is
   an adequate mitigation or whether the pattern itself should change.
4. **S2's metadata propagation is the least-evaluated code on this branch.** `ProcedureMeta`,
   `ProcedureMetaFromNode`, the `ActionMethod` marker: do the declarations actually preserve exact
   metadata and exact error literals through the direct client, the `defineServices` generated client
   and the query factory? Break them. A type that no test can make fail is not a contract.
5. **Receipts** — all eight at each slice's content head, `gitHead == actualGitHead`, real `test`
   PASS with no `SKIPPED`. Archives (`frozen-c9a391811`, `frozen-235482767`, `frozen-42874803`,
   `frozen-2863d29e`) byte-intact and append-only. Note that `frozen-42874803` has **mixed heads** by
   design and carries a restored `test-final.attempt5-skipped.json` (finding G-7, a supervisor error,
   self-reported and repaired) — confirm the restoration is byte-faithful to `dd201816`.
6. **Publish evidence (S3's own obligation)** — workspace and per-member `publish --dry-run`, JSR
   audit per member, isolated declarations for both publishable members, exact `@netscript/*` pins.
   One sanctioned oRPC slow-types INFO is the known baseline; any WARN/FAIL is a finding.
7. `deno.lock` byte-unchanged across the whole branch.

## What you must rule

1. **Is #1466 complete?** All six of the issue's acceptance points, across all three slices — not
   slice-by-slice. Say which are met, by what evidence, and which are not.
2. **Is the leaf ready for a close-gate?** Per `netscript-pr` rule 12. If yes, state exactly what the
   coordinator must do — including that PR #1731 currently carries **`Refs #1466 — partial`** and
   would need a closing keyword restored **only if** you rule the PR completes the issue.
3. **Is `public-doc-lint`'s permanent baseline-red acceptable to merge on?** It will never be green.
   Say plainly whether delta-0 with set identity is a sufficient standard for merge, or whether
   something must change first.
4. **Anything S2/S3 regressed in S1.**

## Deliverable

Append to `evaluate.md` (never rewrite a predecessor's section — both prior evaluators appended;
follow that). Full evaluator template: metadata, immutable identity, process verification, substance,
gate tables, anti-pattern check, arch-debt delta, findings with required actions, lessons, verdict
with rationale, and — if not terminal — an explicit re-evaluation scope. Commit **evidence-only** and
push by explicit refspec. Report your head.

## Hard boundaries

- **Do not fix anything.** Findings with required actions. Revert every perturbation and prove the
  tree clean.
- No merge, ready-flip, relabel, milestone change, issue close, acceptance-box ticking, PR body
  rewrite, or closing-keyword restoration — **including if you rule `PASS`**. Those are the
  coordinator's, and the human merge handoff is explicitly a human decision.
- No `e2e:cli`, Aspire, Docker, or browser gates. The DinD sandbox is reachable; that is capability,
  not authorization, and this lane holds no runtime lease.
- Do not edit product code, tests, receipts, frozen archives, `plan.md`, `supervisor.md`, or any
  predecessor verdict section.
- Do not touch `deno.lock`.
