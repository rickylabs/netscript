# U1 root review corrections for independent evaluation

Coordinator `/root`, 2026-10-27. This is a normative correction to the generated
plan, submitted to the same independent PLAN-EVAL gate as the original packet.
It is neither an evaluator verdict nor implementation authorization. The six
original generator artifacts remain unchanged. Where a clause below conflicts
with the generated plan, this correction controls the proposed implementation.

1. **No new casts or suppressions.** The exception proposed in plan sections
   4.12/10 R5 is withdrawn. Construct a real typed minimal `PluginServiceContext`
   with existing testing ports. No new `any`, boundary cast, `@ts-*`,
   `deno-lint-ignore`, or `quality-allow` is authorized. A discovery that cannot
   meet this condition returns a concrete design problem to the coordinator;
   it cannot silently spend an exception budget.
2. **Real TLS remains an acceptance oracle.** Plan section10 R3 may discover
   reusable valid PEM fixtures, but missing fixtures cannot defer the actual TLS
   listener test or produce a green U1 result. Existing service TLS tests contain
   deliberately invalid `MIItest` strings and stub `Deno.serve`; they are not a
   real TLS oracle. Reuse a valid documented public test certificate/key inline
   in the already owned new test file if necessary, with provenance and validity
   suitable for the test date. No new dependency, external generator, verification
   bypass, or extra product path is implied. Observe a real `https` loopback
   listener, successful trusted-client exchange, original ServeOptions identity,
   and released ports after stop. If this cannot be delivered within the owned
   test shape, U1 remains incomplete pending an explicit reviewed footprint change.
3. **Preserve actual protocol values.** The current streams entrypoint has six
   allow-methods, nine allow-headers and twelve expose-headers. The generated
   eleven/fourteen counts are incorrect. Copy the exact current arrays without
   adding, removing, unioning or inventing values. Caller replacements and
   legacy wildcard behavior remain as specified; the new factory adds no
   wildcard default.
4. **No new release-gate waiver.** The generated declaration that production
   E2E is `DEBT_ACCEPTED` does not grant a waiver. Existing publishing rules
   determine which published-release gates run at which stage; a not-yet-
   published export can be checked with the planned clean-source consumer,
   publish dry-run, plugin verification and scaffold runtime gates. Those gates
   do not replace the normal published-package production E2E before release
   or S16 adoption. Report unavailable prepublication evidence as unrun with
   its concrete dependency, never as a newly accepted passing/debt gate.
5. **Scope and ownership remain explicit.** The twelve product paths, native
   inert factories, pre-I/O auth assertion, port0 precedence, legacy adapters,
   identity preservation and upstream cleanup remain the U1 proposal. U2 CORS,
   U3 browser credentials and E1 application policy still require their own
   reviewed implementation and live acceptance. U1 completion alone does not
   qualify public hosts, release packages, close upstream security issues, or
   authorize shipping EIS-Chat.

Root read the complete research, plan, decision map, context pack and drift.
Independent review must judge this corrected combined proposal and identify
any remaining contradiction, infeasible gate or security/lifecycle defect.
