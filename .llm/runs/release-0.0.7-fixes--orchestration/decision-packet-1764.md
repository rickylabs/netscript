# Decision packet — PR #1764 / issue #1368 (parked at the two-cycle owner boundary)

State: `status:impl`, draft, product head `ed270f2a`, corpus `89bfa6ca`, Tier-A `22f6fa61`.
PLAN-EVAL c2 `PASS_PLAN`; IMPL-EVAL c1 `FAIL_FIX`; IMPL-EVAL c2 `FAIL_IMPL` (terminal, both cycles spent).
Sole blocker is F-A. Not self-certified; no override applied.

## 1. Exact ceiling amendment requested

Add as ceiling item 20 — **one file, one assertion**:

`plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts`, line 62:

```
-    assertEquals(tracer.started.length, 1);
+    assertEquals(tracer.started.length, 2);
```

**Verified, not predicted.** Applied that single character in a throwaway detached worktree at
`22f6fa61`: whole `plugins/sagas` goes from exit 1 · 50 passed / 1 failed / 1 ignored to
**exit 0 · 51 passed / 0 failed / 1 ignored**. Nothing else in the file needs to change:

- l.63 `tracer.started[0]` still resolves to `saga.handle` (it starts first), so l.65's
  `assertEquals(started.name, 'saga.handle')` continues to pass.
- The second test's identical pin at l.106 is unaffected — its handler throws
  (`'service handler failed'`), so no `complete` cascade is produced and its count stays 1.

**Why this is a correction, not a weakening.** The test's definition returns `{ kind: 'complete' }`
and the pin encodes the pre-leaf world where `complete` emitted no span. Issue #1368 target item 1
exists precisely to make `saga.cascade.complete` emit from `SagaEngine`. The file is untouched by the
leaf and was green at base `f8b4f804` (2 passed / 0 failed), so the test is stale against the approved
plan rather than evidence of a product defect.

Optional hardening, if the owner prefers it over minimality: select the handle span by name instead of
by index. That is more than one assertion and I did not assume authorization for it.

## 2. Recertification options

| Option | What it costs | What it risks |
| --- | --- | --- |
| **A. Delta-scoped third IMPL-EVAL** — evaluator rules only on the amended assertion and the resulting green suite, carrying forward c2's verified rows | One short cycle | Lowest; independence preserved on the only unreviewed change |
| B. Full fresh IMPL-EVAL with the cycle count reset | A full cycle (~160k tokens); re-derives rows c2 just reproduced | Wasteful, but maximally conservative |
| C. Owner accepts the delta on supervisor Tier-A alone, no further evaluator | Nothing | Product change is nil, but no independent eye on the amendment; weakest record |

**Recommendation: A.** The blocker is a one-assertion correction to a test file outside the product
ceiling, with zero product-code change. Cycle 2 already reproduced every supervisor row, measured F2
and F3 directly, and issued explicit judgments on all five questions I posed — including that the
corpus `--check` recompute-and-compare is sufficient evidence and that the changed test literal is a
strengthening rather than manufactured green. A delta cycle preserves independence exactly where it is
still absent.

**This does not clear merge on its own.** Cycle 2's standing condition holds: the leaf cannot go
ready-merge while Flow-B consumer runtime is `NOT_RUN`. It must run green under a host lease, in CI, or
off-host first — and on this host AppHost boot is blocked by D-42/D-43, so CI or off-host is the
realistic route.

## 3. Also outstanding when unparked

- Base is still `f8b4f804`, now well behind main `de57fab0`. Integration and an exact-head re-cut are
  required before merge regardless of the amendment.
- Main advances through `de57fab0` are **inert** for this leaf's owned paths — verified zero files in
  saga territory across `3e5cbabf..de57fab0`, which is docs, #1770 run artifacts, and four generated
  carriers (`agent-docs.generated.ts`, `publish-assets.generated.ts`, `prose.json.gz`, `provenance.json`).
  The corpus carrier this leaf regenerated is not among them.
- F-C (info, unaddressed): `SagaEngine.handle` JSDoc does not document the widened `execution` parameter.
