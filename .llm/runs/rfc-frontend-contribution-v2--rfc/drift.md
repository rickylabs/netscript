# Drift Log: Unified Frontend Contribution RFC (`rfc-frontend-contribution-v2--rfc`)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-11-25 — Owner-directed lane/evaluator matrix override (`lane-policy.md`)

- **What:** Implementation builders and PR/RFC evaluators for the `#922` initiative override the default `lane-policy.md` Codex/Sol/Astra cells.
- **Source:** Owner directive relayed via parent run instructions; [`supervisor.md`](./supervisor.md).
- **Expected:** Default `lane-policy.md` matrix (`sol`/`astra` + `fable_5_1`/`muse_spark_1_3`/`grok_4_7`).
- **Actual:** Zero Claude spend during this authoring turn; scheduled Friday 23:30 UTC adversarial RFC evaluation by `Fable 5.2`; `0.0.10` W1–W3 builders on Neon (`antigravity/gemini-4-neon`, `xhigh`, zero Codex) with two-pass PR review by `Opus 5.5` (`xhigh`) and `Hydrogen` (`xhigh`), preserving independent vendor families and separate sessions.
- **Severity:** minor
- **Action:** accept (documented in `supervisor.md` and `worklog.md`).
- **Evidence:** [`supervisor.md`](./supervisor.md), [`worklog.md`](./worklog.md).

## 2026-11-25 — PR `#890` seed was merged as run artifacts rather than closed/unmerged

- **What:** Live GitHub inspection showed PR `#890` has state `MERGED` (`2026-08-03T13:24:44Z`) while no RFC file was placed in `rfcs/`.
- **Source:** `gh api graphql` on `rickylabs/netscript` PR `#890` + `.llm/runs/plan-frontend-contrib--seed/rfc.md`.
- **Expected:** Seed RFC sometimes referenced informally as "unmerged RFC #890".
- **Actual:** PR `#890` merged `.llm/runs/plan-frontend-contrib--seed/` into the repo as seed plan artifacts, leaving `rfcs/` without an accepted frontend RFC. The unified RFC accurately notes PR `#890`'s merged seed state while superseding it cleanly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md#summary).

## 2026-11-25 — `createNetScriptVitePlugin` foreign-`importer` / `@preact/signals-core` resolution gap in `--no-lock` workspace

- **What:** During cold `--no-lock` Probe B builds in `/tmp`, upstream `jsr:@fresh/core@2.3.3` resolved `@preact/signals@^2.1.0` (`2.11.4`) alongside host `2.11.3` because `packages/fresh/src/application/vite/vite.ts:397` passed `importer` unchanged to `this.resolve('@preact/signals', importer)` and omitted `@preact/signals-core` from `dedupe`. Without pinning `@fresh/core`'s internal signals resolution inside `probe-b-fixture/apps/web/vite.config.ts` (`hostFreshSignalsPin`), `Build A`/`Build B` hashes drifted or threw `Error: Cycle detected` (`signals-core.module`).
- **Source:** [`probes/probe-b.log`](./probes/probe-b.log), [`packages/fresh/src/application/vite/vite.ts#L391-L404`](../../../packages/fresh/src/application/vite/vite.ts#L391-L404).
- **Expected:** Host `@preact/signals` pin (`2.11.3`) applies uniformly to `@fresh/core` internal imports, leaving `M6` isolated to third-party remote `http://` islands.
- **Actual:** Added `hostFreshSignalsPin` inside `probe-b-fixture/apps/web/vite.config.ts` (scoped solely to `@fresh/core` / `\0fresh:` importers, leaving `M6`'s `http://` mismatch unmasked: `vite build` `signals=1`, `vite --configLoader native build` `signals=2`) and documented the `vite.ts:397` fix for `0.0.10` W2.
- **Severity:** significant
- **Action:** rescope (absorbed into `0.0.10` W2 `@netscript/fresh/vite` hardening).
- **Evidence:** [`probes/probe-b.log`](./probes/probe-b.log), [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md).

## 2026-11-25 — Probe A passes `18/18` at runtime (`--no-lock -A`) while failing `deno --check` on contravariant `PageProps` test fixtures

- **What:** Running `probe-a-fresh-mount.ts` with `deno run --no-lock --check -A` surfaces `TS2322` on inline route fixture `{ component: ({ data }: PageProps<T>) => ... }` due to Fresh `2.3.3` `RouteComponent` contravariance over `PageProps<unknown, State>`; running without `--check` (`deno run --no-lock -A`) executes cleanly with `18/18 PASS` (`exit 0`).
- **Source:** [`probes/probe-a-fresh-mount.ts`](./probes/probe-a-fresh-mount.ts) & [`probes/probe-a.log`](./probes/probe-a.log).
- **Expected:** Probe A verifies Fresh `2.3.3` runtime behavior (`SRC/probe-a.log` was produced without `--check`).
- **Actual:** Preserved probe fixture intact and recorded the exact runtime invocation (`deno run --no-lock -A`) honestly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** [`probes/probe-a.log`](./probes/probe-a.log).

## 2026-11-25 — Pre-existing repo gaps requiring `0.0.10` W1–W2 remediation

- **What:** Verified baseline gaps in `origin/main` (`af5107b8d`):
  1. `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts:64-91` strips `access.authorization` & `access.audience` (`Probe C 2.1`).
  2. `packages/fresh/src/runtime/server/sse.ts` exists on disk yet is omitted from `packages/fresh/src/runtime/server/mod.ts`.
  3. `packages/fresh/src/runtime/server/define-fresh-app.ts:114-115` invokes `configure()` before `registerFsRoutes()`.
  4. `packages/cli/src/kernel/assets/app/routes/_layout.tsx.template:39-51` places `<Partial name='page'>` outside `<SidebarShell>`, while `dashboard-view.tsx.template` and `vite.config.ts.template` hardcode `streams`/`workers` UI wiring.
- **Source:** Direct file reads + Probe A/C verification.
- **Expected:** Clean host boundary ready for generic frontend contributions.
- **Actual:** Captured into `0.0.10` W1–W2 implementation scope in [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md).
- **Severity:** significant
- **Action:** rescope (absorbed into `0.0.10` W1–W2 slices).
- **Evidence:** [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md), [`probes/probe-c.log`](./probes/probe-c.log).

## 2026-11-25 — Live `origin/main` advanced past initial worktree checkout `af5107b8d`

- **What:** Local `origin/main` stood at `f54542169` (3 unrelated merged PRs: `#2682`, `#2657`, `#2660`) ahead of the worktree's initial `af5107b8d`.
- **Source:** `git merge-base af5107b8d f54542169` and `gh api repos/rickylabs/netscript/git/ref/heads/main`.
- **Expected:** `origin/main == af5107b8d`.
- **Actual:** Cleanly rebased `docs/rfc-frontend-contribution-v2` onto `f54542169` with zero conflicts and re-verified Probes A/B/C and doc gates so `git diff --name-only origin/main` contains strictly `rfcs/0000-frontend-contribution.md` and `.llm/runs/rfc-frontend-contribution-v2--rfc/**`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `git diff --name-only origin/main` (`54` files, zero package/plugin/lock changes).
