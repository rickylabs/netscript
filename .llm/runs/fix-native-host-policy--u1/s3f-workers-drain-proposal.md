# Next executable slice: workers in-flight drain

PREPARATION ONLY; no source implementation or next launch authorized by this brief.
Base: `9f880c6a4be6e1a92bcf2cdfbb6cd70a2d1eb88b`, branch `fix/native-host-policy`, exact worktree
`C:/Users/ericc/source/repos/netscript-native-host-policy-008`. S3e is accepted and published.

## Decision and bounded owner

Finish the missing workers drain oracle before changing the legacy composition or starting streams.
Append one parent test to `plugins/workers/services/src/service-lifecycle_test.ts` only. Preserve
its accepted 109-line prefix byte-exact (SHA256
`c416cf59fc7570746a9b92b5d88da3eab265b6f6f5a469cf21bcc2731646145b`). Proposed addition: 100-140
readable lines; total target 209-249, hard cap 270. This is an explicit next-slice budget proposal,
not an extension attributed to S3e approval. No new owner, helper, production, permission,
dependency, configuration, lock, public API or debt change. Original nine tests remain intact.

## Executable oracle

Use the unchanged `createSandbox` HTTP mode, two fresh checked children, exact existing argv,
30-second child deadline, 32 KiB streams and owned scratch/profile/KV authority. Explicit parent
operation/resource/exit sanitizers. Both children initialize synthetic KV and dynamically import
the public factory inside cleanup protection, as S3e does.

1. Start one guarded worker at `127.0.0.1:0`, `handleSignals:false`, with an explicit finite
   `drainTimeoutMs:5_000`. A typed public `AuthenticatorPort` holds one describe request on a
   test-owned Promise gate; it signals a second gate only after the real request reaches auth.
   Native auth awaits `Promise<AuthnResult>` (`auth/types.ts:77`, `auth-middleware.ts:58`), so no
   product hook, private route or mutation of the returned service is needed.
2. After the entry gate, call the real `running.stop()` twice without awaiting either. Track both
   outcomes immediately so no rejection is unhandled. While the auth gate is held, observe old-port
   rebind with the existing fixed two-second monotonic/ten-millisecond AddrInUse-only rule. Close
   the probe, yield a finite event-loop turn, and require both real stop promises still pending.
   An early fulfillment throws exactly `DRAIN_COMPLETED_BEFORE_RELEASE`; rejection remains its
   own primary failure. This is a real accepted-request drain oracle, not elapsed-time success.
3. Release auth with a synthetic valid principal. Consume and assert the actual HTTP200 describe
   body, then require both stop promises to settle successfully. Rebind/close the old port again,
   prove owned raw KV set/get still works, then close the test-owned KV. Print one final success
   marker only after all cleanup. Every failure path first releases auth, consumes/cancels the
   fetch response, settles the actual native stops and closes KV; retain primary error first.
4. In the second fresh child, keep both actual native stop promises and all cleanup unchanged but
   deliberately feed an already-fulfilled observation promise into the pending-state assertion.
   It must fail exactly `DRAIN_COMPLETED_BEFORE_RELEASE`, exit1 with no success marker, and still
   complete actual listener/request/KV cleanup. This is an oracle negative control, not a product
   behavior claim. Type, permission, setup, timeout, output-cap or cleanup failures do not qualify.

Keep request-entry and response promises under the existing child bound; any added local timer
must be finite and cleared. No no-op replacement of native stop, fake clock, OS signal, fake
response, new network authority or real data. Preserve complete bounded outputs for both children.
If native drain fails, retain the failure and stop at this scope; no production repair is included.

## Gates and route

Run owning ten tests (the accepted nine plus one), then repository wrapper types/lint/fmt on the
same four test/helper owners, new-code quality scan with zero allowances, exact accepted prefix/
helper/old-test/argv checks, and protected source/config/lock/PLAN/debt hashes. Use portable Deno
2.9.7 first on child PATH, ordinary frozen/cached graph/age policy, the existing warm task cache,
and Windows PATHEXT in the temporary gate environment. Keep every initial failure and remove
owned profiles/scratch on both outcomes. No full-app/AppHost/provider/build/install gate.

Resume the supported native Astra architecture primary in this exact worktree after root scope
review and required initialization; use installed NetScript MCP/docs actively. No Fable driver,
provider fallback or additional subagent. Root reads exact source and receipts before checkpoint.
Preparation consulted MCP find_guidance and the native listener/shutdown/auth source; no runtime
drain execution has occurred.

## Following boundaries: legacy, then streams

After drain acceptance, the original S3 legacy slice owns workers `services/src/main.ts`, its
focused compatibility test owner and `README.md`: replace duplicated composition with the exact
default-context delegate, preserve Redis registration/bootstrap/type exports and the original
public-policy reason, then prove context/PORT precedence and actual legacy public behavior. Its
native default hostname/signal behavior does not fit the present loopback-only HTTP fixture by
assumption; root must review a concrete bounded legacy fixture authority before that slice. No
legacy adapter or documentation edits are bundled with this drain test.

Only after workers completion start original S4 streams RED: public `./service` inert/auth tests
against the currently absent export, before S5 adds `services/src/service.ts`, `services/mod.ts`
and the `deno.json` export/check entries. S6 alone owns streams legacy adapter, README and
upstream/durability/proxy/failure-cleanup conformance. Derive streams' own public type closure;
workers' numeric F5 debt is not transferable. Each requires its concrete root-reviewed owner and
gate budget; no streams source or shared helper expansion is authorized by this preparation.
