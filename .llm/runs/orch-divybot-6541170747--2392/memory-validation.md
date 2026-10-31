# Workers validation memory

Structured full worker suite: deno run --allow-read --allow-write --allow-run
.llm/tools/run-deno-test.ts -- --allow-all plugins/workers/worker. 62 pass, 16 environment-gated
integration cases ignored in this environment. Root wrappers accept --root plugins/workers/worker
--ext ts for check/lint/fmt, 34 files selected after adding job logger.
Adding any plugin direct import changes workspace membership metadata in root, Fresh-UI, Expo and desktop
locks even when version resolution is unchanged. Use documented native Expo install command
and deno task deps:refresh:desktop-lock. This change adds exactly one line to each lock.
JSR audit passes. Doc-lint plugin baseline: two private-type-ref errors in
packages/plugin-workers-core/src/contracts/v1/workers.contract-types.ts.
LogTape setup is process-local; service logger initialization does not configure a separate worker.

Fresh-UI lock:update can rewrite existing better-auth peer keys during refresh. Inspect the diff
and retain only the required worker workspace membership entry for this logging change.
