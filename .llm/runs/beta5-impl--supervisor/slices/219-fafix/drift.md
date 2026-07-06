# 219-fafix Drift

## 2026-07-06

- **Severity:** minor
- **Observation:** The prompt referenced `.llm/runs/beta5-impl--supervisor/eischat-seam-analysis.md`, but `.llm/runs/beta5-impl--supervisor/` was not present in this checkout at activation time.
- **Action:** Did not write run-root artifacts. Created and maintained only the requested slice-local artifact directory.

- **Severity:** minor
- **Observation:** FA2 must treat a function `streamPath` as a full per-request subpath. Resolving that function to a string before calling FA1's shared resolver causes the string-prefix rule to append the session id a second time.
- **Action:** Kept string values as static prefixes and passed function values through as full-path resolvers.

- **Severity:** minor
- **Observation:** The requested full export-map doc lint for `@netscript/fresh` was red on pre-existing public-type leaks: `EmptySegment` was private while referenced by exported route conditional types, and `NetScriptVitePlugin` aliased Vite's private `Plugin` type.
- **Action:** Made `EmptySegment` public and replaced the Vite alias with a package-owned structural hook-slot interface so `packages/fresh` doc lint exits 0.
