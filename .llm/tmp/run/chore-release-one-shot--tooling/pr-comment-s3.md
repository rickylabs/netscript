**[PHASE: IMPL] [SLICE: S3]**

S3 pushed: D1 adds `deno task release:cut -- <version>` with exact-version bump coordination, residue check, ordered gates, dry-run mode, and PR creation via `gh pr create --body-file`.

- Commit: `0b2d1aa5` (`chore(release): add release cut orchestrator`)
- Scope: `.llm/tools/release/cut.ts`, `.llm/tools/release/cut_test.ts`, `deno.json`; also includes a relative-path filter fix in the S2 preflight tool discovered by copied-checkout dry-run proof
- Gate: `deno test --allow-read --allow-write --allow-run --allow-env .llm/tools/release/cut_test.ts` — PASS, 3 passed
- Gate: focused `run-deno-check` on S3 tool/test — PASS, 0 occurrences
- Gate: `deno fmt --check .llm/tools/release/cut.ts .llm/tools/release/cut_test.ts` — PASS after scoped formatting
- Gate: no-new-casts scan on S3 files — PASS, zero matches
- Gate note: `deno task release:cut -- 0.0.1-alpha.99 --dry-run` was run in a copied checkout under `.llm/tmp`; bump and residue completed, then the command failed fast at `release:preflight` on the true `packages/service/src/primitives/openapi.ts:155` finding recorded in S2. No branch/commit/push/PR was created by the dry-run.
