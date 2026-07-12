# Session record — issue #309 beta release/API-stability gates

Harness run: `.llm/runs/feat-309-release-api-stability-gates--codex/`.

Delivered the beta subset without cutting or publishing a release:

- one zero-residue coordinator for exact/native `version:bump` and `release:cut`, covering the root,
  declared workspace members, scaffold manifests, and lock mirrors;
- normalized Deno-doc public-surface baseline/diffing for every publishable package export, exact
  major declarations, fixture tests, root tasks, and a beta-non-blocking package-path PR workflow;
- `@deprecated{removal: x.y}` doctrine plus at/past-removal warnings, including the Deno 2.9 source
  fallback required because doc JSON drops the attached payload;
- a hard two-workflow release completion/fix-forward policy in the canonical release skill and its
  generated Claude mirror.

Validation: version tests 7/7, surface tests 3/3, scoped check/lint/fmt zero findings across 36
files, live surface verdict patch across 34 packages / 258 exports / 6,654 symbols, snapshot CLI
undeclared/declared exits 1/0, docs links green, mirror/Claude validation green, and `deno.lock`
unchanged. Separate Claude Opus 4.8 IMPL-EVAL returned `PASS`.

Issue #309 remains open: stable-line promotion of surface-diff from observational to blocking is
explicitly deferred. No PR was opened by owner direction.
