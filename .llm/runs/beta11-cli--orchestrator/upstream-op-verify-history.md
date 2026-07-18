# Upstream op history — why `op_desktop_verify_ed25519` is absent from the runtime op table

Research for the beta-11 orchestrator. Read-only investigation of `denoland/deno`. No GitHub
mutation performed. Method: GitHub REST API (token via `resolveGithubToken`) for commit/PR/issue
history + `raw.githubusercontent.com/denoland/deno/main` for current file bytes. Script:
`.llm/tmp/gh-op-research.ts` / `gh2` / `gh3` / `gh4`.

## Verdict: **OVERSIGHT**

The op was omitted from the bootstrap keep-list in the same PR that added its two siblings, in a
single 18-line block, with no comment, no review discussion, and no design statement anywhere that
verification lives outside the JS-visible table. `main` (unreleased HEAD as of this run) still omits
it. Our observed failure mechanism is correct — this is a genuine upstream bug, not our misread.

## The mechanism (corrected/confirmed)

`NOT_IMPORTED_OPS` in `runtime/js/99_main.js` is a **keep-list**, not a deny-list despite the name.
`removeImportedOps()` (verified, current `main`) deletes every op *not* in the list:

```js
function removeImportedOps() {
  const allOpNames = ObjectKeys(ops);
  for (let i = 0; i < allOpNames.length; i++) {
    const opName = allOpNames[i];
    if (!ArrayPrototypeIncludes(NOT_IMPORTED_OPS, opName)) {
      delete ops[opName];               // absent from the list ⇒ deleted at bootstrap
    }
  }
}
```

The desktop auto-update initializer (`cli/rt/desktop.rs`, `desktop_auto_update_js`) destructures
all three update ops out of the **user-visible** core in one statement:

```rust
r#"(() => {{
  const {{
    op_desktop_apply_patch,
    op_desktop_verify_ed25519,   // <-- destructured here, alongside its two siblings
    op_desktop_confirm_update,
  }} = Deno[Deno.internal].core.ops;
  ...
```

`Deno[Deno.internal].core.ops` is exactly the table `removeImportedOps()` prunes. Two of the three
names are keep-listed and survive; `op_desktop_verify_ed25519` is not, so it is `delete`d before the
init script runs. The destructure of a now-missing property yields `undefined` silently; the failure
surfaces only when the update path calls it — `op_desktop_verify_ed25519 is not a function`. This is
precisely the failure we observed. The op **implementation exists** in `runtime/ops/desktop.rs`; the
gap is purely the missing keep-list entry.

## Introducing commit / PR (load-bearing)

- **PR #33441 — `feat: `deno desktop` subcommand`** (commit `83981628`, 2026-06-16; the only commit
  in the last 6 months to add desktop entries to `99_main.js`). Its diff added the entire desktop
  keep-list block — and this is where the omission was born:

```diff
+  // Related to `Deno.desktop` API (deno compile --desktop)
+  "BrowserWindow",
+  "Dock",
+  "Tray",
+  "Notification",
+  "op_desktop_apply_patch",
+  "op_desktop_confirm_update",
+  "op_desktop_init",
+  "op_desktop_recv_event",
+  "op_desktop_resolve_bind_call",
+  "op_desktop_reject_bind_call",
+  "op_desktop_alert",
+  "op_desktop_confirm",
+  "op_desktop_prompt",
+  "op_desktop_send_error_report",
+  "op_desktop_request_notification_permission",
+  "op_desktop_query_notification_permission",
```

  Sixteen desktop names are enumerated — including `apply_patch` and `confirm_update` — but not
  `verify_ed25519`, despite it being destructured in the same three-name block in `desktop.rs`. The
  PR body describes the auto-updater ("applies bsdiff patches… stages for next launch, rolls back on
  failed launch") and SHA256-verification of downloaded WEF backends, but says **nothing** about the
  ed25519 signature-verification op — consistent with it being an under-documented afterthought.

## No design intent anywhere (why not DELIBERATE)

- **Code search** `op_desktop_verify_ed25519 repo:denoland/deno` → **total_count: 2**: only
  `runtime/ops/desktop.rs` (the impl) and `cli/rt/desktop.rs` (the destructure). It appears in **no**
  `99_main.js`, **no** issue, **no** PR body/discussion. There is no "verification runs in the
  updater thread / a separate isolate not subject to `removeImportedOps`" statement — the caller is
  the same main-runtime init script that reads `Deno[Deno.internal].core.ops`, the very table that is
  pruned. Its siblings were keep-listed *specifically so they survive that pruning*; one was missed.
- **PR #35939** (`feat(desktop): move desktop runtime APIs under Deno.desktop namespace`, open) is a
  pure re-namespacing of the public `Deno.desktop.*` surface. It does not touch op-table membership
  and never mentions verification placement.
- **Issue #35269** (`deno desktop: follow-ups`, open) is the tell: it flags that #33441 "landed with
  essentially no functional tests — the only test change was bumping `EXPECTED_OP_COUNT`", and lists
  "auto-update apply / rollback (temp+rename, rollback-on-failed-launch)" among the **untested**
  security-sensitive paths. A keep-list omission on an untested path is invisible to `EXPECTED_OP_COUNT`
  (that count is about how many ops exist, not which survive bootstrap), which is exactly how a
  single missing entry ships.

## Is `main` fixed? No.

- Current `main` `runtime/js/99_main.js`: `op_desktop_apply_patch` present, `op_desktop_verify_ed25519`
  **absent** (verified via raw fetch of `main`).
- Latest release **v2.9.3** (2026-07-15) — the version we hit. No 2.9.x release note mentions update
  verification changes.
- The `removeImportedOps` machinery is under active churn — **#36013** (`fix(core): restrict extension
  loaders to internal modules`), **#36014** (`fix(worker): remove imported ops during bootstrap`,
  extends the same pruning to workers), **#36065** (`fix(desktop): preserve binding wrappers after
  lazy op upgrade`, closes #36033) — but **none** adds `verify_ed25519` to the keep-list. The area is
  being hardened without anyone exercising the ed25519 verify path, reinforcing the oversight reading.

## Ruling out OUR-MISREAD

The one exculpatory hypothesis — "verification is internal by design, invoked from a snapshot/extension
context unaffected by `NOT_IMPORTED_OPS`" — is **false**: the call site is `desktop_auto_update_js`,
which explicitly reads `Deno[Deno.internal].core.ops` (the pruned user-visible table) and destructures
`verify_ed25519` in the identical statement as `apply_patch`/`confirm_update`, both of which the
maintainers keep-listed *because* they must survive pruning. Same context, same table, same statement,
same requirement — the only difference is one name was left out of the allowlist. Failure mechanism
confirmed, not misread.

## Implication for the owner's decision

**File the upstream bug** — the existing draft in `upstream-op-verify-decision.md` is accurate and its
one-line fix ("retain `op_desktop_verify_ed25519` in `NOT_IMPORTED_OPS` alongside its siblings") is
correct and minimal. This is a defect in Deno, not a NetScript pipeline error and not a design we
should adapt to. Because it is an oversight (not intentional API surface), it is a strong candidate for
a fast trivial-fix merge upstream — but our beta-11 wave still cannot honestly check the #457
apply/rollback proof until a fixed Deno **releases**, so the rescope options in the decision doc
(Option A recommended) stand unchanged. There is no alternate call path to design around.

### Citations
- PR #33441 (introducing) — `github.com/denoland/deno/pull/33441`, commit `83981628`
- Issue #35269 (untested auto-update paths) — `github.com/denoland/deno/issues/35269`
- PR #35939 (Deno.desktop namespace, no verify discussion) — `github.com/denoland/deno/pull/35939`
- PRs #36013 / #36014 / #36065 (removeImportedOps churn, no fix) — deno PRs
- `runtime/js/99_main.js`, `cli/rt/desktop.rs`, `runtime/ops/desktop.rs` @ `main`
- Code search `op_desktop_verify_ed25519 repo:denoland/deno` → 2 hits (impl + destructure only)
