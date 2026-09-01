# IMPL-EVAL — #1387 Slice 3 (sanctioned second opinion)

**Evaluator:** OpenRouter · DeepSeek V4 Flash 0731 · max, separate session, opposite family to the
Codex author. Dispatched under coordinator routing-update authorization after the temporary Opus 5
evaluator had already terminated; both verdicts are preserved per that instruction.

I have everything I need. All verification is complete, the working tree is clean, and I have an independent, fully-reasoned position. Here is my verdict.

---

# IMPL-EVAL — #1387 Slice 3 (typed context runtime composition)

**Evaluator:** Claude, separate opposite-family session (Codex-authored work).
**Certified head:** content `c297064aa76ca1b2b790f399adfb899e95c03920` (evidence head `248b2f062322106c2bf57e6ddd3d4e32e0b446d6`).
**Verdict:** **ACCEPTED_WITH_FINDINGS** at `c297064aa` — independent confirmation of the run's existing acceptance, with all six judgment points verified and two non-blocking findings beyond Tier-A's F-1 confirmed.

I evaluated this content independently. I read the full diff, the plan's Slice 2/3 sections, drift D-3–D-8, the Tier-A review, the prior Slice 2 IMPL-EVAL, and re-ran every contracted gate myself in this worktree. I did not take Tier-A's claims on trust, and I note that another separate-session evaluator already accepted this head (`2d7d1b79`); I did not copy its verdict — I verified each of its points on my own before concurring.

## Independent verification

| Judgment point | Method | Result |
| --- | --- | --- |
| Evidence head product-neutral | `git diff --stat c297064aa..248b2f062 -- packages plugins docs templates` | **empty** (re-ran, not taken on trust) |
| Ceiling | `git diff --name-status 8e1d639d2..c297064aa` | exactly 4 paths: `service-builder-impl.ts`, `service-builder_test.ts`, `handlers_test.ts`, `auth/builder-auth_test.ts` — no breach |
| `deno.lock` | sha256 at base, content, worktree | identical `edfa0c24b70e…` all three |
| Scoped check | wrapper `--include ^packages/service/` (cold) | 45 files, 0 batches failed, 0 occurrences — PASS |
| Service tests | `deno task test packages/service/tests` | 92 / 92 passed — PASS |
| Scoped lint / fmt:check | wrappers | both exit 0 — PASS |
| `quality:gate` | `quality:scan && arch:check` | exit 0; `quality:scan` reports `findings: []`, allowances unchanged — the test casts trip nothing |
| `check:mcp-export-corpus` | direct run | exit 0, **sha256 `510632b1…` byte-identical to the receipt** — proves no public surface moved |
| `docs:exports-drift` | direct run | exit 0, PASS |

## Point-by-point ruling

**1. Ceiling — PASS.** Exactly the four files; `deno.lock` byte-identical.

**2. Non-mutation is proved, not asserted.** `service-builder_test.ts:51-82` freezes the factory result (`Object.freeze`) and asserts `assertNotStrictEquals(context, factoryResult)` — a fresh object — plus `assertEquals(factoryResult, { tenant, tags })` and `Object.hasOwn(factoryResult, 'db') === false`. The `builder-auth_test.ts:82-111` principal test does the same with `Object.hasOwn(factoryResult, 'principal')`. Against the old mutating implementation this suite **fails in three independent ways**: (a) identity assertion fails (same reference), (b) `Object.hasOwn` on the factory would be true, and (c) assigning to a frozen object throws in strict mode. The prior evaluator empirically confirmed this by in-place revert (89/3 failed); I reached the same conclusion by analysis and corroborated it. No happy-path-only coverage here.

**3. D-8 resolved in the correct (runtime) direction.** `service-builder-impl.ts:286-299` builds `traceHeaders` by conditional spread — only headers actually present become keys — so an own key valued `undefined` is no longer producible. `db` and `principal` are each spread only under a truthy guard, so they too cannot be own-`undefined`. The published `ServiceHandlerContext.traceHeaders: Readonly<Record<string, string>>` (types.ts:289) is now true of the runtime, and the internal `| undefined` annotation is gone. Every absence claim in the tests uses `Object.hasOwn` — the only assertion that distinguishes absent from present-and-`undefined`. The two D-8 regression cases (`Object.hasOwn(parentOnly.traceHeaders, 'tracestate') === false` at handlers_test.ts:77, and `traceparent` at :81) fail against the old defect both by `Object.hasOwn` and by key-count in `assertEquals`. Verified.

**4. Behaviour only — PASS.** `mcp-export-corpus` passes with a byte-identical sha to the fresh generator run (I reproduced it), and `exports-drift` passes — no exported signature or JSDoc moved. A moved corpus would have been the tell; there is none.

**5. Evidence integrity — PASS.** All seven top-level receipts: `gitHead == actualGitHead == c297064aa`, all PASS, verified by **argv + durationMs** (not exitCode): check 2949ms/45 files, test 6891ms/92, quality 8436ms, corpus 8998ms, exports-drift 3407ms, lint 548ms, fmt 538ms. None match the "exit-1-from-usage-error-in-7ms" red pattern; I reproduced all seven green. Slice 1 set intact under `slice-1-2ddd6048/` (7 gate receipts + evidence-set at `2ddd6048`). Slice 2 set intact under `slice-2-f9b32b4f/` (11 files; 7 at `f9b32b4f` per its evidence-set, 3 supplementary at `04d22e7e1` — exactly the D-5/D-6 catalog-fix recuts, consistent with recorded history). Top level holds only Slice 3's set + its evidence-set.

**6. F-1 ruling — the cast is acceptable.** The tests reach the private `buildRpcContext` via `as unknown as RpcContextBuilder`. I confirm it is the only seam: the composed context has no public observation point short of a full `withRPC()` + `app.request()` integration path, and `wireRpc` invokes this exact method (`service-builder-impl.ts:502`). The cast exercises the real method on the real instance — it is not a mock. `quality:scan` flags zero new findings from it (the harness `as unknown as` rule targets product-code casts used to green a wrapper, the #745 class; this is a test-file cast on a private seam). It is a genuine smell worth recording — a test that must cast away privacy is evidence the composition has no public observation point, the same surface question as #1787 — but not a defect that required a different solution here.

## Findings (all non-blocking)

- **F-1 (carried from Tier-A).** Private-seam cast in tests; acceptable coverage, observation only.
- **F-A (confirmed independently, also raised by the prior evaluator).** No `build()`-level test exercises the real `wireRpc` wiring of `buildRpcContext` (`service-builder-impl.ts:502`). I confirmed no test in `packages/service/tests/` calls `.withRPC()` at all — a **pre-existing** gap this slice inherits, not introduces. File alongside #1787.
- **F-B (confirmed independently, also raised by the prior evaluator).** Switching mutate-and-return to spread (`service-builder-impl.ts:286`) drops non-own/prototype members from a factory that returns a class instance — a real behavioural difference from the old code, low severity (factories are documented with plain-object examples). The natural mitigation is a JSDoc note on `withContext`'s public declaration stating the factory result is shallow-copied into a fresh context object; that declaration lives in `service-builder.ts`, outside this slice's ceiling, so deferral is correct.

## D-7 deferral ruling

I agree the deferral is sound. `service-builder.ts` appears in the plan exactly once — on Slice 2's ceiling, no later slice owns it. #1787 is verified **OPEN** ("ServiceBuilder's TCustom is a phantom type parameter"). Giving `TCustom` a consumer position would make it invariant, a breaking change. Neither this slice nor any remaining slice could reach it. The deferral is correct, not a dodge.

## Provenance weighed

The two prior stops (D-7, D-8) were brief-caused and correctly stopped. This content resolves D-8 at the runtime — the third option the second brief omitted — without any ceiling amendment. The drift entries describe the process, not a defect in this content.

## What I could not verify (stated plainly)

- I did not run `e2e:cli`, Aspire, Docker, or browser gates — prohibited by the brief; no runtime lease held.
- I did not repeat the prior evaluator's in-place revert experiment; my brief forbids modifying the tree, and the working tree is clean. My non-mutation conclusion rests on test analysis (airtight on its own) corroborated by the prior empirical result.
- I did not write `evaluate.md`: the committed file is the Slice 2 record, and the prior Slice 3 evaluator likewise left it untouched (verdicts here live in the commit trail and `tier-a-*.md`). The supervisor should record this verdict per the run's existing convention.

---

**Verdict: `ACCEPTED_WITH_FINDINGS` at content head `c297064aa76ca1b2b790f399adfb899e95c03920`.** The ceiling was respected exactly, the lock is byte-identical, all seven contracted gates pass and were independently reproduced, D-8 is resolved in the correct direction, and non-mutation is proved rather than asserted. Findings F-1, F-A, F-B are all non-blocking observations; the `TCustom` deferral to #1787 is correct.