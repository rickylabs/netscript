# Drift Log: Aspire 13.5 listener-readiness health checks

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — Deno KV carried-in health-check assumption is absent

- **What:** The current `denokvContainerSetup` emits an HTTP endpoint but no
  `withHttpHealthCheck` call.
- **Source:** `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts`.
- **Expected:** #1718 says the existing Deno KV HTTP health check remains unchanged.
- **Actual:** No existing Deno KV health check is present on stacked S5 head `0bd8ba832`.
- **Severity:** significant.
- **Action:** defer; preserve the owner's explicit “Deno KV unchanged” S6 boundary and surface the
  mismatch to the supervisor.
- **Evidence:** `rg 'withHttpHealthCheck' packages/cli/src/kernel/templates/aspire` returns only
  unrelated generated service/app registrations, not Deno KV infrastructure.

## 2026-08-30 — E2E registry debt stop condition still applies

- **What:** The new listener gate encounters the explicit “next gate” stop condition in
  `scaffold-runtime-a8-f16-1333`.
- **Source:** `.llm/harness/debt/arch-debt.md` and current filesystem measurement.
- **Expected:** A new gate may be added only after the owed role-named runtime registry split.
- **Actual:** `runtime-gates.ts` is 812 lines and the scaffold gate folder has 48 direct files.
- **Severity:** significant.
- **Action:** fix within S6 before registering the new readiness gate; extract behavior/runtime
  script modules and group readiness probes without increasing the direct-child count.
- **Evidence:** `wc -l packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts`; direct
  `find ... -maxdepth 1 -type f | wc -l`.

### S6 response

- Extracted `runtime/behavior-gates.ts`, `runtime/behavior-scripts.ts`, and
  `runtime/runtime-scripts.ts`; moved five existing runtime probes under the same role directory.
- `runtime-gates.ts` is now 305 lines and `behavior-gates.ts` is 304 lines, both within the
  archetype-6 implementation cap.
- The scaffold folder now has 43 direct files and 45 immediate children including its two role
  directories; the new `runtime/` group has 11 direct files, within the 12-child cap.
- The explicit next-gate monolith/deepening stop condition is satisfied. Residual carried-in
  scaffold fan-out remains visible to the debt owner and is not represented as fully retired.

## 2026-08-30 — Aspire 13.5.3 endpoint projection returns expression handles

- **What:** The locked #1718 line 44 / plan D3 projection form used
  `await endpoint.property(EndpointProperty.Host | EndpointProperty.Port)` as if it returned live
  string/number values.
- **Source:** IMPL-EVAL cycle 1 at `78d0ded28`; restored SDK 13.5.3
  `.aspire/modules/aspire.mts` has `property()` returning an
  `EndpointReferenceExpressionPromise`, while `EndpointReference.host()`/`.port()` are declared at
  lines 4700–4701 / 4696–4697 and the promise equivalents at 4767–4768 / 4763–4764.
- **Expected:** Resolve the endpoint host and port at health-check invocation time so isolated-start
  dynamic allocation remains live.
- **Actual:** The property projection produces expression handles and caused four TS2322 errors in
  a generated AppHost compiled against the real restored 13.5.3 modules.
- **Severity:** significant.
- **Action:** retain the locked readiness intent but amend D3's mechanism to obtain the endpoint in
  each callback and await `endpoint.host()` / `endpoint.port()`. Add a real restored-module consumer
  type-check as a mandatory gate for this and every later generator slice.
- **Evidence:** `receipts/06-consumer-typecheck-13.5.3.txt` passes with TypeScript 5.9.3 against the
  S2-restored SDK 13.5.3 surface.

## 2026-08-30 — NAS migration freezes the lane after the cycle-1 repair

- **What:** The current host is being replaced before Phase-B runtime execution and IMPL-EVAL.
- **Source:** Owner-authorized infrastructure migration.
- **Expected:** The live supervisor would normally proceed directly from slice 6 into the runtime
  lease and evaluator handoff.
- **Actual:** Runtime transport sessions were lost during the host restart, while the complete
  cycle-1 repair remained in this worktree.
- **Severity:** operational.
- **Action:** commit and explicitly push the statically green slice-6 repair as the durable recovery
  boundary. Keep PR #1743 draft; recreate the worktree on the NAS and resume with Phase-B runtime,
  supervisor slice review, and a separate-session IMPL-EVAL.
- **Evidence:** focused structured tests 53/53; five-file structured check 0 diagnostics; lint/fmt
  PASS; generated asset reproduced; `quality:gate` exit 0; host runtime inventory reported zero
  Aspire resources and zero Docker containers.

## 2026-08-31 — D-101 supersedes resource lifecycle and Docker-pause fault injection

- **What:** Commits `fbaa0bb89`/`60985a98f` attempted to make a real backing listener unreachable
  by pausing its container and resolving the ID-suffixed resource name.
- **Expected:** The listener fixture deterministically exercises the shipped TCP/RESP health-check
  factories without changing real backing-resource health or relying on host topology.
- **Actual:** A paused container still accepts bare TCP handshakes at the kernel; resource stop
  freezes Aspire's health evaluation; container stop is not portable DCP behavior.
- **Severity:** significant.
- **Action:** D-101 replaces the mechanism with harness-owned synthetic listeners controlled by an
  Aspire-managed task and preserves real-key continuity in the receipt. No Docker permission or
  lifecycle command remains in this path.

## 2026-08-31 — D-102 corrects the healthy-wait timeout exit contract

- **What:** D-101 retained the earlier fixture's exit-18 assertion after replacing resource
  lifecycle failure with a harness-owned listener fault that leaves the resource running.
- **Source:** Coordinator D-102 ruling grounded in Aspire 13.5.3 authoritative docs and the live
  Postgres single-gate receipt at
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s6/phase-b/postgres-single-gate.log`.
- **Expected:** A resource that stays `Running`/`Unhealthy` through `aspire wait --status healthy
  --timeout 10` returns exit 17 and the exact timeout diagnostic. Exit 18 is reserved for a
  failed/terminal resource.
- **Actual:** The synthetic listener transition and real-key continuity behaved correctly, but the
  fixture rejected documented exit 17 because it still required 18.
- **Severity:** bounded contract correction.
- **Action:** require exit 17 plus the exact timeout sentence, rename the receipt fields to identify
  a healthy-wait timeout, and leave listener/controller/resource lifecycle behavior unchanged.
- **Evidence boundary:** focused static tests only in this implementation lane; the coordinator
  owns the fresh zero-state Postgres lease and subsequent SQLite progression.

## 2026-08-31 — D-102b strips ANSI before exact timeout matching

- **What:** D-102 normalized whitespace and a leading `❌`, but left ANSI CSI color/style bytes in
  the candidate line.
- **Source:** Tier-A inspection of the live Aspire 13.5.3 exit-17 stderr receipt.
- **Expected:** CLI presentation decoration does not affect the exact semantic diagnostic match.
- **Actual:** ANSI before the glyph, around the message, and at line end caused a false rejection.
- **Severity:** bounded string-normalization correction.
- **Action:** use `stripAnsiCode` from `@std/fmt/colors` before trim/glyph removal, retain exact
  equality afterward, and add the real decorated-shape regression beside the plain-text case.
- **Evidence boundary:** static focused tests only; exit 17, transitions, controller architecture,
  fixed ports 18998/18999, and runtime lease ownership remain unchanged.
