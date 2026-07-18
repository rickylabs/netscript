# IMPL-EVAL — PR #809 (fixes #808, @netscript/mcp live-validation release blockers)

**Verdict: PASS**

- **Evaluator:** Claude · Fable 5 · medium (route `review_codex_complex`; separate session from the
  Codex Sol·high generator)
- **Date:** 2026-07-17
- **Subject:** worktree `/home/codex/repos/b10-808`, branch `fix/808-mcp-live-defects` @ `bd52f4b6`,
  base `main` @ `7bc256a1` (matches PR #809 head/base)
- **Scope:** code-level truth of the five commits `fb87169c`, `e8bc7210`, `9b2fd26d`, `b04e8f0a`,
  `bd52f4b6`. Full-scaffold SHIP re-validation is an explicitly separate post-merge lane and was
  not repeated here.

## Rationale

All three publish-blocking defects from the HOLD report (PB-1/PB-2/PB-3) are fixed at the owning
layer, each with a regression that would have caught the original failure, and every gate I re-ran
independently passed. The evidence in `worklog.md` and the PR body matched what I executed — no
claim I probed turned out inflated.

## Probe results

### 1. Telemetry adapter (fb87169c) — VERIFIED

- Live-envelope parsing (`unwrapData`, `selectSpans` over `resourceSpans[].scopeSpans[].spans[]`,
  resource-attribute propagation, corrected OTLP numeric SpanKind `1=internal…5=consumer`) lives in
  `packages/telemetry/src/adapters/aspire-query/aspire-telemetry-normalize.ts` — the shared
  telemetry infrastructure layer that owns the Aspire external-system shape. MCP composes only the
  loopback TLS edge (`createAspireDashboardFetch`): CA-verifying via discovered ASP.NET dev-cert
  PEMs, loopback-HTTPS-only, no `verify=false` path anywhere.
- Fixtures are provenance-stamped: `aspire-13.4.6-fixture.ts` names the capture date (2026-07-17),
  Aspire Dashboard 13.4.6, and both endpoints (`/api/telemetry/spans`, `/api/telemetry/resources`);
  the JSON is the real `{data:{resourceSpans:[…]},totalCount,returnedCount}` envelope with numeric
  kinds and nano timestamps.
- **Revert-probe executed:** restored `packages/telemetry/src/adapters/aspire-query/` to base
  `7bc256a1` and ran `packages/mcp/tests/telemetry-live-fixture_test.ts` → **FAILED (0 passed / 1
  failed)**; restored to HEAD → passes. The old fixture/adapter shape can no longer drift silently.
- The fixture test asserts 17 spans / 11 resources / non-empty `list_runs` / successful `get_run`
  validated against `TOOL_OUTPUT_SCHEMAS.get_run` — the exact false-empty class from PB-1.

### 2. Doctor bounding (e8bc7210) — VERIFIED (deliberate aggregation, not lying truncation)

- Top-level `$.checks` becomes one aggregate per family (≤4 ≤ 20); each family keeps ≤19 detail
  checks plus an explicit `<family>_additional_checks` overflow entry carrying the **worst omitted
  severity** and a fix hint. `counts`/`status` at both levels are computed over **all** original
  checks before bounding — aggregation cannot hide a failure.
- Regression runs the REAL flow output through the real output schema:
  `doctor_test.ts` ("real doctor flow stays within its advertised schema for large families",
  25-check family → `validateSchema(TOOL_OUTPUT_SCHEMAS.doctor, …)`, counts `{pass:25,fail:1}`,
  overflow entry status `fail`), and the CLI composition test drives the real CLI-composed doctor
  (25 plugin checks) through the server's schema-validating `tools/call` path asserting no JSON-RPC
  error. The schema itself was tightened (typed `counts`/`checks`/`families` item shapes) rather
  than loosened.

### 3. Docs corpus (9b2fd26d) — VERIFIED

- Default corpus = the package README imported via `with { type: 'text' }`, indexed as slug `mcp`
  through `EmbeddedDocsCorpus` (selected only in `cli.ts`; flows remain corpus-port-only —
  Archetype-6 layering held; `deno task arch:check` exit 0, run by me).
- Package weight: README is 18.64 KB in a 44-file publish set; **no test fixtures or JSON captures
  are in the publish set** (verified via `publish:dry-run` file list). Trivial weight impact.
- Empty-corpus state is explicit and non-silent: `FilesystemDocsCorpus` throws
  `DocsCorpusUnavailableError` (code `docs_corpus_not_found`, message carries the resolved root and
  `pass --docs-root <path>` remediation) for both missing root and Markdown-empty root; docs flows
  map it to a structured tool error, never a silent zero count. Covered by `docs_test.ts`
  (missing-root and `fixtures/docs-empty` cases).

### 4. Live claims — re-executed (minimal composition)

- Focused suites re-run by me: telemetry package **54/54**, MCP package + telemetry query
  **51/51**, CLI MCP composition test **pass** (initial 4 failures were my own missing
  `--allow-run`, not the code).
- Live stdio against `deno run -A packages/mcp/cli.ts` (minimal composition, no running app):
  `initialize` → `@netscript/mcp` / protocol `2025-11-25`; `tools/list` → exactly 13 tools in the
  code-owned order; `doctor` → **structured, schema-valid result, no −32603** (`status:warn`, 4
  family aggregates: telemetry:warn, aspire:warn, project:pass, plugins:warn — correct for an
  unwired environment); `search_docs("telemetry endpoint")` → 1 match slug `mcp`; `list_docs` → 1
  doc; `get_doc("mcp")` → title `@netscript/mcp`, bounded content. All three HOLD defect surfaces
  behave correctly live.

### 5. Suppressions / quality / publish — VERIFIED

- Diff scan `7bc256a1..HEAD` over `packages/`: **zero** new `deno-lint-ignore`, `as unknown as`,
  or `any` introductions.
- `deno task quality:scan` (ran full-repository mode, a superset of changed-file mode): ok, 0
  findings; the 7 allowances are pre-existing and none touch `packages/mcp` or
  `packages/telemetry`.
- `deno task arch:check`: exit 0 (WARN lines are pre-existing, not introduced by this branch).
- `packages/mcp` `publish:dry-run`: Success; **README.md (18.64 KB) is in the file list** — the
  text-asset inclusion claim is true; no tests/fixtures published.

## Process checks

- Generator ≠ evaluator: satisfied (Codex Sol·high generated; this is a separate Claude session on
  the supervisor-recorded `review_codex_complex` route).
- PLAN-EVAL/IMPL-EVAL formal dispatch was owner-waived, recorded in the run's `drift.md`
  (significant, accepted) and restated in the PR body; PR is held at `status:impl-eval` with an
  explicit do-not-merge line and `Closes #808` in the body (closing-keyword obligation met).
- Commit trail: five slice commits on PR #809 match the run's Design slice table; run artifacts
  (`worklog.md`, `drift.md`, `context-pack.md`) are current and honest — including the
  self-reported lint-wrapper tooling failure and the live-discovered `get_run` schema omission.
- Release-gate class: `scaffold.runtime --cleanup` 60/60 is recorded by the generator with raw
  counts; the independent SHIP re-validation after merge remains the final release gate per the
  dispatch brief.

## Findings (numbered, none blocking)

1. **(info)** `worklog.md` Design names a constant `EMBEDDED_MCP_DOC_SLUG = "mcp"`, but the code
   inlines the literal `'mcp'` in `cli.ts` — trivial design-doc drift, no behavior impact.
2. **(info)** `quality:scan --changed` reported `mode:"repository"` (the flag did not narrow the
   scan). Harmless here — the full-repo scan is a superset and returned zero findings — but the
   wrapper's changed-file mode may deserve a look in tooling.
3. **(info)** The scoped lint wrapper's Deno 2.9.3 root-workspace failure is honestly recorded in
   `drift.md` with an explicit-config fallback over the same 59+6 files; pre-existing tooling
   issue, not introduced by this branch.
4. **(observation)** `doctor` top-level detail is now family aggregates only; per-check detail
   moved under `families[].checks`. This is a deliberate, documented contract shape (schema
   requires `families`), not information loss — noted so the SHIP re-validation reads the new shape
   intentionally.

## Conditions

None on the code. The standing conditions are procedural and already owner-imposed: keep PR #809
draft at `status:impl-eval`, owner merges, and the independent post-merge live SHIP re-validation
runs before `@netscript/mcp`'s first publish.
