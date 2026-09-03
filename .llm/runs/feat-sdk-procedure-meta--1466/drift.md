# Drift — #1466 `NetScriptProcedureMeta`

## D-1 — full public doc-lint was already red on the base; slice must add no findings

- Date: 2026-08-30
- Slice: 1 — contracts vocabulary + builder soundness
- Severity: significant
- Status: corrected after base-vs-head reconciliation; terminal repository-baseline FAIL remains

### Planned

`plan.md` contracts slice 1 requires contracts doc lint, and the final eight-receipt set described a
PASS `public-doc-lint` receipt from `deno doc --lint` over every contracts and SDK export
entrypoint. The earlier D-1 analysis incorrectly treated the slice head as the baseline and
therefore attributed the repository's existing doc-lint debt to this slice.

### Observed

The coordinator re-ran the exact contracted 16-entrypoint `deno doc --lint` argv on both immutable
heads. `origin/main` at `13878a80a` reports 12 `private-type-ref` findings; slice head `f9056f879`
reports 14. The +2 incremental cost is one changed declaration: the base annotated
`baseContract` as `ReturnType<typeof oc.errors<...>>` (one finding for private `oc`), while slice 1's
explicit `ContractBuilder<Schema, Schema, BaseContractErrors, BaseContractMeta>` annotation reports
three private names (`ContractBuilder`, `Schema`, and `BaseContractErrors`).

`BaseContractErrors` is a NetScript-owned exported alias that was omitted from the public entrypoint.
Publishing that alias is the bounded repair: it clears the new finding and the two pre-existing
findings where `BaseContractRoute` / `BaseContractOutputRoute` already reference it. `ContractBuilder`
and `Schema` remain upstream oRPC types and are not re-exported under AP-14.

Cycle 1 did not fully match that expectation. Its exact 16-entrypoint argv reported 13 findings:
exporting `BaseContractErrors` cleared its three consumer references, but the now-public alias
introduced two findings, one for upstream `MergedErrorMap` and one for the private `commonErrorMap`
value used through `typeof`. That reduced the pre-repair slice head from 14 to 13 but left a +1
incremental cost versus the 12-finding base.

Cycle 2 was authorized to correct the NetScript-owned half of that boundary. `commonErrorMap` now
has a public NetScript-owned `CommonErrorMap` contract, and both are exported with ownership JSDoc.
The alias describes its six `data` fields with the existing public NetScript error vocabulary and
`ContractObjectSchema`; it does not expose the private lower-case schema constants. The exact
16-entrypoint argv at content head `bb1a489ace2c162c1caca065fc2762d7807330d0` reports 12 findings.
The measured sequence is therefore: base `13878a80a` = 12, pre-repair `f9056f879` = 14, cycle 1
`3c3f9b7c` = 13, cycle 2 `bb1a489a` = 12. The final incremental cost is 0.

The package JSR audit separately recognizes this exact boundary and reports its slow-types check as
INFO because `@netscript/contracts` is on the doctrine's sanctioned oRPC slow-types allowlist. That
sanction does not affect `deno doc --lint` exit status or the `public-doc-lint` catalog gate.

### Impact

The honest final `public-doc-lint-final.json` remains terminal FAIL because the repository baseline
itself is 12 findings, but this bounded repair adds no findings relative to it. The final twelve
include the permitted residual references from `baseContract` to upstream `ContractBuilder` and
`Schema`, and from `BaseContractErrors` to upstream `MergedErrorMap`; the other nine are unchanged
baseline findings outside this leaf. Generic position 3, exact metadata position 4, and the #1350
error-channel guarantee remain intact. Re-exporting `ContractBuilder`, `Schema`, or
`MergedErrorMap` would violate AP-14 and was not done.

### Decision required

The unchanged contracted public-doc-lint gate is recut as a terminal FAIL receipt, with the exact
base/pre-repair/cycle-1/cycle-2 finding counts recorded beside it. Receipt sufficiency remains an
honest mechanical result. Tier-A and separate-session IMPL-EVAL own final sign-off; this
implementation lane does not self-certify.

## D-2 — NAS migration preserves the terminal receipt set before repair

- Date: 2026-08-30
- Slice: 1 — contracts vocabulary + builder soundness
- Severity: operational
- Status: checkpointed

The current host is being replaced after the immutable implementation commit and receipt run but
before the bounded repair and Tier-A sign-off. The eight exact-head JSON receipts are therefore
committed and pushed even though three are terminal FAIL receipts. This is evidence preservation,
not a gate waiver or self-certification. The NAS resume must regenerate the receipts after repair;
it must not treat the preserved red set as current proof.

## D-3 — base reconciliation is inert for the repaired surface

- Date: 2026-08-30
- Slice: 1 repair
- Severity: informational
- Status: reconciled; no rebase or merge performed

The fixed plan base is `21d516224fe35e92957f0998ee848bbf2024eda0`; current `origin/main` is
`13878a80a`, three commits ahead. The coordinator measured both the commit log and diff for
`packages/contracts` plus `packages/sdk` as empty across that range. The drift is therefore inert
for this repair, and holding the base fixed preserves comparability between the pre-repair and
attempt-2 receipts. No rebase or merge of `main` was performed.

## D-4 — attempt-1 archive and attempt-2 receipt recut

- Date: 2026-08-30
- Slice: 1 repair
- Severity: operational
- Status: landed for Tier-A review

Commit `9649b349cda5372838df20f4f17811d79c77e1e6` moved the eight attempt-1
receipts unchanged to `receipts/frozen-c9a391811/`. They remain append-only terminal evidence for
pre-repair head `c9a391811` and are not current proof.

After repair commit `3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d`, all eight contracted paths were
recut through `run-gate.ts` with `--attempt 2`. Every receipt records
`gitHead == actualGitHead == 3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d`; gate IDs and invocation IDs
are unique. Six receipts PASS. `public-doc-lint` is terminal FAIL with the 13-finding measurement in
D-1. `test` is terminal FAIL after 4246 passed / 2 failed / 19 ignored because two out-of-scope
agentic-tooling tests failed (`Too many open files` in `codex-follow_test.ts`; a surviving worker
descendant in `hybrid-launcher_test.ts`). The focused SDK doctest passes 3/3, so the original
`TS2344` repair is cleared even though the root catalog test receipt is red.

Sufficiency recomputed over the eight explicit files is **INSUFFICIENT** solely because those two
receipts did not pass. The supplemental contracts JSR audit passes with one sanctioned oRPC
slow-types INFO and is explicitly excluded from the named set.

## D-5 — annotation-derived exactness guards were tautological

- Date: 2026-08-30
- Slice: 1 repair, cycle 2
- Severity: significant
- Status: corrected with an inferred upstream probe

The cycle-1 SDK doctest and the pre-existing contracts fixture derived a builder field from an
explicit `ContractBuilder<..., BaseContractErrors, BaseContractMeta>` annotation and compared that
field to the same annotation argument. That equality can fail when the two written types differ,
but it cannot detect a divergent initializer because the annotation absorbs the initializer's
inferred type. It therefore did not independently pin T-2 against an oRPC inference change.

`packages/contracts/tests/procedure-meta-inference_test.ts` constructs the same
`oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` expression without an annotation. It
compares the inferred `~orpc.meta` to public `BaseContractMeta` and the inferred `~orpc.errorMap` to
public `BaseContractErrors` with exact `Equal<>` assertions. The test imports `commonErrorMap` from
the internal application module because inference must use the actual error-map value; it remains
under the contracted root `test` gate.

A temporary perturbation of the expected metadata type to `Record<never, never>` produced
`TS2344: Type 'false' does not satisfy the constraint 'true'` at the inferred-meta assertion. The
perturbation was restored before commit. The inferred probe pins the public alias spelling against
oRPC's inference for the contracted expression, which is the independent T-2 requirement as
PLAN-EVAL worded it. It does not observe `baseContract`'s actual initializer and therefore does not
cover a divergent initializer under an unchanged annotation. The assertion-budget test now closes
that residual by requiring the stripped source to contain the exact initializer once. The working
`.meta(publicMeta)` check, both negative `@ts-expect-error` checks, and runtime metadata-storage
assertions were not changed.

## D-6 — cycle-2 quiet-load root test retains one out-of-scope tooling failure

- Date: 2026-08-30
- Slice: 1 repair, cycle 2
- Severity: operational
- Status: scoped blocker recorded; no tooling change attempted

The attempt-3 root `test` gate was run serially at immutable content head `bb1a489a`, with no other
gate from this lane running. It completed with 4248 passed, 1 failed, and 19 ignored. The earlier
`Deno.watchFs` / `Too many open files` failure did not recur. The sole remaining failure is
`.llm/tools/agentic/claude/hybrid-launcher_test.ts` observing a worker descendant that survived
cancellation. This slice changes zero files under `.llm/tools`, so the terminal FAIL is preserved as
an out-of-scope repository-tooling blocker rather than skipped, narrowed, or repaired here.

All eight contracted receipts were recut serially with `--attempt 3`. Every receipt records
`gitHead == actualGitHead == bb1a489ace2c162c1caca065fc2762d7807330d0`; all gate IDs and invocation
IDs are unique. Six PASS, while root `test` and the baseline-red `public-doc-lint` are terminal FAIL.
Exact-file sufficiency is therefore **INSUFFICIENT** for those two reasons only.

## D-7 — the contracted receipt set was blind to branch-owned docs-site export drift

- Date: 2026-08-30
- Slice: 1 repair, cycle 3
- Severity: significant
- Status: branch drift repaired; gate-set change proposed for coordinator / IMPL-EVAL ruling

The `Deploy docs site to Pages` workflow ran `deno task docs:exports-drift` and correctly rejected
the contracts reference page's complete-inventory declaration. The page omitted six public symbols
introduced by this branch: `commonErrorMap`, `BaseContractErrors`, `BaseContractMeta`,
`CommonErrorMap`, `NetScriptAuthenticationRequirement`, and `NetScriptProcedureMeta`.

Attribution is unambiguous. The task exits 0 on `origin/main` at `13878a80a`, but failed on every
measured branch head: `c9a391811`, `f9056f879`, `b4157a9d`, and `c2ae8c425`. Three omissions existed
from the first slice-1 content commit, while the other three followed the bounded adapter repair.
This was branch-owned public-documentation drift, not the host-zombie or public-doc-lint baseline.

The PLAN-EVAL-approved eight-receipt set includes `public-doc-lint`, which is already red on main
and cannot distinguish this regression. It excludes `docs:exports-drift`, which is green on main
and precisely detected the branch's public-surface/documentation mismatch. The evidence design was
therefore structurally blind to the branch-owned check that worked, allowing four branch heads to
carry the regression without a named receipt signaling it.

Cycle 3 documents all six symbols in the complete contracts inventory. The metadata entries state
NetScript ownership and the additive-optional-readonly compatibility rule. The error-map entries
state that codes, HTTP statuses, message literals, and data schemas are stable contract, and that
mutating the exported `commonErrorMap` singleton is unsupported even though JavaScript can do so at
runtime. `deno task docs:exports-drift` exits 0 at content head
`235482767edd8a9793c9d6bf6f766441c51ef313`; the raw command, exit code, and output are preserved in
`audit/docs-exports-drift.txt` as supplemental evidence outside the named eight.

### Proposal — not a plan amendment

Add a distinct `docs-exports-drift` gate to future contracted evidence sets whenever a slice changes
a package's published surface, and require it at the immutable content head. This implementation
thread does not amend the approved plan or add a catalog entry. IMPL-EVAL and the coordinator own
the decision.

## D-31 — G-1 declaration pin is statement-bounded, not merely declaration-prefixed

- Date: 2026-08-30
- Slice: 2 — SDK declaration propagation plus G-1
- Severity: informational
- Status: implemented and adversarially demonstrated

### Planned

G-1 allowed an anchor shaped like
`export const baseContract:[\s\S]*?= oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap);`.
The required proof was B2 with the old dead `_legacyBase` decoy and B2 alone, with every
perturbation restored.

### Observed

A prefix followed by unrestricted `[\s\S]*?` can cross the divergent declaration's semicolon and
consume a later decoy initializer. The slice therefore uses `[^=;]+?` between the declaration name
and initializer. That span covers the multiline type annotation but cannot cross an assignment or
statement boundary.

Under B2 plus the dead decoy, focused `deno check` and `deno lint` stayed green while the pin failed
with 4 passed / 1 failed. Under B2 alone the pin again failed 4/1. After restoration the pin passed
5/5 and `contract-primitives.ts` had no diff. The exact commands and outcomes are recorded in
`audit/g1-declaration-pin-slice2.txt`.

### Impact

No scope change. This is the same G-1 repair with a stricter boundary that survives the exact
forgery it claims to reject.

## D-32 — locked `./query` export is transitively visible from the existing root barrel

- Date: 2026-08-30
- Slice: 2 — SDK declaration propagation
- Severity: informational
- Status: reconciled within the locked physical export sites

L3 requires `ProcedureMeta` wherever `ProcedureInput` and `ProcedureOutput` are exported, naming
`src/ports/mod.ts` and `src/query/mod.ts`, while the public-surface table says the SDK root remains
unchanged. The existing root already uses `export * from './src/query/mod.ts'`, so any new
`./query` symbol is mechanically visible at the root even though `packages/sdk/mod.ts` is untouched.

The slice follows the more specific L3 export-site lock and the product ceiling: it edits only the
two named subpath entrypoints and does not rewrite the root barrel. `ProcedureMetaFromNode` remains
`./ports`-only as explicitly required. No upstream type is exported and no out-of-ceiling file is
needed.

## D-33 — repaired host supersedes the root-test no-retry conditions

- Date: 2026-08-30
- Slice: 3 — publish and compatibility evidence
- Severity: operational
- Status: reconciled; frozen evidence remains immutable

The slice-1 R-1/D-26 root-`test` ruling and the receipt sets cut under it described a host where PID
1 did not reap child processes and a zombie could remain visible to `Deno.kill(pid, 0)`. That host
condition no longer exists. At slice-3 intake, `/proc/1/comm` is `tini`, the system-wide zombie
count is 0, and `/proc/sys/fs/inotify/max_user_instances` is 1024. Root `test` is therefore runnable
and must produce a real PASS receipt; the former no-retry condition and `SKIPPED` form are void.

This is topic drift in the evidence environment, not product drift. The frozen receipt archives were
cut under run, content, and (for the older host-defect sets) host conditions that later heads have
superseded. They remain append-only historical evidence; no archived outcome is rewritten or
reinterpreted. Slice 3 archives the slice-2 top-level set under `receipts/frozen-2863d29e/` before
cutting its own eight receipts at the new content head.

## D-37 — `docs-tagline` was outside the contracted set and caught a consumer-facing defect

`packages/contracts/README.md`'s JSR tagline reached **271 B against a 250 B cap** because slice 1
inserted `NetScript-owned procedure metadata, ` into it. Branch-owned, measured: `main` `13878a80a`
ran the same gate at **over=0** with a **235 B** tagline.

Consumer-facing: the first bold paragraph becomes the **JSR package description**, so 21 bytes over
means the registry stores it truncated. `docs-tagline` is **not** among the plan's eight contracted
receipts, is green at base, and is branch-sensitive — so eight contracted gates passed while a
user-visible defect shipped to a ready-flip. Repaired to **246 B**; the currency evaluator ruled the
trim faithful to the ownership claim.

## D-38 — the shared-asset cascade is a unit, and it too was outside the contracted set

`check:agent-docs-prose` failed at `87d53cec`: `prose.json.gz` / `provenance.json` stale. `main`
`f8b4f804` measured **`fresh:true`**, so entirely branch-owned — this branch edits
`docs/site/reference/contracts/index.md` and `packages/contracts/README.md`, both corpus inputs.

Two things generalise:

1. **The cascade conflicts as a unit.** Merging `main` `a5520e70` conflicted in **four** carriers at
   once (`prose.json.gz`, `provenance.json`, `agent-docs.generated.ts`, `publish-assets.generated.ts`).
   Any leaf touching a corpus input owes `agent-docs-prose` **and** `assets-barrel`,
   `mcp-export-corpus`, `publish-assets` together, not individually.
2. **Generated artifacts are never hand-merged.** Resolution was to take `main`'s side wholesale and
   re-run all four generators. Hand-resolving a compressed corpus or a generated barrel yields a file
   no generator would emit — plausible-looking, unreproducible, and green against nothing.

With D-27 and D-37 this is the **fourth** instance of one class: *the contracted set is scoped to
package correctness and is structurally blind to the repo-level generated-artifact surface a docs edit
touches.* The currency evaluator's Ruling 3 adopts the fix for future leaves — derive the contracted
set from the touched-path classes rather than fixing it at planning time.

## D-39 — an expected-red gate hides invocation defects

Re-cutting `public-doc-lint` at `75b78220`, `run-gate.ts` was invoked **without** the plan's explicit
16 entrypoints, so the catalog's bare `deno doc --lint` ran and exited 1 in **7 ms** with
*"the following required arguments were not provided: `<source_file>`"*. That receipt was pushed and
cited as evidence.

The failure was not the wrong flag; it was **how the receipt was read**. This gate is *contracted to
fail* — it is the baseline-red one — so `exit 1` matched expectation and the argv was never checked.
The same class had been caught earlier in the run only because the gate involved (`test`) was expected
to **pass**, so its failure was surprising.

**Rule:** verify a receipt by `argv` **and** `durationMs`, never `exitCode` alone. A 7 ms
16-entrypoint doc-lint is impossible on its face. Attempts 11/12 carry the 19-element argv at
164/178 ms; the defective attempt-10 receipt is retained unchanged in `receipts/frozen-75b78220/` as
the record of the defect rather than replaced.

## D-40 — "set identical" was the wrong claim for `public-doc-lint` head vs `main`

Run prose repeatedly said the head and `main` doc-lint **sets** were identical. They are not.

Measured at `d5f3bf4c` vs `a5520e70`: **12 vs 12**, **9 common**, and a **3-for-3 substitution** —
`main`-only `BaseContractOutputRoute→BaseContractErrors`, `BaseContractRoute→BaseContractErrors`,
`baseContract→oc`; head-only `BaseContractErrors→MergedErrorMap`, `baseContract→ContractBuilder`,
`baseContract→Schema`.

The error was conflating two comparisons: **head-to-head** across `42874803`/`2863d29e`/`9ab779ce`,
where the sets *are* identical, and **head-to-`main`**, where they are a substitution. The correct
wording, now used in the PR body and here: **count delta 0, exact known R-1 substitution reverified,
9 unchanged + 3 expected replacements, no unreviewed additions.**

This matters beyond phrasing: "identical" would make an unreviewed substitution invisible, since a
count match with a *different* member is exactly a regression wearing a passing number. The
substitution wording forces the three replacements to be named and reviewed.

## D-41 — content head, evidence head, and evaluator-carrier head are three distinct things

This branch now carries three heads that must not be conflated:

| Head | SHA | What it is |
| --- | --- | --- |
| **Content** | `d5f3bf4c` | the tree all eight receipts attest; the only head whose product bytes matter |
| **Evidence** | `dbd3eafa` | receipts + audit committed on top; `git diff d5f3bf4c..dbd3eafa -- packages plugins docs templates` is **empty** |
| **Evaluator carrier** | `ce73a038` | the currency verdict; touches **exactly** `evaluate.md`, +111/−0, and **zero** product, receipt or archive bytes (verified) |

**Carry-forward rule.** A verdict certifies a *content* head. Evidence-only commits stacked above it —
receipts, audits, verdicts — do not invalidate it, provided each is proven to touch no product byte.
That proof is the price of the carry-forward and must be recorded, not assumed.

**The evaluator did not assess its own commit.** Session `2f492178` evaluated content head
`d5f3bf4c` at evidence head `dbd3eafa`; `ce73a038` is where it *wrote* the verdict and postdates the
tree it judged. Claiming otherwise would assert a self-certification the harness forbids.

### D-40 addendum — where the ambiguous phrase survives, and why it is not rewritten

The currency evaluator ruled on the corrected wording (`evaluate.md`, addendum `b39faa1c`) and
resolved what R-1 actually required:

> R-1's "set identical to the one above" refers to the **three-way record it tabulated**
> (`main` / HEAD / diff) — identity of the head set and of the recorded 3-for-3 substitution, **never
> head = `main`**. Head = `main` is unsatisfiable by construction, since the leaf makes
> `BaseContractErrors` public.

So the leaf satisfies R-1 as written at every head through `d5f3bf4c`, against three successive
`main`s, and **"count delta 0 + known 3-for-3 + no unreviewed additions" is stricter than the wording
it replaced**, not a relaxation.

**Two places still carry the ambiguous phrase and are deliberately left alone:**

- `audit/evidence-sufficiency-post-1748.json` and `post-1755.json` — the latter's note reads
  "head 12, main 12, finding set identical", which **read alone is the false head-vs-`main` claim**.
  They are receipt-adjacent audit records of what was computed at those heads; rewriting them after
  the fact would be worse than the imprecision. This entry is the correction of record.
- The predecessor verdict sections in `evaluate.md` — they tabulate the three-way sets and use the
  phrase in R-1's own sense, which the evaluator confirmed is correct there. **Not to be edited.**

**One factual nit the evaluator caught in the PR body:** it described the residual private names as
"upstream oRPC/TanStack names". **None of the six is TanScript/TanStack** — all three head-only
references (`MergedErrorMap`, `ContractBuilder`, `Schema`) are `@orpc/contract` imports. Corrected in
the body to "upstream oRPC names".

**Source anchors, from the evaluator's re-derivation** — exactly two reviewed slice-1 declarations
account for all three head-only findings, and nothing else:

| Finding | Anchor | Cause |
| --- | --- | --- |
| `BaseContractErrors → MergedErrorMap` | `contract-primitives.ts:123` | the R-2/F-1 alias, now public at `src/public/mod.ts:4` |
| `baseContract → ContractBuilder` | `contract-primitives.ts:155` | the T-2 explicit annotation |
| `baseContract → Schema` | `contract-primitives.ts:155` | the T-2 explicit annotation |

and the three `main`-only findings disappear because `main` does not export `BaseContractErrors`
(`:211`, `:240`) and annotates `baseContract` as `ReturnType<typeof oc…>` (`:120`).
