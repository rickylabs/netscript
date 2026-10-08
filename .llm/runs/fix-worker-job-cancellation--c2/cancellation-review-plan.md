use harness

## SKILL

- netscript-harness — selected amendment PLAN-EVAL before source, then mandatory IMPL-EVAL.
- netscript-doctrine — existing job execution ownership and plugin integration, no new layer.
- netscript-pr — same unmerged PR #2088, preserve original reports and review threads.
- netscript-tools — causal mutations, full owning suites and structured raw gates.
- jsr-audit — preserved public contracts, docs/publication/export freshness.

## Locked review amendment plan

Issue #2066 / PR #2088, branch fix/worker-job-cancellation, immutable current source
0023b8f193f2cdc8cc3e8f8f06ebeeb700228584. Existing mandatory signal/optional deadline contracts,
original cancellation/source evaluation and bounded CI carrier review remain retained. Five real
review edge cases remain and must be fixed in this same PR before final delivery. Current checkout
is desktop branch during its independent review; inspect worker source with git show immutable HEAD,
never switch/edit that checkout. No amendment source has been written. Feature workload; no
privileged row authority. Selected decision-heavy lifecycle ownership amendment PLAN-EVAL hard stop.

D1 Schema-backed definition checks context.signal before validation and again after its awaited
validation before invoking application callback. Existing dispatcher already guards unwrapped schema
path; this closes callable-definition path with same schema without changing validation/auth/return
semantics or handler contract. Cancellation during validator must prevent callback side effects.

D2 Runner links and adopts parent cancellation synchronously during dispatch, before deferred
execute/possible synchronous stop. Dispatch finally owns listener removal across early failures;
execute no longer waits a microtask to adopt parent. Existing AbortController first cause wins.
Pre-aborted typed TimeoutError followed immediately by stop remains TimeoutError, not ShutdownError.
No extra public signal options or propagation layer.

D3 Existing owned runner clock rechecks effective deadline at BOTH terminal success/error
continuations (without overwriting earlier abort). Synchronous work can pass deadline before Web
timer runs; terminal reconciliation must abort TimeoutError and cannot clear an overdue timer as
success. Deterministic injected clock advances without firing timers to prove real ordering, no
busy-spin timing assertion. Preserve original earliest deadline, no early clamped timeout, cleanup
and bounded non-cooperative handler behavior.

D4 Keep execution ownership through every reportProgress promise invoked by the handler. Wrap the
existing reportProgress callback in the runner, tracking a promise tail and immediately observing
unawaited rejections; terminal handler continuation awaits the captured progress tail INSIDE the
runner's existing signal/deadline/grace race. Stop accepting new progress after handler settlement;
late callbacks must fail before entering sink. No new public callback, no duplicate plugin timer/
controller or cancellation framework. Existing pool serial progress sink/terminal formatter stay
intact, and pool terminal drain is already settled when runner returns. Cancellation/timeout/
shutdown during unawaited progress cannot record success; a stuck sink does not hold Worker.stop
past runner grace. Late errors stay observed. Preserve progress order/failure behavior and F16
completion/idempotency: abort means failed execution/claim released, never completed/applied.

D5 Worker.stop assigns the shared completion promise BEFORE calling synchronous drain. Use existing
Promise.withResolvers primitive then bridge drain settlement; keep synchronous abort-at-drain-start
and existing cleanup/final guard reset. Reentrant stop from handler abort listener sees same promise
and cannot duplicate resource teardown. No microtask admission delay, worker state machine redesign
or new lifecycle API.

Regressions/mutations: new async schema cancellation test; preaborted typed parent plus immediate
stop test; deterministic clock overdue success/error test; progress-drain test covering cancel,
timeout and shutdown with stuck sink plus late rejection/no timer leak; actual Worker reentrant
stop/real queue cleanup test; actual Worker unawaited blocked progress cancel/shutdown verifies
failed record, released claim and bounded stop (existing actual queue fixture extended). Every new
case has its own source mutation FAIL then restored PASS, no blanket compiler/launch failure counts.
Existing core, Worker pool, real queue and generated registry suites remain required, no skip/delete.

Slices S7 runtime/definition/worker stop plus adjacent tests (at most three production and three
owning test files), scoped frozen checks/unit/lint/fmt and quality/arch; S8 full owning core+worker
suites, type consumers/JSR/raw dry publication/all-entrypoint doc baseline unchanged, exact committed
corpus/carrier; S9 mandatory independent bounded amendment IMPL-EVAL, preserved original evaluate.md
and review-evaluate.md, new cancellation-review-evaluate.md; close actual five review threads only
after fixes/proof, public body/CI state updated, unmerged. Existing public shapes unchanged so
canonical corpus should remain unchanged; generate only if exact-source freshness requires it.
No dependency/lock/CLI/scaffold/plugin release output change; release-class runtime N/A. Previously
accepted doc baseline remains full per-entrypoint comparison, no suppression/reset/false green.

Risk register: preaborted first cause lost -> dispatch owns immediate link; validator completes after
cancel -> callback guard; synchronous overrun returned success -> terminal clock reconciliation;
progress promise ignored -> terminal within same runner owned race; progress rejection unhandled ->
immediate observation; blocked sink prevents drain -> existing grace bound and late cleanup; late
progress after completion -> admission check; reentrant stop duplicate cleanup -> promise assigned
before abort emission; queue claim applied after cancel -> actual Worker failed/release receipts.
Open decisions none. No public redesign or native worker/process rewrite. Any change to these
load-bearing choices requires re-evaluation before implementation. Coordinated publication and
consumer release remain owner work; Refs #2066, EIS createJobAbortScope removable after qualification.

## Independent PLAN-EVAL request

Evaluate all eight Plan-Gate boxes with harness protocol, current original worker run/Design/reports,
review-audit.json sibling and exact immutable worker source via git show. Verify at least one
load-bearing source finding and open-decision/debt sweep. No broad implementation gates, source
changes, branch/history/public/EIS mutations, installs, delegates/inference, CI polling or sleeps.
Only write review-amendment-plan-evaluate.md beside this file and return PASS/FAIL_PLAN with exact
source identity; no operator paths/hosts/IPs/ports/tokens/allowance data. Generator OpenAI differs
from this fresh independent Zhipu GLM session; owner required route. Work only task folder. Source
implementation hard stopped until independent PASS.
