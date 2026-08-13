# PLAN-EVAL — docs-rfc-plugin-cli-contribution--1502

- Plan evaluator session: native Claude Opus 5 · medium · Remote Control, 2026-08-13
  - Registry record: `~/.claude/sessions/2159276.json` — name `netscript-007-features-1502-d0`,
    `sessionId` `669d043a-a1e3-4e75-9366-a1ee94f965ba`, `bridgeSessionId`
    `session_018f6pxZjiFPaYJF6AFLyLxn`, cwd `/home/codex/repos/netscript-007-features-1502`
  - Route: canonical `formal_plan_evaluation` route (native Claude · Fable 5 · medium) was
    unavailable — recorded allowance exhausted. Native Claude Opus 5 / medium is the approved
    fallback and remains opposite-family to the Codex author.
- Evaluated plan head: `a02f9690154b7384ca8e6503ea91d644b397368a` (branch
  `docs/rfc-plugin-cli-contribution`, draft PR #1651)
- Run: `docs-rfc-plugin-cli-contribution--1502`
- Surface / archetype: `rfcs/0000-plugin-cli-contribution.md`; Archetype 4 public DSL/builder
- Scope overlays: `SCOPE-docs`
- Binding contract read:
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`,
  key `rfc-plugin-cli-contribution` (#1502), `baselineMainSha`
  `01e0960494c95ce56eb35892c211a095eb13e6ed`, captured 2026-08-13T22:42:00Z

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined to `01e0960…`; live `origin/main` re-fetched at evaluation time is still `01e0960…` and equals `git merge-base HEAD origin/main`; contract `baselineMainSha` matches. Load-bearing findings re-verified below. |
| Decisions locked                        | PASS   | `plan.md` § Locked Decisions D0–D21, each with rationale; `worklog.md` § Design fixes public surface, vocabulary, ports, constants.                                                                                                       |
| Open-decision sweep                     | FAIL   | Seven deferred items in `plan.md` § Open-Decision Sweep are correctly classified, but the leaf-versus-contract scope question (FP-3) is an unlisted open decision that forces full re-slicing if deferred.                                |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` § Reviewable Commit Slices — 5 ordered slices S0–S4, each naming files and a proving gate; mirrored in `worklog.md` § Commit Slices.                                                                                            |
| Risk register                           | PASS   | `plan.md` § Risk Register — 11 risks, each with a mitigation; `plan.md` § Anti-Patterns adds AP-1…AP-25 dispositions.                                                                                                                     |
| Gate set selected                       | FAIL   | Contract `provingGates` = `check, test, publish-dry-run, arch-check, docs-source-format, docs-accuracy`; `plan.md` § Validation Plan declares the first four N/A. See FP-1.                                                               |
| Deferred scope explicit                 | FAIL   | `plan.md` § Non-Scope excludes the contract's own `fileSurfaces` (`packages/cli/`, `packages/plugin/`, `rfcs/0003-*`, `rfcs/0005-*`) with no drift entry and no contract citation. See FP-3.                                              |
| jsr-audit surface scan (pkg/plugin)     | FAIL   | Contract `jsrAudit.applicable = true` with two named risks; `research.md` § JSR audit applies the rubric to planned-future surfaces only and states it "does not run publication or publish dry-runs". See FP-2.                          |

## Open-decision sweep (evaluator-run)

One rework-forcing open decision the plan did not flag:

- **Is this leaf the contracted `packages/cli/` + `packages/plugin/` implementation leaf, or a
  zero-code RFC draft?** The plan answers "zero-code" unilaterally and treats a package edit as a
  stop condition (`plan.md` § Drift Watch), while the coordinator-approved contract scopes the leaf
  to publishable package surfaces with `publish-dry-run`, `arch-check`, and a live JSR audit. If the
  contract stands, the entire S1–S4 slice table, gate set, and archetype activation change. This is
  not a safe-to-defer FCP item.

The seven items the plan does list are correctly classified as safe to defer: exact type/function
spelling, absent-stub help visibility, exit-code mapping, size/deadline defaults, `PluginCli`
deprecation timing, which issue becomes the epic, and #1474 ownership. D2, D9, D10, D15 fix the
semantics behind each, so refinement during authoring does not force package-boundary rework.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **FP-1 — Gate set does not satisfy the binding contract.** Contract `provingGates` require
   `check`, `test`, `publish-dry-run`, and `arch-check` in addition to `docs-source-format` and
   `docs-accuracy`. `plan.md` § Validation Plan states: "Type-check, test, and lint are N/A for the
   actual docs-only diff" and "`quality:gate`, package publish dry-run, `arch:check`, and
   `scaffold.runtime` are not run or claimed for this leaf." Only two of six contracted gates align.
   The charitable "it really is docs-only" reading does not rescue `check`/`test`: the contract
   set's one pure-docs leaf, `comparison-docs-programme`, still carries `check` and `test`. **Fix:**
   either run and record all six contracted gates against this leaf's actual diff — on a docs diff
   `check` and `test` are cheap, and `publish-dry-run`/`arch-check` need the FP-3 surface question
   resolved first — or obtain an explicit coordinator amendment narrowing `provingGates` and cite
   that amendment in `drift.md` and `plan.md`.

2. **FP-2 — Contracted JSR audit is planned, not performed.** Contract sets
   `jsrAudit.applicable = true` with two risks: (a) "audit public exports and exact `@netscript`
   dependency pins for every touched publishable member"; (b) "run isolated-declaration publish
   dry-run and reject runtime asset/import-meta reads". `research.md` § JSR audit surface scan
   states the leaf "does not change publishable code and does not run publication or publish
   dry-runs", and `worklog.md` marks publish dry-run N/A. Specifically unaddressed: exact
   `@netscript` dependency-pin auditing appears nowhere in `research.md`; the isolated-declaration
   publish dry-run is deferred to future children; and `import.meta` reads are not named — research
   risk 3 covers embedded assets only. **Fix:** run the isolated-declaration publish dry-run and the
   export/dependency-pin audit for the contracted surfaces, or record the coordinator amendment. In
   either case add `import.meta`-read rejection to the RFC's named JSR risk list.

3. **FP-3 — Contracted file surfaces are excluded without recorded drift.** Contract `fileSurfaces`
   are `packages/cli/`, `packages/plugin/`, `rfcs/`, `rfcs/0003-command-composition-kit.md`, and
   `rfcs/0005-devtools-contribution.md`. `plan.md` § Non-Scope forbids all `packages/**` and
   `plugins/**` change and any change to "RFC 0003 business command atomicity or to
   frontend/SDK/runtime/DevTools payload contracts"; § Drift Watch makes a package edit a
   stop-the-leaf condition. A grep of the full run directory returns zero references to
   `leaf-contracts.json`, `provingGates`, `executionKind`, or the orchestration run — the contract
   was never read by the author, so the narrowing is unrecorded rather than argued. Note
   `executionKind: implementation` is the default (42 of 43 contracts) and does not by itself prove
   framework code is required; the discriminator is the contract shape. The other RFC-shaped leaf,
   `rfc-a-stage0-ratification-board`, is `coordinator-checkpoint` with `jsr: false`, no
   `publish-dry-run`, and surfaces limited to issues plus one RFC file. #1502 was deliberately given
   the opposite shape. **Fix:** record the mismatch in `drift.md` (severity significant), escalate
   to the topic orchestrator per `AGENTS.md` operating rule 5 and the plan's own Drift Watch, and
   re-slice against whichever scope the coordinator ratifies. Do not begin S1 under the narrowed
   scope without that ratification in writing.

## Verified evidence (spot-checks against the live tree)

Every load-bearing research claim I sampled holds at the evaluated head:

- R1 — `packages/cli/src/public/features/root/public-command-tree.ts`: static `CliCommandRegistry`;
  `deploy`, `generate`, and `plugin` registered directly; no generic contributed-child mount.
- R2 — `packages/plugin/deno.json` exports `"./cli": "./src/cli/mod.ts"`.
- R3 — `packages/plugin/src/cli/types.ts`: `PluginCliCommand` carries only
  `name`/`description`/`run`; no route tree, completion, capability, or error vocabulary.
- R4 — `mount-plugin-cli.ts` flattens with `` `${cli.name}:${command.name}` ``.
- R6 — `PluginContributions.cli` is `{ doctorChecks?: readonly 'auth-backend'[] }`;
  `mergeContributions` returns no `cli` key, so the axis is dropped on merge.
- R9 — `PluginInstallerManifestSchema` is `z.object({...}).strict()` with
  `schemaVersion: z.literal(PLUGIN_MANIFEST_SCHEMA_VERSION)`.
- JSR baseline reproduced exactly: `deno task doc:lint --root packages/plugin` → 15 private-type
  refs, `./src/cli/mod.ts` = 1 (`applyScaffoldPlan` → private `ScaffoldArtifact`).
- Scope truth: `git diff --name-only origin/main...HEAD` = 10 files, all under the run directory;
  `git diff origin/main...HEAD -- deno.lock` is empty.
- Issue #1502's five acceptance boxes each have a planned evidence path in `plan.md` (inventory →
  `research.md`; contracts/ownership/lifecycle/failures/security/compatibility → D1–D19 and the
  Lifecycle and Failure Matrix; deploy/DevTools without cross-import → D17; epic and children
  without duplicate filing → § Later Implementation Epic Shape and D20; separate PLAN-EVAL → this
  file).
- `scaffold.runtime` is absent from the contract's `provingGates`, so plan D21 is consistent with
  the contract; `quality-job` is likewise absent, consistent with the diff-touches rule.

## Notes — non-blocking, carry into the fix cycle

- **N-1 (identity accuracy).** `supervisor.md` records the author effort as "effort not exposed
  in-thread" / "effort unavailable". Topic launcher evidence at
  `/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/codex-thread-ids.md`
  records requested and observed `provider=openai · model=gpt-5.6-sol · effort=high`, route verdict
  matched, for thread `019ffcc5-d3e1-7c13-9815-e9956ec43683`. Correct the identity table.
- **N-2 (closing keyword).** PR #1651's body carries `Closes #1502`. #1502 is the only issue
  labelled `epic:cli-contrib` and is the anchor for the 11 implementation children in `plan.md` §
  Later Implementation Epic Shape, and `rfcs/README.md` § Lifecycle keeps an RFC tracking issue open
  until implementation completes. If #1502 becomes the epic — the plan's own deferred item "Which
  existing issue becomes the later epic" — merging would auto-close the anchor. Resolve before
  ready-for-review; this evaluator changed no labels or PR metadata.
- **N-3 (terminology gate).** `SCOPE-docs` § Additional Gates lists a Terminology gate that the
  plan's validation table does not name. The overlay cites `.claude/09-glossary.md`, which does not
  exist; the glossary is `docs/site/glossary.md`. The RFC introduces a large `PluginCli*` vocabulary
  and should be checked against that file and doctrine terms.
- **N-4 (Archetype-4 gate completeness).** `plan.md` § Fitness Gates lists 8 of the 18 F-gates
  `ARCHETYPE-4-dsl-builder.md` requires. F-1, F-2, F-4, F-8, F-11, F-12, F-14, F-16, F-17, and F-18
  appear only implicitly via "arch:check and focused doctrine checks". Name the full Archetype-4
  gate list in the RFC's implementation roadmap so children cannot drop them.

This is FAIL_PLAN cycle 1 of the 2 allowed before escalation to the user. No RFC content was
authored, no label was changed, and no implementation or expensive gate was started in this session.
