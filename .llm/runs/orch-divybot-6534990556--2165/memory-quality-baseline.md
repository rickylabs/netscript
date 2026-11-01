# Quality gate baseline

On baseline 30c800958dbf512a4951d640f08748703a8b59e3, before any production changes, deno task quality:gate exits 1 in quality:scan: docs/site/_plugins/markdown-render-fixture.ts:48 has existing unsafe-cast `return element as unknown as Element;`. Root coverage passes. arch:check is short-circuited by the first failure and must run independently for evidence. Do not fix unrelated documentation fixtures in #2165 or call the broad gate green.
