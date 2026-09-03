# Drift Log: generated design registry catalog drift gate

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-15 — frontend overlay legacy pointer absent

- **What:** The frontend overlay's additional-read list names `.claude/05-frontend.md`, which does
  not exist in this checkout.
- **Source:** `rg --files . | rg '/05-frontend\\.md$|frontend\\.md$'` returned no matching
  authority file.
- **Expected:** `.llm/harness/archetypes/SCOPE-frontend.md` lists the file as an additional input.
- **Actual:** Fresh 2.x guidance and the fresh-ui L0/theme authority chain are present and were read.
- **Severity:** minor
- **Action:** accept for this leaf; no implementation decision depends on the missing pointer.
- **Evidence:** `.agents/skills/deno-fresh/SKILL.md`,
  `.agents/skills/fresh-ui-horizontal/l0-conventions.md`,
  `.agents/skills/fresh-ui-horizontal/theme-authoring.md`, `packages/fresh-ui/README.md`.

## Significant — coordinator contract amendment for Tier-A finding T-3

Severity: **significant**. Recorded by topic orchestrator `topic-fixes-0.0.7` on coordinator
disposition, at leaf head `5fe60023530d89b888a028d5269909636ac03b8a`.

### Why the frozen surface could not express the fix

Tier-A finding T-3 established that the landed drift gate never runs on CLI-side edits. Traced end
to end:

1. `packages/fresh-ui/tests/registry-doc-drift.test.ts` executes **only** through
   `.github/workflows/fresh-ui-quality.yml`. `.github/workflows/ci.yml` contains no reference to
   `fresh-ui` at all.
2. That workflow's `pull_request` and `push` `paths:` filters cover `packages/fresh-ui/**` plus a
   few tool/config paths, and do **not** include
   `packages/cli/src/kernel/assets/app/routes/(design)/**`.
3. `.github/scripts/ci-classify-changes.ts` sets `freshUi: path.startsWith('packages/fresh-ui/')`,
   so a CLI design-asset path classifies as `desktop`/`surface`, never `freshUi`.
4. The root `deno task test` cannot compensate: `packages/fresh-ui` is **not** a member of the root
   workspace (it carries its own lock, which is why its suite runs with
   `--lock=packages/fresh-ui/deno.lock --frozen`).

Consequence: a later PR editing only the generated catalog template re-introduces exactly the
50-of-66 drift this leaf exists to eliminate, with no CI signal — on the very surface that drifted.

### Why this is an amendment rather than a re-scope

Issue #1358's acceptance carries a **close-gated** `gate:` box requiring the drift gate to run on
changes to the manifest **or the CLI design assets**, and PR #1657's body carries `Closes #1358`.
The coordinator explicitly declined to weaken or re-scope the box, drop the closing keyword, or
defer a knowingly false CI surface. The gate must therefore genuinely cover both sides.

### Amended surface — exactly three files, nothing else

The original four product surfaces remain in force and unchanged in ownership. Added:

1. `.github/workflows/fresh-ui-quality.yml`
2. `.github/scripts/ci-classify-changes.ts`
3. `.github/scripts/ci-classify-changes.test.ts`

No other file enters the contract. The repair is bounded to CI-ownership wiring plus its focused
tests; it must not touch the four product files, the locks, the issue closing semantics, the
draft/`status:impl` lifecycle, or any prior evidence.

### Gate proportionality for the repair

Cheap classifier/workflow-structure tests plus the existing drift/check/quality/arch gates only.
`fresh-browser`, Aspire, Docker, and any expensive lease are **explicitly out of scope** — the
singleton lease is consumed and its `PASS` receipt at product head `4a3c40321` remains valid because
the repair changes no product file.

## Significant — second coordinator contract amendment for IMPL-EVAL finding E-1

Severity: **significant**. Recorded by topic orchestrator `topic-fixes-0.0.7` on coordinator
disposition, at leaf head `ca8773f662e3ae8ba48a601e73563570825892ff`.

### Why the amended surface still could not express the fix

IMPL-EVAL cycle 1 (`a46b83831`, evaluated head `939e73113`) returned **`FAIL_FIX`** on **E-1**: the
leaf repaired the source template but never regenerated the embedded barrel the CLI actually ships.

Independently confirmed: `packages/cli/src/kernel/assets/embedded.generated.ts` is absent from the
entire product diff, still carries `total: 50`, contains **zero** occurrences of `citation-chip`,
and `deno task check:assets-barrel` exits **1**. `TemplateRegistry`'s only content source is
`EMBEDDED_TEMPLATE_CONTENT` from that file, its `hydrate()` is a no-op, and there is no disk
fallback — so `netscript init` still scaffolds a gallery rendering "All 50 items" with the AI
collection hidden. #1358's user-visible defect was unfixed on the consumer path.

Secondary finding **E-2**: `assets-barrel` is absent from this leaf's `provingGates` and was never
run by any lane, which is why the staleness survived every green gate.

### Amended surface — exactly one generated product path

Added to the contract:

1. `packages/cli/src/kernel/assets/embedded.generated.ts` — **generated**; only ever written by
   `deno task gen:assets-barrel`, never hand-edited.

Plus append-only run artifacts needed to record this amendment and its proof. **No other product
file enters the contract.** The four original product surfaces and the three T-3 CI files remain in
force and unchanged.

`deno task check:assets-barrel` is added to the leaf's validation plan as a bound gate; its raw exit
code and structured receipt are required evidence.

### Determinism condition on the repair

The regenerated delta is retained **only if** it is exactly the output of `deno task
gen:assets-barrel` and **no other generated target moves**. Otherwise the author stops and reports.
The expected shape, observed independently in a clean tree at this head, is **one file, one line**.

### Why no expensive gate is rerun

The previously leased `fresh-browser` product surface is **byte-identical**: this repair
synchronizes only the embedded *representation* of an already-gated template. The consumed lease's
`PASS` receipt at product head `4a3c40321` therefore remains valid, and no Aspire, Docker, browser,
scaffold-runtime, or E2E rerun is authorized or needed.

### Supervisor boundary note

While verifying E-1 the topic orchestrator ran `deno task check:assets-barrel`, whose first half
(`gen:assets-barrel`) mutates the tree. That left `embedded.generated.ts` modified in the working
tree. It was **reverted with `git checkout --` before dispatch**, restoring the committed stale
state, so the repair delta is produced by the Codex author and not by the supervisor. Verified clean
at `ca8773f66` with the barrel back to `total: 50` before the author was resumed.

## Non-formal efficiency correction — the T-3 CI expansion is reverted

Recorded by topic orchestrator `topic-fixes-0.0.7` on coordinator disposition after cycle-2 `PASS`
(`ed9ee7663`). **Formal IMPL-EVAL cycle 2 `PASS` at head `3d7819203f59e68eb5b45f6871a03c41ca43cd2f`
stands unchanged and final.** This is a post-evaluation efficiency cleanup, **not** a formal cycle,
and there is no cycle 3.

### G-1 — the T-3 amendment's recorded root cause was factually wrong

Cycle-2 finding G-1, independently re-verified by this orchestrator:

- Root `deno.json` declares `workspace: ["packages/*", …]`. `packages/fresh-ui` **is** matched by
  `packages/*`. The earlier claim that it "is not a member of the root workspace" is **false** — it
  came from filtering workspace entries for the literal string `fresh`, which a glob does not
  contain. That is a bad probe, not a fact.
- Executed from the repo root:
  `deno test --allow-all --no-check --filter 'generated design catalog matches the Fresh UI registry manifest'`
  → **1 passed, 0 failed, exit 0**. Root discovery reaches the drift gate.
- The classifier sets `needsDeno = true` for **both** `packages/fresh-ui/registry.manifest.ts` and
  the CLI design-asset template, and `ci.yml`'s required `check-test` job runs the root `test` gate
  under that guard.

So #1358's close-gated requirement — "the drift gate runs in CI on every change to
`registry.manifest.ts` **or** the CLI design assets" — was **already satisfied before the T-3
amendment existed**. The T-3 finding was blocking on a false premise.

Sharper still: `fresh-ui-quality.yml`'s job runs `--gate check`, `--gate lint`,
`fresh-ui-lock-regression`, and `clean-worktree`. **It has no test step**, so wiring the design
assets into it added *zero* drift-gate coverage and only duplicated check/lint work on CLI design
PRs — precisely the false-positive/noncritical CI expansion the owner asked to eliminate.

### Disposition — revert exactly the three CI files

`.github/workflows/fresh-ui-quality.yml`, `.github/scripts/ci-classify-changes.ts`, and
`.github/scripts/ci-classify-changes.test.ts` return to their **current `origin/main` bytes**
(`origin/main` = `e090f894ff3682405a36e4f896ffd2cc16f9a1f8`). No other product path changes.

**All core #1358 work is retained**: the catalog template fix, the drift gate and its symmetric
fixtures, and the regenerated `embedded.generated.ts` barrel with its `assets-barrel` receipt.

### G-2 disposition — static consumer evidence accepted

The inherited `fresh-browser` receipt is legitimate for what it covers, but it never rendered the
generated design gallery — it is the **form-navigation** browser regression. Any run-artifact claim
implying that receipt exercised the gallery is corrected. Consumer proof for #1358 rests on static
evidence: the decoded barrel (66 ordered, field-exact items, the `ai` collection,
`registryCollections`, exact `registryMeta`) plus the drift gate. No browser, Aspire, Docker,
scaffold, or E2E run is authorized.

### Orchestrator accountability

This is the **second** analytical error by this topic orchestrator on this leaf, with the same root
cause as the first: concluding from a narrow probe instead of executing the thing. The first was
E-1 (verified template↔manifest semantics exhaustively, never asked whether the template is what
ships). The second is G-1 (filtered workspace globs for a substring instead of running the root
test). Both were caught by formal evaluation, which is the gate working — but the pattern is
recorded here rather than left implicit, because a supervisor whose probes are weaker than its
conclusions manufactures work for the lanes it supervises. The corrective rule: **execute the check;
never infer a negative from a pattern match.**
