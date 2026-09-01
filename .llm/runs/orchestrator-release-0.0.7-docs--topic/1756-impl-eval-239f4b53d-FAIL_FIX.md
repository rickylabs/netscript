# IMPL-EVAL verdict — FAIL_FIX

GLM 5.3 Flash · effort `max` · evaluated head `239f4b53d` (pushed head `fb1061d5d` + the ci.yml commit).
Two blocking findings: F1 (silent revert of #1740 in four stream factories) and F2 (the arity shim
launders generic constraint violations). Disposition recorded on the PR; F1 fixed in `7fbda0e28`,
F2 accepted and tracked as #1892 with the false claim corrected in `57d49f718`.

---

All experiments restored and the tree is clean. I have everything needed for the verdict.

---

**[PHASE: IMPL-EVAL] [VERDICT: FAIL_FIX]** — evaluated head `239f4b53de799445d837ddb2640cebb4bc427b2d` (confirmed via `git rev-parse HEAD`; exactly the pushed head `fb1061d5d` + the 8-line `ci.yml` commit; tree identical to what merges). FAIL_FIX for two findings below — both precisely scoped and mechanically repairable; the gate itself, the (C) restoration, the (B) scanner change, the (D)/(E) repairs, and six of the seven acceptance boxes all verified sound.

## What I reproduced (all commands run at `239f4b53d`)

| Claim | Result |
|---|---|
| Ceilings untouched | `jsdoc-example-policy.ts` is a new file whose ratchet is exactly `maximumDeferredUnboundName: 116`, `maximumDeferredTypeError: 20` (floors 349/348/348, `maximumExempt: 0`). No raise. |
| Census | `PASS members=35 files=2037 examples=358 candidates=357 checked=357 exempt=0 non_ts=1 failures=0`, `deferredCensus={"unboundName":116,"typeError":15}`, exit 0, ratchet empty. Deferred output enumerated: 116 unbound + 15 typeError = 131. |
| Focused suite | **18 passed / 0 failed** (1m6s) — green here because this tree carries the `ci.yml` step. |
| Scanner suite | **44 passed / 0 failed**, including the new "multi-line template fixture source is data, but interpolated expressions are not" test. |
| Aspire parity | `check:aspire-version-parity` exit 0, `ok:true`, 812 checked — restored and passing. |
| Asset freshness | `check:assets-barrel` and `check:publish-assets` exit 0; the barrel check regenerates and diffs `agent-tools.generated.ts` (which this PR modifies), so the checked-in barrel is exactly what the generator produces. |
| `ci.yml` | +8/−0; `- name:` set-difference shows exactly one added step ("JSDoc example import and fence integrity"), 49→50 steps, wired through `run-gate.ts --gate jsdoc-example-compile`. No step lost. |
| Hygiene | `git diff --check 82a2527e2..HEAD` clean; `deno.lock` unchanged vs `82a2527e2`; tree clean after every mutation. |
| (C) set-differences | Task names 105→107, **zero missing vs both `82a2527e2` and `102ef8a10`**, additions exactly `docs:jsdoc-examples` + `docs:jsdoc-examples:test`; gate ids 32→33, zero missing, addition exactly `jsdoc-example-compile`; **no duplicate keys**; the three historically-sensitive commands (`check:aspire-version-parity`, `agentic:claude-openrouter-gateway`, `agentic:claude-hook-log` incl. #1774's narrowed permissions) byte-identical to main. |
| Wholesale-revert sweep | For every PR-modified file with deletions I compared HEAD against its last 15 main-ancestor versions: **zero exact wholesale reverts** — but see F1 for the partial-revert chimeras this exact-match sweep cannot see. |
| (B) before/after | Base scanner over `--root packages --root plugins --root .llm/tools --root docs/site`: **5 findings**; head: **4**. Exactly one removed: `.llm/tools/docs/snippet-supports.ts:79` `explicit-any`, text `export const db: any = {};` — which I confirmed sits **inside a `writeSnippetFile(...)` template literal**, i.e. emitted fixture text, not scanned-module syntax. My own independent probe (not the checked-in test) confirms `${...}` interpolation is still scanned: an `any` nested inside a template-within-interpolation on line 5 was flagged, the interior `any` was not, a real `any` was. |
| (D) specifiers | All are real published entrypoints, read from each package's `deno.json`: `@netscript/plugin-sagas/runtime` (`plugins/sagas` exports `./runtime`, which re-exports `SagaMessage`, `SagaPublisherPort`, `publishSagaOrThrow` from plugin-sagas-core); `@netscript/service` `.` re-exports `createContractAuthorizer`, `createService`, `AuthenticatorPort`, `ContractPolicyContract`, `MatchAwareAuthorizerPort`, `ServiceRouter`; `@netscript/fresh/navigation` re-exports `ComponentChild`. `fallback?: MatchAwareAuthorizerPort` confirmed at `options.ts:41` — a plain `AuthorizerPort` (no `authorizeMatch`) cannot satisfy it, so the repaired example states the real contract. |
| Gate bites — M1 | Reverting the `keyed-partial.tsx` repair: exit 1, `ratchet failure: deferred unboundName 117 > 116`. |
| Gate bites — M2 | `import { ordersClient } from './api-clients.ts'` in `create-service-query-utils.ts`: exit 1, `relative/absolute import "./api-clients.ts" is not a published consumer specifier` at `create-service-query-utils.ts · symbol createServiceQueryUtils · example 1 · fence 1`. |
| Gate bites — M3 | Relative contract import in `packages/sdk/src/desktop/mod.ts`: exit 1, same diagnostic form, `module · example 1 · fence 1`. |
| Gate bites — M4/M5 | Disabling the ci.yml step fails the workflow test (0/1); restoring the base scanner fails the regression test (28/1). Both load-bearing; both restored clean. |
| **M6 (my mutation, per the coordinator's (A) test)** | Injected `declare const evalViolation: ServiceHandlerContext<number>;` — violating the published `extends object` constraint — into the real published example. **Gate: PASS, exit 0, census byte-identical at 116/15.** The violation is not deferred, not counted, not enforced. |
| **M7 (shim reversion)** | Forcing the shim to the old bare alias: typeError 15→**21**, `ratchet failure: deferred typeError 21 > 20`, exit 1. The old shim suppressed **six** examples at this tree. |

## The two merge-blocking findings

**F1 — Silent revert of #1740 content in four shipped files (significant, undisclosed).** The salvage commit `c0433f915` carried `plugins/{workers,auth,sagas,triggers}/streams/factory.ts` from a pre-#1740 base. `2a1248d33` (#1740, "remove runtime literal ports… restore Aspire discovery in plugin factories") had removed the literal fallback, rewritten the module docs to "Aspire-discovered durable streams service", and changed the example to `streamsServiceUrl`. This PR's head reverses all three — including **shipped implementation code**: `const baseUrl = options.baseUrl ?? 'http://localhost:4437';` re-added, where main consults `getStreamsUrl()` (`DURABLE_STREAMS_URL` → Aspire `services__streams__http__0` → VITE vars). With the fallback restored, the discovery chain is never consulted when no base URL is passed — a real behavior regression in all four plugins, not just prose. I found **no disclosure** in the salvage commit message, worklog, drift, plan, or PR body (the commit message frames all 23 touched files as "JSDoc @example fixes"), and **no gate catches it**: `check:aspire-host-ports` reports "OK — no pinned host ports" (959 files) at this head — a fitness-gate scope hole worth its own issue. This is exactly the recurring salvage class; the exact-match sweep missed it because the files are chimeras (stale implementation + new example text).

**F2 — The arity-faithful shim launders constraint violations, and the gate discards unattributed compiler errors (moderate).** The coordinator's required property for (A) **fails**. For every constrained generic, the emitted alias `type X<P1 = any> = import(spec).X<P1>;` fails **TS2344 at its own declaration** ("Type 'P1' does not satisfy the constraint 'object'" — reproduced against the real `@netscript/service` `ServiceHandlerContext`), valid and violating usages are indistinguishable at usage sites, and that error lands in the unattributed `preamble.ts`, which `classifyDenoCheckDiagnostics` cannot attribute and `unclassifiedCompilerFailure` only surfaces when **zero** examples have classified failures — never true here (131 deferred). M6 proves it end-to-end. The commit's claim "the real constraints are still enforced where the alias applies them" is false. The fix's *direction* was right (see (A) below); the implementation needs repair: inject `import type { X } from '<publicSpecifier>'` into the synthetic example module header (real constraints, no phantom arity), or mirror the constraint text — and unattributed `deno check` diagnostics must be counted/attributed rather than dropped while any deferred corpus exists.

Minor: **F3** — the commit message and box-2 evidence say the old shim suppressed "eight" examples; I measured **six** (M7). The body's census section already self-corrected to 6. **F4** — the PR body's numbers are stale at this head (it claims `files=2033 examples=355 candidates=354 checked=354`; measured 2037/358/357/357), its commit table cites pre-rebase SHAs (`76dd2bfaa`…) that do not exist on this branch, and its census table cites `main 38f2ce735` where this tree's base is `102ef8a10`.

## Judgments on the coordinator's five points

- **(A)** Direction correct, implementation unsound. Confirmed: `ServiceHandlerContext<TCustom extends object = Record<never, never>>` is genuinely generic+constrained on the published surface and its example (`ServiceHandlerContext<{ readonly tenant: string }>`) was correct; the old shim's `type X = import(spec).X` made it fail TS2315 (M7 shows the class of failures); repairing the documentation would have corrupted a correct surface. So fixing the tool was right. But as built it fails the coordinator's own bite-test (F2/M6) — a shim that launders type errors is what we got, for constraints at least.
- **(B)** Verified and, with one caveat, endorsed. The flagged line is emitted fixture text; the change removes exactly that one false positive corpus-wide; interpolation scanning is retained (proven independently of the test); the regression test bites. It belongs in this PR: the false positive was created by this PR's own new tooling file (`snippet-supports.ts`), and leaving it would redden the CI quality job. I would have kept it — labeled as tooling, which it is. The residual leniency (template-interior text never scanned) is doctrine-consistent and costs nothing measurable today.
- **(C)** Honored in full: zero missing task names and gate ids against both bases, additions exactly the three claimed, no duplicate keys, sensitive commands byte-identical — **except** that the same content-level audit surfaced F1, a sixth-instance-class revert that was *not* found late and is still present.
- **(D)** Faithful, not just green. All three repairs preserve teaching intent with typed stand-ins consistent with repo convention (`declare const`); the sdk-client ternary fix removes a TS2322 a copying consumer would genuinely hit; the `fallback` claim is verified against the real signature. Every import specifier is a real published entrypoint (verified from each `deno.json`, not merely resolved).
- **(E)** Right call. #1848's two examples took `unboundName` to 118, crossing the ceiling; the ruling forbade raising it, so repairing the freshly merged source was the only compliant move. The stand-ins are faithful — a reader pasting the `KeyedPartial` block gets a compiling demonstration of the published API with `ComponentChild` genuinely re-exported from `@netscript/fresh/navigation` (verified in `navigation/mod.ts` and `packages/fresh/deno.json`) — and the `@module` example's `declare const currentRoute: { value: string }` matches repo convention.

## Acceptance evidence (six entries) and the withheld seventh

All six are truthful, two reproduced verbatim by mutation (boxes 5 and 6 — my M2/M3 diagnostics match the quoted strings character-for-character), boxes 1–4 verified by direct runs and code reading. Box 2's "(unblocking 8 previously mis-classified…)" parenthetical is wrong (measured 6; F3). Withholding the seventh box ("the gate runs in CI…") was the **right call, not an evasion**: at the pushed head `fb1061d5d` the `ci.yml` step did not exist and the credential could not push it, so claiming it would have mirrored a tick onto #1533 for something the head did not do. This tree **does** have the step (verified: 49→50 steps, gate wired) — so the box must be *added* to the block at merge time rather than left withheld.

## Not reproduced / not established

- The "before repair" census of `118/22` attributed to `main 38f2ce735`, and salvage-base numbers generally — those intermediate trees are not available here; the 22→15 accounting is *consistent* with my measurements (M7: 6 shim-suppressed + 1 sdk-client repair) but I could not measure 118/22 independently.
- A precise count of constrained-generic documented owners affected by F2's TS2344 preamble defect (at least `ServiceHandlerContext` is proven; the errors are invisible at gate level by construction, so the census cannot enumerate them).
- The body's stale corpus/commit-SHA numbers (F4) — I report them as discrepancies, not falsehoods.

## Required fixes (both mechanical)

1. **F1**: restore #1740's implementation and module docs in the four `plugins/*/streams/factory.ts` files; keep the corrected published import specifier and make the example faithful with `declare const streamsServiceUrl: string;` (or equivalent) instead of the literal `4437`. File the `check:aspire-host-ports` scope hole so this class is gated next time.
2. **F2**: make the shim sound for constrained generics (direct `import type` injection into the synthetic module, or constraint mirroring) and stop discarding unattributed `deno check` diagnostics while a deferred corpus exists. Add the test the coordinator asked for: a violating type argument through the real shim must surface as a deferred diagnostic.
3. F3/F4: correct "eight"→"six", refresh the body's census numbers and commit table at merge, and add the seventh acceptance box once this tree is what merges.

Everything else — the gate, the ratchet, the (C) restoration, (B), (D), (E) — I verified independently and it stands.