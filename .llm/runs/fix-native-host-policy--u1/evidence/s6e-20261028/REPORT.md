# S6e streams caller abort and ordinary drain source gate complete

Only `plugins/streams/services/src/service-lifecycle_test.ts` changes: **357/430 lines**,14793 bytes,
SHA256 `4833545d1551d8634624cfba8b04fef84699d1fcff59957ec7afae6cc6df5e7d`.
The accepted165-line/6584-byte S6d prefix is byte-exact, SHA256
`769b9a73f46c8b3a24dc4e0c2f44b27a6e9c40bd5b2b31186445c0205d5634b8`.
`source.final.ts` is the complete owner; `source.diff` is the192-line append against checkpoint.
All116 original protected bindings plus148 newly checkpointed paths match: **264/264**.

The accepted S6d checkpoint is signed-off/pushed as9d4580e430b1be8d536d0d1c7be9e7d60342b6f5.
Its149 index/HEAD paths and142 raw archives were byte-audited; original7/1/French10048 error stays
unchanged in the archive. PR2421 remains draft. S6e is not staged, checkpointed or pushed.

## Native lifecycle and exact controls

Installed MCP find_guidance and the exact graceful-shutdown ServeOptions section were used,
along with the actual native listener/coordinator and prior workers qualification. Streams owns
no Deno KV. Existing native fixture authority, compiler argv,30s/2s/32KiB child bounds and
clear synthetic environment are unchanged. Both new Deno.test registrations explicitly enable
sanitizeOps, sanitizeResources and sanitizeExit. Each row uses a fresh sandbox/checked child.

| Row | Actual observation | Outcome and cleanup |
| --- | --- | --- |
| abort-present | Real front/upstream200 bodies equal s6e-abort-real-stream; caller abort releases upstream61493 and front56339 before any manual stop | child0; both ports rebind again after native stop; cleanup/success markers exactly once |
| abort-omitted | Same real consumed stream reads; omitted signal keeps both listeners bound through the fixed deadline | child1 exactly ABORT_DID_NOT_RELEASE; real manual stops and upstream56343/front57234 rebind; cleanup marker once, no success marker |
| drain-native | Real raw GET held inside authentication; both actual and observed stops pending before release; front65435 rebinds while request remains held | release, consumed200 s6e-drain-real-stream, both native stops settle, upstream64624/front65435 rebind; child0 |
| drain-observation-negative | Both actual stops remain pending; only the explicitly labeled first observation is fulfilled | child1 exactly DRAIN_COMPLETED_BEFORE_RELEASE; release still occurs, real200 body consumed, both native stops settle, upstream61882/front51612 rebind |

Every rebind loop uses one fixed performance.now()+2000 deadline,10ms retries only while ports
remain occupied, and retries only Deno.errors.AddrInUse. Other native errors propagate. Abort's
positive port proof is before manual stop; its negative fails exactly after the bounded oracle.
The drain negative replaces only an observation promise, not native stop or request execution.
The gate always releases after any failure. Both actual stop promises retain rejection handlers;
real request consumption and stop settlement precede final both-port rebind/cleanup markers.
Primary errors remain first; cleanup failures would produce AggregateError and fail exact controls.
The nativeStopsSettled field counts the two concurrently initiated drain promises (zero for abort);
the common cleanup separately awaits two manual stop calls for every running handle.

## Actual gates and settlement

- Owning suite: **10 passed /0 failed /0 ignored**,23,499ms. Original eight tests remain intact;
  S6b stays deferred. Both expected negative child exit1/error lines are retained as raw evidence.
- Seven selected files pass types/lint/fmt, with no dropped files, refusals, failed batches or
  diagnostics. Changed-owner quality passes with0 findings and0 allowances.
- Thirty-six captured runtime-fixture children settle status/stdout/stderr/stdin. Thirteen owned
  scratch/profile paths are verified absent;24 native addon hash comparisons match. Runtime
  children required no timeout/overflow kill. Frozen S4 watchdog/output controls retain their
  separate behavior. No extra authority, package graph fetch, lock change or cleanup bypass.
- `gates/execution.json` records actual argv, executable, environment, process identifiers,
  timestamps, statuses and raw output sizes. `gate-hashes.json` binds all final gate reports.
  `source-proof.json` binds protected source/prefix and all four actual row results, SHA256
  `139a09f3d56e8127fd98502142453746b5e7373bb5ac1525f309b716c850ce3d`.

No production/helper/permission/config/lock/debt changes, whole-architecture rerun, OS signal,
forced-timeout/SSE, storage/legacy, independent IMPL or full-U1 claim. Windows qualification only;
Linux remains pending genuine CI. Root reviews complete source/controls before S6e checkpoint.
