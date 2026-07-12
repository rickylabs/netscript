# Worklog: #234 Phase 0/1 TLS opt-in

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-234-h2-tls-optin--codex` |
| Branch | `feat/234-h2-tls-optin` |
| Archetype | `4 - Public DSL / Builder` with listener runtime gates |
| Scope overlays | `service` |

## Short Plan (PLAN-EVAL owner-waived)

1. Re-baseline the issue contract against pinned HEAD and record pre-landed implementation provenance.
2. Run a real self-signed TLS listener, prove `h2` via curl ALPN/HTTP output, and prove Deno `fetch` succeeds over TLS.
3. Run the existing TLS branch test, package tests, and scoped check/lint/format wrappers.
4. Verify `deno.lock` is untouched, commit only honest run evidence, and push the requested branch.

## Design

### Public Surface

- Existing `ServeOptions.tls?: ServiceTlsOptions` is the caller-facing opt-in.
- Existing `ServiceTlsOptions` carries PEM `cert` and `key` strings.
- Existing `createService(...).serve(options)` and `defineService(..., options)` remain the entry paths.

### Domain Vocabulary

- `ServiceTlsOptions` — inline certificate/private-key material.
- `ListenerScheme` — finite `http | https` banner scheme.
- `RunningService` — listener address and graceful `stop()` handle.

### Ports

- No new port. `Deno.serve` remains the designated listener edge and existing test seam.

### Constants

- No new finite values. Existing listener schemes and shutdown signals are sufficient.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Re-baseline and prove the already-landed opt-in TLS/h2 contract | curl ALPN, Deno fetch, targeted/package tests, scoped wrappers | `.llm/runs/feat-234-h2-tls-optin--codex/*` |

### Deferred Scope

- Phase 2/3 rollout surfaces are excluded by the owner brief.
- No default change and no Aspire dev-cert provisioning.

### Contributor Path

Start at `packages/service/src/types.ts` for the public option, follow
`packages/service/src/builder/service-listener.ts` to the TLS/plain listener branches, and copy the
assertion pattern in `packages/service/tests/tls-listener_test.ts` for future transport options.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | 1 | preflight | HEAD `eac57c5f5ac4...` passed; branch is `feat/234-h2-tls-optin`. |
| 2026-07-12 | 1 | re-baseline | Found Phase 0/1 merged at ancestor `9c9efb6b`; no product edit made. |
| 2026-07-12 | 1 | spike | Real TLS listener accepted curl ALPN `h2`; curl used HTTP/2 and received `HTTP/2 200` / `h2-ok`. |
| 2026-07-12 | 1 | trust check | Deno fetch first rejected the ad-hoc self-signed cert (`CaUsedAsEndEntity`), then returned 200 / `h2-ok` with the explicit test-only certificate-validation bypass. |
| 2026-07-12 | 1 | gates | Targeted and full tests plus scoped static/publish-surface gates passed. |
| 2026-07-12 | 1 | reconcile | #234 Phase 0/1 is already represented by ancestor commit `9c9efb6b`; this run does not claim full issue closure, create a PR, or alter Phase 2/3 tracking. |
| 2026-07-12 | 1 | lock hygiene | Raw `git diff -- deno.lock` was empty; `git diff --check` exited 0; only this run directory is in the slice. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Preserve existing implementation | It already satisfies the requested Phase 0/1 contract and is merged history. | `9c9efb6b`, focused source/tests |
| Do not self-certify | Harness requires separate supervisor review and IMPL-EVAL. | harness lane policy |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| D1 PLAN-EVAL owner waiver | significant | yes |
| D2 requested implementation already exists in baseline | significant | yes |

## Gate Results

### Spike / Runtime Evidence

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| TLS + HTTP/2 ALPN | Scratch `Deno.serve({ cert, key })`, then `curl --http2 --insecure --verbose https://127.0.0.1:46123/` | PASS | curl: `ALPN: server accepted h2`, `using HTTP/2`, request `GET / HTTP/2`, response `HTTP/2 200`, body `h2-ok`. |
| Deno fetch over TLS | `deno eval --unsafely-ignore-certificate-errors=127.0.0.1 ... fetch(...)` | PASS | Exit 0; `{\"status\":200,\"body\":\"h2-ok\"}`. Bypass was limited to the scratch self-signed cert. |
| Trust-friction observation | Deno fetch with the scratch cert passed as a CA | EXPECTED REJECTION | `CaUsedAsEndEntity`; confirms certificate trust/provisioning, not protocol implementation, is the remaining rollout cost. |

### Static and Package Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Targeted TLS test | `deno test --allow-all /home/codex/repos/ns-b9-234/packages/service/tests/tls-listener_test.ts` | PASS | 8 passed, 0 failed. Covers inline TLS forwarding, HTTPS banner, and plain HTTP branch. |
| Service tests | `deno test --allow-all /home/codex/repos/ns-b9-234/packages/service/tests/` | PASS | 77 passed, 0 failed. |
| Scoped check | `run-deno-check.ts --root /home/codex/repos/ns-b9-234/packages/service --ext ts,tsx` | PASS | 40 files; `--unstable-kv`; 0 failed batches / occurrences. |
| Scoped lint | `run-deno-lint.ts --root /home/codex/repos/ns-b9-234/packages/service --ext ts,tsx` | PASS | 40 files; 0 occurrences. |
| Scoped format | `run-deno-fmt.ts --root /home/codex/repos/ns-b9-234/packages/service --ext ts,tsx` | PASS | 40 files; 0 findings. |
| Doc lint | `deno task doc:lint --root /home/codex/repos/ns-b9-234/packages/service --pretty` | PASS | 2 entrypoints; 0 errors/private refs/missing JSDoc. |
| JSR audit | `audit-jsr-package.ts --root /home/codex/repos/ns-b9-234/packages/service --text` | PASS | 1 INFO only: sanctioned oRPC slow-types carve-out; no actionable findings. |
| Publish dry-run | `deno publish --dry-run --allow-dirty --allow-slow-types` | PASS | `Success Dry run complete`; approved service slow-types carve-out used. |

### Fitness / Consumer Assessment

| Gate family | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5/F-7 public docs | PASS | `deno doc` inspection + doc-lint | Existing `ServiceTlsOptions`/`ServeOptions` remain documented. |
| F-6 publishability | PASS | JSR audit + publish dry-run | Sanctioned slow-type INFO is pre-existing debt, not new drift. |
| F-10/F-19 tests/scoped runners | PASS | 77 tests + wrapper JSON | No raw root gate substituted. |
| Runtime/consumer | PASS (implementation-agent evidence) | ALPN spike + tests/check | Final sign-off remains separate-session supervisor/evaluator work. |

## Handoff Notes

- Inspect `git show 9c9efb6b` first for the landed implementation.
- The orchestrator must perform the slice review and separate-session IMPL-EVAL.
- `e2e:cli` / `scaffold.runtime` were intentionally NOT RUN per the owner brief; the orchestrator owns that gate.
