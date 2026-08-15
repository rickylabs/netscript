# Tier-A — #1671 (#1350 `sdk-typed-error-channel`) amended plan at `2fa2f71dc5b498c16221461439e53b9f5dc1d5d5`

| Field | Value |
| --- | --- |
| Head | `2fa2f71dc5b498c16221461439e53b9f5dc1d5d5` — local == remote == PR, clean, draft, sole `status:plan` |
| Base | `main@0ef48c2ec` | Author | Codex `01a006f3-…`, `gpt-5.6-sol` · medium — matched, preserved |
| Measured | only after the author was **fully idle 132s**, so the head was settled, not moving |
| Verdict | **PASS** |

## Amendment scope

Exactly **6** changed paths, **all** under the run directory (`context-pack`, `drift`, `plan`,
`research`, `supervisor`, `worklog`); **0** non-run-artifact. Plan-only against base — no product,
test, or docs mutation. PR #1671 stays draft at sole `status:plan`.

## The five ruling requirements

1. **Six-path ceiling** — `plan.md:146`: "This ceiling is exact. A seventh product, test, or docs path
   is a rescope requiring a fresh coordinator ruling." `:276` closes the obvious loophole by stating
   the stale contracts/benchmark prose is tracked follow-up debt and may not consume a seventh path.
2. **`public/mod.ts` conditional genuinely removed** — the file now appears **once**, at `:147`,
   inside the denial statement. The "required only if this leaf owns RFC metadata" branch is gone, not
   merely annotated. This mattered: a denied option surviving as a conditional inside an approved plan
   is how scope returns at implementation time.
3. **Acceptance revised to what this leaf can prove** — six declared literals (`:129`) plus
   meta-generic non-erasure via `Record<never, never>` (`:90`, `:96`, `:101`). `:191` pins the
   assertion as `typeof baseContract['~orpc']['meta']` being exactly `Record<never, never>` rather
   than `any`. **No acceptance item depends on `NetScriptProcedureMeta`**, so nothing here waits on a
   type #1466 has not defined.
4. **Ownership boundary respected** — the leaf preserves the slot without inventing or exporting the
   vocabulary, leaving definition and export to #1466 per #1348's accepted order.
5. **Breaking disclosure retained at full strength** — `:105-107` "**Breaking published contract; not
   patch-level.**" naming the `SafeFailure<TError>` arm change, with risk row `:249` covering the
   public failure `null` → `undefined` consumer break, a repo-wide construction/assertion search, a
   documented migration, and an explicit refusal to call it patch-compatible.

That last point is worth stating plainly: this leaf declares a **real breaking change to published
surface** rather than softening it. That is the correct posture for `packages/contracts` and
`packages/sdk`, and it is the sort of thing that gets quietly downgraded to "patch" under delivery
pressure.

## Supervisor error carried forward

The brief that produced the original plan mis-stated #1350/#1466 metadata ownership (recorded in
`drift.md`). The amended plan now reflects the live records. The PLAN-EVAL brief carries this error
explicitly so the evaluator checks the boundary against #1348's normative header, #1350's owner
comment `5227724542`, and the open #1466 — not against this topic's summary of them.

## Outcome

Tier-A **PASS** at `2fa2f71dc`. Proceeding to exactly one separate native Claude Fable 5 · medium ·
Remote Control PLAN-EVAL, artifact-only, bound to this head. No implementation before its PASS;
#1348, #1466, and runtime untouched.

---

# Tier-A — S1 at `dc034d680b53c2845e9b82f73c6c709f2c51e2b3`

| Field | Value |
| --- | --- |
| Head | `dc034d680b53c2845e9b82f73c6c709f2c51e2b3` — local == remote == PR, clean, draft, sole `status:plan` |
| Commit | `dc034d680 fix(contracts): preserve exact base error map` |
| Verdict | **PASS** |

## Scope — exact

`packages/contracts/src/application/contract-primitives.ts`,
`packages/sdk/tests/readme-doctest_test.ts`, and five **existing** run artifacts. No seventh path, no
`arch-debt.md`, no new file. Slice-2 files (`errors.ts`, `ports/service-client.ts`) and both docs
pages are **untouched** — including `service-client.ts`, which is authorized for the leaf but belongs
to slice 2.

## The five advisories

- **A1 — both REDs recorded.** `worklog.md:73` "Real-export fixture recorded TS18046 (`unknown`) and
  TS2339 (`never`) **together in one structured run; not rerun for tidier output**", with the
  structured `"code": "TS18046"` payload at `:109` and the expectation pinned at `:85` as "Exactly
  TS18046 + TS2339 in one structured check". This was the sharpest advisory — the plan had expected
  only TS2339 — and it is satisfied precisely, including the no-rerun discipline.
- **A2 — no SDK zod mapping.** The SDK side of the diff adds **zero** `zod` lines; the fixture is
  built from exported `@netscript/contracts` schemas. No seventh path.
- **A3 — `SafeFailure` default untouched.** `errors.ts` and `service-client.ts` are not in the diff,
  so the default type parameter is intact by construction; it is slice 2's to change.
- **A4 — corrections stayed in existing artifacts.** Five existing run files edited, no new file
  created.
- **A5 — see observation below.**

## Ownership boundary held

`NetScriptProcedureMeta` appears **nowhere** in `packages/contracts/src` or `packages/sdk/src` — not
defined, not exported, not depended on. The fourth generic is preserved as `Record<never, never>`
(`contract-primitives.ts:116`, `:134`, `:166`), so later metadata is not erased while #1466 retains
definition and export.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| check (`contracts` + `sdk`, 105 files) | 0 occurrences, 0 failed batches |
| `readme-doctest_test.ts` | **2 / 0** |
| `packages/contracts` + `packages/sdk` suites | **77 / 0** |

## Non-blocking observation — A5 ticks

Three PR boxes are ticked: `P0 research + concrete plan + design checkpoint — c7a6f3d32`,
`P0a coordinator scope/ownership amendment — 2fa2f71dc`, and "Coordinator ruling is incorporated as
the exact six-path ceiling with **no metadata-export branch**".

All three are **process boxes carrying commit evidence**, and none claims metadata acceptance — the
third asserts the *absence* of a metadata-export branch, which is the opposite of over-claiming. A5's
purpose, keeping metadata acceptance for the coordinator's close-gate, is intact.

Recorded because **my brief was stricter than the ruling**: A5 said "do not tick metadata boxes" and
I hardened it to "tick nothing on the PR or on any issue". By that letter the author over-ticked; by
A5's intent it did not. I am not failing Tier-A on my own over-hardening, and I flag it for the
coordinator to untick if the close-gate wants a clean slate.

## Outcome

S1 Tier-A **PASS** at `dc034d680`. Slice 2 is not authorized by this review. No evaluator, no runtime
lease, no #1348/#1466 mutation; PR draft at sole `status:plan`.
