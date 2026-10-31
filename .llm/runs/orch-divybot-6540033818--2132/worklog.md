# Worklog

## Design

1. Public surface: unchanged KvStore.list(KvListOptions), globally ordered Redis pages and exclusive
   lower/upper bounds. No new public symbols.
2. Domain vocabulary: candidate = decoded KV key plus Redis name; window = next bounded globally
   ordered candidate set; continuation = last examined candidate, not an opaque Redis cursor.
3. Ports: existing KvStore and narrow Pick<ioredis.Redis, 'scan' | 'mget'>; no new framework port.
4. Constants: reuse REDIS_SCAN_COUNT and REDIS_MGET_BATCH_SIZE; fixture sizes/page sizes are named
   test constants. Reuse @std/data-structures BinaryHeap and compareKeys.
5. Commit slices: S0 planning/run record/draft PR; S1 shared contract + bounded listing and Deno
   semantics correction, README/types and gates; S2 evaluator corrections/evidence if needed.
   Exact file/gate list is locked in plan.md.
6. Deferred scope: storage-key codec migration, sorted index/backfill, snapshot semantics and
   unrelated architecture debt. Reasons in plan.md.
7. Contributor path: packages/kv/tests/list-contract_test.ts is the one shared behavior spec;
   Redis selection details live in adapters/redis/list-entries.ts.

## Routing override

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate
session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
Matrix read first; use owner-authorized route, separate vendor family/session; resume evaluator.

## S0

Assignment and memory read, issue preflight found no duplicate PR. MCP guidance consulted before
source research. Native KV probe confirms inclusive start and illegal prefix+start+end selector.
No production code changed before PLAN-EVAL. RTK missing; focused commands used directly.

## PLAN-EVAL round 1

FAIL_PLAN with five actionable blockers: preserve single-pass watch discovery, exact-prefix-key
parity in memory, use portable non-numeric ASCII fixtures, legal/direction-aware Deno bounds,
and make real multi-batch proof independent of module import order with bounded paging loops.
All addressed in locked plan decisions 5–8 before any implementation. Same evaluator resumed
for round 2; no owner-only decision required. PR closure conflict resolved by following the
later explicit delivery requirement in the supplied assignment; no hand closure or labels.

## PLAN-EVAL round 2

PASS, all five blockers resolved. Full independent verdict in plan-eval.md. Implementation
started only after this PASS. S0 reconcile: draft PR #2505 targets main, owner controls labels
and milestones; no new issue/PR comments required changes. No closing action performed.

## S1 implementation

Extracted bounded ordered Redis selection, reused existing heap/batch constants, and kept
unordered single-pass watch discovery private. Shared memory/Deno/Redis suite covers exclusive
bounds, limits, directions, cursor paging, exact-prefix exclusion, nesting, sibling/literal
prefixes and out-of-prefix ranges. Added real Redis subprocess proof that counts actual SCAN
calls and verifies one full scan per watch baseline and subsequent poll above window size.

Native Deno bounds retain native typed ordering: filter only exact equality when start is already
applied natively; do not reapply the memory string comparator to native numeric/byte/bigint bounds.
A focused Deno test covers 9/10/9n/10n and structurally equal byte-array prefixes. Secondary bounds
for combinations formerly rejected by native KV retain the existing shared comparison policy;
no universal typed-key parity claim is made.

Existing watch tests retain every race/starvation/debounce assertion; their IO pause/count seam
moved from public list to actual Redis SCAN/MGET commands. See memory-watch-test-seams.md.

Negative controls (fresh process, real Redis, SCAN count 16): restoring baseline Redis listing
makes the shared suite exit 1, with global-order, bounds and both cursor page sizes red; memory
and Deno cases remain green. Correcting only start exclusivity on baseline still exits 1 on global
order and paging. Restored fix hash matches its saved pre-control SHA-256; restored contract
then passes all cases. Raw private reports are summarized in validation-summary.json.

| Gate | Result |
| --- | --- |
| Structured package test wrapper, real Redis + native KV | 219 passed, 0 failed, 2 existing environment ignores |
| Structured package check/lint/TypeScript format | PASS, 55 selected files, zero findings |
| quality:gate (includes dependency and doctrine gates) | PASS, raw exit 0; durable private receipt |
| Full export-map structured doc lint | PASS, 0 diagnostics across four exports |
| JSR audit + package publish dry-run | PASS, raw exit 0; audit's baseline banner warning retained |
| Real Redis reproduction | 97 keys, limits 1/32, first 32-entry page traverses multiple real SCAN replies; exact sequence, no gaps/repeats |
| Watch performance regression | Above-window prefix: exactly one SCAN cycle at baseline and one per poll |
| Negative controls + restoration | Both baseline and exclusive-start-only baseline exit 1 on global order/paging; restored shared suite PASS |

One earlier full-suite run saw the unchanged 12-writer Redis atomic-contention test return 11
successes. The baseline and previous/final full runs pass with no atomic implementation changes.
No suppression or test deletion. Local scaffold runtime E2E intentionally not run per owner.
Independent substantive review and sign-off are pending; these gate results are not self-certification.

## IMPL-EVAL round 1 correction

CHANGES: preserve kvdex bridge native inclusive start. Added one-entry ordered boundary translation
before the forward stream or after the reverse stream; it counts toward limits and cursor filters.
Reverse reads the start entry only if the preceding stream did not fill the requested limit. A
focused native-vs-bridge suite covers all three adapters, existing/missing start, limits and both
directions plus cursor continuation. Expanded surface recorded in supervisor.md and drift.md.

Also fixed the fractional-limit heap-cap bypass found during self-review and clarified that every
SCAN visits the whole Redis database, including other namespaces. No index or codec migration.

Correction gates: 223 package tests passed, 0 failed, 2 existing environment ignores; all 56
package TypeScript files pass structured check/lint/fmt; quality:gate, four-export doc lint,
JSR audit and package publish dry-run exit 0. Independent re-review pending. Raw/hashed evidence
is summarized in validation-summary.json.

## Independent slice review / S1 reconcile

IMPL-EVAL round2 PASS, same independent Anthropic session. Reviewer substantively verified the
bridge correction and heap guard, independently ran92focused tests with real Redis (0failed,
0ignored), and independently checked/linted all56package files. See evaluate.md. This is the
substantive review before the implementation commit, not generator self-certification.

S1 reconcile: #2132 remains the scoped issue, PR #2505 targets main, no additional reviewer
threads require scope changes. Owner retains label/milestone/merge authority. Planned release
wiring surfaces were not touched; source changes stay within the declared surface including the
recorded bridge expansion. No lock or assignment-file churn. Push this slice, record its exact
commit in the PR phase comment, then mark ready and perform final exact-head evaluation. Final
verdict belongs on the PR without a subsequent evidence commit changing the reviewed SHA.
