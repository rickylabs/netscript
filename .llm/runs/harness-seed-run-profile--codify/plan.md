# Plan — harness-seed-run-profile--codify

Codify the discovery→roadmap→orchestration pipeline (exemplar: `plan-roadmap-expansion--seed`) as
a reusable Harness v3 run shape, so every future major feature / cross-cutting refactor / replan /
big triage starts from an empirically-grounded, GitHub-native, implementation-ready board instead
of ad-hoc planning.

- **Archetype:** N/A — harness-surface docs (no framework code). **Overlay:** `SCOPE-docs.md`.
- **Gates:** docs-scope statics on touched files (fmt via scoped wrapper), skill-mirror sync check
  (`sync-claude-skills.ts`), link/reference sanity. No runtime/consumer gates apply.
- **Evaluation (owner-directed, recorded in `supervisor.md`):** WSL Codex adversarial pass +
  OpenHands separate-session verdict; owner ratifies; run does not merge.

## Locked decisions

- **LD-1 — Name: “seed run”.** The profile is the **seed-run** shape; run IDs use the `--seed`
  suffix the exemplar already used. Rationale: the run *seeds* the GitHub surface — epics,
  milestones, issues, briefs — from which implementation grows; the name is short, collision-free
  with “supervisor run”, and self-documenting in run IDs.
- **LD-2 — Home: `workflow/seed-run.md`**, sibling of `workflow/supervisor.md` (the promotion
  precedent). It is a **run shape**, not a package archetype and not a scope overlay — putting it
  under `archetypes/` would misfile it.
- **LD-3 — Contracts over templates.** The doc freezes each stage's **contract** (what it must
  produce + what proves it done) and the failure modes; it does NOT freeze the exemplar's exact
  folder tree or prose (n=1 caution, owner-ratified). The exemplar is cited as provenance.
- **LD-4 — Stage→lane binding by reference.** Stages bind to lane-policy tiers (B-corpus→Tier C,
  synthesis/plan→Tier A, deep-dives→Tier B, adversarial→Tier D, verdict→Tier E); the doc never
  restates model bindings — `lane-policy.md` remains the single source.
- **LD-5 — Scale-to-fit is part of the contract.** Full fan for multi-epic programs; the same
  stage sequence with fan-width 1 for a single major feature; explicitly NOT for single slices
  (normal `run-loop.md`). A “when not to use” section is mandatory.
- **LD-6 — One new template: `templates/supervisor.md`.** Fixes the systemic gap (mandatory file,
  no template) that plausibly caused the exemplar's own violation. The filing-manifest and
  decision-brief shapes are documented inline in `seed-run.md` (they are seed-specific; the
  templates dir stays generic).
- **LD-7 — Hard invariants carried into the profile:** drafts-only until owner ratification
  (zero GitHub mutation before the ratify stage); GitHub = single source of truth after filing
  (authority-banner discipline for run docs); evidence-citation gate on the research corpus; both
  lane-policy invariants (generator≠evaluator, no self-certification); `supervisor.md` at stage A.
- **LD-8 — Acceptance = dogfood.** The profile's acceptance test is the next real seed run
  reproducing the exemplar's quality, not this codification PR. Stated in the doc so nobody
  declares victory at the doc merge.

## Open-decision sweep

- **OD-1 (safe to defer):** whether `filing-manifest.md` later graduates to `templates/` — defer
  until a second seed run wants it.
- **OD-2 (owner, at ratification):** whether the seed-run doc becomes the referenced standard in
  `netscript-pr` for board-seeding work — surfaced in the PR body, no rework either way.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Cargo-culting the exemplar (n=1) | LD-3 contracts-only; “what varies per run” section |
| Profile drifts from lane-policy | LD-4 binding by reference, zero restated bindings |
| Ceremony tax on small features | LD-5 scale-to-fit + explicit “when not to use” |
| Doc contradicts netscript-pr / release skills | Pointers, not restatement (V3 single-home rule) |

## Debt / deferred scope

- No debt created. Deferred: OD-1; any automation of the filing manifest (a `.llm/tools/` filing
  executor) is future work, not this run.

## Commit slices

1. **S1 — run scaffolding**: run dir artifacts (`supervisor.md` first). Gate: files present.
2. **S2 — the profile**: `.llm/harness/workflow/seed-run.md` + `templates/supervisor.md`.
   Gate: fmt wrapper on touched files; internal references resolve.
3. **S3 — wiring**: `workflow/activation.md` + harness `README.md` pointers;
   `.agents/skills/netscript-harness/SKILL.md` (concepts, decision tree, reference files);
   regenerate `.claude/skills/` mirror via `sync-claude-skills.ts`. Gate: sync tool exits 0.
4. **S4 — adversarial + eval**: Codex F1 findings triaged/fixed; OpenHands verdict transcribed.
   Gate: verdict of record in run dir.
