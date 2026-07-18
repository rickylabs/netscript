# Owner decision — Deno upstream gap blocks the auto-update apply proof (2026-07-18)

## The fact (investigated, cited)

Deno 2.9.3's main-runtime bootstrap deletes `op_desktop_verify_ed25519` from the op table
(`runtime/js/99_main.js` `NOT_IMPORTED_OPS` omits it, unlike its siblings
`op_desktop_apply_patch` / `op_desktop_confirm_update`), so a packaged desktop app can fetch a
signed manifest but can never verify it — staging/apply/rollback are unreachable on EVERY
platform, not just Windows. NetScript's pipeline is correct (desktop-specific `libdenort`
selected; the op implementation is present in the artifact). Full evidence:
`slices/g6-456-packaging/op-verify-investigation.md` (G6 thread) + G7's structured FAIL
(`.llm/tmp/desktop-native-e2e/evidence.json`).

## Draft upstream issue (for you to file — repo convention is owner-filed)

Title: `desktop: op_desktop_verify_ed25519 missing from NOT_IMPORTED_OPS — packaged apps cannot verify auto-update manifests`
Body sketch: v2.9.3; repro = compile any desktop app, configure Deno.autoUpdate with a signed
manifest server, observe `op_desktop_verify_ed25519 is not a function` during staging; expected =
op retained alongside op_desktop_apply_patch/op_desktop_confirm_update in NOT_IMPORTED_OPS;
impact = native auto-update chain unusable from packaged binaries on all platforms. (Full repro
commands in the investigation file.)

## The ripple

Four milestone-13 issues carry gate boxes that reference the #457 apply/rollback proof: #841
(box 2), #843, #456's e2e line, #457 itself (`gate:e2e`). Those boxes cannot be checked honestly
until upstream ships the fix. Everything else in the wave is done and evaluated.

## Options

- **A (recommended): amendment re-scope.** You approve a non-closing amendment on
  #841/#843/#456/#457 moving the *apply/rollback execution proof* to a successor issue
  (beta.12, "pending denoland#<filed>"), keeping every shipped artifact (suite, seam, server,
  components) in beta.11. Wave PR then closes #840's sub-issues honestly; #457 closes too (its
  deliverable — the suite with truthful platform verdicts — is merged and evaluated; the
  execution proof lives in the successor). Milestone 13 can reach all-closed; release cut
  proceeds with a documented "auto-update apply pending upstream" limitation.
- **B: hold the wave.** #841/#843/#456/#457 stay open until upstream fixes + releases; wave PR
  ships with Refs only; milestone 13 cannot reach the all-closed terminal state; release cut
  either slips or ships without closing the wave issues.
- **C: waive boxes without amendment.** Check the boxes citing the upstream gap. NOT recommended
  — it's exactly the false-closed-checkbox pattern the harness forbids.

Awaiting your in-turn pick (this is a rescope decision — outside my standing merge
authorization). Also still pending: the #824 seed-run Stage-H ratification (separate brief on
PR #850).
