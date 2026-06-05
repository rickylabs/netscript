# Context Pack: NetScript Public Release Program (master)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `master--public-release-program` |
| Branch | `master` |
| Current phase | `execute` (S0 complete + merged to new-repo `main`; S1 prepared and handed off) |
| Archetype | N/A — supervisors select their own |
| Scope overlays | `SCOPE-docs.md` |

## Current State

**This copy lives in the public repo `rickylabs/netscript`** (carried from
`netscript-start` so S1–S6 execute here). S0 is **complete**: the producer repo
was ejected, validated, and merged to `main`. S1 (`feat-package-quality--supervisor`)
is **prepared and handed off** — its `plan.md` + `phase-registry.md` are scaffolded
and the canonical package-jsr-alpha run is nested alongside this run. The program
still decomposes the playground→public transition into 7 supervisor runs
(S0–S6 + tracked S7); all five user cruxes are locked.

## Completed

- `RELEASE-PROGRAM.md` (framing, locked decisions, target repo shape, extraction
  mechanism, toolchain/Aspire leverage, CI/CD, docs strategy, supervisor diagram
  + run cards + handover protocol).
- Harness wrappers: `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`,
  `commits.md`.
- `notes/TOOLCHAIN-2.8.md`, `notes/ASPIRE-13.4-13.5.md`.

## In Progress

- None. Master run is at a clean handover boundary.

## Next Steps

1. **S0 — done.** Genesis ejected, validated, merged to `rickylabs/netscript:main`
   (new-repo PR #1). Tracker: `netscript-start` PR #97; S0 supervisor PR #98.
2. **S1 — execute now** in this repo on `feat/package-quality` (off `main`). Run
   the 7 waves per `feat-package-quality--supervisor/phase-registry.md`, nesting
   the canonical package-jsr-alpha run; do not rewrite it.
3. In parallel under S1's duration: **S2** (toolchain), **S3** (CI/CD), **S5**
   (docs). **S4** overlaps S1's tail. **S6** closes alpha-0. **S7** post-alpha.

## Key Decisions

| Decision | Source | Notes |
|----------|--------|-------|
| `0.0.1-alpha.0` lockstep | user | first tag `v0.0.1-alpha.0` |
| `rickylabs/netscript` | user | JSR scope `@netscript` |
| Lume docs renderer | user + #254 | Fresh = SSR-only; Lume = static |
| Aspire 13.4 now, 13.5 native Deno | user + `AppHost.csproj` | on 13.2.2 today |
| Reuse `netscript-dev` for extraction | `maintainer-cli.md` | engine exists |
| `.agents/rules/*.mdc` | prisma-next | machine-enforced doctrine |
| Track prisma-next → S7 | user | shared DSL vocabulary |
| Phase-group branch grain | PR #96 + user | supervisors decompose into capability groups, not task sub-branches; adopt `supervisor-workflow.md` |

## Files Changed

| Path | Status | Notes |
|------|--------|-------|
| `.llm/tmp/run/master--public-release-program/RELEASE-PROGRAM.md` | new | centerpiece |
| `.llm/tmp/run/master--public-release-program/plan.md` | new | harness plan |
| `.llm/tmp/run/master--public-release-program/worklog.md` | new | design + gates |
| `.llm/tmp/run/master--public-release-program/context-pack.md` | new | this file |
| `.llm/tmp/run/master--public-release-program/drift.md` | new | 3 entries |
| `.llm/tmp/run/master--public-release-program/commits.md` | new | seeded |
| `.llm/tmp/run/master--public-release-program/notes/TOOLCHAIN-2.8.md` | new | Deno 2.8 |
| `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md` | new | Aspire |
| `.llm/harness/workflow/supervisor.md` | new | promoted supervisor protocol |
| `.llm/harness/workflow/escalation.md` | new | promoted escalation protocol |
| `.llm/harness/templates/phase-registry.md` | new | promoted template |
| `.llm/harness/templates/agent-briefing.md` | new | promoted template |
| `.llm/harness/workflow/activation.md` | changed | wired supervisor bootstrap |
| `.agents/skills/netscript-harness/SKILL.md` | changed | wired supervisor-run awareness |

## Gates

| Gate family | Current status | Evidence |
|-------------|----------------|----------|
| Static | PASS | link integrity + terminology verified this session |
| Fitness | PASS | SCOPE-docs source alignment / scope separation / drift log |
| Runtime | N/A | docs run |
| Consumer | PENDING | proven when first supervisor run is produced |

## Open Questions

- Confirm `examples/` set (quickstart/rest-service/full-stack/with-plugins) at S0.
- npm mirror via `deno pack` — alpha or post-alpha? (currently S3 stretch).
- Algolia DocSearch application timing (S5).

## Drift and Debt

- Drift: 5 entries (extraction reframe, Aspire reframe, version confirmation,
  phase-group branch grain correction, supervisor-workflow promotion).
- Debt: none created at program level; supervisors own their entries.
- Done: supervisor workflow promoted into `.llm/harness/workflow/supervisor.md`
  + `escalation.md` and `templates/{phase-registry,agent-briefing}.md`; wired
  into `activation.md` + the harness skill.

## Commits

- none yet (docs run; commits not requested).
