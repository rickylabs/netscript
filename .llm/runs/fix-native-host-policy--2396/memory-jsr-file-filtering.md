# JSR file-filtering lesson

The native publish glob services/**/*.ts includes a helper named service-test-fixture.ts.
The existing **/*_test.ts exclusion does not match it. Keep child-process helpers under the
already excluded test_utils convention; do not widen publication filters to hide ordinary code.
Native deno publish --dry-run --log-level debug prints the actual included-file list. Inspect
that section, not all debug resolver paths. Workers includes92 intended files after this repair,
including both singular factory and legacy entrypoints, with no test/helper path. Deno pack's
transformed module graph is supplementary; its output is not the JSR included-file list or an
actual published consumer proof. Retain raw debug output locally and commit only relative paths.
