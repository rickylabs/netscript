# Drift Log: G2 #841 SDK auto-update

Append-only record of facts diverging from carried-in plans, RFC revisions, doctrine/tooling prose,
or upstream expectations.

## 2026-07-17 — Owner Option A supersedes rev 10 updater authority

- **What:** Rev 10 says the snapshot updater is authoritative and `Deno.autoUpdate` must never be
  the authority. The later owner-ratified Option A makes native auto-update authoritative for the
  beta.11 window-only thin-client tier and moves the snapshot mechanism to beta.14.
- **Source:** Rev 10 §0/§C versus live #840/#841/#456/#457 and PR #822 `rfc.md` F4/OF-L.
- **Expected:** Implement snapshot/journal updater semantics or avoid native auto-update entirely.
- **Actual:** Implement only the typed native SDK seam; no snapshot updater in #841.
- **Severity:** significant.
- **Action:** accept the newer owner-ratified direction; retain rev 10 only for compatible release
  lineage facts.
- **Evidence:** [#840](https://github.com/rickylabs/netscript/issues/840),
  [#841](https://github.com/rickylabs/netscript/issues/841),
  [PR #822](https://github.com/rickylabs/netscript/pull/822).

## 2026-07-17 — Proposed Deno namespace also renames the version property

- **What:** The brief names the `Deno.desktop` namespace move. The live upstream PR changes
  `Deno.desktopVersion` to `Deno.desktop.appVersion`, not merely
  `Deno.desktop.desktopVersion`.
- **Source:** denoland/deno#35939 current body and `lib.deno.desktop.d.ts` patch.
- **Expected:** Pure re-namespacing with identical member names.
- **Actual:** `autoUpdate` keeps its name; the version property becomes `appVersion`.
- **Severity:** significant.
- **Action:** support both structural generations behind the one local resolver and expose neither
  name to consumers.
- **Evidence:** [denoland/deno#35939](https://github.com/denoland/deno/pull/35939).

## 2026-07-17 — Local Deno patch version differs from skill prose

- **What:** The Deno toolchain skill says the repo is on Deno 2.9.0; this WSL worktree executes
  Deno 2.9.3.
- **Source:** `deno eval 'console.log(Deno.version.deno)'`.
- **Expected:** 2.9.0.
- **Actual:** 2.9.3.
- **Severity:** minor.
- **Action:** accept for this run; no dependency/version change is in scope. Keep behavior fixtures
  structural and do not rely on patch-specific ambient types.
- **Evidence:** command output recorded in `research.md`/`worklog.md`.

