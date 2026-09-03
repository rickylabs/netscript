# Drift log — #1906 slice 3

## 2026-09-03 — scoped lint wrapper config boundary (pre-existing)

The required single-root E2E lint wrapper selects 236 files but Deno exits before linting the seven
standalone `fixtures/desktop-native` files: that fixture config is not a root workspace member, and
its `catalog:zod` import cannot resolve after Deno ignores the parent config. This is unchanged from
slice 2 and outside the observation work. Equivalent structured wrapper runs cover 229 ordinary
files plus all seven fixture files under the root `deno.json`, with zero findings and complete
coverage. No config or lock change was made.
