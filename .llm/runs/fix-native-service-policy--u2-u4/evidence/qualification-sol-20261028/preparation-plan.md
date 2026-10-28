use harness

# Qualification repair brief after U4

## Decision and authority

Preparation only. Propose three bounded repair leaves for the reproduced
timer/child/path defects, followed by a separate body-limit attribution leaf.
Root must accept this exact owner/gate/test-seam scope and select the next route
before implementation. Current Astra authority covered U2/U4 and this
preparation; it does not authorize a new repair lane or provider launch.

Base: `815122a889c4ef5bc203a6cd615cab7f8b97a673`, branch
`fix/native-service-policy`, worktree
`C:/Users/ericc/source/repos/netscript-native-service-policy-008`.
[Draft PR 2422](https://github.com/rickylabs/netscript/pull/2422) remains
OPEN/DRAFT at that head. Root's accepted U4 checkpoint and its 51-record bundle
are committed. U2/U4 source stays frozen until the next leaf is authorized; the
accepted baseline failures remain unwaived.

Coordinator source is commit `5cc5cd0f` in
`C:/Users/ericc/source/repos/eis-chat-netscript-008-foundation`, file
`.llm/runs/feat-netscript-008-foundation--s00-s01/s16-native-service-qualification-repair-20261028.md`,
SHA256 `1f397f7fece27ce57a957df2264ba186521c35fd9a5ccb2b85ad9f18557856df`. The
commit abbreviation and file hash identify different objects.

## SKILL

Use checked-in `.agents/skills/netscript-harness/SKILL.md`, doctrine and
archetype 4 gates, `.agents/skills/deno/SKILL.md` for native diagnostics, and
`netscript-pr` for any later checkpoint. Native NetScript MCP find_guidance and
exact service-doc retrieval were performed and retained in
[guidance-provenance.json](guidance-provenance.json). The broad guidance hits
were irrelevant and literal withBodyLimit search returned zero; actual source
and installed docs establish ownership. Installed services docs lines 361–406
define bounded native shutdown and `running.stop()`. No framework, connector or
public policy is to be rebuilt.

## Measured baseline and source bounds

Current U4 whole service: 615 pass / 8 fail / 0 ignored. Consumers: 25 / 1 / 0.
All eight service names and the consumer failure match prior reproduced baseline
categories. This is not a waiver. The exact unchanged-source root timer trace is
copied byte-for-byte here: [database-timer-trace.log](database-timer-trace.log),
SHA256 `499e981b8ff0c10cb3cd94f67ff9be112b5491a8943b7ed6ea78ed536baf0e53`. It
reports 0 pass / 1 fail, and the timer allocation is at
database-connectivity.ts:294. The copied
[body-limit trace](body-limit-trace.log), SHA256
`8814b14bbe272205913887efdfd2c0038bc548eeef43c1760e9a3c1380988496`, reports 0 /
1 and requestBody leakage but supplies no allocation stack.

[owner-inventory.json](owner-inventory.json) records exact current SHA256 and
physical line counts.

| Leaf                          | Proposed editable owner                                          | Current lines | Hard final cap |
| ----------------------------- | ---------------------------------------------------------------- | ------------: | -------------: |
| Q1 TCP ownership              | packages/service/src/diagnostics/database-connectivity.ts        |           471 |            500 |
| Q1 TCP regression             | packages/service/tests/database-connectivity_test.ts             |            76 |            360 |
| Q2 child ownership            | packages/service/tests/legacy-abort_test.ts                      |           152 |            230 |
| Q3 native file URL            | packages/plugin/tests/service/create-plugin-service-auth_test.ts |           196 |            230 |
| Q4 conditional body fixture   | packages/service/tests/body-limit_test.ts                        |           254 |            320 |
| Q4 conditional body primitive | packages/service/src/primitives/body-limit.ts                    |           112 |            160 |

Q1–Q3 are exactly four proposed editable owners. Q4's two owners are
inspect/diagnose-only until root accepts the actual ownership evidence and
selected delta. Six is the combined upper bound, not permission to edit both Q4
files. No new source/test owner, helper package, generated owner, export,
configuration, dependency, lock or debt growth. Readable lines, no formatting
golf.

Run-only owners include define-service_test.ts (197), legacy-abort-service.ts
(44), the existing rate-limit-address-key_test.ts (205), service
builder/runtime, all accepted U2/U4 auth/CORS sources and tests, and all other
consumer fixtures. Do not change the preapproved builder debt or acceptance
records. A later qualification note may document evidence in its own run;
product docs/API do not change for internal resource repairs.

## Q1: native TCP probe owns its work

Existing private checkTcpPort races Deno.connect against an unowned timer. A
successful connection closes, but its timeout remains active; a timeout also
leaves the losing connect promise unowned. The outer hook deliberately retries
three times, waits 2000 ms between attempts, and returns after diagnostics
instead of failing startup. Keep those semantics, provider/URI/localhost
resolution, query behavior, constants, messages and public signatures.

Replace only that private operation's ownership: one AbortController passed
through native Deno.connect signal, one explicitly retained timeout, and finally
cleanup on every completion. Do not retain a detached losing connect promise.
Close every successfully acquired connection, including a completion racing the
timeout; a timed-out attempt must not be classified successful. No fake
connector, exported test-only function, injected public option or database
adapter. Timer cleanup must be observable on success, refusal, abort and thrown
errors.

Exact installed Deno 2.9.7 builtin documentation was read outside the workspace
with no config/lock; [ConnectOptions receipt](deno-connect-options.log) exposes
signal?: AbortSignal. The
[public Deno documentation](https://docs.deno.com/api/deno/network/)
independently lists it. This is native cancellation, not a new service API.

Test sequence before production edit:

1. Run the unchanged define-service owner with explicit sanitizers and
   trace-leaks; preserve the actual two timer-leak names (capable disconnect and
   non-capable client), not a synthetic RED.
2. Add new DB tests through existing createDatabaseConnectivityStartupHook.
   Preserve all original provider tests. A real loopback listener must observe
   client EOF after successful probe and one query; a real refused endpoint must
   preserve bounded retry/soft failure and zero queries.
3. Add deterministic timeout/abort-race controls only as new isolated unit
   tests, under root's explicit clarification below. They must prove delivery of
   a signal, abort at the existing timeout, settlement before hook completion,
   no query after timeout, and no escaped late socket.
4. Obtain real assertion/sanitizer RED with production unchanged, then make the
   minimal correction. Re-run DB tests plus the unchanged define-service owner;
   require all sanitizers GREEN.

Root's explicit test-seam clarification authorizes additional deterministic
clock/connect fault injection for timeout and abort races. Label these as unit
evidence; restore every replaced builtin in finally, close every real acquired
connection, and retain all unchanged real-listener controls. No test-only
production export or public API change is allowed. Unit
late-completion/abort/timer lifetime proof supplements actual native loopback
success/refusal and operation/resource cleanup; it cannot claim an OS-level
native timeout capability. Do not target an arbitrary unroutable Internet
address or treat instant refusal as timeout. Root's clarification requires no
additional human question; implementation still awaits the next explicit
coordinator dispatch.

## Q2: child stdout remains owned through teardown

In legacy-abort_test.ts, lineReader holds a reader; shutdown currently awaits
status and stderr only. Retain one consumer of stdout. Drain to EOF during
shutdown and release its reader in finally, including readiness failure and
exceptional reads. Keep bounded startup/cancellation/teardown; clear every
deadline in finally. Kill only the fixture child, await its exit and both output
streams. Use native file-URL conversion for this owner's fixture path if needed;
its current .pathname is also a filesystem boundary. No fixture-service
implementation change is authorized.

The three original real subprocess controls remain intact: warning present
without the flag; warning absent across three successful requests with the flag;
client disconnect observed as CANCELLED under the flag. Preserve flag
combinations, response and stderr assertions. First reproduce the three stdout
leaks, then repair only lifecycle ownership, and require all three controls
GREEN with operation/resource/exit sanitizers. No ignore, early return,
timeout-to-pass, silenced warning, blind sleep, or discarded stream.

## Q3: Windows native file URL at the JS caller boundary

In the single final plugin test, moduleUrl.href is correctly an import URL; keep
it. The deno.json --config argument incorrectly uses URL.pathname. Convert only
that filesystem value using the existing pinned @std/path native fromFileUrl
helper. Preserve the four malformed auth inputs, actual Deno child eval,
TypeError/message checks and diagnostic stderr in the exit assertion. Keep U4's
accepted health401 oracle unchanged. Child output is already captured by
output(); retain concurrent stdout/stderr draining and bound child completion
without killing unrelated work.

Reproduce the Windows failure first, then require the full plugin service
consumer directory GREEN, including the actual four malformed-policy cases.
Selected type/lint/fmt must enumerate this owner. No product auth change, module
URL-to-path conversion, child mock or assertion replacement.

## Q4: body-limit ownership must be attributed before correction

Root's trace confirms requestBody leakage in the real RPC listener fixture. It
does not determine whether the client stream, rejected server body, native Hono
consumption, or listener shutdown owns the missing cleanup. First run both exact
RPC/OpenAPI real-listener failures with --trace-leaks and capture native
operation traces only if the resource report remains insufficient. The
prospective diagnostic may isolate declared Content-Length from chunked
rejection in ignored evidence, while the original full test remains the gate. A
successful diagnostic variant is not selected acceptance.

Trace-supported fixture cleanup may be proposed in body-limit_test.ts; native
rejection cleanup may be proposed in primitives/body-limit.ts only if it owns
the leak. Choose the narrower owner and return the evidence/diff scope to root
before editing production. Hono bodyLimit stays the sole size-policy resolver.
Do not copy its loop, buffer/drain unlimited input, blanket-cancel successful
requests, alter legacy abort semantics, or patch service listener/builder/CORS.

Mandatory preserved controls: both RPC and OpenAPI, exact typed 413 body,
allowed-origin header, under-limit200, Content-Length rejection, genuinely
chunked framing, count bounded by LIMIT+CHUNK, bodyless paths, authentication401
before limit413, disabled-limit large-body200 and invalid maxBytes. The whole
owner must pass operation/resource/exit sanitizers. If native ownership cannot
be repaired within these bounds, Q4 stays an explicit failed qualification gate,
not a broadened patch.

## Dual-stack and DB identity remain separate

The existing mapped-peer test is read/run-only. Keep two actual IPv4 local
addresses, native :: listener, mapped remote addresses, independent first200 and
subsequent429, cleanup, and the in-memory normalization matrix. Do not use a
mock peer to replace this live control, add an ignore/OS skip, weaken
quota/status assertions, invent ipv6Only, or wrap Node/FFI transport.

The [installed ServeTcpOptions receipt](deno-serve-tcp-options.log) has no
ipv6Only option.
[Microsoft's primary documentation](https://learn.microsoft.com/en-us/windows/win32/winsock/dual-stack-sockets)
describes Windows IPv6-only defaults and the pre-bind option needed for dual
stack. [Deno issue 36168](https://github.com/denoland/deno/issues/36168) reports
native/Node behavior on 2.9.3; it is corroborating evidence, not proof of the
exact installed 2.9.7 behavior. Keep the Windows failure unwaived and require
the original live control on an actual supported Linux environment before
claiming that platform's behavior. No Linux run occurred in this brief. If root
authorizes further native capability probes, bound and retain them separately;
absence of a supported portable API is a qualification gap, not permission to
change the test's meaning.

DB identity is an independent arch:check prerequisite. No database
feature/import/config repair is inside these leaves. Direct doctrine success
cannot waive that prerequisite. No release readiness is claimed while either
gate remains unresolved.

## Proposed route and review

[Actual cached pinned Harness renderer](matrix-straightforward.log), exit0,
selects straightforward: implementation logical sol at xhigh (native
gpt-6.1-sol), fallback glm_5_3_flash/provider_default; independent IMPL
evaluator glm_5_3_flash/provider_default, fallback
deepseek_v4_pro/provider_default. These are a proposal, not dispatched models or
approved paid transport. Root chooses the next route explicitly after this
brief, checks exact native availability, and records the decision. No carryover
of U2/U4's privileged architecture authorization to routine repairs.

PLAN-EVAL: proposed N/A only for Q1–Q3's mechanical resource ownership/path
repairs with fixed public behavior and root's explicit supplemental-unit-test
boundary above. Q4 remains diagnosis only; any material
transport/cancellation-policy decision triggers explicit scope review and risk
selection rather than declaring N/A in advance. Independent IMPL review is
mandatory, separate session and different vendor family, after generator gates
and root substantive source acceptance. No self-certification. No provider/model
launch is authorized by this document.

## Concrete prospective gate commands

Run from the isolated upstream worktree with the portable Deno 2.9.7 directory
first in child PATH, NO_COLOR=1, and existing public product cache
C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache.
Use --cached-only --frozen --check --allow-all --sanitize-ops
--sanitize-resources. All new test registrations explicitly fix
sanitizeOps/sanitizeResources/sanitizeExit=true. No reload, download,
lock/config/pin/age changes. Record native exit codes, counts and raw output
under a NEW ignored qualification-implementation evidence directory.

For each leaf, use:

```powershell
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --output <evidence>/<leaf>.json -- --cached-only --frozen --check --allow-all --sanitize-ops --sanitize-resources --trace-leaks <exact-owners>
```

Exact owner sets: Q1 database-connectivity_test.ts and define-service_test.ts;
Q2 legacy-abort_test.ts; Q3 packages/plugin/tests/service/; Q4
body-limit_test.ts after scope acceptance. Trace diagnostics may filter names,
but final owning tests may not filter away any control.

After all accepted leaves, run once:

- Whole packages/service/tests/ through the same structured test wrapper.
- Consumers: plugins/streams/services/src/proxy_test.ts,
  plugins/streams/services/src/main_test.ts,
  plugins/streams/tests/service/proxy-headers_test.ts,
  packages/plugin/tests/service/,
  packages/cli/src/kernel/templates/aspire/helpers/tests/workspace-cors_test.ts.
- Existing U2 CORS and U4 auth owners are included in whole service; preserve
  their hashes.
- Structured run-deno-check.ts, run-deno-lint.ts and run-deno-fmt.ts over --root
  packages/service --ext ts,tsx plus the exact plugin test via --file. Check
  uses --deno-arg --cached-only and --deno-arg --frozen. Inspect nonzero
  selected/processed counts, zero dropped/refused files; “No matching files” is
  failure, never type evidence.
- Durable run-gate.ts receipts for doc-lint (packages/service, all8 public
  roots), quality-scan, arch-check, and full workspace publish-dry-run if Q1 or
  Q4 production changes. Standard permissions:
  --allow-read/--allow-write/--allow-run as wrapper requires; use --allow-all
  for gate runner, existing cache/frozen graph, timeout120000 (publish180000).
- Direct .llm/tools/fitness/check-doctrine.ts --all-roots to distinguish
  doctrine findings from the separate DB identity prerequisite. JSR audit:
  .llm/tools/fitness/audit-jsr-package.ts --root packages/service --no-dry-run.
- git diff --check; caps/hashes/owner-set audit; no package.json; publication
  scratch cleanup; no new temporary test child/listener/stream/timer remains.

Preserve every setup/RED/FAIL receipt. Report actual final counts; do not
predict a green whole suite while dual-stack or any unresolved ownership gate
remains. Do not repeat accepted broad gates without a new source change or
unresolved failure requiring them. No expensive CLI e2e,
app/provider/browser/CEF/AppHost/installer or release launch. No user-primary
worktree change.

## Handoff boundary

Root accepts exact owners/caps, deterministic test boundary, and native route
before implementation. Then perform meaningful baseline RED → minimal fix →
owning GREEN per leaf, with scoped checkpoints only after substantive source
review; final independent IMPL is separate. This preparation creates only
ignored evidence and this brief. It implements none of the proposed repairs.
