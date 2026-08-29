# Tier-A plan review — #1466 / PR #1731 `sdk-procedure-meta`

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`. Opposite-family to the Codex author thread
`01a04f84-e21d-77f3-863c-56ef2498d581`.

Subject: `research.md` (235 lines) and `plan.md` (167 lines) at head
`9e70b30a3fef798a02a376888603ef42ee3828b9`, PR **#1731** draft.

Verdict: **`PASS`** — three precision requirements (T-1…T-3) carried into the PLAN-EVAL as binding
check items. No design finding; implementation stays blocked until PLAN-EVAL returns.

## Phase-1 stop verified

| Check | Result |
| --- | --- |
| local == remote == PR head | all `9e70b30a3fef798a02a376888603ef42ee3828b9` |
| Tree | clean |
| Base | `21d516224` — **current** `origin/main` |
| Diff scope | **2 files, +402** — `research.md` + `plan.md` only. No source, no `deno.lock`, no generated asset |
| Closing keywords | **`Closes #1466`** present; **`Part of #1348`** with *no* keyword on the umbrella — correct |
| Labels | exactly one `status:` (`status:plan`), plus `type:feat` / `priority:p1` / `area:sdk` / `area:contracts` / `epic:sdk-client-contrib`, milestone `0.0.7` |
| PR opened at first slice | yes — the per-slice comment trail exists from the start |

## What I verified rather than accepted

The plan's central soundness claim is that `$meta` can be threaded without an assertion while leaving
the repaired error channel untouched. I checked it against the locked upstream declarations, not the
prose:

| Claim | Evidence | Holds? |
| --- | --- | --- |
| Re-baseline changed no source fact | `git diff 5bb112dd3 21d516224 -- packages/contracts packages/sdk` → **0 lines** | yes |
| `Meta = Record<string, any>` | `@orpc/contract@1.14.6/dist/shared/contract.TuRtB1Ca.d.mts:54` | yes |
| Locked at 1.14.6 | `deno.lock:123,1611` | yes |
| `$meta` exists on the builder | `dist/index.d.mts:216` | yes |
| `.errors()` preserves `TMeta` | `dist/index.d.mts:237` — `errors<U>(errors: U): ContractBuilder<…, MergedErrorMap<TErrorMap, U>, TMeta>` | yes |
| `ContractBuilder` is publicly exported (so the annotation is nameable under `isolatedDeclarations: true`) | export list; `deno.json:175` | yes |
| Fixtures may import real specifiers | workspace `packages/*`; precedent `packages/sdk/tests/readme-doctest_test.ts` imports `@netscript/contracts` | yes |
| Citations at `:27-58`, `:178-245`, `:184-209` | re-read in place | accurate |

So `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` yields position 3
`MergedErrorMap<Record<never, never>, typeof commonErrorMap>` — **identical to today's
`BaseContractErrors`** — and position 4 `NetScriptProcedureMeta & Record<never, never>`. The design
is implementable with zero assertions. That is the question this Tier-A existed to answer, and the
answer is yes.

## What the plan gets right

**The independence rule is written so a reviewer can reject something.** `research.md:120-126` states
it as a rule with explicit rejection examples — `extends Meta`, `InferContractRouterMeta<…>`, an
upstream re-export, any bridging `as`. Contrast the usual "must remain independent", which no
reviewer can act on. It also correctly distinguishes structural independence of the *semantic type*
from the adapter's already-public oRPC builder annotation, so the rule does not accidentally ban the
existing `baseContract` shape.

**The versioning commitment is decided, argued, and costed.** `research.md` commits to additive-only
optional readonly fields under package semver and explicitly rejects a `version: 1` discriminant
because it would contradict the RFC's `{}` normalization. It then states what S3–S8 inherit. Six
downstream slices depend on this choice; leaving it open would have been the easy move.

**Determinations match the evidence.** PLAN-EVAL selected, with reasons drawn from the leaf itself.
Expensive gates declined with a real argument — Stage 1b changes no CLI template, generated file,
browser runtime, transport, or wire behaviour — plus a stated rescope trigger if a generator owner
turns up. That is the correct reading of the gate class.

**Finding 4 answers a question by finding nothing, and says so.** "No checked-in generated SDK client
file or CLI client-declaration generator owns this slice" — the declaration generator is Deno's
isolated-declaration emission. A negative result stated as a result.

**Stage-boundary discipline.** The open question routed to PLAN-EVAL — declaration-level propagation
now, runtime `ProcedureMetadataPort` in S3 — is the genuine fork, left open correctly rather than
pre-decided.

## T-1 (required) — "without casts or `any`" has no mechanical proof for the cast half

#1466 acceptance point 3 is *"Metadata reaches direct clients, generated clients, and query factories
**without casts or `any`**."* The plan asserts "zero `as` assertions, zero `any`" (L3) and its only
verification is a **"changed-line cast/`any` review"** in slice 2's gate list.

Half of this is already mechanical and the plan does not claim the credit: `deno lint` runs the
`recommended` tag, which includes `no-explicit-any`, and neither `packages/sdk` nor
`packages/contracts` is in `deno.json`'s lint `exclude`. So **`any` is gated**.

**Casts are gated by nothing.** A human review is not a receipt, and this lane has already paid the
full price for exactly that: in #1293 S1, `performIO(query as SqlQuery)` silenced a real
incompatibility, type-checked, skipped a conversion path, and survived review until it was found by
re-deriving the types. An acceptance criterion whose only evidence is "we looked" is the same
failure mode.

**Required:** name a mechanical, receipted check for the cast half — a scripted scan of the slice's
changed lines across the metadata path emitting raw output at the committed content head (a
`run-gate` receipt if it can be expressed as an allowlisted command, otherwise raw output recorded in
the slice report). "Zero assertions" must arrive as evidence, not as a claim.

## T-2 (precision) — pin the fourth generic; do not hedge it

L2 says the annotation's fourth generic is `NetScriptProcedureMeta` *"(including any
upstream-required empty-record intersection produced by `$meta`)"*. That hedge is resolvable now, and
I resolved it above: `dist/index.d.mts:216` gives `U & Record<never, never>`.

State it exactly — `BaseContractRoute` and `BaseContractOutputRoute` position 4 become
**`NetScriptProcedureMeta & Record<never, never>`**, not bare `NetScriptProcedureMeta`. This matters
beyond tidiness: a vague annotation that then fails to match is precisely the moment an implementer
reaches for `as`, which L3 forbids. Removing the vagueness removes the temptation.

## T-3 (precision) — fix the receipt set in the plan, not in the slice report

The "Gate set" section lists roughly ten gates, and slice 3 defers the receipt filenames to "the
slice report". Sufficiency is recomputed against a **named** set: `.llm/tools/gates/evidence-set.ts`
treats any repeated `gateId` as duplicate-or-contradictory and scores INSUFFICIENT, and per-member
gates that share an id are the usual way that fires.

**Required:** enumerate in `plan.md` the exact receipt filenames and their distinct `gateId`s —
per-package where the gate runs per package, so `contracts` and `sdk` never share one. Otherwise the
final slice's sufficiency claim cannot be checked without re-deriving the intended set.

## Determinations

**PLAN-EVAL: required** — concurring with the plan, the coordinator, and this leaf's pre-classification.
It defines a public vocabulary six p1 slices inherit, changes declarations in two publishable
packages, and crosses an upstream generic whose own constraint is `Record<string, any>`. Route:
fresh native opposite-family **Fable 5 · medium** per `lane-policy.md:84` (`review_codex_complex`,
paired to Sol · high implementation).

**Expensive gates: not applicable.** Concurring. Nothing here touches scaffold templates, generated
output, browser runtime, transport, or Aspire. No lease is requested and none may be granted.

## Next

T-1…T-3 pass to the PLAN-EVAL as binding check items rather than a round-trip repair, since
implementation is blocked until PLAN-EVAL returns and that gate must rule on them anyway.
Implementation begins only on PLAN-EVAL `PASS`.
