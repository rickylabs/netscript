# PLAN-EVAL — fix-1015-sagas-registry-path--dependency-mode

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Waiver basis: implementation is delegated to Codex (GPT family); generator and evaluator are
different sessions and different model families, so the harness independence invariant is
satisfied. The open-model `formal_evaluation` route recorded as blocked in `drift.md` is not
required for this fix train and its unavailability is **not** a blocking condition.

Scope of this pass: `plan.md` and `research.md` only. No product code read for the purpose of
modification; source reads below are spot-checks against `origin/main` @ `3ab64720f`.

## Plan-Gate Checklist

| # | Box | Result | Evidence |
| - | --- | ------ | -------- |
| 1 | Research present and current | **PASS** | `research.md` exists and is explicitly re-baselined against `origin/main` @ `3ab64720f` (§ Re-baseline). All six findings spot-checked and confirmed: `services/src/init.ts:13` constant + `new URL(..., import.meta.url)`; `saga-runner.ts:40` constant and `resolveModuleSpecifier` at `:122`; `SAGAS_REGISTRY_MODULE` read at `:60` with no producer; glue at `runtime.stub.ts` builds a cwd `file://` URL; `packages/config/loader.ts:51` establishes `NETSCRIPT_PROJECT_ROOT ?? Deno.cwd()`. |
| 2 | Decisions locked | **PASS** | D1–D4 stated with rationale. D3 (inject env reader/cwd) is the decision that makes the resolver testable and is correctly load-bearing. |
| 3 | Open-decision sweep | **FAIL** | Two decisions that force rework are absent from the sweep. See Finding A and Finding C. |
| 4 | Commit slices | **FAIL** | **`plan.md` contains no Commit Slices section at all.** The template requires an enumerated, ordered list where each slice names what it proves, the gate that proves it, and the files it touches. The `Validation Plan` table is a gate ordering, not a slice decomposition — it names no files and no per-slice proof obligation. |
| 5 | Risk register | **PASS** | Four risks with concrete mitigations; the Windows-drive-path and specifier-preservation risks are the two that actually threaten this change. |
| 6 | Gate set selected | **PASS** | F-3/F-5, F-6/F-7, F-9, F-10/F-13, F-19 selected for Archetype 5 + service overlay. Appropriate for a plugin surface. See Finding A for a correction to the F-9 evidence claim. |
| 7 | Deferred scope explicit | **PASS** | `Non-Scope` names Aspire entrypoint strings, JSR install / scaffold E2E, and glue text churn. Matches the brief's out-of-scope section. |
| 8 | jsr-audit (package/plugin wave) | **PASS** | `research.md` § jsr-audit surface scan: no export-map change, helper stays internal under `src/**/*.ts` (already in the publish include list), slow-type risk noted. Confirmed against `plugins/sagas/deno.json`. |

Boxes 3 and 4 unchecked → `FAIL_PLAN`.

## Findings

### Finding A — `declareEnv` is a dead seam; the F-9 evidence claim is not acceptance evidence

**This is a defect I introduced in the implementation brief (item 4), and the plan inherited it
unexamined.** The brief instructed the slice to have `SagasAspireContribution.declareEnv` emit
`SAGAS_REGISTRY_MODULE`. The plan adopted it (Scope bullet 3) and then listed F-9 — "Aspire env test
asserts `SAGAS_REGISTRY_MODULE`" — as the *expected evidence* for the acceptance criterion.

Spot-check: `rg "\.declareEnv\(" --include=*.ts` over the whole tree returns **no non-test caller**.
The only definitions are `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts:42` and
the four plugin overrides; the only call sites are the four plugin `*-contribution_test.ts` files.
Nothing in `packages/cli` or `packages/aspire` consumes `declareEnv` output to populate resource
environment during AppHost generation.

Consequence: adding the key to `declareEnv` makes a unit assertion pass while delivering the
variable to **no running process**. It cannot evidence issue acceptance criterion 1. If the plan
proceeds as written, the PR would claim criterion 1 is met via the Aspire environment when it is
not.

The change is still worth making as forward-looking declaration, but the plan must be honest about
which mechanism actually satisfies criterion 1: the **project-root fallback**
(`NETSCRIPT_PROJECT_ROOT ?? Deno.cwd()`) inside the resolver. That is the same edge the already-
shipped generated glue relies on, so it is no weaker than accepted behaviour — but it must be named
as the load-bearing mechanism, not the Aspire row.

Required fix: restate the F-9 row as forward-looking declaration only; add a row naming the
resolver fallback as the mechanism evidencing criterion 1; record the dead-seam observation in
`drift.md` (severity: minor, pre-existing).

### Finding B — no commit slices

Required fix: add the Commit Slices table. A defensible decomposition given the locked decisions:
(1) resolver + its unit tests (env/cwd injection, Windows drive + backslash, specifier
preservation); (2) `saga-runner.ts` routed through the resolver, `resolveModuleSpecifier`
package-relative anchoring removed; (3) `services/src/init.ts` given options + importer seams and
routed through the resolver; (4) Aspire `declareEnv` + the `sagas-contribution_test.ts:58` equality
assertion updated. Each row must name its gate and its files.

### Finding C — cross-plugin duplication of the project-root helper is undeclared debt

`projectFileUrl` is duplicated verbatim in the `runtime.stub.ts` of **sagas, workers, and
triggers**. D1 places the new resolver under `plugins/sagas/src/runtime/`, which is the correct
call for a 0.0.3 fixes-only train — hoisting to `packages/plugin` would change a public surface and
touch three plugins. But the Open-Decision Sweep does not list it, and the Arch-Debt table records
"none".

Required fix: add "canonical project-root resolver home (`packages/plugin` vs per-plugin)" to the
Open-Decision Sweep marked **safe to defer**, with the reason (public-surface change out of scope
for a fixes-only milestone), and add a corresponding note to the Arch-Debt implications table. This
does not force rework of this fix; it prevents the next plugin from re-deriving the same helper.

## Assessment of the plan's substance

Setting the checklist aside, the technical approach is sound and I would not redirect it. The
precedence order (explicit argument → `SAGAS_REGISTRY_MODULE` → project-root URL) is the right
seam, D2's preservation of already-absolute `file:`/`jsr:` specifiers correctly avoids rewriting
valid input, and D4's refusal to touch glue text keeps the scaffold E2E out of scope as instructed.
The failure is one of plan completeness and one of evidence honesty, not of design.

One residual limitation the implementer must carry forward and state plainly in the PR: issue
acceptance criterion 3 says the test must start a runtime **"from the published package."** A test
using an injected importer and a package-shaped `import.meta.url` simulates that shape; it does not
install from JSR. Pre-publish that is the strongest available evidence, and the brief authorised it
— but the box must be reported as *dependency-shaped, not published-install*, and must not be
ticked as though a real JSR install was exercised.

## Verdict

FAIL

Two unchecked Plan-Gate boxes (commit slices; open-decision sweep) plus a materially incorrect
acceptance-evidence claim (Finding A). All three fixes are bounded and require no redesign — amend
`plan.md`, append to `drift.md`, and resubmit. Implementation must not begin until the amended plan
is in place. This is cycle 1 of a maximum of 2.
