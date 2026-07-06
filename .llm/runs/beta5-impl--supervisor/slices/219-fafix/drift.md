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

- **Severity:** minor
- **Observation:** Adversarial review found the initial identity-encoding defense was applied only in
  FA2 proxy fetch, leaving FA1 SSR seed materialization and live subscribe/resume direct reads able to
  request gzip/br and crash before app code can sanitize a mislabeled durable-stream response.
- **Action:** Moved the defense into FA1 `resolveChatHeaders`, overriding any caller-provided
  `Accept-Encoding` value with `identity`, and added local-server regressions for both direct-read
  paths.

- **Severity:** minor
- **Observation:** The first doc-lint cleanup typed `NetScriptVitePlugin` hook slots as `unknown`.
  That avoided private Vite type leakage but broke assignment to Vite `PluginOption`, including the
  normal `defineConfig({ plugins: [createNetScriptVitePlugin()] })` consumer shape.
- **Action:** Replaced `unknown` hook slots with package-owned broad function signatures and added a
  compile contract assigning the returned plugin to Vite `Plugin`, `PluginOption`, and `defineConfig`.
