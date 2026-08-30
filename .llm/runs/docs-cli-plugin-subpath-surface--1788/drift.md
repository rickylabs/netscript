# Drift Log: CLI and plugin subpath reference surfaces

Drift is append-only.

## 2026-08-30 — plugin coverage is partial rather than uniformly absent

- **What:** The plugin page already accounts for 95 of 221 unique subpath symbols, but coverage
  varies by entrypoint; 126 unique symbols remain absent.
- **Source:** Per-entrypoint `deno doc --json` comparison with
  `docs/site/reference/plugin/index.md`.
- **Expected:** The brief warned that “summarized below” might partially hold.
- **Actual:** Five subpaths are substantively covered, two are partial, and five are absent.
- **Severity:** minor.
- **Action:** fix only the missing symbols and add explicit re-export accounting.
- **Evidence:** `research.md` findings 3–5.

## 2026-08-30 — one PR retained after measured sizing

- **What:** CLI and plugin remain in one PR rather than being split into child issues/PRs.
- **Source:** CLI exposes 46 unique subpath symbols with one missing; plugin exposes 221 with 126
  missing from the page.
- **Expected:** Split if the combined review surface would be unreviewable.
- **Actual:** The change is a cohesive two-page, table-shaped docs repair with one shared generated
  chain and gate set. A split would duplicate provenance regeneration, gates, and issue machinery
  without isolating different runtime risk.
- **Severity:** minor.
- **Action:** accept; state the decision in the PR body.
- **Evidence:** `research.md`, `plan.md` D1.

## 2026-08-30 — RTK unavailable on implementation host

- **What:** The repository-preferred RTK output proxy is not installed on this host.
- **Source:** `rtk proxy deno task --cwd docs/site check:source-format` exited 127 with
  `rtk: command not found`.
- **Expected:** `.agents/skills/rtk` states that RTK is available on `PATH`.
- **Actual:** Commands must run directly; no gate result relies on the failed proxy attempt.
- **Severity:** minor.
- **Action:** accept for this run and record real exit codes from direct commands.
- **Evidence:** `worklog.md` progress/gate results.
