# S1 Package-Quality — Supervisor Context Brief (2026-06-06)

> Max-context brief for the **supervisor session** that owns `feat/package-quality`.
> The supervisor **supervises** — it does not implement, and it does not run wave
> gates or evaluator passes. Read this once, then operate from
> `.llm/tmp/run/feat-package-quality--supervisor/`.

---

## 1. Where this came from (the migration framing)

The NetScript foundation was built in a **concrete implementation workspace**
(`netscript-start`) — a repo whose job was to let us iterate fast on the framework,
plugins, CLI, and Aspire orchestration with a real running app.

That foundation has now been **migrated into the production repo**
(`rickylabs/netscript`). The production repo's job is different: it is preparing
**full JSR readiness for the first public release**. It is not an iteration
sandbox — every change is judged against publishability.

**S1 — Package Quality** is the release-program track that brings all **27
publishable units** (23 packages + 4 plugins, all `0.0.1-alpha.0`) to that bar:
`deno publish --dry-run` **0 slow-types**, `deno doc --lint` clean, README ≥ 150
LOC, `/docs` per STANDARDS § 7, archetype gate matrix green per unit. **S1 stops at
publish-clean dry-run** — no publishing, no version bumps, no OIDC (those are later
tracks).

## 2. What the supervisor IS (and is NOT)

**The supervisor owns the big picture of `feat/package-quality`** — the integration
branch that combines the work of every wave. It is the only role that sees the
whole 27-unit surface at once.

The supervisor's job:
- **Sequence the waves** (foundation-first; never start wave N+1 before wave N is
  `merged`) and keep `phase-registry.md` the single source of truth for status.
- **Stage each wave**: create the group branch + nested run, seed `research.md` +
  `context-pack.md` (structural re-baseline + accumulated lessons), open the draft
  PR, and **produce the generator prompt** the wave agent will run.
- **Hand off to separate sessions** for everything gate-shaped: the generator
  implements, and **independent evaluator sessions** run PLAN-EVAL and IMPL-EVAL.
- **Integrate** passing waves into the supervisor branch and keep the supervisor
  docs current.
- **Run a retro after every wave** (see § 3).

The supervisor is **NOT**:
- an implementer (it never writes package code),
- an evaluator (it **never runs PLAN-EVAL, IMPL-EVAL, or any wave fitness/gate
  check** — those happen in the wave run and in separate evaluator sessions),
- a re-deriver of per-package plans (it nests the canonical run, never rewrites it).

If you find yourself running `deno publish --dry-run`, `deno doc --lint`, a fitness
gate, or scoring a plan/implementation — **stop**: that is a wave or evaluator
session's job, not the supervisor's.

## 3. The after-each-wave retro (this is the heart of supervising)

When a wave merges, before staging the next one, the supervisor does a retro that
makes the *next* wave better:

1. **Drift promotion.** Read the merged wave's `drift.md` + `arch-debt.md`. For each
   leftover item decide: (a) it belongs to an **upcoming wave** → record it on the
   supervisor branch (`phase-registry.md` "Inherited debt" of the target wave) so
   that wave inherits it; (b) it is **cross-cutting / bigger than any wave** →
   promote it to the supervisor branch as its own line, or spin a **separate new
   run** for it; (c) it is closed → note closure. Nothing leftover should silently
   die inside a finished wave's run dir.
2. **Learning capture.** Distill what the wave taught (review findings, PLAN-EVAL
   adjustments, sizing reality, gate gaps) into durable lessons — append to the
   supervisor `worklog.md` Decisions/Lessons and, when a lesson is reusable across
   waves, into `.llm/harness/lessons/`.
3. **Prompt improvement.** Fold those lessons into the **generator prompt and seed
   templates** for the next wave, so each wave starts stronger than the last. The
   prompt is a living artifact, not a constant.
4. **Status + base-sync.** Update `phase-registry.md` (status table, cards, Base-Sync
   Log), `worklog.md`, `context-pack.md`, `commits.md`; base-sync the integration
   branch forward and log it.

## 4. What's done so far (current truth)

| Wave | Units | Status | Merge |
|------|-------|--------|-------|
| 0 — Foundation | `shared` | merged | `eb8ae44` (PR #3) |
| 0b — Harness + agent docs (inserted) | none | merged | `82ad2a2`,`d5d8e5f`,`76fbeb7` (PR #4/#5/#6) |
| 1 — Contracts & schemas | runtime-config, config, contracts | merged | `4c57867` (PR #7) |
| 2 — Integration adapters | logger, telemetry, aspire, kv, database, prisma-adapter-mysql, queue, cron | **active** | — (draft PR #8) |
| 3–6 | plugin / runtimes / apps / cli | planned | — |

**4 / 27 units merged.** The supervisor docs are current as of today. The harness
itself runs an 8-phase loop with a two-gate model (PLAN-EVAL before code, IMPL-EVAL
after) — both in **separate** sessions from the generator; Wave 0b introduced this
after Wave 0 skipped a gated Plan & Design.

## 5. Accumulated lessons (fold into every future generator prompt)

- **L-sizing** — the Plan-Gate caps slices at **< 30**. Wave 1 = 27 slices for 3
  units; any larger wave must split into sub-waves up front.
- **L-rebaseline** — never trust carried-in counts. The generator re-measures
  slow-types/doc-lint as Research step 1 (Wave 1's stale audit said 35/30/1; real
  was 0/0/0).
- **L-full-matrix** — make the generator select the FULL archetype gate matrix +
  consumer gates in the plan; Wave 1 under-selected and PLAN-EVAL had to add F-14/F-17.
- **L-defensive-io** — plan I/O guards + abort/cleanup **with tests** (Wave 1's
  watcher leaked unhandled rejections + late timer fires; found in review, not planned).
- **L-no-coercion** — forbid unsafe zod casts (`z.unknown().transform(v => v as X)`).
- **L-runnable-docs** — `jsr:` specifiers + `tests/_fixtures/docs-examples_test.ts`
  doctests; JSDoc examples cite real exported symbols.
- **L-e2e** — `deno task e2e:cli` is the merge-readiness gate; make it an explicit
  final slice, run by the wave/evaluator, not the supervisor.
- **L-no-backcompat** — alpha = delete legacy / rename, never alias.

## 6. The live wave — Wave 2 (Integration adapters)

- Staged: group branch + nested run `feat-package-quality-wave2-adapters--adapters`,
  draft **PR #8**, seeded `research.md` (structural re-baseline of all 8 units) +
  `context-pack.md`. Dynamic gates marked `MEASURE-FIRST` for the generator.
- **A generator agent is currently running** the Research + Plan & Design phase. The
  supervisor does **not** intervene in its run and does **not** evaluate it.
- The gating open decision is **OQ-1 (slice budget)**: 8 units exceed the < 30 cap →
  recommended sub-wave split (2a logger·telemetry·aspire / 2b kv·database·
  prisma-adapter-mysql / 2c queue·cron).
- Per-unit headlines: `database` is from-scratch (no README/docs/tests/metadata);
  `prisma-adapter-mysql` README < 150 + `skipLibCheck`; `database`/`queue`/`cron`
  carry `interfaces/` (AP-17 → `ports/`); aspire has a redundant `./helpers` alias;
  `telemetry`/`aspire` are verify-only.

## 7. Supervisor's next actions

1. **Wait for the Wave 2 generator to finish Plan & Design**, then route the plan to
   an **independent PLAN-EVAL session** (you do not run it). Track the handoff in
   `worklog.md`.
2. On PLAN-EVAL `PASS`: let the wave implement → route to an **independent IMPL-EVAL
   session** → integrate on pass.
3. **Run the § 3 retro**, then stage Wave 3 (`@netscript/plugin`) with an improved
   generator prompt.

## 8. Operating invariants

- Nest the canonical per-package run; never rewrite it.
- Evaluator session ≠ generator session ≠ supervisor session.
- Disjoint write scope per wave; foundation-first ordering.
- Re-baseline before trusting counts; alpha = no back-compat shims.
- Keep `phase-registry.md` the live status source; promote leftover drift, don't
  bury it; S1 stops at publish-clean dry-run.
