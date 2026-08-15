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
