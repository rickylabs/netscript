# PLAN-EVAL — cycle 3 (verdict artifact)

- Run: `feat-cli-resource-slice--1354`
- PR: #1891
- Phase: PLAN-EVAL (plan only; no product code exists — confirmed: no
  `packages/cli/src/kernel/application/resource-slice/`, no resource verb registered in
  `packages/cli/src/public/features/generate/generate-group.ts`)
- Evaluator: OpenHands cloud session (separate from the plan-authoring session), per
  `.llm/harness/evaluator/plan-protocol.md`
- Evaluated head: `b2856f62c` (plan.md still at `b210f9092`; `git diff --stat b210f9092 HEAD -- plan.md`
  is **empty** — third consecutive eval of a byte-identical submission)
- Gate reference: `.llm/harness/gates/plan-gate.md`
- Machine verdict: `OPENHANDS_VERDICT: FAIL_PLAN`

## Premise verification (required by the trigger)

Verified from code at this checkout, independent of the plan's own citations:

1. `packages/cli/src/public/features/generate/generate-group.ts` registers exactly three commands —
   `aspire`, `runtime-schemas`, `plugins`. ✅ premise holds.
2. `grep -rl "withResource\|withRouteContract" packages/cli/src/kernel/assets/` returns exactly one
   app asset: `packages/cli/src/kernel/assets/app/routes/examples/service/index.tsx.template` (plus
   the generated barrel `embedded.generated.ts` and prose-only
   `agent/guidance.md.template`, which names `withResource` in narrative text but emits no code).
   ✅ premise holds: **exactly one generated app asset demonstrates the slice**, and it is a frozen
   `init` template.
3. `packages/cli/src/kernel/application/ui/web-scaffold.ts` is 393 lines and has no partial emission;
   `definePartial`/`(_partials)` appear nowhere in `assets/app`. ✅
4. `packages/cli/src/public/features/ui/add/add-ui-command.ts:63` hardcodes `["app.tsx", "main.ts"]`
   as the only registration targets, and `web-scaffold.ts:41` hardcodes
   `join(root, "app.tsx")` for the loader update — the plan's D7.3 edit-target defect claim is real. ✅

The plan's justification foundation is **correct**. Findings below are plan-quality defects, not a
wrong premise.

## Plan-gate checklist

| Box | Status | Evidence / gap |
| --- | --- | --- |
| Research present and current | PASS | `research.md` present; re-baselined at named SHAs |
| Decisions locked | PARTIAL | D1–D11 locked, but D3's re-run ordering is self-contradictory (HIGH-1) → a locked decision that cannot be implemented as written |
| Open-decision sweep | **FAIL** | No sweep section; **no risk register at all** (`grep -ni risk plan.md` → one incidental hit at line 401); gate checklist's "must resolve now" items (D9 enumeration gap, D3 ordering, D4.1 no-branch) are undispositioned |
| Commit slices | PASS | 7 ordered slices, each with files / expected touch set / ceiling / gate evidence |
| Risk register | **FAIL** | absent |
| Gate set selected | PARTIAL | archetype matrix + overlays named and all cited `deno task` names exist in root `deno.json`; but D6's doc-lint A/B has no tool path (MEDIUM-4) and two cited gates are not fed by this feature (MEDIUM-5) |
| Deferred scope explicit | PARTIAL | seven deferrals + #1664/#1356 fences; **#1355 never named** (MEDIUM-3); no `#1348` anywhere in the run artifacts |
| jsr-audit applied | PASS | D8 slow-type, `deps:why`, export-map doc lint, `check:publish-assets`, `publish --dry-run`; `jsr:audit` named in every CLI slice |

Two unchecked boxes + one contradictory locked decision → `FAIL_PLAN`. Per plan-gate, this is now the
**third** `FAIL_PLAN` cycle, so the protocol's escalation-to-user also applies.

## Findings (severity-ranked)

### HIGH-1 — D3's conflict guarantee is defeated by its own ordering (re-run can be blocked with no remedy)
`plan.md:152-154` ("A conflict … prevents any write") vs `plan.md:194-195` ("When an owned resource
directory already exists, … the first option-bearing run … compares every existing leaf … **before
choosing the next option**"). For a second `--form` onto an already-conflicted base, the required
ordering is *option selection (dry-run) → re-render candidates → conflict check → write*; as written,
the check precedes option selection, so the command aborts on a pre-existing conflict before it can
compute a dry-run or name a remedy. No non-conflicting path exists for any later option.
**Fix:** state the ordering in D3/D7; make `--dry-run` conflict-reporting-only; define the remedy
surface (per-leaf `--keep`/`--replace`, `--force` **scoped to owned leaves only**, and an explicit
abandon path).

### HIGH-2 — D9's overlap enumeration is provably incomplete
Against #1664's **live** file list (162 files; 59 non-`.llm/`), D9 names 8 of 9 slice-owned overlap
files. `packages/cli/src/kernel/templates/app/route-templates_test.ts` **is modified by #1664 and is
named by this plan's slice D** (`plan.md:64`), yet appears nowhere in D9.
**Fix:** add it to D9, or justify non-collinearity, and add a standing rule: re-diff against #1664's
head at each slice start, not from a cached snapshot.

### MEDIUM-3 — #1355 is never fenced, and no slice carries `Refs #1354`
`grep -n "1355"` over the run directory matches only `plan-eval.md` (an evaluator self-assertion). The
plan's D5 edits `service/index.tsx.template` — the same template #1355 ("app-side client/query wiring
is a one-shot template with hardcoded names, colliding `service` cache keys and a no-op invalidation",
**open**) exists to fix; convergence order between them is undefined. Slice E (`route slice --refs
#1354`) is also the only verb whose reference is not a bare, keyword-less `Refs #1354`, so it does not
satisfy the trigger's partial-semantics shape.
**Fix:** add a #1355 boundary line (which of cache-key shape / invalidation is #1354 emitting now vs
#1355 later); make every verb reference `Refs #1354` with no closing keyword anywhere in the run
artifacts.

### MEDIUM-4 — The doc-lint A/B baseline has no tool path
`.llm/tools/run-deno-doc-lint.ts` supports only `--root`, `--entrypoints`, `--output`, `--pretty`,
`--help` — no `--compare`, `--allow-list`, or baseline flag.
**Fix:** specify "emit before/after JSON reports per package, then compare" with the concrete two
invocations, or name the tool to be added in a named slice.

### MEDIUM-5 — `check:mcp-export-corpus` is not an observable gate for this feature
`generate-export-surface-corpus.ts` derives from package export maps (no `--help`/command-tree
invocation), so new Cliffy **options** (`--client`, `--namespace`, `--form`, …) cannot move the
frozen `1133`.
**Fix:** drop it as an anti-drift claim or justify; keep `e2e/src/domain/cli-surface.ts` as the real
command-surface gate.

### MEDIUM-6 — D4.1 has no branch and no convergence owner
Slice C (copy `examples/service/**` into `assets/resource/service/**`) is followed by D5 **only if
`add resource service` reproduces the template** (D5's own precondition). Nobody owns the else: the
frozen example keeps carrying a defect D7.3 proves live (`add-ui-command.ts:63` cannot reach
`apps/<app>/main.ts`).
**Fix:** name the non-convergence disposition (or re-scope D5 to a defect-only subset with its own
gate).

### MEDIUM-7 — `deno.lock` must move, contradicting the plan-wide immutability clause
`deno.json:116` `check:assets-barrel` diffs only the `embedded.generated.ts`/`registry.generated.ts`
family — **not** `deno.lock`. D8 adds `@netscript/fresh` to `packages/cli`, which necessarily
re-resolves the workspace lock; that change is then neither required nor permitted (and the trigger's
own hygiene rule forbids incidental lock churn).
**Fix:** add a dependency-approval item to slice A with a named lock diff review, or state that
`@netscript/fresh` resolves as a workspace target with **zero** lock delta and gate on
`git diff --name-only` excluding `deno.lock`.

### MEDIUM-8 — `web-scaffold.ts` ceiling double-counted and the extraction gate is circular
`plan.md:105` counts `web-scaffold.ts` in the slice-A ceiling (6/8) and again in D9's serialization
ceiling; slice A's gate is `web-scaffold_test.ts` "must pass **unchanged**" while slice A adds
`--query`/`--query-module` to that same file.
**Fix:** count each shared file once in the ceiling it is serialized against; split A's gate into
regression (existing cases unchanged) + extension (new cases).

### LOW-9 — D3's conflict test omits the marker-forgery case
The six cases (`plan.md:462`) omit a leaf that **carries the ownership marker but was edited**. Add
it, and pin the marker format (comment vs sidecar) as the authority for "hand-edited".

### LOW-10 — `packages/mcp` export corpus not in any touch set
#1664 regenerates
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` after
`@netscript/cli` surface changes; this plan adds options and never names the file.

### LOW-11 — `--client` semantics drift from #1664 in the option table
`plan.md:28` ("`add resource` … never selects a client") vs `plan.md:76` ("Ambiguity **still** fails
closed"). Align; state how `add resource` behaves with zero or two clients when it binds none.

### LOW-12 — New `packages/cli/deno.json` tasks vs the "no root task" fence
`plan.md:648,693` fences root `deno.json` **tasks**, but `packages/cli/deno.json:3` has no `tasks`
key, so slice C/E must create one. State the package-level exception explicitly.

### NIT-13/14/15 — gate-name spellings
Slice F cites `deno task check:assets-barrel` (real task exists; the plan elsewhere calls it
`assets:check`, `plan.md:51`), `e2e:cli:run --profile quick …` (real: `e2e:cli`, and no scaffold
profile is "quick"), and a slice-B ceiling of 7 with only 6 files enumerated.

## What the plan gets right (re-confirmed by independent code reads)

- D3/D7 core: full pre-render into a plan object, byte-compare before any write, **no force-by-
  default**, `unowned-collision`, `registration-conflict`, `partial-write` as named defects.
- D9 default is *hard-stop, not branch* (`plan.md:262`) — conservative and correct.
- No second client-selection mechanism; `--client` adopts #1664's exact selector; the extracted
  matcher lives in `application/resource-slice/client-selector.ts` **without importing UI or
  presentation**. No silent auto-pick anywhere. `--namespace` is a label, not a selector, and is
  explicitly not an alias.
- D7 file ceilings with per-slice expected touch sets, in the shape of
  `.llm/runs/feat-workers-runtime--1592-1451/plan.md`.
- D6's extension is genuinely conditional (no-namespace = no edit) and its three registration targets
  are the only places where the defect is proven live.
- Scope fences exclude forms, registries, partial/worker runtime, hosted runtime, plugins.
- `--on-conflict ask|keep|replace|replace-with-safety-net` exists in **no** shipped CLI today, so D3's
  "re-runnable verbs must not silently replace bytes" is new, not a re-abstraction — the cycle-1
  reservation is retired.
- All cited `deno task` names except those in NIT-13/14 exist in root `deno.json`; `.llm/harness/
  gates/{archetype-gate-matrix,jsr-publish-gate,cross-cutting-gates}.md` exist; no dangling
  `context-pack.md` reference was found in this pass.

## Required fixes before re-gate (minimal delta)

1. Resolve HIGH-1 (re-run ordering + remedy surface) and HIGH-2 (D9 completeness) — both single-
   subsection edits.
2. Add the missing plan-gate boxes: a **risk register** and an **open-decision sweep** with
   safe-to-defer / must-resolve-now marks.
3. Apply MEDIUM-3..8. NITs may ride along.
