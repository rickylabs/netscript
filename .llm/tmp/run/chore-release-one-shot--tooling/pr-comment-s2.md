**[PHASE: IMPL] [SLICE: S2]**

S2 pushed: D3 adds the release text-import preflight, fixture coverage, root task wiring, and `publish.yml` pre-dry-run gate.

- Commit: `d74ba7c2` (`chore(release): add text import preflight`)
- Scope: `.llm/tools/release/preflight-text-imports.ts`, fixtures/tests, `deno.json`, `.github/workflows/publish.yml`
- Gate: `deno test --allow-read .llm/tools/release/preflight-text-imports_test.ts` — PASS, 3 passed
- Gate: positive fixture CLI — PASS by expected non-zero, flags read line 6 and URL declaration line 1
- Gate: negative fixture CLI — PASS, exit 0
- Gate: focused `run-deno-check` on S2 tool/fixtures — PASS, 0 occurrences
- Gate: `deno fmt --check` on S2 tool/fixtures — PASS
- Gate note: `deno task release:preflight` found a true existing violation in `packages/service/src/primitives/openapi.ts:155` (`scalarJsUrl` declared from `new URL(..., import.meta.url)` on line 29). This is outside the SCOPE-tools edit boundary, so it is recorded and not suppressed.
