# Research Realized — Wave 6 `@netscript/cli`

## Summary

Wave 6 validated the research conclusion that `@netscript/cli` needed a bounded A6 promotion, not a
rewrite. Slices 0-5 landed earlier; this session completed Slice 4a and Slice 6. Slice 4b
(`scaffold.published.runtime`) was not created or run, by instruction, and remains the single
deferred post-S3 step F item.

## Realized Shape

- Slice 4a split init orchestration into a compatibility re-export, `init-orchestrator.ts`, and
  `init-pipeline.ts`; added `init --json`, the empty `init --from` preset seam, generic pipeline
  context typing, an in-memory scaffolder, and `docs/commands/init.md`.
- `netscript-dev init` needed the same `--json` and `--from` parity as public `netscript init`
  because the local `scaffold.runtime` fixture exercises the maintainer binary.
- Slice 6 moved scaffold support helpers under `kernel/application/scaffold/support/` to preserve
  folder cardinality after the init split.
- `PresetRegistry` is exported through `kernel/extension-points.ts`, making the Slice 4a preset seam
  visible to the A6 extension-point gate.
- The seeded route manifest generator now uses structured line assembly instead of a long inline
  template literal.
- Fitness scripts were tightened where the gate intent was production shape: file-size checks skip
  tests, command-shape checks skip dedicated testing fixtures, and typed `Command<...>` constants are
  recognized.

## Divergences

- Slice 3 app writer splitting stayed under `kernel/application/scaffold/writers/`; moving it under a
  maintainer surface would have introduced a kernel-to-maintainer import and violated F-CLI-4.
- Slice 5 consumed the already-landed #44/R6 Aspire 13.4 apphost migration, then verified the
  inherited `.mts` shape and added the schema mirror/process-command seam.
- The branch does not define `deno task check:packages --unstable-kv`; the repo-native equivalent is
  `deno task check`, which passed during Slice 4a and Slice 6.
- Broad `deno task arch:check` remains red on known repo-wide baseline findings. The focused A6
  verdict comes from the F-CLI scripts, all of which pass after Slice 6.

## Final Evidence

- Local `scaffold.runtime`: `passed=41 failed=0`, `database.init` PASS, `E2E_EXIT=0`.
- Root validation: `deno task check`, `deno task lint`, `deno task fmt:check`, `deno task test`,
  `deno task publish:dry-run`, and `deno task audit:critical` completed successfully.
- CLI validation: `packages/cli` check, doc-lint for `./mod.ts`, `./scaffolding.ts`, `./testing.ts`,
  and `packages/cli` publish dry-run passed.
- JSR status: `@netscript/cli@0.0.1-alpha.0` is publish-clean in dry-run. The only CLI publish
  warnings are the known dynamic imports in `plugin-registry.ts` and `ui/registry.ts`.
