# W2-C drift log

## 2026-08-08 — shared contract path absent (minor)

- Expected: `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md`.
- Observed: absent from the worktree and `origin/main` tree.
- Resolution: use the complete inlined shared supervisor contract from the launch prompt as the
  authoritative contract. No scope or gate was dropped.

## 2026-08-08 — launch preparation metadata superseded (minor)

- The checked-in `supervisor.md` contains pre-dispatch branch/worktree/evaluator placeholders.
- The explicit launch identity in the current prompt and actual worktree state are authoritative.
- No rival sender or evaluator is launched from this session.

## 2026-08-09 — acceptance gates registered but omitted from runtime allowlist (material)

- Expected: the granted `scaffold.runtime` pass executes the new migration-artifact and consecutive
  allocation/live-endpoint gates.
- Observed: the command returned `passed=76 failed=0`, but none of the four new IDs appeared in its
  execution list. Registration alone does not select a gate because the built-in suite maintains an
  explicit allowlist.
- Repair: add all four IDs to the Postgres runtime allowlist, exclude them from the SQLite tier, and
  assert both selections in the suite-registry test (16 passed, 0 failed).
- Evidence boundary: no blind retry was run. The 76-gate result is green but is not evidence for the
  four omitted acceptance gates. A fresh serialized grant is required before merge readiness.

## 2026-08-09 — PTY migration spawn reads an unpiped stream (material)

- Expected: the repaired runtime selection executes all four W2-C evidence gates.
- Observed: `database.migration-artifacts` created and applied the PTY migration, then failed when
  `defaultPrismaSpawn` destructured `stderr` from `command.output()` while PTY mode configured the
  stream as `inherit`. Deno correctly rejected access to an unpiped stream.
- Verdict: serialized run raw exit 1, `passed=33 failed=1`. The two allocation captures and
  live-endpoint gate were not reached.
- Boundary: Tier-A instructed stop-on-failure. No retry or code repair was attempted; follow-up
  implementation requires a new steer and a later serialized grant.

## 2026-08-09 — #1202 inherited owner-machine boundary withdrawn (material)

- Previous boundary: reference #1202 only; treat Windows collision identification and three clean
  owner-machine passes as observational acceptance.
- Reverified issue: its body has exactly four acceptance rows, all code/runtime evidence. Neither a
  Windows observation nor three consecutive full passes is an acceptance row. Owner measurement
  found no 3001 listener/reservation, and pristine scaffold coverage proves no fixed host port.
- Resolution: PR #1393 may carry `Closes #1202`. The issue rows remain unticked until the third
  serialized pass proves the mapped migration/allocation/live-endpoint evidence.

## 2026-08-09 — PTY spawn defect repaired RED-first (minor)

- RED contract raw exit 1 because the default spawn seam was not exported.
- Behavioral RED raw exit 1 after adding only the seam: the synthetic inherited-stderr getter threw
  the same `TypeError` as the runtime gate.
- Fix: return the interactive exit code without reading stderr; retain non-interactive capture and
  mirroring. `runCommandWithTimeout` now documents that only piped non-interactive stderr reaches
  it.
- Focused result: raw exit 0, 5 tests / 10 steps passed.

## 2026-08-09 — live-endpoint evidence rejects keyword connection syntax (material)

- Expected: `behavior.live-db-endpoint` compares the authority of the live Postgres URL with the
  generated users service connection string, then verifies health and correlated telemetry.
- Observed: the live URL used port `45103` and users used the same `Port=45103`, but the validator
  searched only for URL-style `:45103` and failed before health/OTEL receipt generation.
- Verdict: third serialized run raw exit 1, `passed=61 failed=1`. Migration artifacts and both
  allocation captures passed; live endpoint evidence failed.
- Boundary: no blind retry or repair. Although the failure payload shows matching ports, it does not
  complete the required health/structured-log/OTEL proof, so #1202 acceptance remains unticked.

## 2026-08-09 — live-endpoint comparison made structural (minor)

- Root cause: the validator assumed both endpoint authorities were URL-shaped. Aspire emitted the
  live resource as `postgres://host:port/db` and the users environment as the Npgsql keyword form
  `Host=...;Port=...;Database=...`.
- Repair: explicitly parse those two enumerated dialects, compare validated numeric ports, and name
  the unparseable side and original value on failure. A negative mismatched-port unit test prevents
  the evidence gate from degrading into a broad substring match.
- Evidence boundary: focused/scoped/framework gates pass. No fourth runtime pass was attempted
  because W2-A holds the serialized token; a new `EXPENSIVE-GATE-REQUEST` is pending.

## 2026-08-09 — live health receipt expects the wrong check shape (material)

- Expected: after structural endpoint authority succeeds, the live gate accepts the users health
  contract and correlates structured logs with OTEL traces.
- Observed: the service returned HTTP 200 with top-level `status: "healthy"` and database check
  `{ "name": "database", "healthy": true, "latency": 5 }`. The validator requires the check itself
  to expose `status: "healthy"`, so it failed before telemetry collection.
- Verdict: fourth serialized run raw exit 1, `passed=61 failed=1`. Migration artifacts and both
  allocation captures passed; `behavior.live-db-endpoint` failed in 239 ms.
- Boundary: no retry or repair. Matching endpoints and healthy JSON do not substitute for the
  missing correlated logs/OTEL receipt; #1202 acceptance stays unticked.
