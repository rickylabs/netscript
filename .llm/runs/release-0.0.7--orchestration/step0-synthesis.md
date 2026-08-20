# Step 0 synthesis — milestone 0.0.7

| Field           | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Repo / milestone | `rickylabs/netscript` · milestone `0.0.7` (id `27`)                         |
| Baseline `main`  | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                  |
| Worktree HEAD    | `477511709b90bf7b5be92f3b0467bdf2a2a6aa6f` (run artifacts only)             |
| Target issues    | **62**, each dispositioned exactly once                                     |
| Status           | **Recommendation only** — nothing ratified, nothing moved, no GitHub mutation |

**Capture drift, recorded.** The brief pinned 61 open issues. **#1564** was moved into `0.0.7` at
`2026-08-13T18:38:26Z`, after that snapshot, and is included here on owner instruction — audited
directly, not carried over from the batch sweep. The milestone's own `open_issues` counter reads 63
because GitHub counts PRs; the 63rd item is coordinator PR #1641, which the brief places off-limits.

## Headline findings

**1. #1564 is a merge barrier and must land before any other leaf.**
`github.event.pull_request.base.sha` is the base recorded *for the PR*, not the base branch tip, so
every gate computing `base.sha..head` enumerates other PRs' merged work as this PR's diff.
Reproduced on #1539: base `cd24e1679` was hours stale, the range returned **9 files, zero of them in
#1539's own diff**, and the gate reported success having inspected **zero lines of the PR under
review** while a new `as unknown as` sat in the actual diff untouched. It degrades with PR age, so
it is anti-correlated with risk. Consumers: `code-quality.yml:39` (affected, owned by #1403),
`ci.yml:135,153`, `e2e-cli.yml:128,158`, `surface-diff.yml:47` (all unaudited, same input);
`openhands-phase-eval.yml:126` is already fixed by #1552, which is the precedent pattern.

This makes **pre-merge gate checks 3 and 6 unreliable** for the whole milestone — the exact
"pass is indistinguishable from did-not-run" class the gate-integrity rules name. With 46 leaves
merging direct-to-`main`, it is wave 0 alone.

**2. RFC 0001 is merged and re-scopes five target issues.**
`rfcs/0001-sdk-client-contributions.md` (1611 lines, PR #1390, 2026-08-11) carries a normative stage
table at `:1273-1281`. Four bodies now contradict ratified doctrine:

- **#1349** demands public export of `createHttpClientLink`/`ClientLinkPort`/`ClientLinkCallOptions`
  — RFC `:491-497` keeps those ports **private** and `:1289` makes #451 "the sole future owner of
  custom links"; it composes upstream interceptor arrays, which `:1276` forbids; it removes
  `port`/`timeout`, which `:1224` keeps deprecated and `:1277` reassigns to #1351.
- **#1353** is reversed: its `traceContextContribution()` acceptance is the alternative `:1476-1481`
  **rejects**; `:1279` re-scopes it to proving the transport owns trace injection.
- **#1351** targets oRPC `1.14.15`; `:1277` makes the family move a separate decision on `v1.15.0`.
- **#1352** keeps a cookie carve-out the RFC bans and cites the wrong module path (`:1168`).

RFC `:1273` already assigns the fix to Stage 0 (#1348): *"align #1349–#1353 bodies before
implementation."* **That is a Step 0 deliverable.** Dispatching those bodies as written produces work
that fails IMPL-EVAL against ratified doctrine.

**3. Nothing in 0.0.7 is blocked by anything outside it.** 134 external issues examined → **zero
`dependency-required` admissions**. Every outward reference is an exclusion boundary, never a
prerequisite; direction runs 0.0.7 → later (#1349 unblocks #451; #1502 supersedes #904–#908). RFC
`:1290` settles the open question: *"#928 and #934 … are **not prerequisites** for the header seam."*

**4. #1453 cannot be worked in this repository.** It targets `tools/migration-loc/cli.ts`; that path
does not exist on baseline, `git log --all -- '*migration-loc*'` returns nothing, and no generator
emits it. No 0.0.7 slice can tick a single box. **`move`** on release-boundary grounds — not size.

**5. The docs lane is nearly empty, and one of its two issues cannot be closed by a PR.** Five
issues labelled `type:docs`/`area:docs` (#1112, #1296, #1350, #1461, #1623) have acceptance
requiring `packages/**` source and were reassigned — the #1020 class that put framework source on a
docs PR in 0.0.4. #1606 is observational: it closes by recorded observation at a canary/cut
checkpoint, never by a merge. `@netscript/sdk@0.0.6` is already published, so it may be
dischargeable now.

## Dispositions and lanes

| Disposition | Count | | Lane | Count |
| ----------- | ----- | - | ---- | ----- |
| `active` | 61 | | `fixes` | 25 |
| `move` | 1 — #1453 → `Backlog / Triage` | | `features` | 17 |
| `close-fixed` / `-duplicate` / `-superseded` | 0 | | `internals` | 17 |
| | | | `docs` | 2 |

**No issue is recommended for closure.** Six already-fixed hypotheses were tested; all six defects
are still present on baseline. Scope was not reduced for size — #1349, #1354, #1448, #1551, #1590,
#1592 are all large and all stay. Lane came from acceptance content, never the label: #1502 →
`features` (ratifies a public seam despite `type:docs`), #1616 → `fixes` (its box 1 needs generator
source despite `type:test`), #1353 → `fixes` (a coordinator override of the auditor's `features`
call: under the RFC re-scope it ships no new export).

## Dependency structure

24 edges, all `from` = prerequisite, all crossing to a strictly later wave, acyclic — asserted
programmatically at build time. Two conventions:

- **External dependencies are not DAG nodes** (recorded per issue in `externalDependencies`) so the
  DAG equals the frozen active inventory and validates. Five named predecessors — #1374, #1615,
  #1594, #1589, #1333 — are **already closed** and recorded as satisfied.
- **Ordering inside one leaf is not an edge.** #1545→#1378, #1601→#1557, #1561→#1621, #1611→#1613
  are intra-PR sequencing, recorded on the leaf.

Critical path, six deep: `#1348 → #1350 → #1466 → #1349 → {#1351, #1352, #1353, #1093} → #1467`.

## Waves

61 active issues → **46 leaf groups**, **10 waves**. Waves are dispatch batches sized to the WIP
bound (≤2 implementation leaves per topic), which is why there are ten rather than the seven the DAG
alone requires. This is ~4× the 0.0.4 exemplar (11 PRs, 42 issues) — a scale decision worth naming
now rather than discovering at wave 5.

| Wave | Leaves | Issues |
| ---- | ------ | ------ |
| **0** | **ci-diff-range-base-sha-barrier — MERGE BARRIER, merges before every other leaf** | 1 |
| 1 | rfc-a-stage0-ratification-board · rfc-plugin-cli-contribution · legacy-port-pin-sweep · scaffold-generated-output-correctness · quality-scan-allowance-rail · harness-evidence-and-verdict-tooling · comparison-docs-programme · sdk-jsr-landing-verification | 13 |
| 2 | prisma-mysql-adapter-surface · app-service-client-wiring · sdk-typed-error-channel · design-registry-catalog-drift-gate · quality-scan-root-coverage · openhands-dispatch-claim-and-refusal | 8 |
| 3 | sdk-procedure-metadata · workers-job-policy-metadata · prisma-mysql-honest-example · ui-add-page-island-repair · reference-export-drift-gate · package-gate-honesty | 8 |
| 4 | sdk-client-contribution-seam · ui-resource-slice-generator · ai-mcp-pool-isolation · sdk-cache-surface-and-telemetry · leak-check-process-descendants · jsdoc-example-compile-gate | 9 |
| 5 | sdk-auth-contribution-dogfood · workers-job-payload-typing · sdk-transport-policy-consolidation · sdk-trace-ownership-proof · fresh-defer-test-capability | 6 |
| 6 | sdk-locale-contribution-proof · aspire-agent-resource-inventory · plugin-discovery-contribution-references · sdk-cached-entry-swr | 4 |
| 7 | plugin-service-context-factory · workers-execution-progress · sdk-browser-safe-entrypoints · scaffold-route-emission-and-gating | 5 |
| 8 | fresh-client-navigation-coordinator · ai-openai-responses-mapper · fresh-typed-route-and-form-repair · cross-package-dependency-declarations | 5 |
| 9 | fresh-ai-chat-response-options · cli-deploy-verb-surface | 2 |

Groupings that were judgement calls: **scaffold-generated-output-correctness** {#1262,#1263,#1588}
shares one `scaffold.runtime` verdict, grouped to cut expensive-gate contention (two false failures
in 0.0.4); **app-service-client-wiring** {#1355,#1360} both edit
`ServiceShowcaseLab.memory.tsx.template` and would collide as separate PRs;
**quality-scan-allowance-rail** {#1378,#1545} *must* be one PR — #1545's registration must precede
#1378's rule or the gate is red day one, while #1545's own test box needs that rule to exist.
**#1354/#1357 and #1293/#1112 were deliberately split** (new verb vs repair; published-surface
change vs prose written against what shipped).

**25 of 61 active issues carry `splitRisk: true`.** Six should be resolved before dispatch, not at
merge: **#1306** (four rows are *alternative* remedies across three surfaces), **#1551** (17
deliverables incl. a full Next.js re-implementation), **#1349**, **#1590**, **#1461** and **#1620**
(each has two mutually exclusive remedies, and the choice moves the lane). This is the #1024/#1061
class that split mid-flight in 0.0.4.

## External candidates

134 examined · **4 proposed** · 31 tempting-but-rejected recorded with reasons. Each proposal needs
**owner ratification *and* the actual milestone move before scope freeze** — recording without
moving is a failed Step 0.

| Issue | Now | Predicate | Basis | Condition |
| ----- | --- | --------- | ----- | --------- |
| **#1637** | *(none)* | `high-value-coherent` | `packages/sdk/src/cache/cache-query.ts:234-248` — `data` resolves, then a failing `store.set` **rethrows and discards the successful result**. Filed 2026-08-13 by a live consumer against published `@netscript/sdk@0.0.6-canary.3`. | Has **no labels and no milestone**. Rides `sdk-cache-surface-and-telemetry` at near-zero cost. Owner may upgrade to `release-critical` — it is a consumer-visible false outage on a published canary. |
| **#1384** | 0.0.8 | `release-critical` | `plugins/auth/services/src/routers/v1-handlers.ts:188-234` — `signout` revokes any `sessionId` an unauthenticated caller supplies; `main.ts:70-83` shows the auth service has no auth config. Ships on published `@netscript/plugin-auth`. | Admissible **only** scoped to the credential-only carve-out. As written it declares itself blocked on #1383, and admitting #1383 drags the whole 0.0.8 auth pack. Without the carve-out, decline. |
| **#1385** | 0.0.8 | `release-critical` | `auth.contract.ts:437-461` — none of the five auth v1 routes sets `outputStructure:'detailed'`; `v1-handlers.ts:95-107,160-169` discard the backend `Set-Cookie`. The only interactive backend shipped cannot complete a browser sign-in via its own published API. | Needs nothing from #1383. Contract-breaking, so cheaper in a foundation release. Decline if the auth deferral is read as covering defects, not just consumers — a legitimate call. |
| **#1249** | Backlog | `high-value-coherent` | `prop-types.ts:166` — `role?: string` widens past JSX's `Signalish<AriaRole\|undefined>`, so the documented `controlProps()` spread does not type-check. Shares #1609's surface. | **Weakest, and one supporting claim needs correcting.** The sweep reported "no `greater_than`/`less_than`/`multiple_of` case exists"; `zod-constraints.ts:163-181` *does* have `min`/`max`/`multipleOf` — but those are **Zod 3** names while `readCheckKind` (`:198`) reads Zod 4's `def.check`. Plausibly real for that reason; unconfirmed without executing a probe. Admit on the `controlProps` half only. |

Notable exclusions: **#928/#934** (coordination, settled by RFC `:1290`), **#904/#908** (downstream
consumers #1502 names for supersession — admitting them inverts the ordering), the **0.0.8 auth
pack** (#1387 would define a competing procedure-policy shape concurrently with #1466 — the exact
outcome RFC 0001 exists to prevent), **#1362** (one sliver is verifiably real — a scaffolded
service's `deno task test` runs against a tree with no test module — but as scoped it is a
folder-vocabulary redesign), **#950** (a whole 0.0.10 epic; the only link is an "Related to" note).

## Stale rows and false positives

No issue is wholly stale; these rows are stale *within* live issues and must be corrected before the
owning issue is dispatched.

| Issue | Row | Finding |
| ----- | --- | ------- |
| **#1296** | "contracts JSDoc imports the root where symbols live on `/query`" | **Already satisfied.** `baseContract`, `BaseContractRoute`, `BaseContractOutputRoute`, `OffsetPaginationQuerySchema` are all re-exported from the root (`src/public/mod.ts:2-6,65`) and the JSDoc at `contract-primitives.ts:72,112,144` imports correctly. Four rows remain live. |
| **#1357** | "`UiAddCommandInput` declares route/island/query/app" | **Already satisfied**: `add-ui-input.ts:1-11` declares all eight fields. The emission defect is unaffected. |
| **#1455** | "`build()` returns `JobDefinition<TId>` with no payload" | **Stale**: `job-builder.ts:80` already returns `JobDefinition<TId,TPayload,TResult>`. Live scope is the registry payload map, `JobTriggerInput`, `enqueueJob`. |
| **#1355** | every `file:line` citation | **Stale**: the cited template moved to `assets/app/routes/examples/service/(_lib)/`. Same defect, wrong citations. |
| **#1619** | "`cache-telemetry_test.ts:237` pins fail-loud" | No such file on baseline (only `cache-provider_test.ts`). |
| **#1349/#1351/#1352/#1353** | multiple acceptance rows | **Contradicted by merged RFC 0001** — finding 2. |
| **#1348** | board line recording #928/#934 as `0.0.7` | Both are `0.0.9` under epic #922. Stale drift. |

## Uncertainties

- **Owner ratification of RFC 0001 is not visible from the repo.** PR #1390 merged the text, but the
  RFC still lists **11 unresolved questions** at `:1555-1599`, including Q6 (metadata ownership) —
  which is precisely what #1466's existence presumes was decided. This is the biggest unknown
  gating waves 3–6.
- **No gate, test, build, or `deno` task was executed** (read-only brief). Every "still broken"
  verdict rests on reading source at the cited lines, not a reproduction. Not re-run: #1350's
  `deno check` probe, #1610's `never`-inference repro, #1618's `deno fmt` exit-1, #1622's constant
  mutation, #1543's `publish:dry-run` behaviour (if publish silently accepts, #1543 downgrades).
- **#1564's blast radius is stated, not proven** — four of five consumers are recorded as unaudited
  in the issue itself. Its boundary with **#1403**, which hardens exactly one consumer, must be
  settled before dispatch or the two collide on `code-quality.yml`.
- **Three issues have an undecided remedy that moves them between lanes**: #1461, #1620, #1621.
- **#1451 does not name its seam** and no candidate exists on baseline — design precedes the slice.
- **#1590 and #1551 depend on artefacts outside this repo** (`apps/dashboard/lib/client-nav.ts`;
  the EIS-Chat route). If unreachable, #1590's semantics are prose-only and #1551 has no subject.
- **#1306's remedies may be upstream-only** — `aspire start` is the Aspire CLI (13.4.6).
- **The external sweep searched outward from 0.0.7.** That catches every case where a 0.0.7 issue
  knows it is blocked, but would miss a blocker documented only in the blocking issue's body.
  Unread: #1464/#1503–#1512, #1363/#1482–#1488, #1364/#1366–#1372, #979.

## What this run did not do

Read-only throughout. No GitHub issue, label, milestone, PR, branch or comment was mutated; no
Codex, OpenHands or implementation session launched; no test, container or Aspire process started;
no commit or push. The only files written are this document and `step0-synthesis.json`.

**Step 0 is therefore not complete.** It remains open on:

1. Owner ratification of the 61/1 split and the #1453 move — **plus the actual GitHub move**.
2. Owner ratification of the four admission proposals — **plus the actual moves into `0.0.7` before
   freeze**, and labels + milestone for #1637, which has neither.
3. **Realignment of #1349, #1351, #1352, #1353 to the merged RFC** (RFC `:1273` assigns this to
   #1348). No SDK-chain leaf should dispatch before this.
4. Settling the **#1564 ↔ #1403** boundary before wave 0 dispatches.
5. Generating the four milestone JSON artifacts from this synthesis, then
   `harness:milestone:render` and `harness:milestone:validate` — the dispatch gate, red until it
   passes.
6. A separate-session **PLAN-EVAL** of the composed wave plan. This synthesis is a generator output
   and **does not self-certify**.
