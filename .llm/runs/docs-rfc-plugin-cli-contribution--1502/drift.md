# Drift Log: plugin CLI contribution RFC

Drift is append-only. Package and plugin source remain read-only in this leaf.

## 2026-08-13 — Documentation-authoring route differs from the attached owner session

- **What:** The canonical documentation-authoring lane and the observed author session differ.
- **Source:** `.llm/harness/workflow/lane-policy.md:37`; `CODEX_THREAD_ID` in the attached WSL
  session; user brief.
- **Expected:** `documentation_authoring` routes to Antigravity CLI / Gemini 3.6 Flash / low.
- **Actual:** The user assigned the attached OpenAI Codex / GPT-5.6 Sol thread as sole leaf
  supervisor/author.
- **Severity:** minor.
- **Action:** accept the explicit owner assignment, record both routes, preserve thread identity,
  and require a fresh native Claude/Fable 5 PLAN-EVAL.
- **Evidence:** `supervisor.md`.

## 2026-08-13 — Accepted contribution RFCs describe unimplemented seams

- **What:** Accepted frontend and DevTools RFCs specify manifest pointers, family envelopes, and
  transactional generated registries that are not present in the live packages.
- **Source:** RFC 0005 §§2, 6, 13–14; frontend canonical design; live `deno doc`; live source.
- **Expected:** Consumer RFC language can be used as a compatibility contract, not as proof of
  shipped APIs.
- **Actual:** `PluginInstallerManifestSchema` is still top-level `.strict()`, the public runtime
  contribution payload is broadly unvalidated, and no frontend/DevTools contribution axis is
  shipped.
- **Severity:** significant.
- **Action:** rebaseline every claim; make schema evolution a prerequisite and reuse the accepted
  family/pointer laws without claiming they exist today.
- **Evidence:** `research.md` findings R6–R9; `packages/plugin/src/protocol/manifest.ts`;
  `packages/plugin/src/config/domain/plugin-contributions.ts`.

## 2026-08-13 — Existing `@netscript/plugin/cli` is not the proposed host seam

- **What:** The repository already publishes a `./cli` subpath, but it is a flat command helper and
  abstract base class, not the required typed host contribution architecture.
- **Source:** `packages/plugin/src/cli/types.ts`, `base/plugin-cli.ts`,
  `composition/mount-plugin-cli.ts`; `deno doc packages/plugin/src/cli/mod.ts`.
- **Expected:** A public DSL/builder with static descriptors, lazy handler pointers, collision
  validation, generation capabilities, and host isolation.
- **Actual:** `PluginCliCommand` carries only name/description/run; `mountPluginCli` prefixes flat
  names; help is string formatting; no nested router, completion, capability, pointer, isolation, or
  deterministic collision contract exists.
- **Severity:** significant.
- **Action:** plan an explicit compatibility/deprecation child instead of silently redefining the
  existing API; keep the future host adapter private to `@netscript/cli`.
- **Evidence:** `research.md` R2–R5; `plan.md` decisions D2 and D14.

## 2026-08-13 — Current public plugin CLI subpath has a JSR doc-lint baseline failure

- **What:** The planned `@netscript/plugin/cli` surface is not currently doc-lint clean.
- **Source:** `deno task doc:lint --root packages/plugin` and focused
  `deno doc --lint packages/plugin/src/cli/mod.ts`.
- **Expected:** Every implementation child touching a publishable surface starts from a measured
  full-export baseline and reaches zero new diagnostics, with the touched subpath clean.
- **Actual:** The package reports 15 private-type references overall; the `./cli` subpath reports
  one: public `applyScaffoldPlan` references private `ScaffoldArtifact`. `@netscript/cli` reports
  zero diagnostics across its three export-map entrypoints.
- **Severity:** significant.
- **Action:** make the existing `./cli` private-type repair an explicit implementation prerequisite
  or same-child fix; never claim this docs leaf passed a package publish bar.
- **Evidence:** `research.md` JSR audit table and command transcript summarized in `worklog.md`.

## 2026-08-13 — Coordinator contract shape conflicts with the RFC-only dispatch

- **What:** The coordinator contract has implementation-shaped file surfaces and proving gates,
  while both the original leaf dispatch and the cycle-1 repair dispatch authorize an RFC document
  that proposes a separate later implementation epic.
- **Source:**
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`,
  contract key `rfc-plugin-cli-contribution`, specifically `executionKind`, `fileSurfaces`,
  `provingGates`, and `jsrAudit`; durable coordinator brief
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/briefs/topic-features/implement.md:24`
  at commit `8775be7b3`.
- **Expected:** The contract's `executionKind: implementation` and `fileSurfaces` could be read as
  authorizing changes under `packages/cli/` and `packages/plugin/`.
- **Actual:** The authoritative dispatch resolves #1502 as an RFC/docs leaf. `packages/cli/`,
  `packages/plugin/`, RFC 0003, and RFC 0005 are inspection/audit surfaces only. The immutable
  `provingGates` and `jsrAudit.applicable: true` still bind this leaf and are run against those
  surfaces; they do not grant mutation authority. `leaf-contracts.json` itself was not edited; the
  durable brief is an explicit dispatch-level narrowing.
- **Severity:** significant.
- **Action:** preserve the RFC-only slices, run and retain all six contracted proving gates plus the
  contracted CLI/plugin JSR audit, and propose—but do not file—the later implementation epic. Any
  expansion into framework code requires a coordinator amendment to contract key
  `rfc-plugin-cli-contribution`, followed by a new plan and separate PLAN-EVAL; it is not inferred
  from the current contract shape.
- **Evidence:** coordinator brief commit `8775be7b3`; `plan-eval-cycle-1.md` FP-1–FP-3;
  `plan-eval.md` cycle-2 PASS; repaired `plan.md` Contract Resolution; receipts under `receipts/`.

## 2026-08-15 — Main advanced after the approved immutable base

- **What:** `origin/main` advanced by one commit while the leaf was awaiting cycle-2 PLAN-EVAL.
- **Source:** raw `git rev-parse origin/main`, `git merge-base`, and diff from the approved base.
- **Expected:** Leaf merge-base remains `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- **Actual:** `origin/main` is `dd472102d05ea13ab7ac7654aeedb177fbae2eb8`; the only intervening
  commit changes evidence/verdict tooling and the PR skill, with no `rfcs/`, `packages/cli/`, or
  `packages/plugin/` overlap.
- **Severity:** minor.
- **Action:** retain the approved immutable base and do not silently rebase; rerun final evidence in
  S4 and escalate only if a later mainline change overlaps the inspected contract surfaces.
- **Evidence:** raw reconciliation at S1 activation; `worklog.md` progress log.

## 2026-08-13 — Docs overlay points to a retired glossary path

- **What:** `SCOPE-docs` names `.claude/09-glossary.md` for its Terminology gate, but that path does
  not exist in the live tree.
- **Source:** `.llm/harness/archetypes/SCOPE-docs.md` Additional Gates; evaluator note N-3.
- **Expected:** The terminology check resolves to a live authoritative glossary.
- **Actual:** The live glossary is `docs/site/glossary.md`.
- **Severity:** minor.
- **Action:** name and run the RFC terminology review against `docs/site/glossary.md`; do not edit
  the shared overlay from this leaf.
- **Evidence:** repaired `plan.md` Validation Plan and final RFC review checklist.

## 2026-08-15 — Tier-A found three bounded S1 contract inconsistencies

- **What:** The first S1 draft used an undeclared diagnostic type, promised deep immutability with a
  shallow return type, and allowed the handler-reference type to look sufficient for path safety.
- **Source:** Tier-A review artifact
  `/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/tier-a-review-1502-s1.md`
  at topic commit `b774998f0`, findings F1–F3.
- **Expected:** The public-types-first RFC declares every normative type and distinguishes static
  type guarantees from runtime validation.
- **Actual:** All three defects were documentation-contract inconsistencies; no ownership,
  lifecycle, package boundary, or implementation scope changed.
- **Severity:** minor.
- **Action:** declare the finite tuple/union, express recursive readonly plus runtime copy/freeze,
  and require normalized in-package handler paths before import. Stop again before S2.
- **Evidence:** S1 fix-up diff, docs-scoped receipts, and PR fix-up comment.

## 2026-08-15 — Live preview spelling differs by host-owned command

- **What:** The accepted plan uses preview/no-write as a semantic contract, while the live
  authoritative registry generator spells that mode `--dry-run` and the S1 contributed-command
  example spells it `--preview`.
- **Source:** Live `netscript-dev generate plugins --help` at accepted S1 head `bd8b29bf3`; plan
  D12; RFC S1 example.
- **Expected:** Plugin authors do not own or parse transaction-mode flags; the host supplies the
  spelling appropriate to each command.
- **Actual:** Both spellings can select the same host no-write state. The RFC now names the live
  registry spelling and fixes identical zero-stage/zero-write semantics for either host spelling.
- **Severity:** minor.
- **Action:** Keep `--dry-run` for the live `generate plugins` claim, permit host-owned `--preview`
  on contributed commands, and forbid plugins from implementing either flag. S3 must not treat the
  spelling difference as a new contribution axis.
- **Evidence:** RFC S2 guide and transaction sections; live-help sampling recorded in `worklog.md`.

## 2026-08-15 — Manifest issue body lags the accepted RFC decision

- **What:** Open issue #1474 still describes installer-manifest forward compatibility as an
  unresolved F-3 choice, while accepted RFC 0005 has ratified top-level `.passthrough()`.
- **Source:** Live #1474 body and RFC 0005 §6/W1-d, refreshed during S3 at accepted parent
  `7a5eb580a`.
- **Expected:** The later implementation prerequisite should have one already-decided schema rule.
- **Actual:** The durable RFC authority and the live implementation issue can lead readers to
  different conclusions if #1474 is consumed unchanged.
- **Severity:** significant.
- **Action:** The future epic amends #1474 in place to the ratified outcome before implementation;
  this RFC leaf files or mutates no issue and creates no duplicate protocol child.
- **Evidence:** `research.md` S3 duplicate refresh and RFC S3 amend/fold-first table.

## 2026-08-15 — Repository quality scan misses direct plugin command registration

- **What:** `deno task quality:scan:repo` reports zero findings, but the host still directly imports
  and registers first-party `ai` and `auth` command factories.
- **Source:** Durable `receipts/quality-scan-repo-s3.json` plus
  `packages/cli/src/public/features/plugins/plugins-group.ts:17-18,66-72,117-125` and
  `packages/cli/src/local/features/plugins/plugins-group.ts:3,81-89`.
- **Expected:** A hardcoded-host-command audit identifies real coupling even when its syntax is not
  covered by the existing equality/predicate scanner rules.
- **Actual:** The scanner passes with seven existing allowances because it does not recognize a
  plugin-specific import followed by direct `.command()` registration.
- **Severity:** significant.
- **Action:** Interpret the S3 gate narrowly; the later migration child adds a focused fixture/guard
  (or amends an appropriate existing scanner issue after re-audit) before removing the manual audit.
  This docs leaf does not change scanner or package source.
- **Evidence:** RFC S3 hardcoded-host-command audit; `research.md`; parent-head receipt.

## 2026-08-15 — Live main advanced inside an inspected auth CLI surface

- **What:** `origin/main` advanced from the previously recorded `dd472102d` to `0b3ed5d5a` while S3
  awaited review, and the new commit changes the implementation of the hardcoded `plugin auth`
  command group inspected by this RFC.
- **Source:** Raw fetch and diff of `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`
  (`fix(auth): require
  an explicit streams session URL (#1643)`) against the approved immutable
  leaf base.
- **Expected:** A later mainline overlap with an inspected CLI/plugin surface is reconciled before
  final evidence rather than hidden by a rebase.
- **Actual:** The auth command changes one session flag default and tests, but does not move its
  factory, change the direct public/local `auth` registration findings, create a plugin contribution
  seam, or alter any RFC-owned type/ownership decision. The branch merge base remains the approved
  `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- **Severity:** minor.
- **Action:** Retain the immutable base, record the overlap, and run the final contracted gates at
  the committed content head. The future implementation child re-baselines command behavior from
  live main before writing its migration fixtures.
- **Evidence:** S4 raw Git reconciliation in `worklog.md`; live commit `0b3ed5d5a`.

## 2026-08-15 — S4 sufficiency scope was implicit

- **What:** The first S4 handoff asserted a `SUFFICIENT` evidence-set verdict without preserving the
  exact six receipt filenames or the evaluator invocation that produced it.
- **Source:** Tier-A S4 review finding S4-F1 at
  `/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/tier-a-review-1502-s4.md`.
- **Expected:** The next evaluator can reproduce sufficiency from the same explicitly bounded set.
- **Actual:** A naive `receipts/*final*.json` glob includes three receipts with gate ID
  `publish-dry-run`, which `evidence-set.ts` correctly rejects as duplicate or contradictory.
- **Severity:** minor.
- **Action:** Choose remedy (b): preserve all immutable receipts, name the six contracted filenames,
  label the CLI/plugin member publish receipts supplemental and excluded, and record the exact
  evaluator command plus `SUFFICIENT` / empty-reasons result in `worklog.md`.
- **Evidence:** S4-F1 journal diff and reproducible evaluator output; no receipt metadata changed.

## 2026-08-15 — Owner narrowed C6 after overlap checkpoint

- **What:** The owner found one real overlap between C6 and RFC 0003's live implementation #1490
  under #1363, then selected KEEP AND NARROW rather than splitting or discarding the RFC.
- **Source:** Bounded owner brief
  `/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/impl-1502-amendment.md`.
- **Expected:** The plugin CLI seam owns generic contribution discovery and workspace-plan execution
  without claiming command-store persistence or business-command semantics.
- **Actual:** The core descriptor/router/registry/capability/bootstrap/isolation contract was
  distinct and remains unchanged. C6 wording was broad enough to imply ownership of RFC-0003
  generation details, and its compatibility row incorrectly called RFC-0003 execution host-owned.
- **Severity:** significant.
- **Resolution:** Narrow C6 to canonical text-plan validation, preview/apply,
  stage/check/commit/rollback, and generic registry/plan/journal doctor health. Reserve provider,
  Prisma, migrations, generated bridges, database validation, and receipt/audit/outbox/transaction
  semantics to RFC 0003/#1490. Add the preview-invariant planner law and qualify payload
  assignability without a brand or cross-domain semantic mapping.
- **Decision impact:** This refines locked D11–D18 and does not change an approved D-series
  decision. The owner expressly authorized no new PLAN-EVAL. Any package/plugin implementation or
  wider ownership change would still require a coordinator amendment and new plan gate.
- **Evidence:** RFC compatibility/ownership/doctor/roadmap/prior-art amendment, content-head commit,
  and fresh six-gate evidence recorded in the following journal commit.
