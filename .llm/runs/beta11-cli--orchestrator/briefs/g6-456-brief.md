use harness. You are the G6 implementation agent (Codex · GPT-5.6 Sol · high,
`complex_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`,
`netscript-cli`, `jsr-audit`, `netscript-deno-toolchain`. Read
`.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g6-456-packaging/` (create from templates).
NEW-FEATURE group: full nested run-loop — research.md + plan.md + Design checkpoint FIRST, then
STOP and signal the supervisor (PR comment `Plan & Design — READY FOR REVIEW`); no implementation
slice before the group Plan-Gate PASS.

## Task — issue #456 (Option-A re-scope): native packaging pipeline + release server + auto-update wiring

Branch `feat/desktop-frontend-456-packaging` off integration `feat/desktop-frontend` (this
worktree is on it — the base ALREADY CONTAINS #452's generator + `PackageTaskName` hook and
#841's `@netscript/sdk/auto-update` seam; consume both, do not reimplement). Draft sub-PR
targets `feat/desktop-frontend`; body uses **`Refs #456`** (NO closing keyword — the issue's
e2e gate belongs to #457; the wave PR closes it), labels
`type:feat,area:cli,area:deploy,wave:v1,priority:p2,status:plan`, milestone `0.0.1-beta.11`.
Read live issue #456 — ALL THREE amendment sections; the Option-A re-scope is the operative one.

Deliverables (Option A — native-first):
1. **Packaging pipeline over `deno desktop`'s native formats** (Windows MSI, macOS .app/.dmg,
   Linux AppImage/.deb/.rpm; `--compress` where useful; cross-compile `--target`/
   `--all-targets`; explicit `-o`) driven via #452's `PackageTaskName` hook. `signtool`/
  notarization remain external CI steps (D4 posture) — document, don't implement.
2. **Release server** serving the NATIVE `latest.json` + bsdiff patches with the Ed25519 signed
   envelope; monotonic sequence high-water. One lineage: design the manifest so the beta.14
   graph manifest is a strict superset (leave extension points, no second format).
3. **Auto-update wiring** through #841's seam: the server's URL layout must match what
   `createReleaseClient` composes (`<base>/<channel>/<os>-<arch>`) — consume the SDK constants,
   never restate them.
4. **Windows posture**: native apply unsupported upstream (denoland/deno#35269) — documented
   manual-update fallback + staged-detection UX hooks (via the seam's manual event).
Snapshot-updater machinery (bootstrap/journal/release-dir transaction) is OUT — beta.14
(#834/#825). `Deno.autoUpdate` is never the update authority (RFC L0.7).

Gates: unit tests for manifest composition/signing/sequence rules (Ed25519 via WebCrypto or
@std — wrap, don't reinvent); URL-layout parity test against the SDK seam's composed URL; jsr
rubric on any new public surface; FULL test dirs of touched packages; `quality:scan` +
`arch:check` per slice; string-constants doctrine (no text/JSON import attributes).

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/feat/desktop-frontend-456-packaging`)
→ PR comment with gate evidence → pause for Tier-A review between slices. Do NOT dispatch
evaluators/reviews yourself. Do NOT merge anything. `deno doc` the SDK auto-update surface
before designing the server layout.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
