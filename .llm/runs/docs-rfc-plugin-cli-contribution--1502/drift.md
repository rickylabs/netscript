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
  `provingGates`, and `jsrAudit`; user dispatch “#1502 plan-fix cycle 1”, scope resolution items
  1–3.
- **Expected:** The contract's `executionKind: implementation` and `fileSurfaces` could be read as
  authorizing changes under `packages/cli/` and `packages/plugin/`.
- **Actual:** The authoritative dispatch resolves #1502 as an RFC/docs leaf. `packages/cli/`,
  `packages/plugin/`, RFC 0003, and RFC 0005 are inspection/audit surfaces only. The immutable
  `provingGates` and `jsrAudit.applicable: true` still bind this leaf and are run against those
  surfaces; they do not grant mutation authority.
- **Severity:** significant.
- **Action:** preserve the RFC-only slices, run and retain all six contracted proving gates plus the
  contracted CLI/plugin JSR audit, and propose—but do not file—the later implementation epic. Any
  expansion into framework code requires a coordinator amendment to contract key
  `rfc-plugin-cli-contribution`, followed by a new plan and separate PLAN-EVAL; it is not inferred
  from the current contract shape.
- **Evidence:** cycle-1 dispatch; `plan-eval.md` FP-1–FP-3; repaired `plan.md` Contract Resolution;
  cycle-1 receipts under `receipts/`.

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
