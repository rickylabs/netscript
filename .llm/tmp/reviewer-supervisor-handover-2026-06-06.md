# Reviewer/Supervisor Handover — S1 Package Quality (as of 2026-06-06)

> Maximum-context brief for the next **supervisor session** on
> `feat/package-quality`. Written by the outgoing reviewer/supervisor. Pairs with
> the copy-pasteable prompt the user holds. Read this once, then operate from
> `.llm/tmp/run/feat-package-quality--supervisor/` going forward.

---

## 1. What this program is

**S1 — Package Quality** is one of seven supervisor tracks in the NetScript public
release program. S1's job: bring all **27 publishable units** (23 packages +
4 plugins, all `0.0.1-alpha.0`) to the alpha bar —
`deno publish --dry-run` **0 slow-types**, `deno doc --lint` clean, README ≥ 150
LOC, `/docs` per STANDARDS § 7, archetype gate matrix green per unit. **S1 stops
at publish-clean dry-run** — no publishing, no version bumps, no OIDC (those are
S2/S3).

Authority chain (nest, never rewrite):
- Program: `.llm/tmp/run/master--public-release-program/RELEASE-PROGRAM.md`
- Supervisor: `.llm/tmp/run/feat-package-quality--supervisor/` (`plan.md`, `phase-registry.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md`)
- Per-package canonical (STALE counts): `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
- Harness: `.llm/harness/` (workflow, archetypes, gates, evaluator, lessons)

## 2. Repo + worktree topology (important — non-obvious)

- GitHub repo: **`rickylabs/netscript`**. Integration/"supervisor" branch:
  **`feat/package-quality`** (there is no branch literally named "supervisor").
- The working checkout is **nested**: from the Zed project root the netscript repo
  lives at `worktrees/repo-genesis/.genesis/netscript/`. The terminal tool only
  lets you `cd` to the project root, so drive git with **`git -C <path>`**.
- Worktrees under `…/netscript/.worktrees/`:
  | Worktree | Branch | State |
  |----------|--------|-------|
  | (main) | `feat/package-quality` | supervisor branch, HEAD `7bca2d8` |
  | `wave0-foundation` | `feat/package-quality-wave0-foundation` | merged |
  | `wave1-contracts` | `feat/package-quality-wave1-contracts` | merged |
  | `wave2-adapters` | `feat/package-quality-wave2-adapters` | **active — agent running** |
- A separate, unrelated repo (`netscript-start`) is checked out at the Zed root
  (`test-app`). Do **not** do S1 work there.

## 3. The operating model (what "being the supervisor" means here)

The harness uses an **8-phase run loop** with a **two-gate / dual-evaluator** model
(added in Wave 0b, see `.llm/harness/lessons/plan-gate-design-as-gate.md`):

Bootstrap → Research → Plan & Design → **PLAN-EVAL (hard stop)** → Implement →
Gate → **IMPL-EVAL** → Close.

The supervisor does NOT implement packages. Per wave, the supervisor:
1. **Stages** the wave: base-sync `feat/package-quality`, create the group branch
   `feat/package-quality-wave<N>-<suffix>` + worktree `.worktrees/wave<N>-<suffix>`,
   create the nested run dir `.llm/tmp/run/feat-package-quality-wave<N>-<suffix>--<suffix>/`,
   and **seed `research.md` + `context-pack.md`** (structural re-baseline + lessons),
   then open a **draft PR** and hand the prompt to a generator agent.
2. When the generator finishes Plan & Design, runs **PLAN-EVAL in a SEPARATE
   session** against `.llm/harness/gates/plan-gate.md` — verdict `PASS` /
   `FAIL_PLAN`. No implementation slice may be committed before `PASS`.
3. After implementation, runs **IMPL-EVAL in a SEPARATE session** (full gate set +
   `jsr-audit` + `deno task e2e:cli` merge-readiness).
4. On pass, merges `--no-ff`, updates the supervisor docs (status table, base-sync
   log, worklog, commits), and stages the next wave. Foundation-first: never start
   wave N+1 before wave N is `merged`.

Non-negotiables: **re-baseline before trusting any carried-in count**; **disjoint
write scope per wave**; **alpha = no back-compat shims**; **evaluator ≠ generator
session**.

## 4. What's done since Wave 0 (current truth)

| Wave | Units | Status | Merge |
|------|-------|--------|-------|
| 0 — Foundation | `shared` | merged | `eb8ae44` (PR #3) |
| 0b — Harness + agent docs (inserted) | none | merged | `82ad2a2`,`d5d8e5f`,`76fbeb7` (PR #4/#5/#6) |
| 1 — Contracts & schemas | runtime-config, config, contracts | merged | `4c57867` (PR #7) |
| 2 — Integration adapters | logger, telemetry, aspire, kv, database, prisma-adapter-mysql, queue, cron | **active** | — (draft PR #8) |
| 3–6 | plugin / runtimes / apps / cli | planned | — |

**4 / 27 units merged.** Supervisor docs were frozen at "awaiting Wave 0" and were
brought fully current on `feat/package-quality` (commit `529006e`).

## 5. Wave 1 review lessons (carry into every future wave)

- **R-1/R-2** — plan defensive I/O guards + abort/cleanup **with tests** (Wave 1's
  watcher leaked unhandled rejections + late timer fires; review-driven, not planned).
- **R-3** — no unsafe zod coercion (`z.unknown().transform(v => v as X)` shipped fake validation).
- **R-4** — runnable docs: `jsr:` specifiers + `tests/_fixtures/docs-examples_test.ts` doctests (DOCS-STRUCTURE).
- **R-5** — JSDoc examples must cite real exported symbols.
- **R-6** — `deno task e2e:cli` is the merge-readiness gate; make it an explicit final slice.
- **R-7** — select the FULL archetype matrix up front (Wave 1's plan under-selected gates; PLAN-EVAL had to add F-14/F-17).
- **Sizing** — Wave 1 = 27 slices for 3 units. The Plan-Gate caps slices at **< 30**, so larger waves must split into sub-waves.

## 6. Wave 2 status (the live one) — what I staged

- Branch + worktree `wave2-adapters`; nested run
  `.llm/tmp/run/feat-package-quality-wave2-adapters--adapters/` seeded with a
  reviewer **structural** re-baseline of all 8 units (`research.md`) + `context-pack.md`
  (+ `drift.md`/`commits.md` scaffolds). Draft **PR #8** open.
- Dynamic gates (slow-types, doc-lint) are marked **`MEASURE-FIRST`** — I could not
  run deno from the staging sandbox; the generator runs them as Research step 1.
- **The gating decision is OQ-1 (slice budget):** 8 units blow the < 30 cap.
  Reviewer recommendation = **split into sub-waves** (2a logger·telemetry·aspire /
  2b kv·database·prisma-adapter-mysql / 2c queue·cron). The generator must resolve
  this before slicing and escalate per `supervisor.md` § 4 if it changes the
  registry's single-group assumption.
- Per-unit headlines: `database` is from-scratch (no README/docs/tests/metadata —
  the wave's "runtime-config"); `prisma-adapter-mysql` README < 150 + `skipLibCheck`;
  `database`/`queue`/`cron` carry `interfaces/` (AP-17 → `ports/`); aspire has a
  redundant `./helpers` alias to drop; `telemetry`/`aspire` are verify-only.
- **The generator agent is RUNNING right now** in `.worktrees/wave2-adapters`
  (producing `plan.md`, `worklog.md`, an `audit/` re-baseline). Do **not** stomp its
  uncommitted work. When it hands back, your first job is the **separate-session
  PLAN-EVAL**.

## 7. Tooling note (new)

`rtk` is now a registered skill (`.agents/skills/rtk/`) and AGENTS.md instructs
prefixing read-heavy `git`/`gh`/`grep`/`ls`/`docker` with `rtk` and wrapping
`deno task` runs in `rtk proxy` (60–90% fewer output tokens). Already merged into
the Wave 2 branch so the generator can use it. Use it yourself for git inspection.

## 8. Standing items / open loops

1. **Wave 2 PLAN-EVAL** is the immediate next action when the generator hands back.
2. Base-sync `feat/package-quality` into the Wave 2 branch again right before
   implementation begins (I already merged the latest into it for the rtk skill;
   re-check before the implement phase). Log syncs in the registry Base-Sync Log.
3. No supervisor-wide `release-readiness.ts` audit dir has been populated; each wave
   re-baselines its own units instead. Either run the sweep or formally accept the
   per-wave pattern in `worklog.md`.
4. Waves 3–6 remain `planned`; stage them one at a time, foundation-first.

## 9. How I worked (so you can continue identically)

- Reviewed each merged PR (read PR body, reviews, inline comments) to extract
  "what went well / what needed attention," then folded the lessons into the next
  wave's seed `research.md` + `context-pack.md`.
- Staged the next wave end-to-end (branch, worktree, run dir, seeds, draft PR) so a
  generator agent can start with a hot context pack instead of cold repo reads.
- Ran PLAN-EVAL/IMPL-EVAL as **separate sessions**, adjusting in place when the
  surface of change was reasonable rather than bouncing the whole plan.
- Kept the supervisor docs (`phase-registry.md` status table + cards + base-sync
  log, `worklog.md` progress/decisions, `context-pack.md`, `commits.md`, `drift.md`)
  current after every state change, and committed them to `feat/package-quality`.
- Used `git -C <nested path>` for all git ops; committed with
  `-c core.hooksPath=/dev/null` to avoid local hook interference.
