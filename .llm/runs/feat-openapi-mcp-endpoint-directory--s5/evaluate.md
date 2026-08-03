# IMPL-EVAL — OMB S5 ServiceEndpointDirectoryPort + adapters

## Route identity

| Field | Value |
| --- | --- |
| Phase | IMPL-EVAL |
| Run ID | `feat-openapi-mcp-endpoint-directory--s5` |
| Branch | `feat/openapi-mcp-endpoint-directory` |
| Baseline | `2c8865e8c` |
| HEAD | `92f8abfa` |
| Reviewer | OpenHands (qwen3.7-max via openrouter) |
| Family independence | Verified — no overlap with Codex implementer or Opus 4.8 reviewer |

## Independent verification summary

Read in order: issue #1131, RFC PR #1123, P1-verdict.md, P3-verdict.md, plan.md, worklog.md,
review-codex-complex.md. Reviewed the complete diff from baseline `2c8865e8c` through HEAD `92f8abfa`
(6 commits, 28 files, +3062/-6). Re-ran focused fixtures, package tests, scoped check/lint/fmt, and
`deno doc --lint`. Verified lock hygiene (`git diff deno.lock` empty), forbidden-pattern scan
(clean), and S4 coupling scan (no projection imports).

## Acceptance gates (issue #1131)

### Box 1 — fixture matrix covers every source outcome and status row

**PROVEN.** Re-ran: `deno test --allow-env --allow-net --allow-run --allow-read --allow-write
packages/mcp/tests/service-endpoint-sources_test.ts
packages/mcp/tests/service-endpoint-directory_test.ts` — exit 0; 15 passed, 0 failed (163 ms).

Coverage traced:

| Required row | Test name | Line |
| --- | --- | --- |
| Foreign-root manifest | `run manifest requires real project identity…` → `project_root_mismatch` | sources:148 |
| Torn manifest with healthy appsettings | `torn manifest remains failed while healthy appsettings remains independently usable` | sources:152 |
| Reused-port identity mismatch | `directory…applies precedence…identity_mismatch` | directory:87,126 |
| All four source used/absent/failed | 6 source tests cover override, appsettings, manifest, CLI outcomes | sources:all |
| CLI absent/non-zero/parse | `Aspire CLI absence, non-zero exit, and parse failure…` | sources:last |
| All five statuses | `running`, `not_running`, `spec_unavailable`, `identity_mismatch`, `excluded` | directory:all |

### Box 2 — non-cooperative hanging spec fetch yields row-level timeout while healthy rows return

**PROVEN.** Re-ran: same command; test `'one non-cooperative hanging spec fetch times out while
another directory row returns'` — exit 0; 21 ms. The fixture uses `new Promise(() => {})` (a fetch
that never settles and ignores the abort signal), and asserts the hung row is `spec_unavailable`
"timed out after 20ms" while the sibling row returns `running`.

## Decisive checks (independent trace)

- **Qualified F1(b) precedence.** `ENDPOINT_SOURCE_PRECEDENCE = override > aspire-cli > run-manifest
  > appsettings` in the port contract; `selectCandidate` sorts by frozen precedence index; directory
  fixture asserts exact ordered conflict list. Matches P1 FAIL→F1(b) ruling. **OK.**
- **Manifest identity safety.** Real-path equality of `projectRoot` + externally supplied
  `expectedRunId` equal to manifest `runId`; absence → `absent`, missing token →
  `expected_run_id_missing`, foreign root → `project_root_mismatch`, stale token →
  `run_id_mismatch`. No currency inferred from the file's own token. **OK.**
- **Aspire CLI failure states.** `command_not_found` (Deno.errors.NotFound), `command_failed`
  (non-zero exit, stderr/stdout detail), `parse_failed` (non-JSON or missing `resources[]`);
  AbortError re-thrown. Banner-tolerant `extractJson`. DCP `-xxxxxxxx` suffix stripped,
  `displayName` preferred. **OK.**
- **Deterministic conflicts.** Lower-precedence differing URLs recorded as `conflicts` in
  precedence order with per-`(source,url)` dedup; identical URLs and selected source excluded.
  **OK.**
- **Exclusion before fetch.** `#row` returns `excluded` before any probe; directory fixture
  asserts the excluded service name never appears in the `probed[]` log. **OK.**
- **Parent cancellation.** Dedicated test `'parent cancellation rejects the directory instead of
  fabricating endpoint rows'` aborts the supplied signal during a slow probe and asserts `list()`
  rejects (`AbortError`). `throwIfAborted()` at entry, post-source, post-workers; probe and
  source read re-throw on parent abort. **OK** (addresses review F-2).
- **Credential / redirect / response bounds.** Probe uses `credentials: 'omit'`,
  `redirect: 'error'`, no `authorization` header (asserted); `readBoundedText` enforces byte cap
  by both `content-length` and streamed length, cancelling body on overflow. **OK.**
- **Spec-first reused-port identity.** Probe fetches `/api/openapi.json` first, then `/`; only
  both-success with `identity.service === candidate.name` yields `running`; valid spec on reused
  port with foreign `/` identity maps `identity_mismatch`. **OK.**
- **Path-mounted overrides.** Dedicated test `'fetch probe preserves a path-mounted operator base
  for spec and identity requests'` composes probe URLs relative to the base path. Override
  normalizer retains the base path. **OK** (addresses review F-1).
- **Exact P3 `spec_unavailable` guidance.** `SPEC_UNAVAILABLE_AUTH_GUIDANCE` is byte-for-byte the
  ratified P3 wording and is attached only on 401/403. **OK.**
- **Public API / JSDoc.** Every exported symbol has JSDoc; contract re-exported from both `.` and
  `./cli`; `deno doc --lint` zero diagnostics (re-ran: exit 0, "Checked 1 file"). Naming
  consistent and intention-revealing. **OK.**
- **A2 layering / S4 independence.** Consumed contract in `src/ports/`, adapters in
  `src/infrastructure/service-endpoints/`, composition in `src/application/`. Spec kept `unknown`
  (opaque); `grep` confirms no S4/projection import in any new file. **OK.**

## Validation evidence (re-run)

| Gate | Command | Result |
| --- | --- | --- |
| Focused source + directory matrix | `deno test --allow-env --allow-net --allow-run --allow-read --allow-write packages/mcp/tests/service-endpoint-sources_test.ts packages/mcp/tests/service-endpoint-directory_test.ts` | PASS, exit 0; 15 passed, 0 failed (163 ms) |
| Package tests | `deno task --cwd packages/mcp test` | PASS, exit 0; 81 passed, 0 failed (2 s) |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS, exit 0; 79 files, 0 diagnostics |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS, exit 0; 79 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS, exit 0; 79 files, 0 findings |
| Doc lint | `deno doc --lint packages/mcp/mod.ts` | PASS, exit 0; "Checked 1 file" |
| Lock hygiene | `git diff 2c8865e8c HEAD -- deno.lock` | PASS, exit 0; empty |
| Forbidden patterns | `git diff` scan for `as any`, `@ts-ignore`, `@ts-nocheck`, `// deno-lint-ignore`, `console.` | PASS; 0 matches |
| S4 coupling | `grep -rn 'from.*s4\|from.*projection\|import.*openapi-projection\|from.*openapi-spec' packages/mcp/src/` | PASS; 0 matches |

Worklog records: quality:gate PASS, publish dry-run PASS, JSR audit PASS (sole slow-type warning is
the recorded progress-banner false positive; no actual slow-type diagnostic). Publish dry-run was
not re-run here (timed out at 60 s in this environment) — the worklog evidence stands.

## Findings (advisory, non-blocking)

No blocking finding. All four items from the Codex review are low-severity / advisory:

- **F-1 (low) — path-prefixed base URL.** Now has a dedicated test proving path-mounted base URLs
  are preserved by the probe. Resolved in this run.
- **F-2 (low) — parent cancellation unproven.** Now has a dedicated test. Resolved in this run.
- **F-3 (low) — service self-identification contract undocumented.** The probe requires `/` to
  return JSON `{ "service": <name> }`. This is documented in the README ("A running service must
  return JSON containing its selected service name"), but the JSDoc on
  `FetchServiceEndpointProbe` does not repeat it. Non-blocking; S7/product services must conform.
- **F-4 (very low) — `firstHttpUrl` prefers plaintext `http://` over `https://`.** Correct for
  loopback dev; note for future TLS-fronted services. No action required now.

## Drift (recorded)

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Formal PLAN-EVAL composed/waived by milestone ruling | significant | yes |
| RFC omitted how MCP learns the current manifest `runId`; S5 requires injection | significant | yes |
| Existing package tests need test-only write permission for temporary directories | minor | yes |
| Planned flat role files were grouped to avoid new/deepened cardinality debt | minor | yes |
| JSR audit parser treats Deno's slow-type progress banner as a warning | minor | yes |
| Fable 5 review primary unavailable; same-family Opus fallback used | minor | yes |

All drift items are documented, not defects. The two significant items (PLAN-EVAL waiver, run-id
injection) are explicit scope boundaries owned by S7 and the milestone-run orchestrator, not this
slice.

## Verdict

**PASS.**

Rationale: both issue #1131 acceptance gates are honestly proven by executable evidence (not
narration). The contract, precedence (qualified F1(b)), manifest identity binding, all four source
outcomes, complete S-12 status mapping, deterministic conflicts, pre-fetch exclusion, credential-
and redirect-free bounded probing, spec-first reused-port identity, the exact P3 guidance, the hard
non-cooperative row-level timeout, parent-cancellation propagation, path-mounted overrides, and
A2/S4 independence are all correct and, for the two acceptance gates, proven by re-run tests. The
four recorded findings are low-severity/advisory: F-1 and F-2 are now resolved by dedicated tests;
F-3 and F-4 are documentation/future-notes. No acceptance box is violated, no honesty invariant is
broken (no path can fabricate a `running` row), and no lock churn or forbidden pattern was
introduced.

Scope note: this IMPL-EVAL did not re-run publish dry-run (timed out in this environment) or the
full CLI scaffold E2E (outside the package-only surface per the task prompt). The worklog gate
tables record those as PASS from the implementer's evidence. No GitHub state, commit, push, PR, or
issue change was made by this evaluator.

---

OPENHANDS_VERDICT: PASS
