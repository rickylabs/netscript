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

---

# Tier-A — S2 at `ca7ade409be0cc0c064e75f5bfa1bd109e06d013`

| Field | Value |
| --- | --- |
| Head | `ca7ade409be0cc0c064e75f5bfa1bd109e06d013` — local == remote == PR, clean, draft, sole `status:plan` |
| Commit | `ca7ade409 fix(sdk): preserve typed service errors` |
| Verdict | **PASS** |

## Scope — exact

`errors.ts`, `ports/service-client.ts`, `readme-doctest_test.ts`, plus two **existing** run
artifacts. No seventh path, no new file, and **no docs work** — both published pages remain untouched
for slice 3.

## The two `@ts-expect-error` markers — converted to real proofs

This was the requirement most likely to be satisfied vacuously, and it was not. Zero
`@ts-expect-error` and zero `@ts-ignore` remain; the diff adds **no** `as any`, `as unknown as`, or
`@ts-ignore`. Both became positive `Assert<Equal<…>>` assertions:

- `_SafePreservesExactErrorCode` — `Equal<typeof discriminated.error.code, ExpectedBaseErrorCode>`,
  proving the six-literal union survives `safe()`;
- `_UndeclaredBaseErrorRejected` — `Equal<Extract<'NOT_DECLARED', BaseErrorCode>, never>`, proving a
  non-defined code is rejected;
- `_SafePreservesNotFoundData` — code-specific data preserved under narrowing;
- plus a value-level `const preservedCode: ExpectedBaseErrorCode = discriminated.error.code`.

**The author also closed a vacuity hole I had not named.** `_EmptyBaseMetaSlotPreserved` asserts
`Equal<BaseMeta, Record<never, never>>`, which would pass trivially if `BaseMeta` were `any` — so it
added `_BaseMetaIsNotAny` asserting `Equal<IsAny<BaseMeta>, false>` alongside it. That is the
difference between a type test and a type test that can actually fail.

## Constraints held

| Constraint | Evidence |
| --- | --- |
| `SafeFailure<TError = ThrowableError>` retained exactly | `errors.ts:71` |
| No local zod map, no ambient redeclaration | diff adds 0 `from 'zod'` / `declare module` / `declare global` |
| No `NetScriptProcedureMeta` | absent from both `packages/sdk/src` and `packages/contracts/src` |
| No additional boxes ticked | still 3, unchanged from S1 |
| #1348 / #1466 | untouched |

## S1 RED evidence — preserved, with a note

`worklog.md` shows 16 deleted lines, which against an append-only instruction warranted checking
rather than assuming. It is a **table reflow**, not evidence loss: the S1 RED row survives verbatim at
`:73` — "recorded TS18046 (`unknown`) and TS2339 (`never`) together in one structured run; not rerun
for tidier output" — and `TS18046` still appears three times. The deletions are old rows re-emitted
with new column padding, plus the S1→S2 closing paragraph.

Non-blocking note: strictly, the file was rewritten rather than appended. No evidence was altered or
removed, so this does not fail the slice, but a literal append would have made the check unnecessary.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| check (`sdk` + `contracts`, 105 files) | 0 occurrences, 0 failed batches |
| `readme-doctest_test.ts` | **3 / 0** (2 at S1) |
| `packages/sdk` + `packages/contracts` suites | **78 / 0** (77 at S1) |
| lint / fmt (`packages/sdk`) | 0 / 0 |

## Outcome

S2 Tier-A **PASS** at `ca7ade409`. Slice 3 (both docs pages) is **not** authorized by this review. No
evaluator, no runtime lease, no #1348/#1466 mutation; PR draft at sole `status:plan`.

---

# Tier-A — S3 at `c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd`

| Field | Value |
| --- | --- |
| Head | `c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd` — local == remote == PR, clean, draft, sole `status:plan` |
| Commit | `c7cba6d9b docs(sdk): document typed error channel` |
| Verdict | **PASS** |

## Scope — exact

`docs/site/services-sdk/sdk.md`, `docs/site/services-sdk/how-to/discover-services.md`, and one
**existing** run artifact. `git diff --name-only ca7ade409..HEAD -- packages/` is **empty** — no
product or test change, as required. No seventh path, no new file.

## Lock hygiene — the guardrail held

`git diff --quiet ca7ade409 HEAD -- deno.lock` → **LOCK-IDENTICAL**. No `zod@4.1.12` and no other
lock mutation was committed.

Recorded for accuracy: the reported drift was **not reproducible** when this topic checked it. At that
moment the worktree lock was byte-identical to `ca7ade409` (sha256 `edfa0c24b70e0d83` both sides),
`zod@4.1.12` occurred zero times in both, and only the two docs pages were modified. The guardrail was
therefore dispatched as **preventive rather than corrective**, and said so plainly to the author — an
instruction to "restore the lock you broke" would have misdescribed reality to it. The requirement was
still binding at commit time, and the committed head satisfies it.

## The six-literal channel — verified against source, not against assumption

The authoritative set from `contract-primitives.ts` and the doctest's `ExpectedBaseErrorCode` is
**`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`,
`SERVICE_UNAVAILABLE`**. **All six appear on both pages.**

Worth recording: an initial check using a guessed literal set showed "5 of 6" and looked like a gap.
The guess was wrong — `BAD_REQUEST` is not one of the six; `VALIDATION_ERROR` is. Deriving the set
from source before filing anything is what prevented a false finding.

## Story correctness

Literal branching is present on both pages — `sdk.md` `isSuccess`×2 / `isDefined`×3,
`discover-services.md` `isSuccess`×3 / `isDefined`×4 — so a plain or non-defined failure cannot fall
through as success in the documented examples. `NetScriptProcedureMeta` appears **zero** times on
either page, and no metadata acceptance claim is made. Box count unchanged at 3.

## Gates — executed by this review

| Gate | Result |
| --- | --- |
| `docs-source-format` | **PASS** |
| `docs-accuracy` | **PASS** |
| doctest / compile evidence | **3 / 0** |
| product + test paths touched | **none** |

`docs-accuracy` is recorded as proving what that script asserts and nothing more; it is not cited as
evidence for a page-level narrative claim it does not check.

## Outcome

S3 Tier-A **PASS** at `c7cba6d9b`. S4 final gates are **not** authorized by this review. No evaluator,
no runtime lease, no #1348/#1466 mutation; PR draft at sole `status:plan`.

---

# Tier-A — S4 at `db8aadd9542c38a305efffbd7017c56d0abf4e01`

| Field | Value |
| --- | --- |
| Head | `db8aadd9542c38a305efffbd7017c56d0abf4e01` — local == remote == PR, clean, draft, sole `status:plan` |
| Commit | `db8aadd95 chore(harness): record blocked S4 gate receipt` |
| Verdict on the **slice** | **PASS** — S4 behaved correctly |
| Verdict on the **leaf** | **BLOCKED** — a real leaf-owned regression is open |

## The slice did the right thing

Scope is run-artifact-only: three existing files, **0** non-run-artifact paths, `deno.lock`
**LOCK-IDENTICAL**. Receipts bind `gitHead == actualGitHead == c7cba6d9b` with `waiver: null`.
Gates not reached are recorded honestly as `NOT_RUN` with the reason and the specific gate list, not
silently omitted.

Most importantly, the author **stopped rather than fixing source inside a run-artifact-only slice**.
That is the fourth time an author in this lane has halted on a real boundary instead of widening, and
it is the behaviour that keeps these verdicts worth anything.

## The blocker — verified independently, not accepted from the receipt

`sdk-raw-doc-lint`: **base `0ef48c2ec` = 3 diagnostics, head = 13**. I re-ran the combined SDK
doc-lint at head and got **13**, matching. The ten added `private-type-ref` diagnostics are all
attributable to this leaf's own S2 typed-error work:

| Public type | now references private |
| --- | --- |
| `ServiceClientMethod` | `ThrowableError`, `ClientPromiseResult` |
| `ServiceClientShape` | `ProcedureErrorFromNode` |
| `SafeFailure` | `ThrowableError`, `NonDefinedSafeFailure`, `DefinedSafeFailure` |
| `SafeResult` | `ThrowableError` |
| `isDefinedError` | `NarrowDefined` |
| `safe` | `ThrowableError`, `ClientPromiseResult` |

A second receipt records `["baseContract","BaseContractErrors"]` added and `["baseContract","oc"]`
removed on the contracts side.

**This is a genuine regression on published surface**, not a baseline red. The SDK's public error API
now references private types — precisely what `deno doc --lint` exists to catch and what JSR
publishing and `isolatedDeclarations` care about. Classifying it `NEW LEAF-OWNED RED` rather than
folding it into the known `F-DOCT-5`/pinned-baseline set is exactly right, and is the
red-attribution discipline working in the direction that costs the leaf something rather than the
direction that excuses it.

## Why this cannot be fixed in S4

Remedying it requires **source** changes — exporting the referenced types or restructuring the public
signatures — and S4 is run-artifact-only by grant. The author correctly refused to edit S1/S2 product
files to make its own gate green. That would have been the worst available outcome: a green gate
bought with an unreviewed source edit inside a slice whose whole contract is "touch no source".

## Not executed after the mandated stop

Recorded as `NOT_RUN` with reasons: `contracts-jsr-audit`, `sdk-jsr-audit`,
`netscript-jsr-specifiers`, and the selected export guards. These are outstanding, not passed.

## Outcome

S4 Tier-A **PASS on slice conduct**, but the **leaf is not merge-ready**. A new leaf-owned
published-surface regression is open and needs a coordinator scope ruling for a bounded S5 — a
source-touching slice authorized to resolve the ten new `private-type-ref` diagnostics — before
formal IMPL-EVAL is worth spending. IMPL-EVAL is **not** requested at this head.

No evaluator, no runtime lease, no label/issue/checkbox/ready/merge action, no #1348/#1466 mutation.

---

# Tier-A — S5 rebaseline + narrow architectural correction at `bd97a7c03a3fe9b9c2534fd53c9fb0518801bb31`

| Field | Value |
| --- | --- |
| Leaf head | `bd97a7c03a3fe9b9c2534fd53c9fb0518801bb31` — local == remote == PR `headRefOid`, clean, draft, sole `status:impl` |
| Branch base | `main@0ef48c2ec` | Current main | `9634735bc09123b0e69e7438ea4ec763462aa072` |
| PR #1671 | `OPEN`, `isDraft: true`, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` |
| Verdict on the **rebaseline** | **PASS** |
| Verdict on the **ruled correction** | **FAIL — mechanism refuted by execution** |

## Rebaseline — the baseline is inert

`main` advanced five commits (`0ef48c2ec` → `9634735bc0`). Exactly **four** paths under `packages/`
changed, one line each, all JSDoc `@example` import specifiers
(`@netscript/contracts` → `@netscript/contracts/query` | `/transform`, from #1666's gate-reference
drift repair). Zero semantic contact with any of this leaf's files.

Re-measured, not argued — `deno doc --lint` at main `9634735bc0` in a detached measurement worktree:

| Package | Base @ `9634735bc0` | Leaf head @ `bd97a7c03a` | Delta |
| --- | --- | --- | --- |
| `packages/contracts` | **9** private-type-ref | **11** | +3 new / −1 (`baseContract → oc`) = **net +2** |
| `packages/sdk` | **3** private-type-ref | **13** | **+10** |

These are byte-identical to the counts S4 recorded against the **old** base `0ef48c2ec`. The
rebaseline therefore changes nothing about finding attribution: the 13 leaf-owned findings are the
same 13, and the S4-R correction map's inputs survive intact. Rebaseline **PASS**.

Recorded plainly: **no history rewrite was performed.** The branch remains based on `0ef48c2ec`. It
does not need rebasing — GitHub already reports `MERGEABLE`/`CLEAN` against current `main` — and
force-pushing the leaf branch is outside this supervisor's git authority. "Rebaseline" is executed
here in its harness sense: re-establish the baseline measurement against current `main` and re-verify
the correction against it. If the coordinator wants an actual history rebase, that is a separate
instruction and a separate authorization.

## F1 (blocking) — the ruled mechanism makes the problem twice as bad

The ruling authorizes exposing, from `packages/contracts/src/public/mod.ts`, only the public type
names required by `baseContract`'s existing signature. That signature
(`contract-primitives.ts:112-117`) names exactly three flaggable identifiers: **`ContractBuilder`**,
**`Schema`** (×2), and **`BaseContractErrors`** (`Record<never, never>` is a TS built-in and is never
flagged).

Probed directly in a disposable worktree at the exact leaf head — added precisely those three as
type-only re-exports, changed nothing else, measured:

| State | `packages/contracts/mod.ts` private-type-ref |
| --- | --- |
| Leaf head, unmodified | **10** |
| Leaf head + the three ruled re-exports | **21** |

The count **doubled**. The cause is structural, not incidental: `deno doc --lint` checks a private
type's own body only when that type is itself an exported root. Exporting `ContractBuilder` promotes
it from a leaf reference into a linted root, and its body then contributes ten further diagnostics —
`ContractProcedure`, `ErrorMap`, `Meta`, `Route`, `MergedErrorMap`, `ContractProcedureBuilder`,
`ContractProcedureBuilderWithInput`, `ContractProcedureBuilderWithOutput`, `ContractRouterBuilder`,
`HTTPPath`, `ContractRouter`, `EnhancedContractRouter`, `ContractBuilderDef`. `Schema` adds
`StandardSchemaV1`; `BaseContractErrors` adds `MergedErrorMap` and `commonErrorMap`.

Closing that cascade means re-exporting `@orpc/contract`'s entire builder algebra through NetScript's
curated public barrel — exactly the "wider barrel growth" the same ruling forbids. There is no bounded
stopping point: each layer names the next.

Worth recording because it is the sort of thing that gets missed twice: **S4-R's own probe finding #2
documents the precise mechanism that defeats this ruling** — "it does not recurse into a flagged
private type's own body ... because `BaseContractErrors` itself isn't a root symbol being linted from
that entrypoint." The map established the rule and never applied it to option 1, because option 1 had
been rejected on *scope* grounds (forbidden fourth file) and so was never tested for *efficacy*. A
denied option is not a refuted one, and this lane just spent a coordinator ruling on the difference.

## F2 (blocking for the plan as written) — correction #12 does not type-check

S4-R #12 proposes replacing `Schema<unknown, unknown>` with NetScript's own
`ContractSchema<unknown, unknown>`, on the reasoning that `ContractSchema` is a public structural
mirror of `StandardSchemaV1`. Executed:

```text
deno check --unstable-kv packages/contracts/mod.ts
TS2322 [ERROR]: Type 'ContractBuilder<Schema<unknown, unknown>, ...>' is not assignable to
type 'ContractBuilder<ContractSchema<unknown, unknown>, ...>'.
  Type 'StandardSchemaV1<unknown, unknown>' is missing the following properties from
  type 'ContractSchema<unknown, unknown>': _input, _output, parse, safeParse
```

`ContractSchema` is strictly **narrower** than `Schema`, not equivalent — it carries Zod-specific
members (`_input`, `_output`, `parse`, `safeParse`) that the standard-schema interface does not have.
The map recorded this as "reasoned, not `deno check`-proven". The reasoning was wrong. #12 is refuted.

## F3 (confirmed sound) — correction #11 holds, and the owed verification is now executed

Inlining `BaseContractErrors`' body as a `Readonly<{...}>` literal over the six **public** PascalCase
schema aliases, with `Schema<unknown, unknown>` left in place:

| Gate | Result |
| --- | --- |
| `deno check --unstable-kv packages/contracts/mod.ts` | **PASS** |
| `packages/contracts/mod.ts` private-type-ref | 10 → **9** |

This discharges the verification S4-R explicitly owed: `oc.errors(commonErrorMap)`'s constraint does
accept the map once the annotation's `data:` slots widen from `ContractObjectSchema` to
`ContractSchema`, because the former is assignable to the latter. #11 is real, not notional.

## F4 — the achievable floor on contracts is baseline **+1**, not zero

With #11 applied, #12 refuted and #13 unresolvable, `baseContract` retains two flagged names —
`ContractBuilder` and `Schema` — against the one it removed (`oc`):

| | contracts total |
| --- | --- |
| Base `9634735bc0` | 9 |
| Leaf head today | 11 |
| Leaf head + #11 (best available under the three-file ceiling) | **10** |

So the residue is **one** diagnostic over baseline. Two mitigating facts belong in the record rather
than being spun: `baseContract → ContractBuilder` is a **one-for-one substitution** for the
pre-existing pinned `baseContract → oc` on the same symbol, and `Schema` is **already** a
baseline-referenced private name in this same file (`BaseContractOutputRoute → Schema`), so the +1 is
a second reference to a name the public surface already carries — not a new kind of coupling, and not
a new dependency edge.

Stated plainly: the premise behind the ruling — that `baseContract → ContractBuilder` would become
"new permanent private-type-reference debt" — is close to, but not exactly, right. It is a
**substitution** of pinned debt, at a net cost of one additional diagnostic, and the proposed cure
costs eleven.

## F5 (non-blocking) — the map rejects for `ContractBuilder` what it accepts elsewhere

#13 rejects locally reconstructing `ContractBuilder` because doing so would be "permanently coupled to
oRPC's exact internal shape and guaranteed to drift on the next `@orpc/contract` version bump"
(AP-1/AP-9). Corrections **#7/#9** and **#10** do precisely that at smaller scale — #7/#9 hand-copy
oRPC's phantom marker `Promise<T> & { __error?: { type: E } }`, and #10 reconstructs oRPC's
`ErrorMap` → error-union derivation from `~orpc.errorMap`.

The trade is defensible: those surfaces are a few lines against a fifteen-member builder algebra. But
the plan must carry it as a **bounded, accepted coupling with a named drift risk** — "if oRPC renames
`__error`, `TError` inference degrades silently" — rather than under the map's current
"purely notational" framing. A silent inference degradation is the failure mode this leaf exists to
prevent.

## F6 (non-blocking) — the `ThrowableError → Error` swap is a design decision, not a rename

Verified against the installed `.d.ts`: `@orpc/shared` defines
`ThrowableError = Registry extends { throwableError: infer T } ? T : Error`, and a repo-wide search
for `declare module '@orpc/*'` returns **zero** augmentations. It resolves to exactly `Error` today,
so the map's factual claim is correct.

But `Registry` is a **consumer** extension point that `@orpc/shared` exports for exactly this purpose.
Hardcoding `Error` forecloses downstream augmentation permanently. The mitigating fact is that these
SDK signatures are leaf-new — the SDK baseline is 3 findings, none on `SafeFailure`, `safe`, or
`isDefinedError` — so this forecloses a capability on **new** API rather than regressing existing
behaviour. That makes it acceptable and cheap, and it still belongs in the plan as a declared
decision rather than inside a list of notational rewrites.

Also verified: `deno.lock` pins `@orpc/contract@1.14.6`, matching the version S4-R verified against
(the cache also holds 1.14.7/8/13, which are not the resolved versions).

## Outcome

**Rebaseline PASS. Ruled correction FAIL.** No implementation agent is authorized at this head: the
ruled mechanism is refuted by execution, and dispatching an author against it would have spent a
canonical implementation slice producing a doubled diagnostic count.

Options returned to the coordinator, in preference order:

1. **Withdraw the exposure ruling; land #11 + the ten SDK corrections under the existing three-file
   ceiling.** Result: contracts 10 (base 9, residue +1), SDK 3 (base 3, **0 new**). No fourth file, no
   barrel growth, no new export names. Requires F2's #12 dropped from the map, and F5/F6 restated as
   accepted couplings.
2. **(1) plus a follow-up issue** for the residual `baseContract → {ContractBuilder, Schema}`, on the
   #1669 → #1670 precedent, so the substitution is tracked rather than absorbed silently.
3. Accept the residue with no follow-up.

This topic recommends **(2)**.

No evaluator requested, no runtime lease, no label/issue/checkbox/readiness/merge action, no
`#1348`/`#1466` mutation, no product file touched. All probe work was performed in disposable
detached worktrees (`netscript-007-probe-1671`, `netscript-007-baseline-9634735`), both removed; the
leaf worktree and PR remain at `bd97a7c03a`, unmodified.

---

# Cross-lane advisory from the docs topic supervisor — audited 2026-08-23

Received read-only, no action taken on the docs lane. Audited rather than accepted; two of three
findings are upheld, one is a subset of work already executed, and one framing is corrected.

## Finding 1 — new blocking Pages gate never ran against this branch: **UPHELD, and now proven green**

Confirmed at `9634735bc0`: `.github/workflows/pages.yml:143-145` carries a
`Check documentation exports drift` step (`deno task docs:exports-drift`) immediately ahead of
`docs:snippets`, gated only on `env.RUN == 'true'` with no `continue-on-error`. It arrived with
`2dd1a75ef` (#1666), which post-dates this leaf's merge-base `0ef48c2ec`. The sequencing concern is
real: the step has never executed against #1671, and #1671 does edit two `docs/site/` pages.

The advisory reasoned the gate would pass by reading the tool. This topic **ran it** instead. Applied
the leaf's six product/docs paths onto a detached worktree at `9634735bc0` and executed the gate:

```text
Coverage [contracts]: mode=complete;        omitted-symbol-groups=0; documented-non-export-groups=0
Coverage [sdk]:       mode=entrypoints-only; omitted-symbol-groups=0; documented-non-export-groups=0
Exports & Symbols drift check: PASS      (exit 0)
```

**PASS, exit 0.** The mechanism is slightly more specific than the advisory stated: `sdk` runs in
`entrypoints-only` mode, so its reference page is checked for entrypoint coverage and **not** for
symbol rows at all; `contracts` runs `complete`, and the leaf changes no exported symbol name there.
Both halves have to hold, and both do.

Two by-products worth recording. First, the six leaf paths **apply cleanly onto current `main`** — the
only cherry-pick conflicts were `DU` markers on run artifacts from plan commits deliberately outside
the replay range, with zero product conflict. That independently corroborates the § S5 rebaseline
finding. Second, this closes a real proof gap for whoever eventually claims readiness: the gate is now
executed evidence at rebased content, not an argument from reading the checker.

## Finding 2 — reference/guide divergence: **UPHELD as debt, framing corrected, and out of scope**

The gap is real and the advisory found it correctly. `docs/site/reference/sdk/index.md` is the third
page documenting this API, #1671 does not touch it, and nothing catches the divergence: symbol names
are unchanged so `docs:exports-drift` is silent (and `sdk` is `entrypoints-only` regardless), while
`docs:snippets` compiles fenced code, not table rows.

**But the framing "the reference and the guide teach two different contracts" overstates it.** Checked
against source at the leaf head, all three flagged rows remain **factually true**:

| Row | Still accurate? | Evidence |
| --- | --- | --- |
| `SafeResult` — "Tuple/object result returned by `safe`" | **yes** | `errors.ts:49-66` — both failure arms remain tuple-and-object intersections |
| `SafeFailure` — "Failure branch returned by `safe`" | **yes** | `errors.ts:71` — unchanged role |
| `isDefinedError` — "Narrow an unknown error to an oRPC defined error" | **yes** | still exported, still narrowing |

Nothing on the reference page is wrong. The guide stopped *showcasing* tuple destructuring and
`isDefinedError`; the reference still frames the API around them. That is **cross-page emphasis debt**,
the same class as #1669's adjacent-page debt — and this topic must be explicit that it made the
**opposite** error on that leaf, characterising accurate adjacent pages as "the same false-narrative
class" and being corrected by the coordinator and evaluator. The distinction is what keeps a passed
gate from being reopened to widen a PR.

A second, sharper reason not to fold the three rows in: those row descriptions are **verbatim the
package's own JSDoc** — `errors.ts:68-70` reads "Failure branch returned by {@link safe}" and
`:75-77` reads "Tuple/object result returned by {@link safe}". Editing the reference rows without
editing the JSDoc would *create* source-to-reference drift where none exists today. The suggested
"~3 rows" is therefore not a 3-row change; it is a rows-plus-JSDoc change touching a seventh **and**
eighth path.

Disposition: **declined at this lane, routed to the coordinator.** `plan.md:146` sets an exact
six-path ceiling — "A seventh product, test, or docs path is a rescope requiring a fresh coordinator
ruling" — and `docs/site/reference/sdk/index.md` is a seventh. Same disposition as #1669 → #1670: a
tracked non-blocking follow-up with explicit "these rows are not wrong" framing, filed by the
coordinator, not folded into #1671 and not filed by this lane.

## Finding 3 — three unexported types in published signatures: **already measured; scope is broader**

Upheld and already covered. All three named references appear in this topic's own § S5 measurement:
`SafeFailure → NonDefinedSafeFailure`, `SafeFailure → DefinedSafeFailure`, and
`isDefinedError → NarrowDefined`. The advisory's "current main has ZERO such references in that
module" matches the § S5 base measurement exactly — SDK baseline is **3** diagnostics
(`QueryClientPort → QueryClient`, `createNetScriptQueryClient → QueryClient`, one in
`plugin-streams-core`), none in `client/errors.ts`.

The withheld gate's scope is **wider than the advisory's three**: the leaf introduces **10** new SDK
private-type-ref diagnostics, adding `ThrowableError` (×4), `ClientPromiseResult` (×2) and
`ProcedureErrorFromNode` to the three named. The advisory's `@orpc/contract`-in-a-published-signature
parallel to `baseContract → ContractBuilder` is also correct and is the § S5 F1/F4 subject.

## Net effect on this lane

None of the three changes the § S5 verdict. Finding 1 removes a proof gap and returns **green**;
Finding 2 becomes a coordinator follow-up rather than leaf scope; Finding 3 was already inside the
withheld-gate scope. No merge, readiness flip, label, checkbox, or product/docs mutation from this
lane. Probe worktree `netscript-007-probe-gate` removed; leaf and PR unmodified at `bd97a7c03a`.

---

# F1 addendum — the ruled correction fails a **second, independent** gate (docs lane hypothesis, executed)

The docs supervisor, on accepting the § Cross-lane audit, raised one forward-looking point this topic
had not measured: if a ruling changes what `@netscript/contracts` publishes, that lands on
`docs:exports-drift` with **contracts in `complete` mode**. Offered as input, not a position. It is
correct, and it is now executed rather than predicted.

Probe: detached worktree at `9634735bc0`, leaf's six paths applied, plus exactly the three ruled
type-only re-exports in `packages/contracts/src/public/mod.ts`. Nothing else.

```text
Coverage [contracts]: mode=complete; omitted-symbol-groups=0; documented-non-export-groups=0
Symbol Drift Error [contracts]: Document at docs/site/reference/contracts/index.md OMITS exported symbol 'BaseContractErrors'
Symbol Drift Error [contracts]: Document at docs/site/reference/contracts/index.md OMITS exported symbol 'ContractBuilder'
Symbol Drift Error [contracts]: Document at docs/site/reference/contracts/index.md OMITS exported symbol 'Schema'
Exports & Symbols drift check: FAIL   (exit 1)
```

Compare the identical probe **without** the three re-exports: `PASS`, exit 0. The three symbol-drift
errors are attributable to the ruled correction alone.

So the ruled mechanism now has **three independent failure modes**, not one:

1. **`deno doc --lint`** — `packages/contracts/mod.ts` goes **10 → 21** private-type-ref diagnostics
   (§ S5 F1).
2. **`docs:exports-drift`** — **red, exit 1**, blocking the Pages workflow at
   `pages.yml:143-145`. This is a *merge-blocking CI gate*, not an advisory count.
3. **The repair for (2) is worse than (2).** Clearing those three errors means documenting
   `ContractBuilder`, `Schema`, and `BaseContractErrors` as rows in
   `docs/site/reference/contracts/index.md` — a **seventh path**, and substantively a commitment that
   NetScript's published reference surface now documents **oRPC's builder class and standard-schema
   alias as NetScript's own published symbols**. That is a doctrine question about what
   `@netscript/contracts` claims to publish, not a lint fix, and it is exactly the "wider barrel
   growth" the ruling itself forbids — arrived at from the opposite direction.

Recorded because it changes the strength of the § S5 recommendation rather than merely adding to it:
the exposure route is not "more expensive than the residue", it is **not landable** without a
doctrine decision about publishing a dependency's internals under NetScript's name. Recommendation
(2) — withdraw the exposure ruling, land #11 plus the ten SDK corrections under the existing
three-file ceiling, file a follow-up for the residual — stands and is now the only option that clears
both gates.

Also carried from the docs lane, and worth stating because it explains the § Cross-lane finding-2
disposition: `sdk` runs `entrypoints-only`, so its reference-page symbol rows are never checked at
all. Advisory findings 1 and 2 are the same fact from two sides — the gate that proves #1671 green is
green *because* it does not look at the rows finding 2 is about. That is why finding 2 is real debt
and simultaneously not a gate risk.

Probe worktree `netscript-007-probe-drift` removed. No product/docs mutation; leaf and PR unmodified
at `bd97a7c03a`.
