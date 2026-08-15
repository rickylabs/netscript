# Evaluation: generated design registry catalog drift gate (#1358 / PR #1657)

Formal **IMPL-EVAL**, first and only cycle. Fresh separate session; independent of both the Codex
implementer (`gpt-5.6-sol`, thread `01a003f0-7821-7a10-a555-e619a9280479`) and the Claude topic
orchestrator that produced the Tier-A sign-off (`topic-fixes-0.0.7`, session
`c7597d28-6774-44c9-aa00-b8b40b776165`). Neither binds this verdict; the Tier-A review was treated
as an input to re-derive, never as a substitute.

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `fix-design-registry-catalog-drift-gate--0.0.7-wave1`     |
| Target         | `@netscript/cli` generated Fresh design catalog + `@netscript/fresh-ui` drift gate |
| Archetype      | `6 — CLI / Tooling`                                       |
| Scope overlays | `frontend`                                                |
| Phase          | `IMPL-EVAL` (single bounded cycle; no PLAN-EVAL, no evaluator loop) |
| Date           | 2026-08-15                                                |

### Evaluator identity

| Field | Value |
| --- | --- |
| Transport | Native first-party Claude Code, background session |
| Session ID | `04897102-bcd6-4918-8b72-dc0151035883` |
| Bridge / Remote Control ID | `session_01GbqPgckdxHEZzXzNu7DKNp` |
| Remote Control URL | `https://claude.ai/code/session_01GbqPgckdxHEZzXzNu7DKNp` |
| Job ID | `04897102` |
| PID | `202494` |
| cwd | `/home/codex/repos/netscript-007-leaf-design-registry-drift` |
| Session name | `NetScript 0.0.7 #1657 IMPL-EVAL` |

The bridge ID is the `bridgeSessionId` (`session_…`) read from `~/.claude/sessions/202494.json`,
not the `cse_…` form; only the sessions-registry form resolves as a Remote Control URL.

### Route — requested, observed, and the owner amendment

| Field | Value |
| --- | --- |
| Requested | native first-party Claude Code · `claude-opus-5` · effort `medium` · `/remote-control` enabled |
| Observed | `claude-opus-5` · effort `medium` · `--remote-control` present |
| Route verdict | **matched** |
| Evidence | `~/.claude/jobs/04897102/state.json` → `respawnFlags = ["--effort","medium","--permission-mode","bypassPermissions","--remote-control","--name","NetScript 0.0.7 #1657 IMPL-EVAL","--model","claude-opus-5"]` |

**Owner-route amendment (recorded explicitly).** `.llm/harness/workflow/lane-policy.md` renders
`formal_impl_evaluation` as *native opposite-family Claude · Fable 5 · medium* for Codex-authored
work, and `supervisor.md` records that policy route. The coordinator/owner **overrode** it for this
gate and **explicitly forbade** substituting Fable, OpenRouter, or any other transport. This
evaluation therefore ran on Opus 5 by owner instruction, not by lane-policy default. Evaluator
independence is unaffected: the generator lane is Codex/`gpt-5.6-sol` and the Tier-A reviewer is a
different Claude session, so no lane self-certifies.

### Heads — independently resolved

| Head | Value | Verification |
| --- | --- | --- |
| Evaluated head | `939e7311317365db7681de5e3c7c56a73412424e` | `git rev-parse HEAD` |
| `origin` branch | `939e7311317365db7681de5e3c7c56a73412424e` | `git ls-remote origin fix/design-registry-catalog-drift-gate` |
| PR #1657 `headRefOid` | `939e7311317365db7681de5e3c7c56a73412424e` | `gh pr view 1657 --json headRefOid` |
| Reviewed product/repair head | `a093314973b2039183ee408ef7501cd9e08ea0aa` | ancestor of HEAD; `git diff --name-status a09..HEAD` = `review-tier-a.md` only (artifact-only, as declared) |
| Gated browser product head | `4a3c40321ac1e58aa337e02afeaa95fbc553ce7f` | ancestor of HEAD; `git diff --stat 4a3c40321..HEAD -- packages/` is **empty** |
| Immutable base | `da574111af05a5cded74250128b196fcab870274` | ancestor of HEAD |

All three heads (local, `origin`, PR) agree. No mismatch; nothing refused.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | `PASS` | `PLAN-EVAL: N/A` justified in `worklog.md:78-80` and `plan.md`, both landed in S0 commit `c3f978f5a` (run artifacts only) before any product commit. |
| Design section exists in worklog | `PASS` | `worklog.md:44` — "### Archetype-6 Design Checkpoint". |
| Commit slices match design plan | `PASS` | S0 `c3f978f5a` → S1 `1308c0b39` → S2 `4a3c40321` → amendment `c5e06661b` → repair `a09331497`; plan's S0/S1/S2 table plus the recorded contract amendment. |
| Each slice has a passing gate | `PASS` (with the E-2 exception below) | One structured PR comment per slice, each carrying named commands and raw exit codes. The `assets-barrel` gate is the missing member — see E-2. |
| Agent brief carries a `## SKILL` chapter | `PASS` | Brief staged at `/home/codex/design-registry-drift-brief.md` per `codex-thread-ids.md`; run artifacts record the skill set read. PR body correctly does **not** carry one (protocol rule 13). |
| No speculative seams (unused files) | `PARTIAL` | No new files. One new export is unconsumed in generated output — see N-3. |
| Constants used for finite vocabularies | `PASS` | `FRESH_UI_CLI_DESIGN_ASSET_PREFIX` added as a named constant in `ci-classify-changes.ts` rather than an inline literal. |
| Scope stayed inside the amended contract | `PASS` | See "Scope" below. |
| Lock hygiene | `PASS` | `git diff --name-only da574111a..HEAD -- '*deno.lock' '*.lock'` is empty — root, CLI and Fresh-UI locks unchanged. |
| No gate-greening escape hatches | `PASS` | Added lines across `packages/` and `.github/` contain no `deno-lint-ignore`, `quality-allow`, `as any`, or `as unknown as`. (The one `deno-lint-ignore no-control-regex` in the classifier is pre-existing, unchanged by this branch.) |

### Scope — verified against the amended contract

`git diff --name-status da574111a..HEAD` returns exactly 14 paths:

- **2 of the 4** original frozen product surfaces changed:
  `packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template` and
  `packages/fresh-ui/tests/registry-doc-drift.test.ts`. `registry.manifest.ts` and
  `packages/cli/src/kernel/application/ui/registry.ts` are byte-unchanged, as the plan predicted.
- **Exactly the 3** files named in the coordinator's significant amendment (`drift.md`):
  `.github/workflows/fresh-ui-quality.yml`, `.github/scripts/ci-classify-changes.ts`,
  `.github/scripts/ci-classify-changes.test.ts`.
- **9** run artifacts under `.llm/runs/<run-id>/`.

Nothing outside the amended surface changed. The delivered scope is narrower than the contract
ceiling, never wider.

## Static Gates

Re-executed by this evaluator at the evaluated head. Raw exit codes only.

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Drift gate (focused) | `cd packages/fresh-ui && deno test --allow-read --lock=deno.lock --frozen tests/registry-doc-drift.test.ts` | `PASS` | raw exit **0**; **5 passed / 0 failed** |
| Classifier suite | `deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts` | `PASS` | raw exit **0**; **62 passed / 0 failed** |
| Quality scan | `deno task quality:scan` | `PASS` | raw exit **0**; `{"ok":true,...,"findings":[],"allowCount":7,"allowanceFailures":[]}` — all 7 allowances pre-existing (`#1276`) |
| Architecture | `deno task arch:check` | `PASS` | raw exit **0**; INFO/WARN only, all pre-existing |
| **Generated asset freshness** | `deno task check:assets-barrel` | **`FAIL`** | raw exit **1** — see **E-1** |
| Publish asset freshness | `deno task check:publish-assets` | `PASS` | raw exit **0** |
| Typecheck / lint / fmt / publish dry-run | author-run per S2 comment | `PASS` (accepted) | Product surfaces are byte-identical to the gated head `4a3c40321`, so the author's S2 evidence still binds; the repair's own check/lint/fmt evidence is in the S3 comment |

Both freshness gates were executed in a **detached scratch worktree**
(`git worktree add --detach` at `939e7311`, removed afterwards) so the evaluated worktree was never
mutated. Evaluated tree confirmed clean at `939e7311` after removal.

## Fitness Gates

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| F-1 / F-10 | File-size and test-shape | `PASS` | `arch:check` exit 0; the drift test asserts parsed semantic projections, not a giant snapshot |
| F-3 | Layering | `PASS` | No new cross-layer runtime import; the test reads the CLI asset as data from a test file excluded from publication |
| F-5 / F-6 / F-7 | Public surface / JSR / doc score | `PASS` | No public-export delta on either package; author JSR audits and both publish dry-runs exit 0; `check:publish-assets` exit 0 (re-run here) |
| F-9 | Permission declaration | `PASS` | No new runtime permission; test-only `--allow-read` |
| F-15 | Re-export of upstream | `PASS` | None introduced |
| F-CLI-22 | Template under kernel assets | `PASS` | Template path unchanged |
| F-CLI-24 | Static catalog checked bidirectionally against the manifest | **`FAIL`** | The check binds the **source template** only. The artifact the CLI actually ships — `embedded.generated.ts` — is stale and unchecked by this leaf. See **E-1**. |
| frontend / browser | `fresh-browser` | `PASS` (inherited, valid) | Receipt `PASS`, raw exit 0, 2 passed / 0 failed, `gitHead == actualGitHead == 4a3c40321`; product tree byte-identical from `4a3c40321` to HEAD, so the receipt still binds. Not re-run (lease consumed). |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| `fresh-browser` | Leased, exactly-once | `PASS` (inherited) | `receipts/fresh-browser.json`; head-bound by `run-gate.ts`, which resolves `HEAD` itself and fails closed |
| Aspire / Docker / CLI E2E | Out of scope for the bounded repair | `NOT_RUN` | Per hard constraint and `drift.md` gate proportionality. `docker ps -a` empty and `aspire ps` reports no AppHost — no survivors |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Source template ↔ manifest | Independent recomputation by this evaluator (own probe, not the run's comparator) | `PASS` | manifest **66** / catalog **66** / `registryMeta.total` **66**; 0 missing, 0 extra, 0 duplicates; **ordered** name equality `true`; `kind`/`layer`/`description` mismatches **0**; collections **8/8** ordered-equal by name and by membership (46/15/10/5/8/1/13/7); `name`/`version`/`packageName` exact; all 16 originally-missing names present |
| **Scaffolded app (`netscript init`)** | Does the generated `/design/components` gallery actually list 66 items? | **`FAIL`** | **No — it lists 50.** See **E-1** |
| CI trigger ownership (T-3) | Independent re-derivation of classifier + workflow filters | `PASS` | See below |

### T-3 trigger ownership — re-derived, not accepted from the Tier-A table

I imported `classifyPath`/`decide` from `.github/scripts/ci-classify-changes.ts` and executed them
directly, adding near-miss cases the Tier-A pass did not cover:

| Case | Path | `freshUi` |
| --- | --- | --- |
| POSITIVE | `…/assets/app/routes/(design)/design/(_shared)/registry.ts.template` | **true** |
| POSITIVE | `…/assets/app/routes/(design)/design/components.tsx.template` | **true** |
| POSITIVE | `…/assets/app/routes/(design)/design/_layout.tsx.template` | **true** |
| POSITIVE | `…/assets/app/routes/(design)/design/tokens.tsx.template` | **true** |
| REGRESSION | `packages/fresh-ui/registry.manifest.ts` | **true** (unbroken) |
| REGRESSION | `packages/fresh-ui/tests/registry-doc-drift.test.ts` | **true** (unbroken) |
| NEGATIVE | `packages/cli/src/kernel/adapters/database/scaffolder.ts` | false |
| NEGATIVE | `packages/cli/bin/netscript.ts` | false |
| NEGATIVE | `packages/cli/src/kernel/assets/database/seed.ts.template` | false |
| NEGATIVE | `packages/cli/src/kernel/assets/app/routes/index.tsx.template` | false |
| NEGATIVE | `packages/cli/src/kernel/assets/embedded.generated.ts` | false |
| NEGATIVE | `packages/service/src/mod.ts` | false |
| NEGATIVE | `plugins/workers/src/mod.ts` | false |
| NEAR-MISS | `…/assets/app/routes/(designx)/a.ts.template` | false |
| NEAR-MISS | `…/assets/app/routes/(app)/x.tsx.template` | false |

A simulated future CLI-design-only PR yields `needsFreshUi = true`. Ownership is anchored on the
exact prefix `packages/cli/src/kernel/assets/app/routes/(design)/`, so sibling CLI asset paths, other
route groups, and the lookalike `(designx)` prefix all stay false. **The design surface requests the
Fresh UI gate without broadening unrelated CLI diffs — scoped correctly.**

The workflow half carries `packages/cli/src/kernel/assets/app/routes/(design)/**` in **both** the
`pull_request.paths` and `push.paths` filters of `.github/workflows/fresh-ui-quality.yml` (read
directly at lines 10 and 24). T-3 is genuinely resolved on both halves.

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-18 (giant generated-string snapshots) | `CLEAR` | The gate asserts parsed semantic projections and named diffs, not a snapshot string |
| AP-19 (silent permissions) | `CLEAR` | No new declared or undeclared permission; test-only `--allow-read` |
| AP-25 (side effect in non-edge file) | `CLEAR` | All file reading stays in the excluded test; no runtime `Deno.*`/`import.meta` added to published CLI or fresh-ui code |
| AP-1…AP-17, AP-20…AP-24 | `N/A` | Outside the touched surface; no new module, class, folder, barrel, or public symbol introduced |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | Both packages carry `Keep` verdicts; `arch:check` exit 0 |
| Resolved entries | 0 | — |
| Deepened violations | 0 | `quality:scan` allowances unchanged at 7, all pre-existing `#1276` |
| Unrecorded violations | 0 | E-1 below is an implementation/gate defect, not a doctrine violation, so it is `FAIL_FIX` and not `FAIL_DEBT` |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| **high** | **E-1 — the CLI embedded asset barrel was not regenerated, so the shipped scaffold still emits the 50-item catalog and the `assets-barrel` CI gate is red** | see below | fix |
| **high** | **E-2 — the `assets-barrel` gate is absent from the plan's validation table and was never run by any lane** | see below | fix (evidence) |
| low | N-3 — `registryCollections` is exported by the template but consumed by no generated route | see below | none (record) |
| low | R-1 disposition — non-blocking, but the ready-flip proof Tier-A proposed does not actually prove it | see below | none (record) |
| low | C-1 — every acceptance box on live #1358, including the close-gated one, is still unchecked | see below | coordinator, at ready flip |

### E-1 — BLOCKING: the fix does not reach the artifact the CLI actually ships

The leaf repaired the **source** template. It did not regenerate the **embedded barrel** that the
CLI reads at runtime.

1. `packages/cli/src/kernel/application/registries/template-registry.ts:3,18` — `TemplateRegistry`'s
   only content source is `EMBEDDED_TEMPLATE_CONTENT` from
   `packages/cli/src/kernel/assets/embedded.generated.ts`. Its `hydrate()` is a no-op
   ("embedded assets are already loaded"); there is no disk fallback.
2. `DEFAULT_TEMPLATE_REGISTRY = new TemplateRegistry()` is what
   `packages/cli/src/public/features/init/init-command.ts:13,98` (and every other scaffold command)
   uses. The design catalog is a registered key:
   `manifest.ts:10` → `appRoutesDesignSharedRegistry`.
3. I decoded that key straight out of the committed barrel at the evaluated head and compared it to
   the on-disk template:

   | Property | `embedded.generated.ts` | on-disk template |
   | --- | --- | --- |
   | bytes | 9 064 | 15 404 |
   | `registryMeta.total` | **50** | **66** |
   | item entries | **50** | **66** |
   | `registryCollections` | **absent** | present |
   | `avatar` / `donut` / `dropzone` / `render-ui` / `mcp-ui-widget` | **absent** | present |

4. The generated gallery renders from exactly those exports:
   `…/design/(_components)/components-view.tsx.template:40,43,737` imports `registryCatalog` and
   `registryMeta` and prints `All {registryMeta.total} items`.

**Consequence.** A project scaffolded from this branch still renders "All **50** items" and still
hides the entire AI collection. Issue #1358's first three acceptance boxes — "the generated
`/design/components` catalog contains all 66 current registry items", "item names, kinds, layers and
collection membership match the manifest exactly", "`registryMeta.total` and `registryMeta.version`
are derived from the manifest" — are **false on the consumer path**. The user-visible defect the
issue exists to fix is unfixed in generated output; only its template was corrected.

**The repo already owns a gate for this, and it is red.** `deno task check:assets-barrel`
(`gen:assets-barrel && git diff --exit-code …`) is wired into `ci.yml:378-381` as gate
`assets-barrel` / id `quality-assets-barrel`, guarded by `env.RUN_DENO == 'true'`. I re-derived the
classifier over this PR's actual changed set: `needsDeno = true`, so that gate **will** run at ready
flip. Executed in an isolated detached worktree at `939e7311`:

```
deno task check:assets-barrel   → RAW EXIT 1
 packages/cli/src/kernel/assets/embedded.generated.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Exactly **one file, one line** — and the regenerated barrel carries `total: 66`. So the staleness is
neither pre-existing nor incidental: it is drift introduced by this branch, and the required repair
is precisely `deno task gen:assets-barrel` plus committing that single regenerated file. Every other
generated barrel in the gate's path list is already fresh, and the sibling `check:publish-assets`
gate is green (raw exit 0).

This is invisible today only because the PR is a draft: every CI job reports `skipping`.

**Why the new drift gate cannot catch it.** `registry-doc-drift.test.ts` reads
`CLI_REGISTRY_TEMPLATE_URL` — the source template — and compares that to the manifest. It has no
view of the embedded barrel, so it stays green while the shipped catalog is stale. The gate pair
`registry-doc-drift` (manifest ↔ template) + `assets-barrel` (template ↔ barrel) is complete in
principle; this leaf simply never closed the second link.

**Contract note for the coordinator.** `embedded.generated.ts` is outside both the original four
frozen surfaces and the three-file amendment, so — exactly as with T-3 — the implementer cannot
regenerate it unilaterally. This needs a further coordinator disposition (a one-file amendment is
the obvious minimal form). I am reporting it, not fixing it.

### E-2 — BLOCKING (evidence): the freshness gate for the changed artifact class was never run

`plan.md`'s nine-row Validation Plan does not include `check:assets-barrel`, no slice comment cites
it, and the string `barrel` / `embedded` appears nowhere in any run artifact — plan, worklog,
context-pack, drift log, or the Tier-A review. A change to a generated-asset **source** landed
without its generated-asset **freshness** gate, and the omission propagated through implementation,
Tier-A review, and re-review unchallenged. Per protocol rule 7, missing evidence is a finding in its
own right; it is also the direct cause of E-1 reaching this stage.

Required action: add `check:assets-barrel` to the validation plan for any run that touches
`packages/cli/src/kernel/assets/**`, and record its raw exit code.

### N-3 — non-blocking: `registryCollections` is unconsumed in generated output

`registryCollections` (plan LD-2) is exported by the template and read by the drift gate, but no
generated route template imports it — `components-view.tsx.template` uses only `registryCatalog` and
`registryMeta`. In a scaffolded app it is therefore a dead export. That is consistent with LD-2's
stated purpose (make membership explicit for the gate) and is not a contract breach, but it is worth
recording rather than leaving a reader to assume the gallery groups by collection. Note it also
means the stale barrel produces **no** compile error in generated projects — nothing imports the
missing export — which is part of why E-1 is silent.

### R-1 — I agree it is non-blocking, but Tier-A's proposed proof does not work

On the substance I reach the same conclusion as Tier-A: GitHub's filter-pattern syntax gives special
meaning to `*`, `**`, `?`, `+`, `!`, `[` `]` and `\`; parentheses are literal, so
`packages/cli/src/kernel/assets/app/routes/(design)/**` should match. Combined with a correctly
scoped classifier, the residual risk is low and does not block.

**One correction.** Tier-A records that R-1 "becomes empirically provable at the ready flip, when
`fresh-ui-quality` executes for real". It does not. This PR's changed set includes
`packages/fresh-ui/**`, `.github/workflows/fresh-ui-quality.yml`,
`.github/scripts/ci-classify-changes.ts` and `.github/scripts/ci-classify-changes.test.ts` — four
paths that are **independently** in the same `paths:` filter. The workflow will trigger regardless
of whether the `(design)` glob matches, so a green run here proves nothing about that glob. The
first genuine proof only arrives on a later PR that touches the CLI design assets **and nothing else
in the filter**. Recorded so a future reader does not mistake this PR's trigger for verification.

### C-1 — close-gate precondition (coordinator, at ready flip)

All seven acceptance boxes on live issue #1358 are still `- [ ]`, including the close-gated
`gate:` box, while PR #1657's body carries `Closes #1358`. Under protocol rule 12 that blocks a
`status:ready-merge` transition. It is correct that they are unchecked *now* — the PR is draft at
`status:impl` and issue mutation is coordinator-owned — and boxes 1–3 must not be checked at all
until E-1 is repaired, since they are currently false in generated output. Recorded as a readiness
precondition for the coordinator, not as an independent implementation defect.

## What is verified correct

Stated plainly, because the majority of this leaf is sound and the findings above should not
obscure it:

- The **source template** projection is exact: 66/66, ordered, field-faithful, 8/8 collections
  ordered-equal by membership, metadata exact — recomputed here from scratch with my own probe.
- The **drift gate is a real gate**: symmetric in both directions, field- and order-aware,
  metadata-aware, and it names the offender (`manifest-only items`, `catalog-only items`,
  `changed items`, `changed collections`, `changed registryMeta fields`). Its three negative fixtures
  are built in memory and call the same comparator as the live assertion — no source mutation, no
  lock churn, and no way for a fixture to drift from the checked-in path.
- The **T-3 repair is correct and correctly scoped**, verified by executing the classifier rather
  than reading its tests, including near-miss prefixes Tier-A did not test.
- **Scope, lock and resource hygiene are clean**: two of four product surfaces, exactly the three
  amended CI files, zero lock churn, no suppression escape hatches, no expensive-gate survivors.
- The **commit trail is honest**: each slice carries a structured comment with named commands and
  raw exit codes, and the author recorded its own failed command-selection iterations rather than
  presenting only green ones.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Fixing a generated-asset source is only half the fix | When a run edits anything under `packages/cli/src/kernel/assets/**`, the embedded barrel is a second, mandatory surface; add `check:assets-barrel` to the validation plan and cite its raw exit code | Archetype 6 (CLI/tooling), any scaffold-asset run | high |
| A drift gate must bind the artifact that ships, not only the artifact that is authored | Ask "which file does the runtime actually read?" before declaring a consumer gate complete | Archetype 6, frontend overlay | high |
| A `paths:`-filter change is not proven by the PR that introduces it | The introducing PR almost always touches other paths already in the same filter; genuine proof needs a later single-surface change | Any CI ownership repair | medium |

## Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **`FAIL_FIX`** |
| Evaluated head | `939e7311317365db7681de5e3c7c56a73412424e` |
| Rationale | The approved (and amended) plan remains valid and the delivered work is materially correct on the surfaces it touched — but the fix does not reach generated output. `packages/cli/src/kernel/assets/embedded.generated.ts` still carries the 50-item catalog with `total: 50`, and it is the only template source `netscript init` reads, so a scaffolded `/design/components` gallery still lists 50 of 66 and still hides the AI collection. The repo's own `assets-barrel` freshness gate is consequently **red at the evaluated head** (raw exit 1, one file, one line), and that gate was never named in the plan nor run by any lane. Per `verdict-definitions.md` this is "a required gate fails" plus "evidence is missing" with a sound plan — `FAIL_FIX`, not `FAIL_RESCOPE` (the plan is not materially wrong, it is one surface short) and not `FAIL_DEBT` (no doctrine violation or debt-bookkeeping defect). |
| Required repair | Regenerate the CLI asset barrel (`deno task gen:assets-barrel`) and commit the single resulting file, then re-run `check:assets-barrel` and record its raw exit code. `embedded.generated.ts` sits outside the current contract surface, so this needs a coordinator amendment first — the same boundary that produced the T-3 amendment. |
| Stop | This is a single bounded cycle. No evaluator loop, no PLAN-EVAL. The run stops here for coordinator disposition of E-1/E-2 and of the recorded residuals (R-1, C-1, N-3). |

### Standing stops observed by this evaluator

1. PR #1657 left `OPEN`, draft, exactly one `status:impl`. Not marked ready, not merged, not
   relabeled, not published.
2. `Closes #1358` neither added nor removed; no issue closed; no acceptance box checked.
3. No central coordinator state mutated; no next leaf begun.
4. No expensive gate run: no `fresh-browser`, no lease requested, no Aspire, no Docker, no
   `e2e:cli`. Post-evaluation `docker ps -a` empty and `aspire ps` reports no AppHost.
5. Nothing implemented and nothing fixed; every finding is reported for coordinator disposition.
6. Only `evaluate.md` plus harness bookkeeping committed; the evaluated product tree is untouched.
