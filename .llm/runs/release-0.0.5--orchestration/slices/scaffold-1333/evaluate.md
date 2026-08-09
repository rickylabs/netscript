# IMPL-EVAL: PR #1427 — #1333 default-app reference quality

**Verdict: FAIL_FIX**

Evaluator session: separate from the generator; read-only against
`/home/codex/repos/ns005-w3b1` at the immutable head. All commands below were executed by this
session unless explicitly marked "relied on, not re-run".

## Head and delta verification

- `git rev-parse HEAD` in the review worktree = `fa2b5413da723f08cb635efb988983dffecccd14`;
  `gh pr view 1427 --json headRefOid` = same; branch `feat/default-app-reference-quality`, OPEN.
  No divergence — evaluation proceeded.
- `git diff --name-status 2052551d7..fa2b5413d` = 4 files, all under
  `.llm/runs/release-0.0.5--orchestration/slices/scaffold-1333/`. The claim that the delta from the
  authorized runtime head contains no product source is **verified**, not assumed.
- Verification commands that mutate (barrel regen, doctrine at two commits, test runs) were executed
  in a disposable clone of the head at `/tmp/eval-1427`, never in the writer-owned worktree.

## Findings (most severe first)

### F1 — PR body has no Definition of Done; `Closes #1333` with all nine acceptance boxes unchecked

- `gh pr view 1427 --json body`: sections are `## Summary`, `## Plan`, `## Status` only. There is
  no `## Scope`, no `## Validation`, and **no `## Definition of Done` checklist** (zero `- [ ]`
  lines in the body). `netscript-pr` (SKILL.md:74-85, 195-220) makes `## Definition of Done` /
  `## Acceptance` the authoritative close-gate sections and `check-close-gate.ts` reads them;
  ready-merge condition 2 ("every `- [ ]` in the PR body's DoD is checked") currently has nothing
  to evaluate.
- Issue #1333 rows 1-9 (`gh issue view 1333`, body lines 22-30) are all `- [ ]` unchecked with no
  linked evidence, while the PR body carries `Closes #1333`.
- Concrete failure: labeling `status:ready-merge` and merging as-is auto-closes #1333 with zero
  checked acceptance boxes — the exact #260 false-done the close-gate exists to stop. Required fix:
  add the DoD/Validation sections per the `netscript-pr` impl template and run the evidence-mirror
  flow so rows 1-9 are checked with linked evidence before ready-merge.

### F2 — release-critical browser gate's Chrome dependency is documented nowhere

- `BEHAVIOR_APP_REFERENCE` is registered unconditionally in the `scaffold.runtime` gate sequence
  (`packages/cli/e2e/suites/scaffold/capability-suites.ts:130`; not in the `POSTGRES_ONLY` set) —
  verified. `findBrowserExecutable` throws (`probe-app-reference.ts:177-179`) after checking six
  hardcoded paths (4 Linux, 2 Windows-interop; **no macOS path**); `probeAppReference` has no skip
  branch — verified by read. A runner without Chrome/Chromium/Edge now fails the merge-readiness
  suite.
- `grep -i chrome|chromium|browser packages/cli/e2e/README.md` → zero matches; AGENTS.md's
  `e2e:cli` section and `docs/` likewise say nothing. The only discoverability is the runtime error
  string itself.
- Judgment: the hard dependency is defensible for a gate whose whole point is real-browser
  rendering, and the throw is loud and names every candidate path. But an environmental
  prerequisite of the release gate that exists only inside an error message is a documentation
  defect. Required fix: document the browser prerequisite (and supported platforms) in
  `packages/cli/e2e/README.md` where the suite is described; a macOS candidate path is worth a
  decision, not silence.

### F3 — over-cap deepening of `runtime-gates.ts` is drift prose, not registry debt

- Measured: merge-base `35358886a` = 865 lines; head = 906 (`wc -l`; doctrine tool reports 907;
  drift.md says 905 — the number drifts by measurement point but the deepening is real). The file
  was already over the A8/AP-1/F-1 500-line cap; the scaffold gate directory also grew 41→43
  immediate children against its F-16 WARN.
- `.llm/harness/debt/arch-debt.md` has **no entry** for this (grep `runtime-gates` → nothing).
  Drift.md records it as a paragraph. Same-day precedent on this very run:
  `mcp-tool-contracts-a8-1102` (arch-debt.md:2208) was created for PR #1404 for exactly this
  situation — growth inside an over-cap file — with reason/owner/target/linked-plan/gate.
- Per verdict-definitions, deepened doctrine debt without a registry entry is the FAIL_DEBT
  condition; it is folded into this FAIL_FIX as required bookkeeping: add an arch-debt.md entry
  mirroring the #1404 shape (split target for the runtime gate registry, owner, gate).

### F4 — doctrine "byte-identical origin/main baseline" claim is false at the committed head

- Executed `check-doctrine.ts --root packages/cli` at both commits in the clean clone:
  - origin/main merge-base `35358886a`: `FAIL=50 WARN=51 INFO=1`
  - head `fa2b5413d`: **`FAIL=50 WARN=50 INFO=1`** and `diff` of full outputs is non-empty:
    the `src/kernel/assets/app/lib` forbidden-folder WARN is **gone** (S2 removed the folder — an
    improvement), and two WARNs deepened (file size 866→907; directory children 41→43).
- Worklog lines 289-290 claim head scan = `50/51/1`, "byte-identical finding set". The claimed head
  numbers match the merge-base, not the committed head — consistent with a scan run in a worktree
  where the emptied `lib/` directory still existed on disk. Direction favors the branch, but the
  recorded evidence is wrong as written and must be corrected in the run artifacts.

### F5 — the `no-explicit-any` opt-in is a no-op and the drift entry's rationale is not reproducible

- Drift claims Deno's default recommended rules "do not include `no-explicit-any`" and that the
  pre-fix deliberate-`any` mutation exited 0. Executed on the pinned toolchain (deno 2.9.5):
  `deno lint --rules` tags `no-explicit-any` as `recommended`, and
  `deno lint --no-config probe.ts` on `export const value: any = 1;` exits **1** — the exact
  invocation shape the merge-base runner already used (`quality-runner.ts:172` at `35358886a`:
  `['lint', '--no-config', ...files]`).
- Therefore `--rules-include=no-explicit-any` (head `quality-runner.ts:172`) changes nothing on
  this toolchain; the "behavioral" test `quality-runner_test.ts:130-141` passes with or without the
  flag (the default rule set already rejects `any`), and only the source-string self-grep at
  `quality-runner_test.ts:175-178` detects the flag's removal. The e2e `probeExplicitAny`
  (`generated-quality-probes.ts:98-131`) is likewise satisfied by defaults.
- Net: the executable quality contract itself **holds** (an `any` mutation does fail the generated
  lint — verified), so this is not a product defect; but the drift entry's causal story is wrong,
  the recorded pre-fix RED cannot be reproduced from the committed states, and a decorative flag is
  guarded by a grep-of-self. Required fix: correct the drift entry (or remove the no-op flag); do
  not carry the "defaults miss no-explicit-any" claim forward as doctrine.

### F6 — optimistic rollback is never executed by any gate; the guarding tests are string scans with behavioral names

- `route-templates_test.ts:558-567` (DB) and `:574-583` (memory) assert substrings
  (`onMutate`, `getQueryData`, `setQueryData(listOptions.queryKey, context.previous)`) in the
  rendered template text. Nothing compiles, renders, or runs the island logic; no test imports
  `ServiceShowcaseLab*` or `preact-render-to-string`.
- The browser gate does not cover it either: `?preview=rollback` short-circuits via
  `props.previewState ??` (`ServiceShowcaseLab.tsx.template:125`) and renders the fixture message
  with **no mutation fired** — the nine rendered states prove presentation, not the snapshot/restore
  behavior.
- Concrete undetected regression: reorder `onMutate` so the optimistic `setQueryData` runs before
  `const previous = queryClient.getQueryData(...)` (template lines ~77-90). Rollback then restores
  the already-mutated list, yet every string assertion, the generated `deno task check`, and the
  full browser gate stay green. Moving the restore from `onError` to `onSuccess` is equally
  invisible.
- Plan S3's proving gate promised "DB and memory optimistic rollback unit tests"; the shipped tests
  are named as behavior ("restores the saved optimistic snapshot") but assert structure. The
  worklog's falsifiability mutations only prove detection of edits that alter the asserted strings.
  Required fix: either an executed unit test of the mutation callbacks (the query factories and
  callbacks are plain functions and can be driven with a stub query client), or an explicit drift
  entry stating rollback semantics are compile-proven and fixture-rendered only — the current
  artifacts overstate the guard.

### F7 — identity source-policy guard scope is narrower than the defect class it records

- `generated-app-identity-source-policy_test.ts` walks only
  `packages/cli/e2e/src/application/gates/scaffold`. Its two forbidden forms (`apps/dashboard`,
  `appName = 'dashboard'`) are executable and were mutation-proven (worklog falsifiability, raw
  exit 1 naming `verify-clean-clone-readme.ts:61`).
- But the stale-identity class survives outside the scan root: `SCAFFOLD_DEFAULTS.APP_NAME:
  'dashboard'` (`scaffold-defaults.ts:9`) is still live product code with a fallback consumer at
  `generate-appsettings.ts:273`. Verified currently unreachable — the sole production caller
  (`plan-init.ts:277-279`) passes the validated/derived `appName` — so this is latent residue, not
  a live bug. Positional `'dashboard'` arguments, `appName ?? 'dashboard'`, and a reintroduced
  `cli-surface.ts` constant consumed by gates would all evade the regexes.
- Not blocking alone; record as a known guard boundary (or widen the scan / delete the dead
  `'dashboard'` default so the constant cannot be silently re-consumed).

### F8 — minor guard gaps (record, fix opportunistically)

- `app-name.ts:13` trailing-dash trim (`.replace(/-+$/, '')`) is untested: the 64-char fixture
  contains no hyphen at the cut point, and `NAME_PATTERN` accepts `--`, so deleting the trim passes
  the whole file.
- `probe-app-reference_test.ts:23` is self-referential (`observed.length ===
  REFERENCE_EXPECTATIONS.length × viewports`): deleting seven of the nine expectations stays green;
  the expectation count (9) and the marker content of eight states are pinned by no test (only the
  rollback marker is, at `:28-44`). `resolveProjectAppUrls`/`readPinnedAppPort` and the real
  `renderWithHeadlessChrome` path have zero test coverage; the throw-on-missing-browser behavior is
  established by source reading only.

## Priority questions — direct answers

1. **Can each new guard fail?** Mostly yes, with the exceptions above. Verified failing edits
   exist for: app-name derivation/suffix/64-char boundary (exact `assertEquals`), route-contract
   presence and shape, `withRouteContract`/`withResource`/`withForm` chain, managed-form branches,
   canonical-link promotion (obsolete `/design/components` literal mutation-proven at raw exit 1
   per worklog), identity source-policy's two forms, and the old-path rejection — which **does**
   exist, at the filesystem level: `public-command-tree_test.ts:101`
   `assertPathAbsent(apps/<app>/lib/example-service.ts)` on a real scaffold, plus
   `assertAppConventionsResolve` statting every path referenced by generated agent docs. The
   template-string suite has no old-path rejection (a template emitting both old and new imports
   passes `route-templates_test.ts:420`), and the guards that cannot fail are F5 (lint flag) and
   F6 (rollback semantics).
2. **BEHAVIOR_APP_REFERENCE as a release gate:** registration unconditional and throw-not-skip both
   verified (F2). The gate itself is real: the island renders exactly one `data-state` per request
   via a single ternary chain, each preview carries a state-unique message, so the nine
   desktop+mobile assertions discriminate states and cannot be satisfied by a page that lists all
   markers. Environmental dependency acceptable in principle; undocumented in practice — F2 blocks.
3. **Embedded corpus consistency:** executed `deno task check:assets-barrel` at the committed head
   in a clean clone — exit 0, no diff. Template assertions are not vacuous against this barrel.
4. **Byte ceilings, independently recomputed:** app template sources 176,362 / 197,796; embedded
   barrel 294,190 / 330,000 (`wc -c`); MCP embedded docs corpus 253,535 bytes / 12 docs vs 262,144,
   computed by importing `publish-assets.generated.ts` and summing document bytes — matches
   provenance exactly, and `git diff origin/main...HEAD -- packages/mcp` is empty, so "unchanged"
   holds. The full diff contains no deletions; the only removal is the R100 content-identical
   rename of `lib/example-service.ts.template` → `(_lib)/service-query.ts.template`. Nothing was
   dropped to fit.
5. **zod:** catalog law respected. The repo root `deno.json` catalog uses bare npm semver values
   (`"zod": "^4.4.3"`); the scaffold mirrors that shape (`SCAFFOLD_WORKSPACE_CATALOG`), keeps JSR
   pins explicitly out of the catalog (comment and structure in `scaffold-app-catalog.ts`), and
   `scaffold-app-catalog_test.ts:63` pins the mirror to the live root value while
   `generators-config_test.ts:97` pins the app import to exactly `'catalog:'`. The worklog records
   the fresh generated-consumer check that first failed TS2307 and then passed 108 files at exit 0
   with no cast or allowance added; drift records the decision. Sound.
6. **Doctrine debt:** the growth is functionally attributable (two new gates in an established
   registry) and honestly disclosed in drift, but the baseline claim is false as written (F4) and
   the registry entry required by this run's own same-day precedent is missing (F3).
7. **Intent:** the generated app is a genuine keepable reference, not assertion filler. The
   canonical route composes the real public API end-to-end — zod route contract with typed
   path/search params, `withResource` composition (viewer + prefetched showcase), a deferred
   partial layer with fallback, a managed form with schema validation driving a server mutation
   through an honest, documented permissive auth seam (`authenticated: false`, no fake identity),
   telemetry spans, resource-local `(_lib)/(_components)/(_islands)/(_shared)` topology, and
   appRoutes-derived `/design` + `/design/composition` promotion (verified at head — an earlier
   hardcoded-string sighting in this evaluation was a wrong-worktree grep, corrected). The one
   substantive soft spot in the "real developer keeps it" claim is F6: the rollback behavior the
   reference is supposed to teach is implemented plausibly but proven nowhere.

## Runtime and process evidence

- Serialized `scaffold.runtime`: relied on per brief, not re-run (no token) — row 70 RED at
  `2150421e4` honestly recorded in drift; row 73 GREEN at `2052551d7`
  (80/0/2, `RAW_EXIT_CODE=0`, `behavior.app-reference` PASS both viewports). The reviewed head's
  product source is byte-identical to that authorized head (verified above).
- Executed at head in the clean clone: 6 new/changed test files
  (`app-name`, `route-templates`, `quality-runner`, `probe-app-reference`,
  `generated-app-identity-source-policy`, `scaffold-app-catalog`) — 15 passed, 25 steps, 0 failed.
- `agentic:review-threads` PR 1427: PASS, threads=0 unanswered=0 (executed).
- PLAN-EVAL: owner-approved verdict recorded in `plan-eval.md` before implementation; row-10
  relocation to #1090 is recorded on the issue itself (owner note, 2026-08-09) — not re-raised.
- Labels/milestone: `type:fix`, `area:cli`, `area:fresh`, `area:fresh-ui`, `priority:p0`, exactly
  one `status:` (`impl`), milestone 0.0.5 — conforming.
- Not re-executed (trusted as recorded raw exits in worklog): full CLI sweep 680/680, scoped
  check/lint/fmt batches, code-quality scan, CLI doc lint, JSR dry-runs, root publish dry-run,
  publish-assets check, JSR-specifier scan; the expensive-gate ledger rows 70-73; the Windows-Chrome
  interop path of row 73. Sub-agent brief `## SKILL` chapters could not be inspected from the
  committed artifacts and are unverified.

## Verdict rationale

The approved plan is valid and its scope is complete at this head; rows 1-9 have real
implementations and the runtime row-73 receipt covers the behavioral suite. What blocks PASS is
fix-class work, none of it a redesign: the PR body lacks the close-gate's required Definition of
Done while carrying `Closes #1333` against nine unchecked boxes (F1); the new release-gate browser
dependency is undocumented (F2); the over-cap deepening needs its arch-debt registry entry per this
run's own precedent (F3); and the run artifacts contain two evidence claims that do not reproduce
(F4, F5) plus a behavioral guard that cannot fail where the plan promised one that could (F6).
Because the blocking set includes implementation/docs/evidence work beyond debt bookkeeping,
`FAIL_FIX` — not `FAIL_DEBT` — is the verdict.
