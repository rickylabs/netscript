# Drift Log: desktop fixture oRPC contract dependency

## 2026-09-02 — prepared fixture rewrites the import map

- **What:** The suite's staging adapter replaces, rather than merely copies, the checked-in fixture
  imports.
- **Source:** `packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts`.
- **Expected:** The brief described the checked-in fixture import map as the resolution root.
- **Actual:** The checked-in map is reviewable source, while a rewritten temporary map is the
  runtime authority.
- **Severity:** minor.
- **Action:** fix both declarations and guard the prepared workspace without refactoring packaging.
- **Evidence:** `prepareDesktopFixture()` assigns `config.imports` before native contract/package
  gates.

## 2026-09-02 — RTK unavailable

- **What:** The documented output-filter binary is not installed on this host.
- **Source:** `rtk rg ...` returned `command not found`.
- **Expected:** `.agents/skills/rtk/SKILL.md` says the binary is on PATH.
- **Actual:** Focused raw `rg`, Git, and GitHub CLI reads are required.
- **Severity:** minor.
- **Action:** accept for this run; preserve focused output and use structured wrappers for verdicts.
- **Evidence:** shell exit 127 on the first RTK invocation.

## D1 correction — prepared map → committed map

Plan D1 said the guard would check the **prepared** (staged) fixture map. That is unimplementable:
`fixture-workspace.ts:31` overwrites `config.imports` with a map synthesized from the workspace root
`deno.json`, so the staged fixture is never isolated the way the packaged dpkg is, and the staged
map always contains the dependency regardless of what the fixture ships.

Measured, not reasoned: a guard reading the staged map exited 0 both with and without
`@orpc/contract` in the fixture's committed `deno.json`.

The guard therefore reads the fixture's **committed** `deno.json` — the map the dpkg actually ships
with. Same intent as D1, corrected mechanism.

## D2 — collector widened after IMPL-EVAL C1

The first collector matched only `… from '…'`. IMPL-EVAL finding C1 showed that missed two forms
requiring runtime resolution: bare side-effect imports (`import 'x'`) and literal dynamic imports
(`import('x')`), including their relative variants, so a module reachable only through one of them
was never visited.

Collector now covers `from`, side-effect, and dynamic forms, strips comments first (doc examples in
`sdk/src/desktop/mod.ts` reference `@my-app/contracts`, which is not a real edge), and strips erased
`import type` / `export type` statements.
