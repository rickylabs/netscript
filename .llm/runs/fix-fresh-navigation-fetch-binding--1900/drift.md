# Drift Log: bind the Fresh navigation platform fetch

Drift is append-only.

## 2026-09-01 — Frontend overlay reference paths are absent

- **What:** `SCOPE-frontend.md` points to `.claude/05-frontend.md` and `.resources/deps-docs/`, but
  neither path exists in this worktree.
- **Source:** direct filesystem lookup during harness bootstrap.
- **Expected:** both additional-read inputs exist.
- **Actual:** the named `deno-fresh` skill, package source/tests, and current Fresh 2.3.3 import pin
  are available; the two overlay paths are not.
- **Severity:** minor
- **Action:** accept for this already-diagnosed two-file fix; do not broaden scope to repair harness
  documentation.
- **Evidence:** `.llm/harness/archetypes/SCOPE-frontend.md`; failed path lookup on 2026-09-01.

## 2026-09-01 — Draft PR follows the orchestrator brief commit

- **What:** the orchestrator pushed the staged `implement.md` brief before a draft PR existed.
- **Source:** branch commit `884dda6ad` and GitHub PR search for the branch.
- **Expected:** harness bootstrap's first commit opens a draft PR in the same session.
- **Actual:** this implementation session will open the draft PR immediately after committing the
  mandatory run-plan artifacts and before changing product code.
- **Severity:** minor
- **Action:** accept and restore the live review surface before implementation.
- **Evidence:** branch history and empty `head:fix/fresh-navigation-fetch-binding` PR search.

## 2026-09-01 — Full Fresh doc-lint baseline has regressed outside navigation

- **What:** The structured full-package doc-lint reports 45 diagnostics, all in builders, query,
  route, and streams entrypoints; the navigation entrypoint reports zero.
- **Source:** `deno task doc:lint --root packages/fresh --pretty` at the #1900 slice head.
- **Expected:** Doctrine file 10 states the earlier Fresh doc-lint residue was resolved with zero
  diagnostics in June 2026.
- **Actual:** Current `origin/main` contains later unrelated public-surface residue (28
  `private-type-ref`, 17 `missing-jsdoc`). Neither changed product file appears in the report.
- **Severity:** significant
- **Action:** defer to the owners of those public surfaces; this P1 transport fix keeps
  `./navigation` clean and does not widen into unrelated API/doc remediation.
- **Evidence:** structured report: `./navigation` 0; builders 3; query 8; route 25; streams 11.
