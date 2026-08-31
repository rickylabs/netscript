# IMPL-EVAL — #1387 Slice 3

**Evaluator:** Anthropic Claude / **Opus 5 · medium**, separate session, opposite family to the Codex
author. **Coordinator-authorized bounded routing deviation** (Slice 3 only): the native Fable 5
opposite-family route hit a monthly spend limit after one turn (no verdict produced); the documented
OpenRouter fallback (DeepSeek V4 Flash 0731 · max) is unconfigured on this host
(`openrouter.env` absent, no `OPENROUTER_API_KEY`); the further AGY fallback has no general-purpose
evaluator launcher in the checked-in suite, only a fixed read-only canary probe. Dispatched via the
same checked-in interface (`claude-print.ts`) as every prior evaluator in this run. Not a
policy-wide waiver; does not count as a failed eval.

**Certified content head:** `c297064aa76ca1b2b790f399adfb899e95c03920`.
**Evidence head:** `248b2f062322106c2bf57e6ddd3d4e32e0b446d6` — re-confirmed product-neutral by the
evaluator itself (`git diff --stat -- packages plugins docs templates` empty; the diff is 9 files, all
under `.llm/runs/…/receipts/` plus `tier-a-slice-3.md`).

## Verdict: ACCEPTED_WITH_FINDINGS


## Verification performed (independently, not from receipts)

| Check | Result |
| --- | --- |
| Ceiling `8e1d639d2..c297064aa` | Exactly 4 files: `service-builder-impl.ts`, `service-builder_test.ts`, `handlers_test.ts`, `auth/builder-auth_test.ts`. No breach. |
| `deno.lock` | sha256 `edfa0c24b70e…1820c` at base **and** at both heads. Byte-identical. |
| Product neutrality `c297064aa..248b2f062` | `git diff --stat -- packages plugins docs templates` → **empty**. Re-run myself, not taken on trust. Full diff is 9 files, all under `.llm/runs/…/receipts/` + `tier-a-slice-3.md`. |
| `deno task test packages/service/tests` | exit 0, **92 passed / 0 failed** — matches receipt exactly. |
| `check`/`lint`/`fmt:check` scoped to `^packages/service/` | exit 0, 45 files each, 0 findings. |
| `quality:gate` | exit 0 (pre-existing `export default` WARNs, unchanged). |
| `docs:exports-drift` | `PASS`. |
| `check:mcp-export-corpus` | exit 0, sha256 `510632b1…`, 7628 symbols. Since no corpus file moved between base and content, this proves the generated surface at content **equals** the committed surface at base — item 4 confirmed independently. |
| Working tree after all work | clean at `248b2f062`. No commit, push, comment, or head movement by me. |

## 2 — Non-mutation is proved, and I proved the proof

I did not settle for reading the assertions. I reverted `service-builder-impl.ts` to the base version in place, re-ran the suite, and restored the file (tree verified clean afterwards). Against the old mutating implementation the suite goes **89 passed / 3 failed**, with exactly the three right failure modes:

- `service-builder_test.ts:51` → `TypeError: Cannot add property db, object is not extensible`
- `auth/builder-auth_test.ts:77` → `TypeError: Cannot add property principal, object is not extensible`
- `handlers_test.ts:65` → `assertEquals` diff showing the surplus `tracestate: undefined`

So: yes, this suite fails if the implementation still mutates. `Object.freeze` on the factory result plus ESM strict mode turns mutation into a throw rather than a silent pass, and `assertNotStrictEquals(context, factoryResult)` independently catches an identity return. This is a real proof, not a happy path.

## 3 — D-8 resolved in the correct direction

`buildRpcContext` (`service-builder-impl.ts:265-290`) now returns a fresh object built by conditional spread. Every framework field — `db`, `traceHeaders`, `principal` — is spread from `{}` when absent, so **no own key can ever exist with value `undefined`**. `traceHeaders` is assembled the same way per header, so the published `ServiceHandlerContext.traceHeaders: Readonly<Record<string, string>>` (`types.ts:289`) is now true of the runtime. `types.ts` was not touched — the fix landed inside the ceiling, which is the third door the previous dispatch was never offered.

Every absence claim uses `Object.hasOwn` (8 of them, all checked). Worth noting for the record: `@std/assert` 1.0.19's `assertEquals` *does* distinguish `{a, b: undefined}` from `{a}` — that's how the third failure above surfaced — so the `Object.hasOwn` assertions are correct belt-and-braces rather than the sole line of defence.

## 6 — Ruling on F-1 (the privacy cast)

**Acceptable here, but the supervisor understates it.** A public seam does exist: `ServiceBuilder.build(): ServiceApp` (`service-builder.ts:177`) would let a test dispatch a real request through an oRPC procedure and observe the composed context without casting. The concrete gap this leaves:

- **`service-builder-impl.ts:502`** — `wireRpc(…, (c) => this.buildRpcContext(c, traceContext), …)` — is the only wiring of the method under test, and **no test in the suite exercises it**. If that line regressed (callback dropped, `traceContext` inverted), all three new tests still pass.

I rule it non-blocking because the wiring at :502 is unchanged from base, no `build()`-level RPC test exists anywhere in `packages/service/tests/`, and building one is outside a behaviour-only slice whose stated scope is the composition itself. It is a pre-existing coverage gap this slice inherits, not one it introduces. It should be filed alongside #1787 rather than fixed here.

## Additional finding (not raised by Tier-A)

- **`service-builder-impl.ts:286`** — switching from mutate-and-return to spread also changes behaviour for a context factory that returns a **class instance**: the spread copies own enumerable properties only, so prototype methods and accessors are dropped from the handler context. `ContextFactory<TNext extends object>` (`service-builder.ts:135`) does not exclude such factories. Failure scenario: `.withContext(() => new RequestScope(c))` — handlers previously received a live `RequestScope` and can now only see its own data fields; a `context.can(...)` call throws `TypeError: not a function`. I judge this acceptable — it is inherent to "return a fresh object", which is the point of the slice, and every documented example uses an object literal — but it is an undocumented constraint on `withContext` and deserves a JSDoc line on the public declaration.

## Out of scope, and I agree with the deferral

The phantom `TCustom` (#1787) is correctly deferred. Fixing it needs a consumer position on the public `ServiceBuilder`, which makes the parameter invariant and is a breaking change; that is a plan-level decision, not slice work, and the only file that could carry it is not on Slice 3's ceiling. The deferral is right.

## Evidence integrity

Seven receipts at the top level plus `evidence-set.json` (`SUFFICIENT`, zero reasons). All seven have `gitHead == actualGitHead == c297064aa`. Verified by `argv` and `durationMs`, not `exitCode`: every `argv` is a real gate invocation with no usage error, and durations (538 ms fmt → 8998 ms corpus) track the work. `test-service.json` carries the full TAP summary `{passed: 92, failed: 0}` in its stdout tail, which I reproduced. The contracted Tier-A set for Slice 3 is check/lint/fmt + service tests + `quality:gate` + `mcp-export-corpus` + lock hash; the delivered set is that plus `exports-drift` — a superset.

Slice 1 (`slice-1-2ddd6048/`, 7 receipts + manifest) and Slice 2 (`slice-2-f9b32b4f/`, 10 receipts + manifest) are intact, all `gitHead == actualGitHead`, all `PASS`. Top level holds only Slice 3's set. One observation, not a defect and outside my scope: four of Slice 2's receipts are pinned at `04d22e7e1` rather than `f9b32b4f7` — that is Slice 2's own already-certified history, not movement here.

## What I could not verify

Nothing material was left unverified. I did not run `e2e:cli`, Aspire, Docker, or any browser gate, per the brief; no runtime lease was sought or held.