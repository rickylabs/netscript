# Drift: U2/U4 architecture plan (generator session c2672910-4296-4cbf-b7be-4652f52837eb)

Status: PLAN only; nothing implemented; no gate run. Each entry: observation → decision/consequence.

## D1 Environment remap observed in the generator session

`deno info --json` exited 2 and revealed `DENO_DIR` pointing at
`C:/Users/ericc/source/repos/eis-chat-netscript-008-workers-runtime/.netscript/agent/worker-health-checks/state/cache`
and `LOCALAPPDATA` remapped to `.llm/tmp/native-service-policy-plan-20261027/runtime/localappdata`.
Neither location held the Hono/oRPC pins. **Decision:** no cache reload/override; the real user caches
(`C:/Users/ericc/AppData/Local/deno/{npm,remote}`) were read read-only and the exact pinned files
were hashed ([source-receipt.json](source-receipt.json)). The JSR cache carries no `.metadata.json`
sidecars; files were resolved by sha256 of the module URL. Implementers should expect the same remap
inside this task-owned environment and must not treat the empty remapped `DENO_DIR` as a reason to
run `deno cache --reload` (rule 6).

## D2 EIS candidate footprints vs. locked footprints

| Leaf | EIS candidate (`s16-remediation-footprint-20261027.md`) | Locked (plan.md) | Why |
| --- | --- | --- | --- |
| U2 | 3–4 paths: `service-cors.ts`, `service-builder-impl.ts`, `tests/cors-rpc-policy_test.ts`, README | 8 paths: + `primitives/handlers.ts`, `builder/service-rpc.ts`, `tests/handlers_test.ts`, CHANGELOG (+ conditional docs page); `service-builder-impl.ts` becomes inspect-only | The oRPC `CORSPlugin` is instantiated unconditionally in `createRPCPlugins` (`handlers.ts:77`) and only reachable from `wireRpc` (`service-rpc.ts:68-69`). It cannot be removed from `service-cors.ts`/`service-builder-impl.ts`. Standalone compatibility needs its own owner. |
| U4 | 5 paths: `auth/options.ts`, `auth/auth-middleware.ts`, middleware test, builder-auth test, README | 9 paths: + `src/auth/mod.ts`, `mod.ts`, `tests/auth/define-service-auth_test.ts`, CHANGELOG | `AuthnOptions` is public from both `./auth` and the root; `doc:lint` requires reachable types → two re-export owners. `defineService` is the preset most consumers use and rejects at `serve()`, so pre-listener rejection needs its own owner. |

Both are additive to the brief's "candidate, not authority to omit a proving owner".

## D3 Documentation vs. source behavior (pre-existing, motivates U2)

`docs/site/reference/service/index.md` (CORS origins section) and `packages/service/README.md`
state that origins outside the allowlist receive no `access-control-allow-origin`. Source derivation
(research.md §2.2–2.3): builder-wired RPC/OpenAPI **success** responses reflect any `Origin` through
oRPC's default `CORSPlugin`, emit `access-control-allow-origin: ""` with no `Origin`, and carry a
duplicated `Vary` token. Error/auth/body-limit/raw/health responses match the docs. **Decision:**
docs are the intended policy; U2 makes the source conform; no doc retraction. Recorded as negative
controls that must be red on HEAD.

## D4 EIS approach (response-preservation middleware) not adopted

EIS evidence proposed preserving Hono's headers over oRPC's output. Rejected in D-U2-1: it would keep
two engines and re-merge headers after Hono's own `set res` re-application. The chosen mechanism
(disable the inner plugin via `RPCHandlerConfig.cors: false`) is a smaller, source-level fix. This
is a deliberate divergence from the proposal, not from the brief.

## D5 U4 canonical path: stricter than legacy, differs from deny-side normalization

Legacy strings compare on the decoded `c.req.path`; deny-side raw routes `normalizePath` (strip
trailing slashes). D-U4-2 requires byte equality on **both** `rawPathname(c)` and `c.req.path`, so
`/health/` and `/he%61lth` are *not* anonymous while `/x/../health` (URL-normalized before Hono) is.
Recorded so the evaluator can challenge the asymmetry: widening denial is safe; widening anonymity is
not.

## D6 Tooling notes

- `rtk grep` returned no output for repository-wide searches in this session; the Grep tool was used.
  No tool was installed or reconfigured.
- Harmless NetScript MCP calls (`get_doc` ×2, `search_docs` ×1) were made as required; results
  matched the checked-in docs and added no new facts beyond research.md §1.
- No product, test, config, lock, U1 or other-worktree file was modified. Only run metadata under
  `.llm/runs/fix-native-service-policy--u2-u4/` was written.

## D7 Policy status (revision 3)

Root resolved M-U2-1 and M-U4-1 in [root-policy-addendum.md](root-policy-addendum.md); M-U2-2
dissolved (no public type change in U2). Root's appended checkpoint/Vary correction (revision 3, D10)
changed mechanism detail and oracles only — no option, owner or footprint change. Deferred:
Q-U2-3..6, Q-U4-2..3. No runtime gate has been run; all verdicts in plan.md are prospective.

## D8 Revision 1 → revision 2 corrections (root addendum, 2026-10-27)

| Item | Revision 1 | Revision 2 | Why |
| --- | --- | --- | --- |
| U2 mechanism | Disable oRPC `CORSPlugin` via public `RPCHandlerConfig.cors` + `wireRpc` `cors: false` | `withCors()` wrapper enforces the decision on the **final** response (delete six → re-apply snapshot → dedupe `Vary`); no new public knob | Root's measured counterexample: upstream `ACAO *`/allow/expose headers on a raw route survive Hono's checkpoint regardless of oRPC. Verified this turn against Hono `set res` (re-applies only placeholder headers), durable-streams `server.ts:446-458,1124`, streams `proxy-headers.ts`. |
| U2 footprint | 8 paths incl. `handlers.ts`, `service-rpc.ts`, `tests/handlers_test.ts`, conditional docs | 4 paths (`service-cors.ts`, new `tests/cors-response-authority_test.ts`, README, CHANGELOG) + conditional docs prose | Knob dropped as redundant; test renamed because raw/upstream headers are in scope. |
| U2 no-`withCors()` behavior | Changed (projections emit nothing) | **Unchanged** (no authority installed) | Follows from the mechanism; classification adjusted honestly per root (Fixed + migration sentence stating both facts). |
| U4 `HEAD` | `GET` entries admit `HEAD` | `GET` ≠ `HEAD`; six explicit entries documented | Root policy. |
| Research §3.1 | listed `DELETE /health%2Fx` as prefix-bypassed | corrected: `%2F` stays encoded, not under the prefix | Root source correction; consistent with §3.2. |
| Research §2.2 | "`set res` rewraps on an immutable-headers `TypeError`" | `set res` always rewraps when a placeholder exists; `c.header()` rewraps when finalized | Re-read of context.ts:414-433, 519-531. |
| M-U2-2 | MUST RESOLVE (reference regeneration for `RPCHandlerConfig.cors`) | dissolved | No public type change remains in U2. |

## D9 Consumer observation (not a defect of this plan)

`plugins/streams/services/src/main.ts` configures `origin: '*'` with explicit `allowHeaders`/
`exposeHeaders` mirroring the upstream server. Under U2 its wire output under `withCors()` is
byte-equivalent on ACAO/expose and loses only the upstream non-preflight `allow-methods`/
`allow-headers`/`max-age` noise; no `Origin` token is forced into its `Vary`. Allowlist-origin hosts
(the EIS case) are where the hostile `*` leak is observable. Plugin-lane configuration remains that
lane's decision (U1/EIS adoption).

## D10 Revision 2 → revision 3 corrections (root's appended checkpoint/Vary correction, 2026-10-27)

| Item | Revision 2 | Revision 3 | Why |
| --- | --- | --- | --- |
| Checkpoint contents | Three headers Hono may write (`allow-origin`, `allow-credentials`, `expose-headers`) | **All six** `access-control-*` values **including absence (`null`)** + placeholder `Vary` tokens | Restoring must delete exactly what Hono left absent and re-set exactly what it wrote; a three-field snapshot encodes a policy assumption instead of the native state. |
| Restore step | Delete six, re-set snapshotted three, collapse final `Vary` | Restore each of six (set value / delete absence); `Vary` = **union**(checkpoint, final), case-insensitive dedupe, `*` wins, `Origin` ≤ 1 and only when native policy appended it | A downstream handler overwriting `Vary` (no append) would otherwise erase a checkpoint token; an explicit `'*'` policy must not receive a forced `Origin`. |
| Conformance oracles | ACAC `true` and ACEH `X-Trace` "only with the allowed origin"; "no access-control header" for no-Origin; hostile preflight "no ACAO/ACAC" | **Native Hono**: ACAC whenever `credentials`, ACEH whenever `exposeHeaders`, both independent of `allowOrigin`; ACAO absent for denied/no-Origin; preflight ACAC/ACEH present | Pinned `cors/index.ts` sets ACAC/ACEH unconditionally on configuration; the revision-2 assertions contradicted the six-value native snapshot the authority restores. Resolver still runs once. |
| Negative controls | Hostile/allowed `/raw`, RPC reflect, `ACAO ""`, duplicate `Vary` | + `Vary` union control (checkpoint `Accept-Encoding`, handler overwrite `Cookie`, Hono `Origin` ⇒ three tokens once each); + upstream `allow-credentials: true` under a no-credentials fixture; placeholder-wins caveat for returned `Response` documented | Root-required negative; honest statement of what Hono's `set res` decides before the authority runs. |
| Public surface / footprint / owners | none / 4 + 1 conditional | unchanged | Root: "No additional public options or implementation owners are required." |
