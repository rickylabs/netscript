# Supervisor identity — topic-docs-0.0.7

| Field                               | Value                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Role                                | Claude topic orchestrator, `docs` lane (supervise-only)                                                            |
| Coordinator                         | `codex-root-0.0.7` (`/home/codex/repos/netscript-547-lffix`, run `release-0.0.7--orchestration`)                   |
| Coordinator Codex session           | `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd` (sole merge/release authority)                                              |
| Requested route                     | native Claude · Opus 5 · high effort · Remote Control required                                                     |
| Observed route (process argv)       | `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control netscript-007-docs`      |
| Route verdict                       | matched                                                                                                            |
| Claude session id                   | `fcf04b0f-3c2f-4844-9508-84c52ce8298c`                                                                             |
| `bridgeSessionId`                   | `session_01SBHRTmr6ddueUYzCbcXrRV` (current; supersedes `session_01PLRauSHN1PnvrNF2ucefF6`, whose PID is dead)      |
| Remote Control URL                  | `https://claude.ai/code/session_01SBHRTmr6ddueUYzCbcXrRV`                                                          |
| Remote Control state                | attached; native Anthropic client, `--remote-control`, resumed on the same Claude session id                       |
| PID                                 | `11850` (respawn of `2429469`; the Claude session id is unchanged)                                                 |
| Exact cwd                           | `/home/codex/repos/netscript-007-docs`                                                                             |
| Worktree                            | `/home/codex/repos/netscript-007-docs`                                                                             |
| Branch                              | `orchestrator/release-0.0.7-docs` (no upstream by design; push by explicit refspec only)                           |
| Topic run                           | `.llm/runs/orchestrator-release-0.0.7-docs--topic`                                                                 |
| Preserved parked Codex topic thread | `019ffcc0-e19b-71d1-95ce-8c72559eb026` (parked/offline; never resumed as topic controller)                         |
| Leaves (both shipped)               | `comparison-docs-programme` → PR #1652 → `e090f894f`; `comparison-vs-pages` → PR #1660 → `729386c56`               |
| Leaf worktree / branch              | `/home/codex/repos/netscript-007-docs-comparison` / `docs/comparison-docs-programme`                               |
| Leaf implementer Codex thread       | `019ffcc9-16c2-7573-b7f6-d627172408e8` (gpt-5.6-sol · high · idle; steer by `codex exec resume`, never a new send) |
| Lane issue scope                    | #1551 only (one committed milestone issue)                                                                         |
| Lane status                         | **EXHAUSTED / PARKED** — allocation `[1551]` shipped; no docs-lane issue open                                      |
| Last reconciliation                 | 2026-08-15 vs coordinator state `353bd087a` (`updatedAt` 11:51Z, `currentMainSha` `baf1cdf67`) — allocation unchanged |

Attachment is proved by the native session registry entry `~/.claude/sessions/2429469.json`, whose
`pid`, `cwd`, and non-empty `bridgeSessionId` match the live process, plus the process argv above.
No `ANTHROPIC_BASE_URL` override is in play; this is a native Remote Control surface, not an
inference-only gateway session.

## Attachment claim against the coordinator's cluster state

`milestone-cluster-state.json` still records the docs controller as `state: pending_attachment` with
`requestedModel: claude-opus-5` and `requestedEffort: high`. This session satisfies that request.
The coordinator owns that field — this lane reports the proof and does **not** mutate the central
control plane.

## Dispatch order 6 (this lane's only assigned gate)

| Field      | Value                                                                             |
| ---------- | --------------------------------------------------------------------------------- |
| leafId     | `comparison-docs-programme`                                                       |
| phase      | `plan-eval`, cycle 1                                                              |
| PR         | #1652, branch `docs/comparison-docs-programme`                                    |
| worktree   | `/home/codex/repos/netscript-007-docs-comparison`                                 |
| sourceHead | `d35cbca30872d1f55118d63437638e93270c2ac3` (immutable evaluation head)            |
| runDir     | `.llm/runs/docs-comparison-docs-programme--1551`                                  |
| brief      | `comparison-docs-programme.md`                                                    |
| output     | `plan-eval.md`                                                                    |
| route      | native-claude · Claude Opus 5 (`claude-opus-5`) · effort **low**                  |
| rationale  | bounded docs-only PLAN-EVAL with immutable evidence and no product implementation |

Not yet granted. Cluster concurrency is 1 evaluator globally across all six dispatch entries; this
lane's turn has not been called.

## Leaf contract (binding, from `leaf-contracts.json`)

- archetype `1-small-contract`, overlay `docs`, wave 0, executionKind `implementation`.
- file surfaces: `.llm/tools/`, `docs/site` (incl. `docs/site/reference/`), and the immutable
  external source `EIS-Chat@5191de83f3da97559f21d8891c6c8afdf1cf473a`.
- proving gates: `check`, `test`, `docs-source-format`, `docs-accuracy`.
- JSR audit not applicable (no `packages/**` or `plugins/**` surface).

## Standing control laws (from `topic-claude-reset-common.md`)

- Supervise only. No product/docs/tooling edits in this worktree; implementation stays in
  daemon-attached WSL Codex leaves launched/steered through the agentic suite.
- Never resume parked Codex thread `019ffcc0-e19b-71d1-95ce-8c72559eb026` as a topic controller, and
  never fire a second `send-message-v2` at a leaf worktree — steer the existing thread.
- One evaluator globally at a time; fresh session per gate; opposite family from the Codex
  generator; exact route from `briefs/reset-gates/dispatch.json`. No OpenRouter/OpenCode/AGY
  substitution. Fable 5 requires a coordinator amendment recording genuine architectural necessity.
- Tier-A topic review may consolidate shared lane context but never replaces PLAN-EVAL or IMPL-EVAL.
- No merge, publish, ready-for-review, relabel, issue-close, milestone-scope change, cluster-state
  mutation, or release-writer lease from this lane.
- Do not blindly resume a leaf: re-establish exact local/remote/PR head, hold, formal gate, CI,
  resource lease, and thread state first.

## Recovery attachment + drift audit — 2026-08-23

Reattached against central recovery commit `ba1688732`, which set this lane's controller to
`state: recovery_pending` and instructed docs to "audit relevant main drift and documentation
consequences without silently taking new milestone scope". Allocation is unchanged: `[1551]`,
`queueState: exhausted_parked`, no open docs-lane issue. No scope taken.

| Field                | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| Claude session id    | `36288ff6-96bf-459b-8b1e-f289eab242e3`                         |
| `bridgeSessionId`    | `cse_01PMQqcnqEbKKQQz2ipLNf7K` (`bridgeOutboundOnly: false`)   |
| Remote Control URL   | `https://claude.ai/code/session_01PMQqcnqEbKKQQz2ipLNf7K`      |
| Route (respawnFlags) | `--model claude-opus-5 --effort high --remote-control`         |
| Route verdict        | matched (requested native Claude · Opus 5 · high · RC)         |
| cwd / worktree       | `/home/codex/repos/netscript-007-docs`                         |
| Reconciled at        | topic head `844acea27` clean; `origin/main` `9634735bc0`       |

Route evidence is `respawnFlags` in the daemon job state, not argv: this session was claimed from a
`bg-spare` process whose argv carries neither `--model` nor `--effort`.

### Four post-checkpoint RFC merges — NO documentation or release-compatibility drift

`#1678` `8ab438d47`, `#1683` `aac320d74`, `#1685` `43f4c1ff3`, `#1686` `9634735bc`.

- Path surface is exclusively `.llm/` and `rfcs/`. Zero `docs/site/`, `packages/`, `plugins/`,
  workspace config, or workflow files.
- Publish surface unchanged: `rfcs/` is not a workspace member and is inside no package
  `publish.include`.
- The new foreign-language and nested-config files (`Cargo.toml`, `.go`, `.cs`, `.py`, `.sh`,
  `.wasm`, a nested `deno.json`+`deno.lock` under `bench/parallel/wasmbuild-lcg/`, a `package.json`
  under `bench/bootsharp-lcg/`) sit outside every gate root: `check`/`lint`/`fmt:check` are rooted at
  `packages`+`plugins`; `quality:scan:repo` adds only `.llm/tools/fitness`, `.llm/tools/quality`,
  `docs/site`; the npm-catalog and zod-alignment scanners walk workspace members only.
- `docs:links` roots are `.llm/harness`, `docs/architecture/doctrine`, `.agents/skills` plus four
  root files — `rfcs/` and `.llm/runs/` are outside it, so new RFC prose cannot break it.
- Numbering is **not** drift: `rfcs/README.md` lifecycle step 1 requires drafts to keep `0000-<slug>`
  until a number is assigned on acceptance. Five concurrent `0000-*` drafts are conformant, and the
  README carries no index table to go stale.
- CI evidence: `ci` and `Code quality` are `success` at all four heads. The Pages docs workflow
  correctly did not run (no `docs/site` paths).

The series proposes four task-runtime adapters (scriptc/Rust/.NET/Go). None is Accepted, none carries
a 0.0.7 commitment, none needs docs/site coverage. Docs lane takes no scope from them.

### Lane corrections — docs consequences

- **#1663** (`194e22a3d`): 9 files, all under
  `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/`. No product, no
  docs. **Zero docs-lane consequence.**
- **#1664** (`203374417`): docs-relevant paths are `packages/cli/README.md`,
  `packages/fresh/README.md`, three scaffold templates, and a regenerated `embedded.generated.ts` —
  the barrel regen is present, as `check:assets-barrel` requires. Checked and cleared: these README
  edits invalidate **neither** of the other two generated layers. `agent-docs.generated.ts` is fed
  from `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`, and `publish-assets.generated.ts`
  embeds `packages/mcp/README.md` only. This lane's three-generated-layers rule does not fire.
  Remaining exposure is JSR landing-page copy, owned by the features lane's own publish gates.
- **#1671** (`bd97a7c03`): the only correction with a real docs-lane consequence — see below.

### #1671 — findings for the fixes lane

1. **Base predates the new blocking Pages gate.** #1671 edits `docs/site/services-sdk/sdk.md` and
   `docs/site/services-sdk/how-to/discover-services.md`, so it triggers Pages. Its base `0ef48c2ec`
   predates `2dd1a75ef` (#1666), which inserted `docs:exports-drift` into `pages.yml` ahead of
   `docs:snippets`. That step has never run against this branch — rebase onto current main before any
   readiness claim, or the gate is unproven.
2. **`docs:exports-drift` will not fail it.** Verified, not assumed: the gate compares entrypoint
   names and — for `checkSymbols: true` packages — exported *symbol names* only, never signatures.
   #1671 changes no entrypoint and adds/removes no exported symbol name in `@netscript/sdk`
   (`checkSymbols: false`) or `@netscript/contracts` (`checkSymbols: true`).
3. **Ungated reference/guide divergence.** #1671 rewrites the golden-path example in
   `services-sdk/sdk.md` from tuple destructuring + `isDefinedError` narrowing to the discriminant
   form (`result.isSuccess`, then `result.isDefined`) and drops the `isDefinedError` import from the
   example. `docs/site/reference/sdk/index.md` — untouched by #1671 — is the third page documenting
   this API and still frames around the tuple form: `isDefinedError` (line 40), `SafeResult` (58),
   `SafeFailure` (60). Nothing catches the gap: symbol names are unchanged and `docs:snippets`
   compiles fenced code, not table rows.

   **Corrected 2026-08-23 after the fixes lane's audit — see § Advisory outcome.** My first wording,
   "reference and guide teach two contracts for one API", overstated it, and the "fold ~3 rows into
   #1671" recommendation was wrong. All three rows remain factually **true** at the leaf head, and
   they are **verbatim the package's own JSDoc** (`packages/sdk/src/client/errors.ts:68-70`,
   `:75-77`) — verified against source. So this is cross-page emphasis debt, not contradiction, and
   editing the rows without the JSDoc would *create* source-to-reference drift where none exists.
   It is a rows-plus-JSDoc change, i.e. a 7th and 8th path against `plan.md:146`'s six-path ceiling.
   Correctly declined by the fixes lane and routed to the coordinator as a #1670-precedent
   follow-up.
4. **Existing snippets stay compilable.** `SafeSuccess`, `NonDefinedSafeFailure`, and
   `DefinedSafeFailure` remain tuple-and-object intersections, so `const [error, result] = await
   safe(...)` still destructures. Two silent narrowings land: the failure payload slot moves
   `null` → `undefined`, and default `TError` moves `unknown` → `ThrowableError`. Repo-wide, the only
   docs/site pages touching this API are the three named above — the other `safe(` hits in
   `data-persistence/database.md` and `reference/prisma-adapter-mysql/index.md` are
   `executeRawUnsafe`/`$queryRawUnsafe` false positives.
5. **For the withheld JSR/export gate — exact locations, no verdict claimed.** #1671 puts three
   *unexported* types into public signatures reachable from published entrypoint
   `@netscript/sdk/client`: `NarrowDefined` (`packages/sdk/src/client/errors.ts:47`) in the return
   position of exported `isDefinedError` (`:115`), and `NonDefinedSafeFailure` (`:49`) /
   `DefinedSafeFailure` (`:61`) as the constituents of exported `SafeFailure` (`:71`). Current main
   has **zero** such references in that module — every public signature there resolves to an exported
   type — so this is new with #1671 and is the class of thing `deno doc --lint` / JSR slow-types
   police. Same shape as the coordinator's open `ContractBuilder` question, where
   `packages/contracts/src/application/contract-primitives.ts` now annotates exported `baseContract`
   with `ContractBuilder<…>` imported from `npm:@orpc/contract`, placing an upstream type in a
   published NetScript signature.

### Release-cut sequencing note

`bump-version.ts` rewrites `deno.json` files only, while `generate-cli-assets-barrel.ts` throws when
`.llm/assets/agent-docs/provenance.json` `version` differs from `packages/cli`. The 0.0.7 cut must
therefore run `gen:agent-docs-prose` inside the cut commit, as cuts 0.0.4/0.0.5/0.0.6 all did — and
because that regen re-extracts from `docs/site`, it must land **after** #1671's docs edits settle.

Pre-empting a plausible false alarm: `provenance.json` carries no `comparisons/*` entries, but that is
by design, not staleness. The "Agent docs corpus freshness" gate executed and passed on this lane's own
comparison merge `729386c56` (run `31876977043`, job `quality`).

No merge, publish, readiness flip, runtime lease, relabel, or self-certification performed. Lane
remains EXHAUSTED / PARKED with allocation `[1551]`.

### Advisory outcome — fixes lane audit, 2026-08-23

The fixes supervisor audited all three findings rather than accepting them; recorded at `4ff7f3772`
on `orchestrator/release-0.0.7-fixes`, `.llm/runs/release-0.0.7-fixes--orchestration/tier-a-1671.md`
§ Cross-lane advisory. Net: findings 1 and 3 upheld, finding 2 upheld as debt with my framing
corrected and my scope recommendation declined.

- **Finding 1 — upheld and upgraded from reasoning to execution.** They confirmed `pages.yml:143-145`
  gained the blocking step in `2dd1a75ef`, post-dating merge-base `0ef48c2ec`. I *read*
  `check-exports-drift.ts` and predicted a pass; they *ran* it, applying the leaf's six product/docs
  paths onto a detached worktree at main `9634735bc0`: `Coverage [contracts]: mode=complete`,
  `Coverage [sdk]: mode=entrypoints-only`, `omitted-symbol-groups=0` both, drift check **PASS**
  (exit 0). Mechanism refinement worth carrying: sdk runs **entrypoints-only**, so its reference-page
  symbol rows are never checked at all — stronger than "no changed name tripped `checkSymbols`", and
  it is precisely why finding 2's gap is ungated. By-product: the six leaf paths apply cleanly onto
  current main with zero product conflict.
- **Finding 2 — my framing corrected, scope correctly declined.** See the correction inline above.
- **Finding 3 — upheld; their measurement is wider than mine.** My three are a subset: the withheld
  gate covers **10** new SDK diagnostics (mine plus `ThrowableError` ×4, `ClientPromiseResult` ×2,
  `ProcedureErrorFromNode`). My "zero on current main in `client/errors.ts`" matches their base
  measurement; the SDK-wide baseline is 3, all outside that module.

**Result for this lane's review surface — the `ContractBuilder` question is now answered negatively.**
The coordinator's proposed fix (export the type names `baseContract`'s signature needs from
`packages/contracts/src/public/mod.ts`) is **refuted**: probed at the exact leaf head, `contracts/mod.ts`
goes 10 → 21 private-type-ref diagnostics, because exporting a type promotes it to a linted root whose
own body is then checked — `ContractBuilder` alone adds ten (`ContractProcedure`, `ErrorMap`, `Meta`,
`Route`, `ContractRouterBuilder`, `ContractBuilderDef`, …). Closing that cascade means re-exporting
`@orpc/contract`'s whole builder algebra into NetScript's published surface. Also refuted: S4-R
correction #12 (`Schema` → `ContractSchema`) fails `deno check` with TS2322 — `ContractSchema` is
narrower (carries `_input`/`_output`/`parse`/`safeParse`), not a structural mirror.

Docs-lane read on that: both refutations point away from widening the published contracts surface, so
the resolution is a coordinator ruling on the boundary, not a docs change. #1671 is parked pending it;
leaf and PR unmodified at `bd97a7c03a`. This lane opens nothing and takes no scope.

### Forward hook fired — exposure route is merge-blocking on this lane's gate, 2026-08-23

The forward hook I left with the fixes lane ("if a ruling changes what `@netscript/contracts` or
`@netscript/sdk` publish, that lands on `docs:exports-drift` with contracts in **complete** mode")
was executed, not left hypothetical. Recorded at `33c1288d2` on `orchestrator/release-0.0.7-fixes`,
`tier-a-1671.md` § F1 addendum. Probe at `9634735bc0` + the leaf's six paths + exactly the three
ruled type-only re-exports in `packages/contracts/src/public/mod.ts`, nothing else:

```
Coverage [contracts]: mode=complete; omitted-symbol-groups=0
Symbol Drift Error [contracts]: docs/site/reference/contracts/index.md OMITS exported symbol 'BaseContractErrors'
Symbol Drift Error [contracts]: docs/site/reference/contracts/index.md OMITS exported symbol 'ContractBuilder'
Symbol Drift Error [contracts]: docs/site/reference/contracts/index.md OMITS exported symbol 'Schema'
Exports & Symbols drift check: FAIL   (exit 1)
```

The identical probe **without** the three re-exports is PASS/exit 0, so the three errors are
attributable to the ruled correction alone. This is merge-blocking at `pages.yml:143-145`, not an
advisory count — a different class from the `deno doc --lint` diagnostics (10 → 21).

**Docs-lane position on the repair path, since it is this lane's surface.** Clearing those three
errors means adding rows for `ContractBuilder` and `Schema` to
`docs/site/reference/contracts/index.md`. This lane's read: **do not.** That page is the
consumer-facing statement of what `@netscript/contracts` publishes *as its own surface*. Adding rows
for an upstream oRPC builder class and a standard-schema alias would tell consumers NetScript owns
and stabilises those types, and would put NetScript's reference docs on the hook for upstream's
builder algebra. That is a doctrine decision about the published surface, not a lint repair — and it
reaches the same barrel growth the ruling forbids, from the opposite direction. The gate is behaving
correctly here: it is refusing to let an unowned type enter the published surface silently.

Consistent with the fixes lane's recommendation 2 (withdraw the exposure ruling, land S4-R #11 plus
the ten SDK corrections under the existing three-file ceiling, file a #1670-precedent follow-up for
the residual), which changes no exported symbol name in either package and therefore clears
`docs:exports-drift` cleanly. This lane authors nothing and files nothing; the ruling is the
coordinator's.

Standing arrangement confirmed with the fixes lane: nothing currently live changes either package's
published surface, and this lane hears from them before any readiness attempt if an exposure variant
is revived.

### PR #1691 export-surface review — accepted, plus an unpoliced-drift finding, 2026-08-23

Reviewed at the fixes lane's invitation (`ce3c21a1`, one generated path). Read-only; this lane
authored nothing and filed nothing.

**Their attribution independently corroborated.** They flagged that the `@netscript/sdk` `CacheQuery`
signature change (`startInflight()`/`readCachedEntry()`) superficially looks like #1671's but is not.
Confirmed from this lane's own main audit: `packages/sdk/src/cache/cache-query.ts` is in the
`baf1cdf67..9634735bc` range via #1665 `3e8e146a4` / #1669 `0ef48c2ec`, and #1671's 14 paths touch no
cache file. Attribution holds on evidence gathered before their message. Their correction to the
briefing they were given — nine exports **plus** eleven changed signatures, not "exactly the nine
exports" — matches what the corpus can carry, and reporting it as measured rather than as briefed is
the right call.

**Finding: the five new symbols have drifted, and no gate can ever catch them.** The 9 added export
entries are 5 distinct symbols — `McpReadResourceResult`, `McpResourceContent`, `McpServerStatus`,
`McpTransportPoolSnapshot` (`@netscript/ai`, each across `./mcp` and `./ports`) and
`PrismaMySqlTransactionOptions` (`@netscript/prisma-adapter-mysql`). Checked against their reference
pages at main `9634735bc`:

```
McpReadResourceResult          docs/site/reference/ai/index.md                   0 occurrences
McpResourceContent             docs/site/reference/ai/index.md                   0
McpServerStatus                docs/site/reference/ai/index.md                   0
McpTransportPoolSnapshot       docs/site/reference/ai/index.md                   0
PrismaMySqlTransactionOptions  docs/site/reference/prisma-adapter-mysql/index.md 0
```

Both pages exist. **Neither package is in `AUTHORITATIVE_MAPPING`**, so `docs:exports-drift` cannot
flag this — not now, not ever. The structural shape: **8 of 36 package reference pages policed**
(`fresh-ui`, `plugin`, `config`, `contracts`, `queue`, `sdk`, `service`, `telemetry`), **28
uncovered**. #1666 built a real gate and covered a quarter of the surface; this is the first
concrete instance of what the uncovered pages do silently.

Denominator counted exactly, because it decides the shape of any ruling: `docs/site/reference/` holds
**37 entries = 36 package directories** — every one carrying an `index.md`, none missing — **plus the
top-level `docs/site/reference/index.md` landing page**. The landing page is not a package surface and
is not something `AUTHORITATIVE_MAPPING` could gate, so it is **correctly out of scope** and does not
belong in the denominator. `28 uncovered` is identical under either count, so this changes no
conclusion — but `8/37` would silently assert the landing page is a gateable surface someone forgot,
where `8/36` says it is deliberately not one. For a ruling phrased as "extend the mapping, or record
what is deliberately out of scope", that distinction decides what gets built. The fixes lane carried
the corrected figure upward at `982276ab6`.

Checked and **clear**, so it is not part of the finding: the `sdk` `CacheQuery` row
(`reference/sdk/index.md:86`) is a one-line class description with no method list, so
`startInflight()`/`readCachedEntry()` do not make it false — and `sdk` runs entrypoints-only anyway.

**This is pre-existing main drift, not #1691's.** #1691 is the honest regeneration that made it
visible, and it should **not** be widened to fix it — that would repeat the exact scope error the
fixes lane correctly refused on #1671's reference rows. No objection to #1691 from this lane.

**Not filed.** The milestone is frozen and this lane does not add scope to it. Surfaced to the
coordinator as a **post-0.0.7 / Backlog** candidate — extend `AUTHORITATIVE_MAPPING` toward the
remaining reference pages, or record deliberately which pages are out of scope and why. The
coordinator decides whether it becomes an issue; this lane will not open one.

## Reconciliation — live main `c73d361ee`, central `148d30026`, 2026-08-23

Resumed at topic head `f836bdc96`. **Verified:** working tree clean; local `f836bdc96` **==** remote
`refs/heads/orchestrator/release-0.0.7-docs`; **Docker zero containers**. Aspire holds no AppHost —
the only `aspire` processes are three `aspire mcp start` instances, one bound to each live supervisor
session (internals, fixes, docs), which are agent MCP tooling, not application runtime. No `dotnet`
and no product `deno` processes. Consistent with the central checkpoint's "Docker has zero containers,
Aspire reports `[]`". No runtime work started, no lease requested, no scope admitted.

Main advanced `9634735bc` → `c73d361ee` by exactly two commits, **both already reviewed by this lane
in-session**: `61bfd858d` (#1691, the one-file corpus regeneration — reviewed, no objection, kept at
one file) and `c73d361ee` (#1692). Per the central record, #1671 was accidentally closed by a literal
closing token in prerequisite prose and its bounded work continued as replacement PR #1692.

### CORRECTION — a factually wrong statement in this lane's own pushed record

Commit `2609a9d89` asserted: *"`provenance.json` carries no `comparisons/*` entries, but that is by
design, not staleness."* **Both halves are wrong.**

- On main at `9634735bc`, `provenance.json` carried **3** `comparisons/*` entries
  (`sourceCommit 0d4c82d6e`). The "no entries" reading came from **this worktree's own copy**
  (`sourceCommit 6f9620c0c`, 0 entries) — a parked checkpoint artifact then ~7 commits behind main.
- "By design" was the wrong explanation. The comparison pages are corpus-**eligible** and were
  present; they were never excluded. `c73d361ee`'s regeneration carries the same three entries.

The *conclusion* (no alarm needed) was right, but it rested on a false fact, and a reader could take
it as evidence the corpus deliberately excludes comparison pages — which would misinform any future
coverage decision. Corrected here rather than left standing.

**Root cause, and a rule this lane now owns: read main-state facts from main, never from this parked
worktree.** Use `git show origin/main:<path>`. The topic worktree is a checkpoint, not a mirror of
main — the same class of error as the context-pack staleness this lane already paid for, arriving
through a different door. My "gate green on `729386c56` proves exclusion" inference was also invalid:
a green freshness gate says the corpus matched at that build, not that a page is out of corpus.

### All three #1671 findings closed out at the merged head

- **Finding 1 (base predated the blocking `docs:exports-drift` step) — resolved.** #1692 shipped from
  a current base; the central record has all 21 exact-head checks green at `686bae07b`.
- **Finding 2 (reference/guide emphasis debt) — live on main, and tracked.** #1692 changed
  `services-sdk/sdk.md` and `discover-services.md` but not `docs/site/reference/sdk/index.md`, exactly
  as predicted. Tracked as **#1690** (`docs(reference/sdk): align error-handling emphasis between the
  reference page and package JSDoc`), **Backlog / Triage**, `type:docs`/`p3` — *not* in the frozen
  milestone. Re-verified at `c73d361ee` that **no row is false**: exported names `DefinedError`,
  `SafeSuccess`, `SafeFailure`, `SafeResult`, `isDefinedError`, `safe` are all present on the page,
  and `SafeResult` is still `SafeSuccess | SafeFailure` over tuple-and-object intersections, so rows
  39/40/57/58/59/60 all hold. Emphasis debt only — the characterization after the fixes lane's
  correction was right, and the original "two contradictory contracts" framing would have been wrong
  about main too.
- **Finding 3 (three unexported types in published signatures) — resolved, not shipped.** At
  `c73d361ee`, `NarrowDefined`, `NonDefinedSafeFailure` and `DefinedSafeFailure` appear only at their
  own definitions (`:43`, `:45`, `:57`) and in internal `as` casts inside function bodies (`:143`,
  `:151`). Exported `SafeFailure` (`:67`) and `isDefinedError` (`:165`) now **inline** the structural
  shapes instead of naming the aliases, so the published surface names no private type. The default
  also moved `ThrowableError` → `Error`, whose consequence is recorded as #1693 (Backlog / Triage).

The exposure route this lane argued against was not taken: the central record confirms the final
architecture "does not transfer ContractBuilder, Schema, BaseContractErrors, public-barrel, metadata,
or export-corpus ownership."

### Lane rule 5 confirmed on a live case

#1692's docs edit invalidated the derived layers and the PR regenerated all four in-slice:
`prose.json.gz`, `provenance.json`, `packages/cli/.../agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`. Provenance moved `0d4c82d6e` → `587ade9f3`, version
still `0.0.6` matching `packages/cli`. This is the lane's rule 5 firing exactly as written and it
supports the recorded release-cut sequencing note: the prose regen must follow docs settling.

### Standing

The unpoliced-drift finding is unchanged — **8 of 36 package reference pages policed, 28 uncovered**,
still a post-0.0.7 candidate, still filed by neither lane. Nothing was added to the frozen milestone:
#1690 and #1693 are both Backlog / Triage. Lane remains **EXHAUSTED / PARKED** at allocation `[1551]`,
attached with Remote Control, awaiting explicit coordinator instruction.
