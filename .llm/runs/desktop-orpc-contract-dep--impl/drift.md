# Drift Log: desktop fixture oRPC contract dependency

## 2026-09-02 — prepared fixture rewrites the import map

- **What:** The suite's staging adapter replaces, rather than merely copies, the checked-in fixture imports.
- **Source:** `packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts`.
- **Expected:** The brief described the checked-in fixture import map as the resolution root.
- **Actual:** The checked-in map is reviewable source, while a rewritten temporary map is the runtime authority.
- **Severity:** minor.
- **Action:** fix both declarations and guard the prepared workspace without refactoring packaging.
- **Evidence:** `prepareDesktopFixture()` assigns `config.imports` before native contract/package gates.

## 2026-09-02 — RTK unavailable

- **What:** The documented output-filter binary is not installed on this host.
- **Source:** `rtk rg ...` returned `command not found`.
- **Expected:** `.agents/skills/rtk/SKILL.md` says the binary is on PATH.
- **Actual:** Focused raw `rg`, Git, and GitHub CLI reads are required.
- **Severity:** minor.
- **Action:** accept for this run; preserve focused output and use structured wrappers for verdicts.
- **Evidence:** shell exit 127 on the first RTK invocation.
