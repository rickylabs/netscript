# beta6-nondash supervisor context pack

Status: TEL-T7 implementation complete on `feat/408-telemetry-t7-query`, awaiting draft PR review,
Tier-A A1 review, and IMPL-EVAL.

Baseline:

- Branch: `feat/408-telemetry-t7-query`
- Base confirmed at `c8f68721`; T3 commit present in history.

Implemented:

- `@netscript/telemetry/query` now exports the query read-side contract and Aspire-backed adapter.
- Query read models cover traces, spans, logs, resources, metrics, span events, span links, and OTLP
  JSON export.
- Standard Schema validators cover trace/resource/metric query filters.
- `AspireTelemetryQuery` wraps Aspire dashboard `/api/telemetry/*` HTTP endpoints, supports
  resource/service filters, limits, `follow`, metric name filtering, API key header injection, and
  absent-Aspire empty-result degradation.
- Tests cover adapter grouping, logs/resources/metrics, validation failure, public default factory,
  graceful absent Aspire behavior, and layering.

Validation summary:

- Scoped wrapper check/lint/fmt for `packages/telemetry`: green.
- Focused query/layering tests: green, 8 passed.
- Telemetry package tests: green, 45 passed.
- Full export doc-lint wrapper: exit 0, totalErrors=0, `./query.ts` total=0.
- Raw full export `deno doc --lint`: exit 0, `Checked 11 files`.
- `deno publish --dry-run --allow-dirty` from `packages/telemetry`: exit 0, no
  `--allow-slow-types`.
- Telemetry doctrine fitness: exit 0, FAIL=0; remaining WARN rows are pre-existing package debt.

Constraints honored:

- No dashboard/UI/panel code.
- `deno task e2e:cli` was accidentally started by a malformed PR-comment shell command after the
  slice commit, then interrupted immediately with Ctrl-C; no E2E verdict was produced or used.
- No `deno.lock` changes kept.
- No new `as` casts in T7 files.

Next:

- Commit and push with explicit refspec.
- Open a draft PR with `Closes #408`, acceptance/gate evidence checkboxes, required labels, and
  milestone `0.0.1-beta.6`.
- Stop at draft PR ready for separate-session IMPL-EVAL.
