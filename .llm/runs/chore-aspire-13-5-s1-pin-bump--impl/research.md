# Research: Aspire 13.5 S1 pin bump and parity gate

## Baseline

- Issue #1713 is the implementation contract and fully specifies scope, boundaries, acceptance, and gates.
- Worktree `HEAD` and merge-base with `origin/main` are both `3b32d1628584749af4dd6e97fd331c24e84f0b9e`.
- The draft-of-record research branch is `origin/research/aspire-13.5-0.0.7` at `ee925896ed6bdd06c0333d2a4cc71795a044ba55`.
- The required research run and manifest are absent from the implementation baseline but readable at that remote ref. The manifest will be imported byte-for-byte as an immutable gate input; archival content will not be rewritten.

## Load-bearing findings

- Target train is `13.5.3` for CLI, SDK, and `Aspire.Hosting.*`; mixed 13.4/13.5 trains are forbidden (D-1, research §1).
- `Aspire.Hosting.Browsers` remains the accepted preview pin `13.5.3-preview.1.26425.3` and requires an appended debt entry (D-3).
- `CommunityToolkit.Aspire.Hosting.Deno` and `.SQLite` use stable `13.5.0` (research §1).
- `SCAFFOLD_VERSIONS.ASPIRE_SDK` is the parity truth; phase 1 fails only `scaffold-constants`, `ci:*`, and `root-config` rows (D-2, D-13).
- Phase 2 is implemented but not enabled in CI here. It fails all non-archival stale rows, special-cases `compat-fixture` by requiring `13.5.3`, and skips `lockfile` rows (D-13, D-16).
- Current branch has 13.4.6 pins in scaffold constants, toolchain config, three E2E workflows, and the policy test; `e2e-cli-prod.yml` additionally has a 13.5.0 preview CLI route.
- `.openhands/setup.sh` already sources `.github/toolchain.env`; no hardcoded Aspire version is needed there.
- No CLI public export or package export map changes. JSR surface risk is therefore N/A beyond preservation gates; constants and an internal validation tool change only.

## Doctrine and risk scan

- Selected archetype: 6 — CLI/tooling. Current doctrine verdict for `packages/cli` is Keep; preserve the kernel/surface split.
- In-scope anti-pattern checks: AP-1, AP-11, AP-18, AP-19, AP-25. The new validation tool is bounded, static file IO only, and tested semantically.
- No new port, base class, extension axis, command, or public JSR symbol is introduced.

## Open questions

- None that force implementation rework. The missing-on-baseline manifest and generator-path mismatch are recorded in `drift.md` with the exact source ref.
