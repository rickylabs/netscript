use harness. You are the G3 implementation agent (Codex · GPT-5.6 Sol · high,
`complex_implementation` lane) for run `beta11-cli--orchestrator`, supervised by the Fable 5
orchestrator (session 86d308d5-c761-4e5d-a41f-8be959bc46d2).

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-tools`,
`jsr-audit`, `netscript-deno-toolchain`, `deno-fresh`. Read
`.llm/harness/workflow/run-loop.md`. Nested run dir:
`.llm/runs/beta11-cli--orchestrator/slices/g3-842-bindings/` (create from templates). NEW-FEATURE
group: full nested run-loop — research.md + plan.md + Design checkpoint FIRST, then STOP and
signal the supervisor (PR comment `Plan & Design — READY FOR REVIEW`); no implementation slice
before the group Plan-Gate PASS.

## Task — issue #842: type-safe desktop bindings — oRPC MessagePort adapter over the bind channel

Branch `feat/desktop-frontend-842-bindings` off integration branch `feat/desktop-frontend`
(this worktree is already on it). Draft sub-PR targets `feat/desktop-frontend`, body `Closes
#842`, labels `type:feat,area:sdk,area:fresh,wave:v1,priority:p1,status:plan`, milestone
`0.0.1-beta.11`. Read live issue #842 + epic #840; design source PR #822 rfc.md + the RFC run's
plan.md rev 10.

Core requirements (issue body):
- A **port shim** adapting Deno Desktop's bind channel (`win.bind()` / `bindings.<name>()`,
  JSON + `Uint8Array`, promise-based, per-window isolation) into a MessagePort-like pair.
- **oRPC MessagePort adapter** on top: `RPCHandler.upgrade(port)` runtime-side, `RPCLink`
  webview-side (orpc.dev/docs/adapters/message-port) — same typed contracts NetScript services
  already use, spanning the window boundary; NO hand-maintained bindings.d.ts.
- Integration split: SDK provides link + shim; `@netscript/fresh` wires the window side
  (desktop-gated, no-op in browser/Aspire — the POC feature-detection pattern; sibling pattern:
  G2's `packages/sdk/src/auto-update/` adapter, already on your branch's integration base).
- Serialization default string/binary; `experimental_transfer` sparingly per oRPC guidance.

Gates (issue acceptance): typed round-trip incl. error mapping ({name,message,stack}) +
Uint8Array payloads; per-window isolation test; browser/Aspire no-op parity; jsr rubric on new
SDK/fresh surfaces; `quality:scan` + `arch:check` per slice; FULL test dirs of touched packages
(lesson of this wave: never curated test lists). String-constants doctrine: no text/JSON import
attributes in published code.

## Method

Per-slice: commit → push (`git push origin HEAD:refs/heads/feat/desktop-frontend-842-bindings`)
→ PR comment with scope, hash, gate evidence → pause for Tier-A review between slices. Do NOT
dispatch evaluators/reviews yourself. Do NOT merge anything. `deno doc` before broad source
reads; check oRPC's shipped adapter surface from the dependency itself before writing the shim.

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
