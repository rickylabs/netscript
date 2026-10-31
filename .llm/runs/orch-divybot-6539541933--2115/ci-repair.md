# S3 generated documentation repair

CI quality on S2 failed `check:mcp-export-corpus`: stale generated corpus after parser JSDoc change. Repository generator `deno task gen:mcp-export-corpus` refreshes exactly one row, `auth-kv-oauth` / `./cookies`. Raw-deflate decoded before/after comparison confirms the sole semantic delta is parseCookieHeader documentation (skip invalid encoding, last successful duplicate wins). Names, types, signatures and all other corpus rows are unchanged.

`deno task gen:publish-assets` changes no dependent carriers. `check:mcp-export-corpus` and `check:publish-assets` pass. Structured fmt/check on the generated corpus pass. No auth source, tests, lock, scaffold/template or runtime code changed. Previous package regression and negative-control evidence stays applicable. CI repair does not require local scaffold runtime or e2e label.

Close-gate failed because CI ran before exact-head review finished and saw the unchecked review box. After final review, checklist correction makes live local close-gate PASS. A rerun of the old job was denied while its parent workflow was active; no empty commit or metadata manipulation was used. Temporarily return PR to draft for this repair so review evidence can be completed before the next ready transition. Required final exact-head review remains outstanding for S3.

Test shard 4 artifact confirms both failures come from the same stale corpus: `--check remains freshness-only when the generator read set is dirty` and `write mode generates the artifact from a clean committed tree` (the latter exhausts the assertion diff buffer on a huge compressed-row mismatch). No unrelated runtime/DB failure. Run focused generator tests after committing the refresh because these tests archive HEAD.
