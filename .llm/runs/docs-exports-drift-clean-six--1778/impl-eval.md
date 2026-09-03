# IMPL-EVAL — PR #1780 (docs/exports-drift-clean-six)

## Verdict

**PASS** — no blocking findings. Six advisories, two substantive (aspire, logger), none requiring
a change to this diff before merge. The recommended follow-up belongs on umbrella #1777, not on
this PR.

## Evaluated head and identity

| Field | Value |
| --- | --- |
| PR | #1780, base `main`, `Closes #1778`, `Part of #1777` (no closing keyword to #1777) |
| Evaluated head | `85e7f96bbd351d525a894f9944762f1aab1de0b4` (== PR `headRefOid`, == worktree HEAD) |
| Base | `origin/main` `de57fab0` |
| Evaluator | Claude Code session, observed model id `claude-fable-5` (Fable 5). Requested effort: medium — effort is not introspectable from inside a session; reporting the request, not a measurement. |
| Generator | Codex `gpt-5.6-sol` medium, thread `01a05350-a6c4-7340-be12-c78a50141d74` (matches `codex-thread-ids.md`); generator ≠ evaluator holds |
| Mode | Read-only. No tracked file touched; this untracked report is the only file created. Worktree porcelain-clean after all gate runs. |

## Method

Independent re-derivation, not diff review: I re-ran the gate, then ran my own per-package
symbol audit (scratchpad script importing `deriveExpectedExports`/`parseDocContent` from the
checker plus `deno doc --no-lock --json` per entrypoint) to compute, for each of the six
packages, exactly which exported symbols the reference page does and does not inventory — i.e.
what a `mode: 'complete'` run would report. I also traced every missing symbol to its exporting
entrypoint(s).

## Per-package policy findings (the core of this evaluation)

Checker semantics verified first: `entrypoints-only` enforces only the export-map ↔
`## Sub-path exports` table equivalence; `complete` additionally requires every `deno doc`
symbol from every entrypoint to appear in a `Symbol`-headed table. So a green gate proves the
*enforceable* part; the truth of each declaration was checked against the pages directly.

| Package | Declared mode | Independent measurement | Verdict on the declaration |
| --- | --- | --- | --- |
| `cron` | **complete** | 4 entrypoints, 28 unique exported symbols; **28/28 in the page's symbol tables, 0 invented**. Tables are genuine documentation (signatures + descriptions), not row-stuffing. Re-exports are resolved by `deno doc`, so the union is real. | **TRUE.** The only `complete` claim, and it holds. |
| `kv` | entrypoints-only | 4/4 entrypoints; 15 symbols missing from tables — exactly the kvdex/Deno-KV compatibility re-exports (`DenoAtomic*`, `DenoKv*`, `KvObject`), and the page's kvdex section lists precisely those names in a prose paragraph. | **TRUE and clearly deliberate.** The reason ("summarizing kvdex compatibility re-exports in prose") is an exact description. Cleanest of the five. |
| `cli` | entrypoints-only | 3/3 entrypoints; **1** symbol missing (`CacheBackendChoice`, from `/testing`), 70/71 documented. | **TRUE.** The reason's "selected … fixture tables rather than every CLI option type" covers the single miss. Advisory A4: this package is one type away from `complete`. |
| `database` | entrypoints-only | 10/10 entrypoints; 13 missing — 12 from `/scripts` (Prisma spawn/retry plumbing, `runMigrationWithArtifacts`, the `writeCrudZodBarrel` family) and `sqlJsonExtension_default` from `/extensions` (a `deno doc` artifact of the module's default export; the named `sqlJsonExtension` **is** documented). | **Substantially TRUE.** Advisory A3: the Scripts section is headed "Codegen and migration runners" yet omits three real runners (`runMigrationWithArtifacts`, `writeCrudZodBarrel`, `runWriteCrudZodBarrel`); the reason's "focus on primary contracts and runners" absorbs this, but barely. |
| `logger` | entrypoints-only | 3/3 entrypoints; 24 missing — the **entire** `/middleware` and `/orpc` symbol surfaces. The root surface is fully documented (22/22), so the reason's "selected root primitives" actually under-claims. | **TRUE about this page** — but see A2. The page's own prose says the sub-path surfaces' "reference pages are generated separately"; **no such pages exist** (`docs/site/reference/logger/` contains only `index.md`). |
| `aspire` | entrypoints-only | 9/9 entrypoints; 9 missing of 113. Five (`CacheMode`, `CacheModeSchema`, `HostPortEntry`, `SagaResourceConfig`, `SagaStoreBackend`) fall inside sections that purport to enumerate config interfaces/type aliases/schemas. Four (`AspireError`, `DuplicateContributionError`, `AspireRuntime`, `ReferenceSpec`) are exported **only** via `/public` (verified in `packages/aspire/src/public/mod.ts`) and appear nowhere on the page. | **TRUE as a mode declaration** ("curating their primary APIs rather than every exported contract"), but see A1: the page itself claims `/public` "re-exports all public … symbols" and "Each is documented against its own `deno doc` surface" — both false for those four. |

### Question 3 — was any package adopted at the weaker mode to dodge a real omission?

**No dodge in the culpable sense.** The generator probed `complete` for all six *first*, recorded
the failures in `research.md`/`worklog.md`, and disclosed every omission count in the PR body's
"Why this mode" column — the opposite of hiding. #1778's drop test ("if a package turns out to
*need* `complete` and fails under it") keys off the page's promise, and none of the five pages
promises a complete symbol inventory in the sense the checker enforces.

**However**, two of the five would fail `complete` partly for reasons that are genuine
undocumented exports, not editorial curation, and I state them plainly as the brief requires:

- **aspire** — the four `/public`-only symbols (`AspireError`, `DuplicateContributionError`,
  `AspireRuntime`, `ReferenceSpec`). No editorial choice on the page accounts for them; the page's
  text believes `/public` adds nothing beyond the documented sub-surfaces, which is false. This is
  an unacknowledged doc gap, not curation.
- **logger** — the 24 `/middleware`/`/orpc` symbols. The page defers them to per-entrypoint
  reference pages that do not exist, so the deferral is a broken promise, not a curation decision.

Neither invalidates the adoption: `entrypoints-only` asserts nothing about symbols, both reasons
honestly describe the index pages, and adoption converts both pages from unpoliced to
entrypoint-gated (a strict improvement). But "already clean" is true only at the entrypoint bar,
and the umbrella's 108-finding ledger covers only the *other* 15 packages — so these five
packages' symbol-level gaps (9 + 1 + 13 + 15 + 24 = 62 symbols, of which aspire's 4 and logger's
24 are genuine gaps) currently live only in this run dir and the PR body. See Required follow-up.

## Boundary and scope checks

- **Zero `docs/site/**` changes** — `git diff --name-only de57fab0...85e7f96b` = the checker plus
  seven `.llm/runs/docs-exports-drift-clean-six--1778/*` files, nothing else. No `packages/`,
  `plugins/`, or other `.llm/tools` file. PASS.
- **Umbrella safety** — PR body: `Closes #1778` present; #1777 referenced only as "Part of #1777".
  Neither commit message in `de57fab0..HEAD` contains any closing keyword or issue reference. PASS.
- **Existing mappings untouched** — the diff only inserts six entries; the eight prior entries and
  checker behavior are unchanged. PASS.
- **Duplicated `reason` string** — "This page currently guarantees package entrypoint coverage;
  complete symbol prose is tracked separately." appears 4× both at `de57fab0` and at head
  (plugin/queue/sdk/service), and none of the six new entries uses it. **Pre-existing, not
  introduced here — confirmed independently.** All six new reasons are distinct and page-specific.
- **Labels/milestone** — `type:docs`, `area:docs`, `area:tooling`, `priority:p2`, exactly one
  `status:` (`status:impl`), milestone 0.0.7; docs-only PR carries `ci:skip-e2e` +
  `ci:skip-scaffold` per harness policy. PASS.

## Gates — re-derived and re-run by this evaluator (real exit codes at head `85e7f96b`)

| Gate | Exit | Note |
| --- | ---: | --- |
| `deno task docs:exports-drift` | **0** | 14 coverage rows; PASS line; cron's `complete` mechanically enforced in this run |
| Independent per-package symbol audit | n/a | Reproduces the PR's disclosed omission counts exactly (aspire 9, cli 1, database 13, kv 15, logger 24, cron 0) |
| `deno task docs:links` | **0** | |
| `deno task docs:accuracy` | **0** | |
| `deno task check:publish-assets` | **0** | Worktree porcelain-clean afterwards |
| `deno task check:assets-barrel` | **0** | Worktree porcelain-clean afterwards |
| `deno task check:agent-docs-prose` | **0** | Full site build re-run by this evaluator |
| `run-deno-check.ts --root .llm/tools/docs --ext ts` | **0** | 22 files, 0 findings — matches PR claim |
| `git diff --exit-code -- deno.lock` | **0** | |
| `deno task docs:readme:check` | **1** | Sole finding: `packages/bench/README.md` missing `## Install` |

**Corpus-input determination, verified from the generators, not the PR's claim:**
`.llm/tools/docs/build-agent-docs-bundle.ts` reads either an external bundle dir or rendered
`docs/site/_site` files; `.llm/tools/generate-publish-assets.ts` reads its `PUBLISH_ASSET_OUTPUTS`,
checked-in `.llm/assets/agent-docs/*`, and package sources. Neither walks `.llm/tools/**`. The
PR's "not an agent-docs corpus input" claim is **correct**, and both freshness gates plus the full
prose gate were green anyway.

**Baseline red:** `docs:readme:check` exit 1 is **not chargeable** — the PR touches no README and
no `packages/` file, and the sole finding (`packages/bench/README.md`) is identical in kind to the
recorded clean-`origin/main` reproduction. I agree with the supervisor's assessment.

## PR body truthfulness

Contrary to this lane's three-slice pattern of thin/absent bodies, #1780's body is complete and —
checked claim by claim — accurate: file list matches the diff exactly; slice SHAs
(`e4b21ac2`, `85e7f96b`) match the commits; the per-package table's omission counts match my
independent audit; every validation row I re-ran reproduced; `acceptance-evidence` SHAs equal the
PR head. All six DoD boxes are truthfully ticked. One wording nit (A5 below). No required PR-body
edits.

## Blocking findings

None.

## Advisories (non-blocking)

- **A1 (aspire, substantive):** Four symbols exported only via `@netscript/aspire/public`
  (`AspireError`, `DuplicateContributionError`, `AspireRuntime`, `ReferenceSpec`) are documented
  nowhere, and the page's claims that `/public` "re-exports all public … symbols" and that "Each
  is documented against its own `deno doc` surface" are false for them. Genuine doc gap +
  page-truth defect; needs a page-repair slice under #1777 (fix prose, document or intentionally
  exclude the nine, then consider upgrading aspire toward `complete`).
- **A2 (logger, substantive):** The index page promises separately generated reference pages for
  `/middleware` and `/orpc`; they do not exist, leaving 24 symbols (both integration surfaces)
  undocumented. Needs a #1777 repair slice: either create those pages or fix the prose and
  inventory the surfaces.
- **A3 (database):** Three real runners (`runMigrationWithArtifacts`, `writeCrudZodBarrel`,
  `runWriteCrudZodBarrel`) are absent from a section headed "Codegen and migration runners";
  the mapping reason and the PR body's "lower-level/default/helper symbols" gloss slightly
  understate this.
- **A4 (cli):** One documented-symbol short of `complete` (`CacheBackendChoice`); cheap upgrade
  candidate in a later slice.
- **A5 (PR body nit):** database's "Why this mode" characterizes all 13 omissions as
  "lower-level/default/helper" — accurate for ten, generous for the three runners in A3.
- **A6 (checker, pre-existing):** `complete` mode counts a symbol as documented if it appears in
  any `Symbol`-headed table cell; nothing verifies signature/description quality. Fine for cron
  (its tables are real documentation) but worth remembering when later slices adopt larger
  packages at `complete`.

## Required follow-up (umbrella, not this PR)

Record on #1777's ledger that the "six already clean" are clean **at the entrypoint bar only**,
attaching the five packages' complete-mode omission lists (62 symbols; this run's
`research.md`/`worklog.md` and this report carry them), and mark aspire (A1) and logger (A2) as
page-repair candidates, since their gaps are broken page promises rather than curation. Without
this, adoption makes those gaps invisible: the gate is now green forever at `entrypoints-only`
and the umbrella's 108 findings never counted these packages.

## Issue #1778 acceptance boxes — earned status (nothing ticked by me)

| Box | Earned? | Evidence |
| --- | --- | --- |
| 1. All six in `AUTHORITATIVE_MAPPING` with per-package `symbolCoverage.reason` | **Earned** | Diff at `85e7f96b` adds six entries, each with a distinct page-specific reason; verified against the pages above |
| 2. `deno task docs:exports-drift` exits 0 | **Earned** | Re-run by this evaluator at head: exit 0, 14 coverage rows, PASS |
| 3. No `docs/site/**` file modified | **Earned** | Three-dot name-only diff contains zero `docs/site` paths |
| 4. Any dropped package named with reason | **Earned (vacuously)** | None dropped; PR body states "Dropped packages: none" with the per-package justification, consistent with #1778's drop test as analyzed above |

Scope checklist boxes (add six / per-package policy / do-not-weaken / gate green): all satisfied;
the "do not weaken" box passes on the analysis in "Question 3" above, with A1/A2 as the recorded
caveats.

