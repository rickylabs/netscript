# Drift Log: G6 #456 native packaging and release server

Drift is append-only. These entries reconcile the older snapshot design and upstream prose with the
owner-ratified Option-A scope and current Deno behavior.

## 2026-07-18 — Option A supersedes snapshot-first beta.11 sequencing

- **What:** Older RFC L0/rev-10 prose places update authority in NetScript's combined-artifact
  snapshot transaction and says `Deno.autoUpdate` must never be the authority. The later
  owner-ratified Option A moves that transaction to beta.14 and uses the native mechanism for the
  window-only beta.11 tier.
- **Source:** live #456 final amendment; live #840/#841/#457; PR #822 F4/OF-L; G2 drift record.
- **Expected:** Implement bootstrap/journal/release-directory transaction now or avoid the native
  updater entirely.
- **Actual:** #456 builds the native release server and #841 wiring only. NetScript's signed server,
  sequence policy, pinned config, and SDK seam remain authority; Deno is the effectful thin-client
  mechanism. Combined-graph apply remains #834/#825.
- **Severity:** significant.
- **Action:** rescope to latest owner-ratified direction while preserving the “Deno does not define
  NetScript policy” invariant.
- **Evidence:** [#456](https://github.com/rickylabs/netscript/issues/456),
  [PR #822](https://github.com/rickylabs/netscript/pull/822).

## 2026-07-18 — Current native installer support is broader than older prose

- **What:** Earlier RFC text states no Deno-native combined-MSI path exists. Current Deno 2.9.3
  supports native MSI for a window bundle and the requested Linux/macOS formats.
- **Source:** local `deno desktop --help`; current Deno distribution docs and
  `cli/tools/desktop.rs`.
- **Expected:** Treat MSI as unavailable and route all Windows packaging through future .NET/WiX.
- **Actual:** Thin-client native MSI is available now; the older limitation still applies to the
  beta.14 combined window + sidecar installer, which remains out of scope.
- **Severity:** significant.
- **Action:** accept for Option A; document external `signtool` and preserve #825 for combined
  installers.
- **Evidence:** [Deno Desktop distribution](https://docs.deno.com/runtime/desktop/distribution/).

## 2026-07-18 — Upstream all-target expansion omits Windows ARM64

- **What:** Deno advertises `aarch64-pc-windows-msvc` as an explicit target, but the current
  `--all-targets` loop expands only five targets and omits it. Reusing one `--output` across that
  loop also cannot express the full native format matrix safely.
- **Source:** local Deno 2.9.3 help; current `denoland/deno` `cli/tools/desktop.rs` lines 52–84.
- **Expected:** Forward upstream `--all-targets` and receive every supported target.
- **Actual:** NetScript must expand SDK OS/architecture constants to six explicit target
  invocations, each with a unique format-selected `-o`.
- **Severity:** significant.
- **Action:** fix at the NetScript planning boundary and pin with an exhaustive unit matrix; do not
  patch or fork Deno.
- **Evidence:**
  [denoland/deno desktop tool source](https://github.com/denoland/deno/blob/main/cli/tools/desktop.rs).

## 2026-07-18 — Desktop feature uses the existing deploy target axis

- **What:** The approved plan named `deploy/desktop/` as the cohesive implementation directory.
- **Source:** Slice-1 focused doctrine scan and the pre-existing `deploy/target/` axis.
- **Expected:** Add a fifteenth immediate child under `deploy/`.
- **Actual:** Nest the feature at `deploy/target/desktop/`, preserving the locked command and domain
  contracts while keeping the immediate `deploy/` child count at its baseline of fourteen.
- **Severity:** minor.
- **Action:** fix the implementation location and reconcile research, plan, and contributor paths.
- **Evidence:** focused doctrine scan recorded in `worklog.md`.

## 2026-07-18 — Workspace dependency recorded after minimum-age guard

- **What:** `deno add @netscript/sdk` was selected as the native dependency-edit path.
- **Source:** Deno dependency-age policy and the workspace-local SDK package.
- **Expected:** `deno add` records the workspace dependency directly.
- **Actual:** Deno rejected resolution under the repository minimum-age policy and this CLI version
  did not expose its suggested override flag. The equivalent workspace import entry was applied
  narrowly, with lock and `deps:why` verification required before commit.
- **Severity:** minor.
- **Action:** accept the mechanical edit only if final dependency and lock gates prove workspace
  resolution without unrelated churn.
