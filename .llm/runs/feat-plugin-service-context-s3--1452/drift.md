# Drift Log: #1452 Slice 3 plugin service host context

Drift is append-only.

## 2026-09-02 — RTK proxy unavailable

- **What:** The preferred `rtk` executable is not installed on this host.
- **Source:** `rtk ls docs/architecture/doctrine`.
- **Expected:** The repository RTK skill states that the machine-level binary is on `PATH`.
- **Actual:** Bash returned `rtk: command not found`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Focused `rg` and direct Git reads replace exploratory RTK; structured Deno wrappers
  remain the gate verdict sources.

## 2026-09-02 — Owner PR-open contract overrides bootstrap draft convention

- **What:** This run will open one non-draft PR only after implementation/evaluation, with all
  labels and milestone applied in the same open action.
- **Source:** User's Slice 3 PR contract.
- **Expected:** Generic harness guidance opens a draft PR with the bootstrap commit.
- **Actual:** Owner explicitly requires non-draft against `main`, `status:impl`, and atomic metadata.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` recorded override; no PR exists at bootstrap.

## 2026-09-02 — Auth narrows newly opaque appsettings at runtime

- **What:** `plugins/auth/services/src/init.ts` required a minimal implementation edit beyond the
  plan's package-local file ceiling.
- **Source:** The focused generated-consumer type-check after adding
  `PluginServiceContext.appsettings?: unknown`.
- **Expected:** Existing consumers would accept the extended generic context unchanged.
- **Actual:** Auth passed the generic context to a plugin-specific appsettings contract, which is
  no longer type-safe once the base property exists as `unknown`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Auth now accepts the generic base context and structurally validates/narrows its
  optional appsettings fields before plugin-specific access; no cast or concrete base dependency
  was added. The focused wrapper passes 3/3 tests including real auth boot.

## 2026-09-02 — PR metadata connector parsed the create response incorrectly

- **What:** The PR-create action contained both creation and metadata mutation, but its local result
  parser expected `structuredContent.result.number` while the connector returned
  `structuredContent.number`; the metadata sub-call therefore did not run in that action.
- **Source:** Required atomic PR metadata contract and the live connector response for PR #1944.
- **Expected:** Non-draft PR creation, six labels, and milestone 0.0.7 in one action.
- **Actual:** The PR opened non-draft with the correct body, then the exact labels and milestone were
  applied in the immediately following action eight seconds later.
- **Severity:** minor
- **Action:** accept and record; final live metadata is complete.
- **Evidence:** PR #1944 has labels `orchestrator:features`, `status:impl`, `type:feat`,
  `area:plugins`, `priority:p2`, `wave:v1`, and milestone 0.0.7.
