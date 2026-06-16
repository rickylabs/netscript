# Final Plan — PR #44 IMPL-EVAL Remediation + Toolchain/Process Roadmap

> Supervisor decision lock, 2026-06-16. This is the **remediation + roadmap addendum** to
> `plan.md` (the T0–T5 / A1–A4 toolchain plan), authored after the MiniMax M3 IMPL-EVAL
> (`CHANGES_REQUESTED`, run `27586790008-1`). It does **not** re-derive the toolchain plan; it
> locks the post-eval fixes, the tooling/skill foundation, and the deferred process-automation
> vision so no context is lost.

## Roles & Decision Lock

| Item | Value |
| ---- | ----- |
| Supervisor | Claude (Opus 4.8), Windows worktree `.worktrees/deno-aspire-upgrade` |
| Implementers | Codex WSL sub-agents, native worktree `~/repos/netscript-chore-deno-2.8-aspire-13.4-upgrade`, mobile-visible via `codex-wsl-remote` |
| Evaluator | separate session (IMPL-EVAL), never the generator |
| **Umbrella split (LOCKED)** | **PR #44 = Phase A (eval fixes) + Phase B (deps toolbelt + skills + AGENTS + watch tool).** Phase C/D/E (CI tiers, labels+Projects, PR-authoring automation) = a **separate "repo process automation" umbrella**, documented in full below, implemented after #44. |
| Toolchain | Deno **2.8.3** (Windows + WSL both verified), catalogs/`deno ci`/`deno why` are 2.8 features |

## Evaluator Corrections (supervisor ground-truth, Deno 2.8.3, 2026-06-16)

The eval was strong but its "latest" detection was fooled by prerelease tags. Verified directly
against registry stable channels:

1. **fedify suite — eval WRONG.** `jsr.io/@fedify/fedify/meta.json.latest` = **`2.2.5` (stable)**;
   `deno outdated --latest` surfaced `2.3.0-dev.1299` and the eval then defended the old `1.10.11`
   pin. Correct action: **bump `@fedify/{fedify,amqp,denokv,redis,express}` 1.10.11 → 2.2.5**
   (major — needs a scaffold.runtime smoke).
2. **logtape — bump.** `@logtape/logtape` `2.1.4 → 2.1.5` (stable latest; eval saw `2.2.0-dev.*`).
3. **preact — align to Fresh, not npm-absolute-latest.** Pin preact / preact-render-to-string to
   the range **Fresh 2.3.3 expects**, not the newest npm release. Verify against `@fresh/core`.
4. **Root cause (drives Phase B):** `deno outdated --latest` ignores semver **and includes
   prereleases**. The source of truth for "latest stable" is the registry stable channel —
   jsr `meta.json.latest` / npm `dist-tags.latest`. Our manual `curl`-per-dep process is what the
   `deps:latest` tool replaces.
5. **JSR-in-catalog — confirmed not a bug.** Empirically on 2.8.3: a `jsr:pkg@catalog:` specifier is
   rejected (`Invalid package specifier ... Unexpected character`), and a `jsr:`-valued catalog
   entry warns `Invalid version requirement`. `catalog:` is **npm-only** (bare, or `npm:pkg@catalog:`).
   Matches the existing locked decision; keep JSR deps as inline `jsr:` specifiers.

## Phase 0 — Supervisor Ground-work (me, sequential on PR #44 branch, FIRST)

Done by the supervisor before any sub-agent launches, because the sub-agents consume these tools.

| Slice | Deliverable |
| ----- | ----------- |
| **B0** | `final-plan.md` (this file) + `phase-registry.md` in the run dir. |
| **B1** | `.llm/tools/deps/` toolbelt: `outdated.ts` (wrap `deno outdated --recursive`, parse table → JSON; native has **no** `--json`), **`latest.ts`** (inventory × registry stable channel, **prerelease-filtered** — the fedify fix), `why.ts` (wrap `deno why <pkg>` → used/where, drives dead-import sweep), `audit.ts` (wrap `deno audit --level`), `prod-install.ts` (wrap `deno ci --prod --frozen`). Root `deno.json` tasks: `deps:outdated`, `deps:latest`, `deps:why`. |
| **B2** | New skill **`netscript-deno-toolchain`** — surfaces the full `deno` dependency/release toolbelt (`outdated`, `update`, `why`, `info`, `add`, `remove`, `audit`, `ci`/`ci --prod`, `bump-version`, `publish`, `pack`, `doc --lint`) so agents stop reinventing. Seeds from `TOOLCHAIN-2.8.md` + the dependency commands the leverage map omits. |
| **B3** | New skill **`netscript-pr`** (built via `skill-creator`) — branch naming, PR body template, label application, `paths`-filter awareness, draft↔ready, umbrella/sub-PR linking. Phase-E content lands here. |
| **B4** | `AGENTS.md` updates: deps toolbelt as the **default** path; `deno doc`/`deno why` "are your friends"; pointers to the two new skills; `watch-run.ts` for supervisor loops. |
| **B5** | `.llm/tools/watch-run.ts` — `Deno.watchFs` on a run dir's `commits.md`/`worklog.md`; exits on change so a background invocation re-wakes the supervisor (no `ScheduleWakeup` dependency). |
| **B6** | Add a **prod-install lane**: `deno ci --prod` (+ `--skip-types` consideration) as a *separate* verification that the published surface installs without devDependencies. Note: the quality lane (`check`/`lint`) still needs dev deps, so `--prod` is additive, not a replacement for the existing `ci` task's `deno ci`. |

## Phase 1 — PR #44 Remediation (Codex WSL sub-agent, sequential on branch)

The eval's six fixes, corrected. All touch `deno.json`/catalog → **sequential, not parallel**
(conflict-prone). Slice-by-slice commits; supervisor watches via `watch-run.ts`; IMPL-EVAL (separate
session) closes.

| Slice | Eval ref | Work |
| ----- | -------- | ---- |
| **R1** | C1/C3 | Bump the four subpath pins in `packages/fresh/deno.json` + `packages/fresh-ui/deno.json` to match catalog (`preact ^10.29.2`, `preact-render-to-string ^6.7.0`); normalize `@david/dax` inline → `^0.48`. |
| **R2** | C5 | Prune dead imports in `plugins/workers/deno.json` + `plugins/sagas/deno.json` (`hono`/`@hono/hono`/`zod`/`@tanstack/db`/`@durable-streams/client`); re-sweep all members via `deps:why`. |
| **R3** | C2 | Catalog → **stable** latest using `deps:latest` (NOT `deno outdated --latest`). Apply the corrections above (fedify→2.2.5, logtape→2.1.5, preact↔Fresh). For any dep deliberately held back (e.g. `amqplib` 0.10→2.x major), add a `DEBT_ACCEPTED` row to `drift.md`/`arch-debt.md` naming the verified regression. |
| **R4** | C6 | Scaffold parity: rewrite `generate-app-deno-json.ts` to source pins from the root catalog instead of literals; bump `SCAFFOLD_VERSIONS.{ASPIRE_SDK→13.4.4, ASPIRE_HOSTING_DENO→13.4.x}` + integrations; **create `.llm/tools/check-scaffold-versions.ts` (E-12 / LD-7 no-preview guard)**; run a **quick `netscript init`** smoke (not the full e2e suite) to confirm Layer A copies the catalog. |
| **R5** | C6 | Merge-readiness: `deno task ci` + `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` from the **native WSL worktree** (per `codex-wsl-remote`; not `/mnt/c`). Wrap the e2e in a CI tool later (Phase C), but for this PR run it via the existing task and paste raw exit code. |

Note: R3/R4 overlap the existing plan's T-remainder and Phase A1; the catalog and `deno ci` are
already in place per the eval (HEAD `75abf9f`+), so these slices are remediation, not first-build.

## Phase 2 — Repo Process Automation (DEFERRED umbrella — documented, not lost)

Implemented after #44 as its own umbrella with its own research→PLAN-EVAL→impl→IMPL-EVAL.

### C — CI tiers (token-replacing automation)
- **Tier 1 (per-commit, drafts included, non-blocking):** `deno ci --prod --frozen` + `check`/`lint`/`fmt:check` + `deps:latest` (report-only). Reuses Phase B wrappers; the workflow reads exit codes. No agent tokens.
- **Tier 2 (on "ready for review" + after, blocking):** a CI wrapper around `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` that parses output → exit code + failing-suite messages. Branch-protection gated.
- **Skip logic:** GitHub Actions `paths`/`paths-ignore` = automatic skip for config/docs-only PRs (zero tokens); `ci:skip-e2e` / `ci:full` labels = manual override.
- **OpenHands cleanup:** Copilot Setup Steps runs by default and is effectively replaced by OpenHands; pull the latest OpenHands action from `main` into the program and retire/scope the Copilot step.

### D — Labels + Projects v2 (anti-graveyard)
- Namespaced labels: `type:` (`umbrella`,`sub-pr`,`chore`,`feat`), `status:` (`research`,`plan`,`plan-eval`,`impl`,`impl-eval`,`augment-review`,`ci-fail`,`ready-merge`), `area:` (`cli`,`fresh`,`plugins`,`deps`), `ci:` (`skip-e2e`,`full`).
- **Projects v2** = visible board; labels **feed** it and trigger workflows; **harness run artifacts (`.llm/tmp/run/`) remain source of truth.**
- A small Action enforces single `status:*`, syncs label→Project column, and auto-fires the right workflow per status — so agents barely touch it and it does not rot into a graveyard. Agents comply via the `netscript-pr` skill + an AGENTS.md section.

### E — PR-authoring skill
Seeded in Phase B3 (`netscript-pr`); the Phase 2 work wires it to the label taxonomy + `paths`-filters once C/D land.

## Watch Mechanism (supervisor, token-free)

`ScheduleWakeup` is unreliable in this environment. Instead: run `.llm/tools/watch-run.ts <run-dir>`
as a **background Bash process**; it `Deno.watchFs`-es `commits.md`/`worklog.md` and exits on the
next change, which re-invokes the supervisor. The supervisor inspects the new commit, validates the
slice, and either continues or escalates. Fallback only: a long (≥1200s) `ScheduleWakeup` heartbeat
in case a sub-agent hangs without writing.

## Sub-agent Briefing Protocol

Every Codex WSL launch:
1. Opens with `use harness`; names skills to activate: `netscript-harness` + `netscript-deno-toolchain` + the domain skill (`netscript-cli`, `jsr-audit`, `deno-fresh` as relevant).
2. Runs from the **native WSL worktree** (never `/mnt/c`); confirms daemon + session attached for phone follow-up.
3. Pulls `origin/chore/deno-2.8-aspire-13.4-upgrade` before working; **sequential** on the branch (sub-branch + sub-PR only when genuinely parallelizable, wave-4/5 style).
4. **Commit per slice**, append `commits.md` immediately; never delete locks or `deno cache --reload` without approval.
5. Uses `deps:latest` (not `deno outdated --latest`) for any "is this the latest" decision.

## Validation (per slice, smallest-that-proves)

`deps:why` (dead imports) · `deno task check`/`lint`/`fmt:check` (scoped wrappers) ·
`deno task publish:dry-run` · `check-scaffold-versions.ts` (no preview pins) ·
`deno task ci` + `e2e:cli scaffold.runtime` (native WSL, merge-readiness only).

## Open Items

- preact↔Fresh exact range — resolve in R1/R3 against `@fresh/core` 2.3.3.
- `amqplib` 0.10→2.x — default to DEBT-defer unless R3 verifies a clean major.
- `deno ci --prod` interaction with workspace dev tooling — confirm in B6 it does not break the quality lane.
