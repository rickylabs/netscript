# IMPL-EVAL — refactor-sdk-transport-policy--1351 (#1351 / PR #1889)

- Evaluator: separate opposite-family session (Claude Code / GLM 5.3 Flash via OpenRouter),
  2026-09-01. Read-only over source; the only artifact written is this file.
- Evaluated head: `6a1a001ad` (branch `refactor/sdk-transport-policy`; PR #1889 draft, head
  verified equal via `gh api repos/rickylabs/netscript/pulls/1889`).
- Slice footprint re-derived: `git diff 7d18ef104..HEAD` (merge base of HEAD vs `origin/main`)
  = 26 files, all `packages/sdk` + `packages/contracts` source/tests/READMEs plus run artifacts.
  No CLI, Aspire, workflow, agentic-tooling, manifest, or lock file.
- Inputs read: `plan.md`, `plan-eval.md` (PASS at `871caac96`), `worklog.md`, `context-pack.md`,
  `drift.md`, `supervisor.md`, `leak-report.md`, `codex-thread-ids.md`, PR #1889 per-slice
  comments, focused source, and the full branch diff.
- All exits below are real captured exits (`out=$(cmd 2>&1); rc=$?`), no pipelines for verdicts.

## The two deciding properties

### 1. Forward-compat enforcement — contributions never observe the method — VERIFIED ENFORCED

The enforcement is real, five independent layers, each re-verified in source:

1. **Types** — `SdkClientPrepareOptions` is exactly `context | signal | procedure | transport |
   input` (`ports/sdk-client-contribution.ts:42-55`); `SdkClientProcedureDescriptor` = `path |
   meta`; `SdkClientTransportDescriptor` = `kind | origin | rpcPath | secure`; `meta` carries only
   `access`/`policy.cache`. Compile-time fixture
   `tests/type-fixtures/sdk-client-contributions-rfc_type.ts` asserts the exact key set.
2. **Construction** — `transportPolicy` is a sibling client option (`ports/service-client.ts`);
   `CONTRIBUTION_FIELDS` exact validation (`prepared-call.ts:21-28,207`) rejects injected policy
   fields; Desktop rejects any `contributions` key outright.
3. **Runtime projection** — preparation builds a fresh frozen five-key snapshot
   (`prepared-call.ts:447-453`); the logical/prepared call is never spread into it; context
   projection copies only declared keys (`projectContributionContext`). The attempt context
   carrying the private symbol is built *after* preparation (`createAttemptContext`) and is never
   visible to a contribution.
4. **Private storage** — the resolved decision lives on the frozen `SdkClientLogicalCall` and is
   carried only under the unexported `stableV1PreparedCall` symbol (`stable-v1-adapter.ts:23`).
5. **Executable boundary** — `deno doc --json` probes over all four public entrypoints reject the
   private names; a packed-tarball + `npm install` + `deno check` probe rejects
   `@netscript/sdk/internal/transport-policy` and three other subpaths (ran green inside the
   measured suite, below).

**Independent adversarial attempts (this evaluator's own probes, scratch under `.llm/tmp/`):**

| Probe | Captured exit | Result |
| --- | --- | --- |
| Runtime defeat: public-API `createServiceClient` + a hostile contribution whose `prepare` deep-walks its entire reachable graph (`Reflect.ownKeys`, prototype chains, depth 6, cycle-safe) hunting keys `method`/`inferredMethod`/`fallbackMethod`/`maxUrlLength`/`dedupePredicate`/`resolveCall`/`transportPolicy`, symbols containing `prepared-call`, and string literals `GET/POST/PUT/PATCH/DELETE` | `RUNTIME_PROBE_RC=0` | Zero hits. The probe proved the path was real, not vacuous: the wire request was observed GET (contract-derived), the contribution's header was present on the wire, and the call resolved. |
| Type defeat: `deno check` fixture asserting exact key equalities for all three contribution-facing types plus hostile `keyof`/`extends` extractions (`'method' extends keyof …`) | `TYPE_PROBE_RC=0` | No type-level path from a contribution's inputs to any HTTP-method identity. (One assertion failure on the first run was this evaluator's wrong expectation about `access`'s two fields — not a leak.) |
| Barrel/re-export probe: dynamic `import` of all four public entrypoints, walking every runtime export for the internal identities | `BARREL_PROBE_RC=0` | No internal policy identity re-exported; zero symbols in public runtime exports. |

Boundary note (not a bypass): inside the monorepo a consumer can still deep-import
`src/internal/transport-policy.ts` by relative path; the enforced boundary is the published
surface, where the packed-import probe proves rejection. The override callback receiving
`inferredMethod` is the sanctioned owner-facing override, not a contribution.

### 2. Header-safe dedupe and reconnect tests are capable of failing — VERIFIED

`tests/integration/client-contribution-adapter_test.ts:412-499` uses genuinely pending fetches
(a never-settling `fetch` stub recording `Headers`), issues both `link.call`s before awaiting, and
waits for the first fetch to be pending plus a macrotask tick before asserting:

- same `authorization`+`accept-language` → **exactly 1** pending fetch carrying those headers
  (a never-coalesce regression yields 2 and fails; a headers-blind over-coalesce passes here);
- distinct headers → **exactly 2** pending fetches with the `Bearer A/B` + `en-US/fr-FR` pairs
  (closes the same-headers case's only vacuous-pass hole — the second dispatch demonstrably
  reaches `fetch` — and fails any headers-blind over-coalescing).

The pair is jointly falsifiable in both directions. Reconnect: strict-identity assertions prove
unary retry reuses one prepared call/decision (`preparedCalls[0] === preparedCalls[1]`, 1
preparation, 1 policy call, 2 attempts) and iterator reconnect starts a fresh epoch (2
preparations/2 policy calls across 4 attempts, rotated credentials `A,A,B,B`); abort starts no
epoch. All ran green in the measured suite.

## Also-verified properties

| # | Property | Verdict + evidence |
| --- | --- | --- |
| 3 | Contract-derived, not wire-derived | `resolveTransportPolicy`'s `dedupePredicate` is `(call) => call.method === 'GET'` over the frozen resolved decision (`internal/transport-policy.ts:198`); the HTTP link's `DedupeRequestsPlugin.filter` adapts from the prepared call, never `request` (`http-client-link.ts:165-174`). Grep over `packages/sdk/src`: the only `request.method`-shaped and `x-http-method-override`-shaped matches are substrings of the reserved-header blocklist string. `policy.cache` is an input: `resolveCache` selects explicit `context.cache` (three supported modes) → `procedure.meta.policy?.cache` → `'default'` inside `resolveCall`; non-policy modes (`reload`) keep default-group behavior with the fetch `cache` passthrough unchanged (`transport-policy_test.ts:40-46`; base `http-client-link.ts:176` passthrough preserved). |
| 4 | One owned function, two consumers, no link literals | `createServiceClient` (`service-client.ts:101`) and `createDesktopServiceClient` (`desktop-rpc-client.ts:31`) both call `resolveTransportPolicy`; `createHttpClientLink` requires the fully resolved `ResolvedTransportPolicy` and wires method/fallbackMethod/maxUrlLength/filter/groups exclusively from it (`http-client-link.ts:122-174,131-137`); base's three inline decisions (`method: inferRPCMethodFromContractRouter`, `filter: ({ request }) => request.method === 'GET'`, inline `force-cache` group at base lines 115/144/152) are gone. Desktop resolves the call and forwards the unchanged MessagePort frame; the POST-only Desktop test observes `inferredMethods === ['GET']` with no `POST` in any sent frame, and an invalid override result (`HEAD`) rejects before any send frame. |
| 5 | `port`/`timeout` deprecated no-ops, regression-tested | Both fields keep `@deprecated` with migration guidance and explicit "accepted but ignored" wording (`ports/service-client.ts`); live regression starts a real service and proves a wrong `port` (addr+1) still discovers, `timeout: 1` does not abort a 50 ms slow call, and pre-aborted explicit cancellation rejects identically on both clients (`service-client-runtime_test.ts`, green). SDK README "Transport policy" section documents both no-ops. |
| 6 | `transportPolicy?` single override point, resolved before contributions compose | Only one optional field on both option interfaces; exact validation rejects any other field and non-function `method`, and invalid returned methods (`HEAD`) throw per call. `createServiceClient` resolves policy **before** `validateSdkClientContributions`; Desktop resolves before the contribution rejection, with a dedicated test ("transport policy validation precedes Desktop contribution rejection"). The override fires before preparation: the retry test asserts `observations.length === 0` inside the method callback. |
| 7 | Zero dependency churn (re-derived) | `git diff --quiet 7d18ef104..HEAD -- deno.lock deno.json packages/sdk/deno.json packages/contracts/deno.json` → rc=0 (no diff); the 26-file name-status list contains no lock/manifest/catalog/workflow/agentic file; `deno.lock` resolves `@orpc/client|contract|server@1.14.6` (+ pre-existing `@orpc/otel`/`@orpc/shared@1.14.7` pair owned by #1879). Blocking condition did not occur. |
| 8 | No v2 / #1349 seam / unfrozen defaults / server-policy change | No `@orpc/*/v2`, `MethodOverrideHandlerPlugin`, or `allowMethods` anywhere in changed source; `ClientRetryPlugin({ default: { retry: 0 } })` byte-matches base; client construction still goes through `createORPCClient` with no new seam; no server/handler file in the diff. |

## Disclosed claims — falsification results (all commands at `6a1a001ad`)

| Claim | Evaluator re-derivation | Captured exit |
| --- | --- | --- |
| Root `deno task test` green | **4,724 passed / 0 failed / 19 ignored** (280 s) — count differs from the disclosed 4,716 because this head carries the dispatch-time main merge; 0 failed is the load-bearing part | `ROOTTEST_RC=0` |
| Focused suite green | Superset re-run: full `packages/sdk/tests` + `packages/contracts/tests` = **237 passed / 0 failed**, including the packed-tarball npm-install rejection probe actually executing | `RC=0` |
| Scoped check/lint/fmt | `run-deno-check/lint/fmt.ts --root packages/{contracts,sdk} --ext ts,tsx` — 27 + 101 files each, zero findings | 6 × `RC=0` |
| `quality:gate` | `quality:scan` + `arch:check`; only pre-existing repo-wide warnings (cli/services `export default`, `Deno.exit` in a test helper) — nothing from this slice | `QUALITY_GATE_RC=0` |
| Publish dry-run | "Dry run complete" | `PUBLISH_RC=0` |
| Doc-lint baseline | Re-derived exactly: SDK **3** errors / 3 private-type-ref / **0** missing-JSDoc / 0 other; contracts **9** / 9 / 0 / 0 — no count increase, no new diagnostic class | rc=1 as expected against the disclosed baseline |
| Commit trail | PR #1889 (draft, open, head `6a1a001ad`) carries per-slice comments: Slice 1 (17:41Z), Slice 2 (17:51Z), Slice 3 (17:55Z), IMPL handoff (18:44Z) | `PR_RC=0`, `COMMENTS_RC=0` |

## Gate 10 (scaffold.runtime E2E) — attribution judgment: EXTERNAL, non-blocking

Both failures occurred after 38 passing steps at `database.init` on an Aspire control-plane
`404 NotFound` for the *generated Postgres executable*, with two different generated resource
names, cleanup passing both times, and the leak reporter showing Aspire/Docker healthy with zero
survivors (`leak-report.md`). The 26-file slice footprint contains no CLI, Aspire, apphost,
scaffold, or workflow source — the SDK client link/policy code cannot influence Aspire's
generation or download of a Postgres executable — and every in-gate SDK-consuming step
(scaffold, generation, registries, type-checks) passed both times. I judge the failure genuinely
external infrastructure, not attributable to this change. This is a draft PR evaluation, not a
release cut, so the release-gate class does not block this verdict; the gate must be
re-established at merge readiness when Aspire retains the generated executable (context-pack Next
Steps already records exactly that, without widening #1351).

## Findings by severity

**Blocking — none.**

**Minor / process (non-blocking):**

1. **Unrecorded final merge.** The evaluated head `6a1a001ad` is a second merge of `origin/main`
   (`7d18ef104`) into the branch, committed 22:10 local, moments before the run dir was written;
   the implementation session's worklog records "no second integration was taken" (true of that
   session) and does not mention this dispatch-time merge. It is consistent with the supervisor
   handing the evaluator an up-to-date head (this evaluation prompt names `6a1a001ad`), and it
   introduces no slice content — but the run dir should note it when closing.
   *Disposition: record in `context-pack.md`/`drift.md` at close; no code action.*
2. **Vacuous-pass hole in one of two dedupe tests.** The same-headers coalescing test would also
   pass if the second call failed before dispatch; the companion distinct-headers test closes
   that hole by proving the second dispatch reaches `fetch`. *Disposition: none required; noted
   so the pair is never split apart in later refactors.*
3. **Codec-edge method bridge.** `stableV1CodecMethod` (`http-client-link.ts:96-105`) bridges the
   locked 8-method public vocabulary to stable-v1's narrower 5-method codec declaration via
   `Reflect` instead of a cast — an intentional, commented adapter per the worklog decision row;
   policy validation remains authoritative. *Disposition: none; keep the comment when stable-v1
   is replaced.*

## Verdict

Every locked plan section is implemented as written with no silent re-decision; both
issue-deciding properties are enforced and falsifiable, not merely intended; zero dependency
churn is re-derived at this head; all disclosed green gates were re-derived green (one test count
moved with the merge, still 0 failed); the one red gate is judged external and is owned as a
merge-readiness follow-up rather than hidden.

VERDICT: PASS
