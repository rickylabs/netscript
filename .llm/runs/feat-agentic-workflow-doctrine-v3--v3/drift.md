# Drift Log — Agentic Workflow Doctrine V3

Append-only. Severity: minor | significant | architectural.

- **D1 (architectural, 2026-07-04)**: Harness v2 mandates run dirs at `.llm/tmp/run/<run-id>/`,
  but `.gitignore` excludes all of `.llm/tmp/` — run artifacts + generated `workflow.js` cannot be
  committed or reviewed from GitHub/mobile there. This run dogfoods the V3 target: tracked run dirs
  under `.llm/runs/<run-id>/`. Subject to PLAN-EVAL; v2 docs updated as part of V3 itself.
- **D2 (significant, 2026-07-04)**: `commits.md` intentionally NOT instantiated for this run —
  V3 drops it (requirement 10); the draft PR commit list + per-slice PR comments are the commit
  trail. v2 activation.md still lists it as mandatory; superseded by this run's design, pending
  PLAN-EVAL.
- **D3-lane-override (significant, 2026-07-04)**: Owner directive overrides the design §8 per-slice
  lane assignments for the implementation phase. The **supervisor stays Fable 5** (unchanged), but
  **all implementation slices S2–S8 run on Opus 4.8 sub-agents** instead of the planned Tier-D Codex
  (S2/S4/S6/S8) and Tier-C Sonnet Workflows (S3/S7), given V3's high importance and Opus's authoring
  quality on doctrine/tooling prose. **WSL Codex (Tier D) is retained ONLY as a final adversarial
  validation pass before IMPL-EVAL** (close-all-gaps sweep). This does not change the design's
  written lane-policy doctrine (S2 still documents the general Tier A–E model per §2); it is a
  run-scoped execution choice, recorded here per "drift is explicit". IMPL-EVAL remains OpenHands,
  separate session.
- **D4 (minor, 2026-07-04)**: The PLAN-EVAL evaluator's OpenHands job errored after producing its
  verdict — the PASS was posted to PR #390 (issuecomment-4881028564) but the mandatory
  `plan-eval.md` artifact never landed on the branch. The supervisor transcribed the posted verdict
  into `plan-eval.md` with a provenance note (transcription, not supervisor certification). The
  evaluator session separation is intact; only the artifact delivery failed.
- **D5-slice-review-gate (significant, 2026-07-04)**: Owner-directed scope amendment AFTER
  PLAN-EVAL PASS. The substantive per-slice supervisor review is not run-local behavior — it becomes
  **permanent, lane-agnostic harness doctrine** ("Slice review gate"): after an implementation
  sub-agent lands a slice and automated gates pass, the **Tier-A supervisor performs a substantive
  intelligence review of the slice content (correctness, coherence with already-landed slices,
  doctrine-fit, gaps/overreach) BEFORE the sign-off commit** — the commit is the supervisor's
  sign-off, not the implementer's. This holds for **every implementation lane without exception**
  (Tier B Opus sub-agents, Tier C Workflow-generated slices, Tier D WSL Codex); no lane
  self-certifies. Codified in V3 as: invariant wording in `workflow/lane-policy.md` (S2) +
  discoverable reference in the `netscript-harness` SKILL (S2) + concrete run-loop step between
  automated gates and sign-off commit in `workflow/run-loop.md` (S5). Recorded as design-v3.md
  Amendment A1; applied immediately to in-flight slices (each slice's worklog entry notes the
  review + any findings).
- **D6-A2-tools-and-llm-grade (architectural, 2026-07-04)**: Owner-directed scope amendment AFTER
  S2–S8 landed and BEFORE IMPL-EVAL dispatch. Owner identified that design §8 **under-scoped the
  `.llm/tools` work**: S6 wired mandates/aliases + `workflow/tooling.md`, and S8 pruned scratch, but
  the **deep tools refactor was never performed**. IMPL-EVAL is HELD. Two new workstreams fold in
  (recorded as design-v3.md **Amendment A2**):
  - **S9 — `.llm/tools` production-grade refactor (audit-first).** (1) AUDIT every tool under
    `.llm/tools/**` → classify keep / harden / deprecate-delete; post the classification as a PR #390
    comment (reviewable) and SendMessage the supervisor-coordinator BEFORE any destructive action;
    flag load-bearing/ambiguous delete candidates rather than guessing. (2) DELETE stale/deprecated
    tools, never deleting anything still referenced without repointing callers first. (3) HARDEN +
    HARMONIZE survivors (uniform CLI contract: flags/`--help`/exit codes, least-privilege
    `--allow-*`, structured/compact output, uniform errors); fix the three #307 debt items if in
    scope (codex-watch `--allow-env` doc, gh-token main-guard, claude-hook-log stdin-block).
    (4) RESTRUCTURE the folder into topic/domain subfolders — an S3-scale reference sweep updating
    EVERY caller (`deno.json` `agentic:*` + other aliases, all skills + `.claude` mirrors via sync
    (never hand-edit mirrors), AGENTS.md/CLAUDE.md, `.llm/harness/**`, `.github/workflows/**`);
    grep-zero stale tool paths. (5) TEST each surviving tool runs (smoke/`--help`/dry-run); existing
    tool tests pass; agentic suite resolves end-to-end. (6) UPDATE the tools registry +
    `workflow/tooling.md` + `netscript-tools` and `netscript-deno-toolchain` SKILLs to the new
    structure (map, not manual). May split into audit→execute sub-slices.
  - **S10 — `.llm/*` production-grade sweep.** Everything under `.llm/*` must be production-grade: no
    stale, no drafts, no dead/dated one-offs, no contradictions. **EXCEPTION: `.llm/runs/` is KEPT**
    as the agent-learning corpus (pruned on demand, not swept). Sweep `.llm/harness/**` and any other
    `.llm/*` for staleness/drafts/duplication and bring to grade.
  - **Sequencing:** S9 (audit→execute) → S10 → full-surface gates → **WSL Codex adversarial pass over
    the WHOLE V3 surface** (the pre-staged adversarial brief is deferred to cover S9+S10 too) →
    OpenHands IMPL-EVAL (separate session). Slices stay reviewable; material run growth noted in
    worklog. Still docs/tooling only — no `packages/`/`plugins/` source. No merge/close (owner's
    call). Authored by Opus 4.8 sub-agents under the A1 lane-agnostic review gate, same as S2–S8.
- **D7-S9-out-of-surface-followups (significant, 2026-07-04)**: S9 STEP 3A deleted 28 dead
  `.llm/tools` tools (27 `fitness/` gates + root `release.ts`). Two files that name deleted tools sit
  **outside V3's writable surface** and were therefore NOT edited — captured here (owner-directed)
  so the drift isn't lost:
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` (~L363-364) names
    `check-folder-cardinality.ts` and `check-abstract-coloc.ts`, and per the S9 audit also carries
    ~13 phantom root `check-*.ts` references that never existed at that path. This is the **#305
    doctrine-prose lane** V3 must not cross; it was already stale before the deletion. Tracking note
    posted on **#305** ("[S4] Architecture Doctrine revamp") for the doctrine owner to reconcile the
    fitness-function inventory to the surviving surface (`check-doctrine.ts`, `audit-jsr-package.ts`,
    `check-ds-no-raw-hex.ts`, `check-ds-color-utilities.ts`).
  - `docs/architecture/DOCS-STRUCTURE.md` (~L240) names `release-readiness.ts` (deleted). `docs/**`
    is outside V3's enumerated surface → owner/#305 follow-up, not edited.
  No automated gate blocks on either (the link-checker validates anchors/links, not tool-name
  existence). Not routed as an implementation task — lightest durable capture per owner.
- **D7b-generate-cli-assets-barrel-stable-path (minor, 2026-07-04)**: S9 STEP 3B restructure keeps
  `.llm/tools/generate-cli-assets-barrel.ts` at the **root (stable-path)** rather than moving it to a
  `codegen/` subfolder as the audit had proposed. Reason: its path is embedded as a
  `// @generated by .llm/tools/generate-cli-assets-barrel.ts` **provenance header in four
  out-of-surface `packages/**/*.generated.ts` files** (`packages/fresh-ui/registry.generated.ts`,
  `packages/service/src/primitives/scalar.generated.ts`,
  `packages/cli/src/kernel/assets/embedded.generated.ts`,
  `packages/plugin/src/kernel/assets/embedded.generated.ts`). Moving the tool would strand those four
  headers, which V3 cannot fix (packages/ is out of surface; regenerating is a framework-source op).
  Same deepest-wired logic that keeps the `run-deno-*` trio at root. **Do not "fix" this apparent
  inconsistency by moving it** without first repointing/regenerating those provenance headers under
  the packages/ lane. Owner-approved. (Also noted in `.llm/harness/workflow/tooling.md`.)
- **D7c-coverage-folder-gitignore-collision (minor, 2026-07-04)**: S9 STEP 3B originally moved
  `report-function-coverage.ts` into a `coverage/` subfolder (per the audit's topic grouping), but
  `.gitignore` line 2 is an **unanchored `coverage/`** rule — it matches a `coverage/` directory
  anywhere in the tree, so the tool landed in an ignored path (it committed only because `git mv`
  force-stages, but any future file added there would be silently un-tracked). Corrected during the
  A1 landing pass: the folder is `.llm/tools/reporting/` instead. Single reference updated
  (`deno.json` `coverage:functions` task); tooling.md layout note records the reason. All other new
  subfolders (`e2e/`, `git/`, `harness/`, `release/`, `search/`, `validation/`, `reporting/`) were
  verified collision-free against `.gitignore`.
- **D7d-S9-3B-out-of-surface-moved-path-refs (minor, 2026-07-04)**: two files **outside V3's writable
  surface** carry now-stale references to the pre-move root tool paths and were therefore NOT edited:
  `docs/site/_includes/readme-template.md` (~L8, names `.llm/tools/check-readme-standard.ts`, now
  `.llm/tools/validation/`) and `packages/cli/e2e/README.md` (~L6, names
  `.llm/tools/scaffold-e2e-test.ts`, now `.llm/tools/e2e/`). Both are prose mentions, not executable
  wiring — no gate breaks. `docs/**` is the #305 lane and `packages/**` is framework source; both are
  owner/#305 follow-ups, captured here so the grep-zero record is complete.
- **D8-S10-AP-ceiling-doctrine-vs-tool (significant, 2026-07-04)**: S10 harness sweep surfaced a
  three-way ceiling split for anti-patterns/fitness-functions. Doctrine source
  `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` **defines** AP-1..AP-25 and
  F-1..F-19 (verified by heading grep). The `check-doctrine.ts` tool + `gates/fitness-gates.md` +
  `archetype-gate-matrix.md` describe the tool's coverage range as AP-1..**AP-30**. Several harness
  evaluator surfaces were additionally **stale at AP-20 / F-15** (a pre-expansion count). RESOLUTION
  (in-surface): the harness evaluator tables (`evaluator/anti-pattern-catalog.md`,
  `templates/evaluate.md`, `gates/README.md`, `DOCTRINE-REF.md`) were brought up to the
  **doctrine-defined ceiling AP-25 / F-19** — an evaluator must enumerate what doctrine actually
  defines. The AP-25(doctrine)-vs-AP-30(tool) gap is **NOT resolved here**: reconciling it requires a
  doctrine-prose edit (the #305 lane, out of V3's surface) to either define AP-26..AP-30 or correct
  the tool's advertised range. `DOCTRINE-REF.md` now notes the AP-30 tool range as forward headroom.
  Owner/#305 follow-up. No AP-30 references in `fitness-gates.md`/matrix/tool were changed (S9 surface,
  graded correct).
- **D9-impl-eval-push-did-not-land (minor, 2026-07-04)**: The IMPL-EVAL evaluator (OpenHands,
  `openrouter/qwen/qwen3.7-max`, run 28708279015) returned **PASS** and posted the full verdict to
  PR #390 (issuecomment 4882250744), but — identically to the PLAN-EVAL case in D4 — its job errored
  at the push step ("Job status: failure" wrapper quirk), so **neither `impl-eval.md` NOR the trace
  it claimed to commit (`.llm/tmp/run/openhands/pr-390/run-28708279015-1`) actually landed on the
  branch**. Verified: PR head unchanged at `7e053757`; no `.llm/tmp/run/` path tracked on origin or
  present on disk; `deno.lock` clean; no `openhands/*` refs. Consequence: (a) the feared drift-D1
  violation (tracked content under the just-cleaned `.llm/tmp/run/`) **did NOT materialize** — there
  was nothing to `git rm`; (b) the legitimate evaluator artifact was missing from the run dir, so the
  supervisor faithfully **transcribed** the evaluator's verbatim verdict into `impl-eval.md` (same
  mechanism as D4/plan-eval.md), attributed to the evaluator with the run + comment links. Verdict
  content is the evaluator's, not the supervisor's. No self-certification.
