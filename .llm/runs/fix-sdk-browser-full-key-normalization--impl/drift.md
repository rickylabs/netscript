# Drift Log: browser full-key discovery normalization (#1824)

Drift is append-only.

## 2026-08-31 — RTK binary unavailable

- **What:** The `rtk` skill documents a machine-level binary, but `rtk` is not on this host's PATH.
- **Source:** `rtk git remote -v` exited 127.
- **Expected:** Read-heavy Git commands use the RTK output filter.
- **Actual:** Focused raw Git/rg reads are required.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output in the Codex session; verdict gates still use structured wrappers.

## 2026-08-31 — Owner-provided Codex identity is partially opaque

- **What:** The active session exposes the Codex family but not an exact runtime model id, effort, or session id.
- **Source:** session environment.
- **Expected:** Canonical lane identity is recorded as provider/model/effort/session.
- **Actual:** Only the family and current `/root` role can be recorded; requested opposite-family reviewer/evaluator identities remain explicit.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and override.

## 2026-08-31 — Cross-package agreement test direction corrected before commit

- **What:** The initial plan placed the agreement assertion in Aspire tests with a relative SDK source import.
- **Source:** Independent Slice 1 review, native Claude Opus 5 session `f63a7890-19a6-4d6f-bde5-39319dcfa08b`.
- **Expected:** Test-only coupling would preserve package dependency isolation and all planned checks would pass after the product fix.
- **Actual:** Aspire's stricter `noUncheckedIndexedAccess` config type-checked SDK internals and exposed an unrelated SDK error. The test now lives in SDK and imports Aspire's public application subpath.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `slice-1-review-cycle-1.md`, updated `plan.md`, and `packages/sdk/tests/discovery/env-ordering_test.ts`.

## 2026-08-31 — Codex session id became observable during review

- **What:** Review cycle 2 observed the current implementation session id while exact model and effort remain opaque.
- **Source:** Native Claude session environment reported by reviewer `b888c0a7-3ef2-48f5-84e0-1ff40accf8d8`.
- **Expected:** Initial bootstrap could not observe a session id.
- **Actual:** `01a05611-ee74-7ff2-9234-8e00691a3523` is now recorded in `supervisor.md`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `slice-1-review-cycle-2.md` and `supervisor.md`.

## 2026-08-31 — Origin main advanced during Slice 1 review

- **What:** `origin/main` advanced from the reviewed baseline `dea449911` to `eaea940be` while Slice 1 review was running.
- **Source:** `git fetch origin main`; `git log HEAD..origin/main`.
- **Expected:** Bootstrap baseline remains the branch base for the reviewed slice.
- **Actual:** One upstream Fresh/chat commit landed; its 15 changed files do not overlap `packages/sdk`, `packages/aspire`, or this run directory.
- **Severity:** minor
- **Action:** accept
- **Evidence:** raw `git diff --stat HEAD..origin/main`; no overlap with Slice 1 paths.

## 2026-08-31 — Upstream tip advanced again without scope overlap

- **What:** By Slice 2 review, `origin/main` had advanced again to `0e93a6c05`.
- **Source:** Independent reviewer merge-base comparison.
- **Expected:** Mid-run upstream changes may land while the reviewed branch stays on its bootstrap baseline.
- **Actual:** No upstream commit since `dea449911` touches `packages/sdk` or `packages/aspire`; PR #1831 already targets the live `main` tip.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Slice 2 review gate `git diff --name-only $(git merge-base HEAD origin/main) origin/main` found no SDK/Aspire path.
