# PLAN-EVAL — test-jsdoc-example-compile-gate--1533

- Plan evaluator session: Native Claude · Fable 5 · medium (lane-policy `formal_plan_evaluation`
  route for a Codex-authored plan) · job `f4f36161` · 2026-08-30
- Run: `test-jsdoc-example-compile-gate--1533` · PR #1756 (draft) · branch
  `test/jsdoc-example-compile-gate`
- Evaluated head: `0f30c4f4bd2c9e7b615dfc776f05d7b2c0c4bf93` (confirmed `git rev-parse HEAD`;
  `git ls-remote` for the branch returns the same SHA)
- Base: `13878a80a50c55b9662099fed64555f2310ae4a3` (`main`)
- Surface / archetype: 6 — CLI / Tooling, proportional internal gate
- Scope overlays: docs
- Evaluator worktree: `/home/agent/projects/netscript/worktrees/007-eval-1533-plan`, detached;
  the leaf worktree was not written to.

## Verdict

**`FAIL_FIX`** — bounded plan corrections. The plan decided the fix-or-baseline policy, the
compile mechanism type-checks imports rather than parsing them, and there is no unattributable
baseline. It fails on four bounded items, the first of which is a factual error in the inherited
research that the plan's repair-scope reasoning currently rests on. None of them changes the plan's
shape; all are edits to `plan.md` (and an appended `drift.md` entry), after which implementation
may begin without a second PLAN-EVAL cycle unless the supervisor wants one.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS (with correction, see F1) | `research.md` re-baselined against `13878a80` on 2026-08-30; findings 1–5 spot-checked below. |
| Decisions locked                        | PASS   | `plan.md` D1–D17, each with rationale. |
| Open-decision sweep                     | FAIL   | Two decisions the plan does not flag would force rework if deferred: the repair convention for app-side unbound names (F2) and empty-selection behaviour (F3). |
| Commit slices (< 30, gate + files each) | PASS   | B0, P1, I1–I6: seven slices, each with proving gate and files; RED (I3) precedes GREEN (I4). |
| Risk register                           | PASS   | Twelve rows with mitigations. The "first census reveals many genuine defects" row is under-weighted (F2). |
| Gate set selected                       | PASS   | F-1/F-2/F-5/F-6/F-7/F-10/F-19 plus docs overlay; Archetype-6 F-CLI family declared proportional/N/A with reason. |
| Deferred scope explicit                 | PASS   | `## Non-Scope`, `## Deferred Scope`; #1374/#1377/#767/#1108 boundaries named. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` § jsr-audit surface scan; export-map and slow-type risks named; no published signature changes planned. |

## What I tried to break, and what survived

### 1. The baseline trap — survived

The plan does **not** baseline compile failures. D12 repairs every genuine failure; D5 puts the only
allowance at the example itself (`ts no-check:<nonblank reason>` on the opening fence, printed as
`path · owner · reason` in every run); D13's ratchet is a *maximum* over already-attributed
exemptions plus *minimum* coverage counts, i.e. the same shape as `TIER_1_FLOOR` in
`.llm/tools/docs/snippet-policy.ts`, not a global failure count. A reader can tell which example is
excused and why, and the count can only shrink without ceremony. This is not the #1542 / #1378 /
#1709 defect class.

What did **not** survive is the assumption underneath D12 that the repair volume is small — see F1
and F2.

### 2. Compile without execute — survived

D8 reuses `compileSnippetAnalysis` (`.llm/tools/docs/snippet-compiler.ts`): synthetic modules
written to a temp dir, one `deno check --unstable-kv --lock <copied> --config <synthetic>` with an
import map built from real workspace `exports` (`snippet-workspace.ts`). `deno check` resolves and
type-checks every import specifier, so a dead specifier is TS2307 and an unbound name is TS2304 —
the #1425 class is caught; nothing is imported into the gate process or executed. I confirmed the
primitive directly: a file with the pagination example body checked with `deno check --unstable-kv`
exits 1 with TS2304 ×2, while `deno doc --lint packages/contracts/query.ts` exits 0 (`Checked 1
file`). The plan's stated need for a *published-only* mode of the resolver is real:
`resolveWorkspaceSurface` today includes every `@netscript/*` member regardless of `publish:false`.

D6 is feasible: `deno doc --json query.ts` (schema version 2, `nodes` keyed by file URL) reports
`createPaginatedOutput` with `declarations[0].location = schemas/pagination.ts:144` and the
`example` tag on the declaration, so exact-declaration identity through a re-export is available
without `--private`.

### 3. Illustrative examples — partly survived (F2, F4, F5)

The opt-out is the existing reasoned fence marker; the extractor rejects blank reasons, misplaced
markers, and extra fence attributes. Two holes remain:

- **A bare fence (no language) is a reason-less opt-out.** D4 reports tags "containing only
  non-TypeScript fences" as `nonTypeScript`; the extractor classifies an empty info string as
  unchecked. An author can delete `ts` from a fence and the example silently leaves the checked
  corpus with no reason and no census line that distinguishes it from `bash`. At least one bare
  fence exists in the corpus today (`packages/cron/ports/types.ts:15`, non-TS content). → F4.
- **The marker can excuse a genuine break.** Nothing mechanical distinguishes "intentionally
  partial" from "broken and labelled partial"; the author who writes the reasons also sets the
  first ratchet maximum in the same leaf (I4). The plan's only defence is the word "genuine" in
  D12. → F5.

### 4. The supervisor's inherited research — one claim right, one claim wrong

I re-derived both claims against the evaluated tree.

- **"The four contracts examples import from a non-exporting root" is false — confirmed.**
  `packages/contracts/deno.json` exports `.`, `./crud`, `./query`, `./transform`. The four examples
  (`schemas/pagination.ts`, `schemas/filters.ts`, `src/application/paginated-query.ts`,
  `src/application/transform-helpers.ts`) import from `@netscript/contracts/query` or `/transform`,
  and `deno doc --json query.ts` / `transform.ts` list every named symbol (`PaginationInputSchema`,
  `createPaginatedOutput`, `FilterConditionSchema`, `buildPrismaWhere`, `paginatedQuery`,
  `createTransformer`). The supervisor and the author were right to reject the ledger entry.
- **"Exactly one genuine defect survives" is wrong.** Stated plainly: **all four cited examples
  fail `deno check`**, and so do both entrypoint module examples in `query.ts` and `transform.ts`.
  Compiled as temporary files in `packages/contracts/` importing `./query.ts` / `./transform.ts`
  (removed afterwards; worktree clean):

  | Example | Diagnostics | Class |
  | --- | --- | --- |
  | `schemas/pagination.ts` module | TS2304 `baseContract`, TS2304 `UserSchema` | unbound app-side names |
  | `schemas/filters.ts` module | TS2345 — `{ field: string; operator: string; value: string }[]` not assignable to `Readonly<{ field: string; operator: FilterOperator; … }>[]` | **genuine type error**: literal widening; a consumer pasting this example hits it verbatim |
  | `src/application/paginated-query.ts` module | TS2304 `db` | unbound app-side name |
  | `src/application/transform-helpers.ts` module | TS2552 `dbUser`, TS2552 `dbUsers`, TS18046 ×3 (`dbUser` is `unknown` — the callback parameter has no contextual type) | unbound app-side names **and** a genuine inference defect in the example shape |
  | `query.ts` module (entrypoint) | TS2304 `db` | unbound app-side name |
  | `transform.ts` module (entrypoint) | TS2304 `UserRecord` | unbound app-side name |

  `research.md` finding 5 and the PLAN comment only claim that the *pagination* example fails; they
  never claim the other three compile — but they never checked, and the brief carried "exactly one
  genuine defect" forward as if they had. The ledger was wrong about the *reason*; it was not wrong
  that the examples are defective. This matters because the plan's D12 rationale ("first-run
  failure count is intentionally unknown … regardless of N") was written believing N in the
  motivating package was one.

  A rough census of the publish set (`packages/**` + `plugins/**`, excluding tests, `bench`,
  `cli/e2e`, fixtures): ~443 `@example` tags in ~234 files, ~415 TS-fenced candidates, 6 unfenced
  tags (fail under D4), and **29 TS fences in 20 files already use `UserSchema` / `db.` / `prisma`
  / `baseContract` unbound** — a lower bound on the dominant failure class, since D6 injects only
  the documented symbol and nothing else.

### 5. Gate wiring and false-green — not survived (F3)

`deno check --config <x>` with **zero file arguments exits 0** and prints only `Warning No matching
files found` (verified on Deno 2.9.5 in a scratch directory). The reused compiler passes
`...modules.map((m) => m.path)` straight to `deno check`; if every candidate is exempt, or the
publish-rule selector matches nothing, the subprocess is invoked with no paths and the gate is green.
The #1374 gate is protected only by its `TIER_1_FLOOR.minimumChecked`; the plan gives this gate an
equivalent floor (D13) but the floor is populated at I4 — the plan never states what the gate does
on an empty selection, which is the exact question the brief required it to answer. D16/D17 are
otherwise sound: the quality job already runs under `RUN_DENO` for `packages/**`, `plugins/**` and
`.llm/tools/**` changes, and `run-gate.ts` + `catalog.ts` are the durable receipt path.

### 6. Scope discipline — survived

`git diff --stat 13878a80 HEAD -- . ':!.llm/runs'` is empty. Only `.llm/runs/…/` changed across
`a1a4328b` and `0f30c4f4`.

### 7. Receipt honesty — survived

Every SHA cited in the run artifacts, PR body, and phase comments resolves:
`a1a4328ba4706f3fe8e7c541e43763975a8df485` (B0), `0f30c4f4bd2c9e7b615dfc776f05d7b2c0c4bf93` (P1),
`13878a80a50c55b9662099fed64555f2310ae4a3` (base), `d558f9ab` → `d558f9ab21c91da99928712e54ce892aee8f6d6c`
(#1537). PR #1756 is draft, base `main`, head `0f30c4f4`, milestone `0.0.7`, labels `type:test`
`area:tooling` `area:docs` `status:plan-eval`, body carries `Closes #1533`. The 35-member / two
`publish:false` census matches `.llm/tools/quality/check-root-coverage_test.ts` and the two
`deno.json` files.

## Open-decision sweep (evaluator-run)

1. **Repair convention for unbound app-side names** (`db`, `UserSchema`, `dbUser`, `UserRecord`,
   `baseContract`, …). This is the dominant failure class, not an edge case, and D12/D5 leave the
   author to choose per example between (a) adding stand-in declarations to the example body
   (visible on JSR for every affected example), (b) a reasoned `no-check` exemption (which, applied
   at this volume, makes the exemption ratchet the gate's largest number and shrinks the checked
   corpus), or (c) a typed illustrative preamble — which D6 forbids ("inject only that documented
   symbol"). Deferring this produces 100+ inconsistent edits and would force rework. **Must resolve
   now.**
2. **Empty-selection behaviour.** Must resolve now (F3).
3. Bare-fence classification (F4) — small, but it is a policy hole, not an implementation detail.

## Findings and required fixes

| # | Severity | Finding | Required fix (bounded) |
| --- | --- | --- | --- |
| F1 | high | Inherited claim "exactly one genuine defect survives" is false: all four cited contracts examples and both entrypoint module examples fail `deno check` (table above); `filters.ts` and `transform-helpers.ts` fail for reasons that are not brevity. | Append a `drift.md` entry correcting the record with the diagnostics; amend `research.md` finding 5 or add finding 12. The rescue of the ledger's *reason* stands; its *conclusion* (the examples are defective) was right. Do not propagate "one defect" into I3/I4 expectations. |
| F2 | high | D12 says "regardless of N" but the plan has no convention for the dominant unbound-app-name class and no checkpoint between measuring N and repairing it. | Add to `plan.md`: (i) the single repair convention for unbound app-side names (pick one of (a)/(b) above, or a bounded generator-proven support per D11 if one actually exists — `@database/zod` already ships `UserSchema` in `snippet-supports.ts`, but only for site snippets); (ii) I3 must commit the RED census to the run artifacts as `N` split by class (bad specifier / type error / unbound name / unfenced / malformed) **before** I4 starts; (iii) a numeric rescope trigger for D14 (e.g. if repairs would touch more than a stated number of packages or examples, stop and hand up) so "regardless of N" has a ceiling the supervisor set, not the author. |
| F3 | high | Empty selection is green: `deno check` with zero paths exits 0; the plan does not state what happens when the selector or exemptions leave zero checked modules. | Add to D8/D17: zero candidates **or** zero checked modules is `FAIL` with a census line saying so, independent of the D13 floor; the compiler must not spawn `deno check` with an empty path list; add this as a negative control in I3 alongside the historical relative-import controls. |
| F4 | medium | A fence with no language inside an `@example` leaves the corpus with no reason (`packages/cron/ports/types.ts:15` shows the shape). | Amend D4: an unlabelled fence in an `@example` is `malformed` (fails until it carries a language), or at minimum is counted as its own census field and included in the ratchet so it cannot grow silently. State which. |
| F5 | medium | The `no-check` marker can excuse a genuine break; the author sets the first ratchet maximum. | Amend D5/D12: an example whose failure is a bad import specifier, an undeclared `@netscript/*` subpath, or a type error against the documented symbol's real signature (the #1425 / `filters.ts` class) may **not** be exempted; I4 must list every exemption with its reason in the PR phase comment so IMPL-EVAL audits the list, not the count. |
| F6 | low | D6's ambient preamble must cover type-only and class (value+type) symbols; the plan says "declares the symbol" without saying how for each declaration kind. | One sentence in D6 or the Design checkpoint naming the three shapes (`const`, `type`, class = both) and a test per shape in I3. |
| F7 | low | `plan.md` § Non-Scope says "Changing the repo's JSDoc convention that symbol examples omit an import for the documented symbol" is out of scope, but D5's marker adds text to the opening fence that JSR renders. | Confirm in I4 (one `deno doc --html` or JSR-preview check on one exempted example) that `typescript no-check: …` still highlights and does not leak the reason into the rendered page; record the result. Not a plan change. |

## Gates recorded

| Gate | Result | Evidence |
| --- | --- | --- |
| Head / remote match | PASS | `0f30c4f4…` local and `git ls-remote` |
| Scope (diff outside `.llm/runs/` vs `main`) | PASS | empty |
| SHA resolution | PASS | all four resolve (above) |
| Supervisor claim A (ledger reason false) | PASS | `deno.json` exports + `deno doc --json` symbol presence |
| Supervisor claim B (exactly one defect) | **FAIL** | six failing probes, diagnostics above |
| Compile primitive catches TS2304/TS2345 | PASS | probes; `deno doc --lint` exit 0 reproduced |
| Empty `deno check` exits 0 | CONFIRMED (defect) | scratch dir, Deno 2.9.5 |
| Aspire / Docker / browser / `e2e:cli` / `scaffold.runtime` | NOT_RUN | no expensive-gate lease; not needed for a plan verdict |

## Lessons for promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Disproving a ledger's *reason* is not the same as disproving its *conclusion* | When a carried claim is rejected, re-test the thing it was about with the plan's own gate, not only the cited measurement | all lanes | high |
| `deno check` with zero paths is green | Any gate that forwards a computed file list to `deno check` must fail on an empty list before spawning | tooling gates | high |
