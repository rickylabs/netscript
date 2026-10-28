# S6d streams startup failure source gate complete

One new shipping owner, `plugins/streams/services/src/service-lifecycle_test.ts`: **165/210 lines**,
6584 bytes, SHA256 `769b9a73f46c8b3a24dc4e0c2f44b27a6e9c40bd5b2b31186445c0205d5634b8`.
`source.final-2.ts` and `source-2.diff` contain the complete final source/addition. The narrow
root-approved correction is isolated in `authorized-correction.diff`; all other assertions remain.
All116 existing protected bindings match. The294-line runtime fixture,256-line HTTP owner and
accepted182-line TLS owner remain byte-exact. No production, helper, permission, configuration,
lock or debt edit. This source remains untracked pending root review; no S6d checkpoint or S6e work.

## Actual three-row evidence

Each row is a fresh checked child using the unchanged native discovery/runtime sandbox. Caller
option access observes the selected upstream already bound by a real AddrInUse probe; no private
upstream handle, fake lifecycle implementation or cleanup substitute is exposed. All rows return
no running handle, release upstream through the factory's native catch/stop, rebind the actual
upstream before fixture cleanup, and print the final marker exactly once after cleanup.

| Row | Native rejection and independent observation | Actual rebind |
| --- | --- | --- |
| bind | Deno.errors.AddrInUse; observedBound1, hostnameReads1; blocker survives factory failure | upstream51177 before blocker close, front51178 after close |
| sentinel | Identical caller-owned Error object, message S6D_CALLER_HOSTNAME_SENTINEL; observedBound1, hostnameReads1 | upstream51593 |
| cors | Native TypeError, exact message CORS wildcard origins cannot be combined with credentials; observedBound1, hostnameReads0 | upstream57563 |

The bind receipt records actual blocker.addr `{hostname:"127.0.0.1",port:51178,transport:"tcp"}`
and actual serve.port51178. Native error text remains unchanged and contains no endpoint:

```text
Une seule utilisation de chaque adresse de socket (protocole/adresse réseau/port) est habituellement autorisée. (os error 10048)
```

The hostname getter is not reread after rejection. Its source returns127.0.0.1 for bind and throws
the exact sentinel for the identity row. CORS fails at native build before listener hostname access.
The blocker-occupied check occurs after rejection, followed by independent upstream rebind before
any blocker close or unexpected-public-handle cleanup. Actual rows returnedHandle:false throughout.
Primary failures precede any cleanup failures; there is no swallowed oracle failure or broad error.

Raw per-row receipts live at `gates-2/children/startup-{bind,sentinel,cors}/child-1-result.json`.
All have code0 with status/stdout/stderr/stdin settled. Final verification binds their SHA256s.

## Gates, preserved failure and cleanup

- Final owning suite: **8 passed /0 failed /0 ignored**,16,827ms. All original seven tests retained;
  the new parent explicitly enables sanitizeOps/sanitizeResources/sanitizeExit.
- Seven selected files pass types/lint/fmt: seven selected and processed, no dropped files,
  refusals, failed batches or diagnostics. New-owner quality:0 findings/0 allowances.
- Final proof:116/116 protected matches,24 captured runtime children settled,9 owned paths absent,
  16 native addon hash comparisons match. Both attempts combined:42 settled children,16 paths
  absent,28 native hashes match. Runtime children required no timeout/overflow kill; frozen S4
  watchdog/output controls keep their separate behavior. Pipes remain within32KiB.
- First executed161-line source c5cd5dfc31cd78be0271d54b12ccfda8a7633adecaa5ca85af6489bf4a553096,
  first7/1/0 run and French AddrInUse failure remain immutable. The incorrect endpoint-text
  assumption is documented in FIRST_FAILURE.md; root's precise replacement authority is in
  CORRECTION_AUTHORITY.md. The initial failure stopped before sentinel/CORS; final run executes all.

`gates-2/execution.json` preserves actual commands, executable, cleared synthetic environment,
process identifiers, durations, status and raw output lengths. `gate-hashes-2.json` binds static,
owning and quality reports. `source-proof-2.json` SHA256:
`331dd6826b93501d7ecbad995e0a23fdab64707c363db5afc570d7595223a136`.
`final-verification.json` SHA256:
`1840faffc3caf7342346c6498e5369aa1019965183dc7144cb9767d8855e9eff`.

Windows qualification only. Linux remains pending genuine CI. No whole-architecture rerun,
CORS/health integration acceptance, abort/drain, storage/legacy, independent IMPL or full-U1 claim.
S6c is already faithfully signed-off/pushed as e6cdfea360c885efcd33fca21039b7975babe73f;
PR2421 remains draft. Root reads this complete source and three-row evidence before checkpoint.
