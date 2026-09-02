# Drift Log: Slice E — unregistered resource command

## 2026-09-02 — serialized root dependency overlap removed

- **What:** The evaluated Slice E touch set included `public-command-dependencies.ts`; the owner
  removed it and capped the product slice at five files because #1664 still edits that root.
- **Source:** Owner directive; PR #1664 head `9e09364407c90138773acda845ffbf54ed007fa6`.
- **Expected:** Six planned files and a concrete root dependency bundle.
- **Actual:** Five product files, unregistered command, injected client/staging dependencies inside
  the feature boundary, zero live #1664 intersections.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md`; live PR diff inspection.

## 2026-09-02 — frontend overlay reference absent

- **What:** `SCOPE-frontend.md` directs readers to `.claude/05-frontend.md`.
- **Source:** `.llm/harness/archetypes/SCOPE-frontend.md`.
- **Expected:** Referenced frontend guidance exists.
- **Actual:** The file is absent in this worktree.
- **Severity:** minor
- **Action:** defer; the locked plan and existing Fresh resource templates govern this non-visual command slice.
- **Evidence:** `sed` returned file-not-found; no browser/UI implementation is owned here.

## 2026-09-02 — CLI lint/fmt root exclusion

- **What:** Root `deno.json` excludes `packages/cli/` from both lint and format.
- **Expected:** Structured wrappers process the five Slice E files.
- **Actual:** An unqualified wrapper run drops CLI paths. A temporary config copied the repository
  rules without that exclusion; both wrappers then processed 5/5 files with zero findings.
- **Severity:** minor
- **Action:** accept for scoped evidence; no repository tooling/config edit is authorized here.
- **Evidence:** `implement.md` and `worklog.md` validation tables.

## 2026-09-02 — integration-base rebase convergence

- **What:** Rebasing the B+D integration base onto main replayed their historical commits and
  conflicted in the generated export corpus and Slice D run artifacts.
- **Expected:** B (#1943) and D (#1948) disappear from the branch after merging to main.
- **Actual:** Main's side was retained for all overlapping B/D files; a remaining Slice D-only
  harness delta was dropped. Mandated corpus regeneration/check passed and left no generated diff.
- **Severity:** minor
- **Action:** accept.
- **Evidence:** final pre-Slice-E base `9a191bdda`; corpus check census 35/273/7,841.

## 2026-09-02 — formal evaluator route fallback

- **What:** The lane-policy native Fable 5 binding was unavailable to the evaluator launcher.
- **Expected:** Fresh native opposite-family Fable 5 IMPL-EVAL at medium effort.
- **Actual:** The launch failed before evaluation with `unrecognized_model` / `model_not_found`;
  a fresh native Claude Opus 5 session at medium effort performed the full evaluation and returned
  `PASS`.
- **Severity:** minor
- **Action:** accept; provider family separation and fresh-session requirements remained intact.
- **Evidence:** `supervisor.md`; evaluator session
  `c3f1d770-e62d-4e2d-b395-e1a28b979167`; `evaluate.md`.

## 2026-09-02 — main advanced during evaluation

- **What:** `origin/main` advanced twice while the working tree was under evaluation, ending at
  `9a191bdda` with a CLI changelog-only commit after the evaluator's snapshot.
- **Expected:** Open the PR from current `main` after B and D merged.
- **Actual:** The branch was rebased after each advance. The final rebase was conflict-free, and
  the complete delivery gate set was refreshed before commit.
- **Severity:** minor
- **Action:** accept.
- **Evidence:** `worklog.md`; final `HEAD == origin/main` pre-commit.
