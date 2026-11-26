# Drift Log: Unified Frontend Contribution RFC (`rfc-frontend-contribution-v2--rfc`)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-11-25 — Owner-directed lane/evaluator matrix override (`lane-policy.md`)

- **What:** Implementation builders and PR/RFC evaluators for the `#922` initiative override the default `lane-policy.md` Codex/Sol/Astra cells.
- **Source:** Owner directive relayed via parent run instructions; [`supervisor.md`](./supervisor.md).
- **Expected:** Default `lane-policy.md` matrix (`sol`/`astra` + `fable_5_1`/`muse_spark_1_3`/`grok_4_7`).
- **Actual:** Zero Claude spend during RFC authoring or Pass-1 integration; initial `plan_eval` plan queued an adversarial evaluation slot (`Fable 5.2`, later superseded by `2026-11-26` owner override to `openrouter/openai/gpt-6.2-astra#xhigh` Pass 1 and planned Gemini 4 `Hydrogen` Pass 2); `0.0.10` W1–W3 builders on Neon (`antigravity/gemini-4-neon`, `xhigh`, zero Codex) with two-pass PR review by `Opus 5.5` (`xhigh`) and `Hydrogen` (`xhigh`), preserving independent vendor families and separate sessions.
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
- **Evidence:** [`rfcs/0010-frontend-contribution.md`](../../../rfcs/0010-frontend-contribution.md#summary).

## 2026-11-25 — `createNetScriptVitePlugin` foreign-`importer` / `@preact/signals-core` resolution gap in `--no-lock` workspace

- **What:** During cold `--no-lock` Probe B builds in `/tmp`, upstream `jsr:@fresh/core@2.3.3` resolved `@preact/signals@^2.1.0` (`2.11.4`) alongside host `2.11.3` because `packages/fresh/src/application/vite/vite.ts:397` passed `importer` unchanged to `this.resolve('@preact/signals', importer)` and omitted `@preact/signals-core` from `dedupe`. Without pinning `@fresh/core`'s internal signals resolution inside `probe-b-fixture/apps/web/vite.config.ts` (`hostFreshSignalsPin`), `Build A`/`Build B` hashes drifted or threw `Error: Cycle detected` (`signals-core.module`).
- **Source:** [`probes/probe-b.log`](./probes/probe-b.log), [`packages/fresh/src/application/vite/vite.ts#L391-L404`](../../../packages/fresh/src/application/vite/vite.ts#L391-L404).
- **Expected:** Host `@preact/signals` pin (`2.11.3`) applies uniformly to `@fresh/core` internal imports, leaving `M6` isolated to third-party remote `http://` islands.
- **Actual:** Added `hostFreshSignalsPin` inside `probe-b-fixture/apps/web/vite.config.ts` (scoped solely to `@fresh/core` / `\0fresh:` importers, leaving `M6`'s `http://` mismatch unmasked: `vite build` `signals=1`, `vite --configLoader native build` `signals=2`) and documented the `vite.ts:397` fix for `0.0.10` W2.
- **Severity:** significant
- **Action:** rescope (absorbed into `0.0.10` W2 `@netscript/fresh/vite` hardening).
- **Evidence:** [`probes/probe-b.log`](./probes/probe-b.log), [`rfcs/0010-frontend-contribution.md`](../../../rfcs/0010-frontend-contribution.md).

## 2026-11-25 — Probe A passes `18/18` at runtime (`--no-lock -A`) while failing `deno --check` on contravariant `PageProps` test fixtures

- **What:** Initial `2026-11-25` run executed `18/18` at runtime (`--no-lock -A`) while failing `deno --check` on contravariant `PageProps` test fixtures (`TS2322`); see `2026-11-26` entry below for added `P2d` (`portable-jobs-loader.ts` + `fresh-jobs-adapter.tsx` passing `--check exit=0`) and `19/19` runtime status.
- **Source:** [`probes/probe-a-fresh-mount.ts`](./probes/probe-a-fresh-mount.ts) & [`probes/probe-a.log`](./probes/probe-a.log).
- **Expected:** Probe A verifies Fresh `2.3.3` runtime behavior (`SRC/probe-a.log` was produced without `--check`).
- **Actual:** Preserved legacy `P1`/`P4` runtime harness while surfacing `probe-a-fresh-mount.ts` `--check exit=1` visibly in [`probes/probe-a.log`](./probes/probe-a.log) and adding `--check`-clean separated loader/adapter fixtures (`P2d`).
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
- **Actual:** Captured into `0.0.10` W1–W2 implementation scope in [`rfcs/0010-frontend-contribution.md`](../../../rfcs/0010-frontend-contribution.md).
- **Severity:** significant
- **Action:** rescope (absorbed into `0.0.10` W1–W2 slices).
- **Evidence:** [`rfcs/0010-frontend-contribution.md`](../../../rfcs/0010-frontend-contribution.md), [`probes/probe-c.log`](./probes/probe-c.log).

## 2026-11-25 — Live `origin/main` advanced past initial worktree checkout `af5107b8d`

- **What:** Local `origin/main` stood at `f54542169` (3 unrelated merged PRs: `#2682`, `#2657`, `#2660`) ahead of the worktree's initial `af5107b8d`.
- **Source:** `git merge-base af5107b8d f54542169` and `gh api repos/rickylabs/netscript/git/ref/heads/main`.
- **Expected:** `origin/main == af5107b8d`.
- **Actual:** Cleanly rebased `docs/rfc-frontend-contribution-v2` onto `f54542169` with zero conflicts and re-verified Probes A/B/C and doc gates so `git diff --name-only origin/main` contains strictly `rfcs/0010-frontend-contribution.md` and `.llm/runs/rfc-frontend-contribution-v2--rfc/**`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `git diff --name-only origin/main` (`54` files, zero package/plugin/lock changes).

## 2026-11-26 — Owner-authorized `PLAN-EVAL` Pass 1 (`gpt-6.2-astra#xhigh`) & upcoming `Hydrogen` (`xhigh`) Pass 2

- **What:** Ran adversarial Pass-1 RFC evaluation (`plan-eval.md`) using `openrouter/openai/gpt-6.2-astra#xhigh` via OpenCode CLI `v2.3.2` (`CHANGES_REQUESTED`), superseding the earlier queued `Fable 5.2` slot, with Pass-2 re-check assigned to `gemini-4-hydrogen-xhigh`.
- **Source:** Owner directive; [`plan-eval.md`](./plan-eval.md); [`astra-review-triage.md`](./astra-review-triage.md).
- **Expected:** Earlier draft deferred `plan_eval` to `Fable 5.2`.
- **Actual:** Executed Pass 1 immediately on `gpt-6.2-astra#xhigh`, preserving independent model family and separate session from the Antigravity `self` RFC author and Neon `0.0.10` builders.
- **Severity:** minor
- **Action:** accept (updated `supervisor.md`, `worklog.md`, `research.md`, and `context-pack.md`).
- **Evidence:** [`plan-eval.md`](./plan-eval.md), [`astra-review-triage.md`](./astra-review-triage.md).

## 2026-11-26 — Astra Pass-1 `CHANGES_REQUESTED` remediation (`B1`–`B8`, `M1`–`M6`, `N1`–`N3`, `F-1`–`F-5`) & probe recount

- **What:** Initial RFC/worklog misstated Probe B as 15 matrix cells (actual `probe-b.log` contains **19 matrix rows: 11 PASS, 5 CAVEAT, 3 FAIL**) and Probe A `P4e` hardcoded `6.8.0` (actual resolved `preact-render-to-string@6.8.3` under `--no-lock` vs `6.8.0` in `deno.lock`). Astra also flagged wire divergence from `RFC 0005` (`B1`–`B2`), browser-visible SHA-256 digests (`B3`), unanchored root containment (`B6`), non-`workersContract` / non-HTTP-separated gateway proofs (`B4`–`B5`), coupled `P2c` route ABI (`B7`), overclaimed Wave-0/acyclic closures (`B8`), and merged `#2670` status (`M4`).
- **Source:** [`plan-eval.md`](./plan-eval.md) & `git show origin/main:packages/fresh-ui/src/runtime/secret-field/secret-field.utils.ts` (`906da5188`).
- **Expected:** Full alignment with accepted `RFC 0005`, merged `#2670`, verified Wave-0 proofs, and explicit non-closure of Wave-0 issues on RFC acceptance.
- **Actual:** Fixed Probe A (`19/19 PASS` runtime, `--check` status logged cleanly, `P2d` framework-free loader + GPUIX PoC ABI proof, `P4e` dynamic `6.8.3` detection), fixed Probe C (`13/13 PASS`, `--check` exit `0`), re-verified Probe B (`19` rows, exit `0`), inspected `#2670` via `git show` before creating clean single-commit `RFC 0010` branch off `origin/main` (`906da5188`), and rewrote `rfcs/0010-frontend-contribution.md` + `astra-review-triage.md` (with `F-1`–`F-5` ratified and Doctrine `AP-26` added).
- **Severity:** major
- **Action:** accept (all Pass-1 findings resolved cleanly within docs + `.llm/runs/rfc-frontend-contribution-v2--rfc/`).
- **Evidence:** [`astra-review-triage.md`](./astra-review-triage.md), [`probes/probe-a.log`](./probes/probe-a.log), [`probes/probe-b.log`](./probes/probe-b.log), [`probes/probe-c.log`](./probes/probe-c.log).
