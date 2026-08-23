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
