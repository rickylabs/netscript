# PLAN-EVAL — fix-desktop-document-reconnect--c2

- Plan evaluator session: independent Zhipu GLM evaluator, OpenCode Go route `glm-5.3-flash` (variant max), 2026-10-08.
- Run: `fix-desktop-document-reconnect--c2` (issue #2041, draft PR #2091, branch `fix/desktop-document-reconnect`).
- Exact head evaluated: `27b27db11eba23c2147bc6f7f8632430c3235061` (baseline `8aad14940c52cd3a4db7efa57d56d50ae131df6c` + two docs-only run-dir commits; working tree clean; diff baseline→HEAD touches only `.llm/runs/fix-desktop-document-reconnect--c2/**`).
- Route: requested owner-selected OpenCode Go `glm-5.3-flash` max (HARNESS.md override; fallback Gemini/agy unused). Observed: this session. Generator route is OpenAI (`gpt-6.1-sol`, lane C2) — session and vendor family both independent.
- Surface / archetype: ARCHETYPE-2-integration + ARCHETYPE-3-runtime-behavior, SCOPE-frontend/native; workload tier `feature` (no privileged-row authority used).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at current main `8aad14940`; baseline diff verified docs-only in this session. Both load-bearing findings spot-checked against the tree (below). |
| Decisions locked                        | PASS   | `plan.md` D1–D4 with rationale; `worklog.md` ## Design adds state/lifecycle/concurrency detail. |
| Open-decision sweep                     | PASS   | `plan.md`: "Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design" + risk-register row "no open material decisions; private native launcher mechanics are safe to resolve". Evaluator sweep below found no unflagged rework-forcing decision. |
| Commit slices (< 30, gate + files each) | PASS   | S1–S5 ordered; S2/S3 each capped under 8 source files; each names its proving gates (scoped check/test/lint/fmt, mutation pairs, native strict receipt, corpus, JSR/doc/publish) and its touched surfaces (SDK bind-channel adapter + adjacent tests; Fresh binder/types/docs + adjacent tests; native runner + CI step; corpus; evaluation). |
| Risk register                           | PASS   | `plan.md` risk register: 10 named risks each with a mitigation mapped into D2/D3/D4; publication risk carries the "do not claim shipment before coordinated-release receipt" rule. |
| Gate set selected                       | PASS   | `plan.md` gate-matrix paragraph matches `gates/archetype-gate-matrix.md` for A2+A3: F-19 scoped runners + F-1 sizing (arch:check/quality:scan), F-5/F-6/F-7/F-15 (JSR audit, publish dry-runs, all-entrypoint doc lint, no upstream reexport), F-10 (full SDK/Fresh suites + mutation pairs), F-5/F-16/F-17/F-18 (owning corpus freshness), frozen static consumer checks + cold consumer evidence, actual native strict runtime task (Arch-3 runtime lane), browser-bundle half of D4 (subtype), release-gate class explicitly N/A (no CLI/scaffold/plugin/release surface touched — verified none planned), cli E2E N/A. |
| Deferred scope explicit                 | PASS   | Owner release acceptance deferred, not source behavior/tests; unmerged-PR standing instruction; published-consumer qualification remains owner work; EIS helper removal deferred with `Refs #2041`; doc-baseline-adjudication rule stated conditionally for an existing debt row. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Package wave (sdk/fresh). Planned public delta named before slicing: one optional documented `unknown` epoch parameter on the existing Fresh `DesktopBindableWindow.bind` handler callback (verified exported from `packages/fresh/src/runtime/desktop/mod.ts`); SDK `DesktopBindingInvoke`/`DesktopBindingHandler`/options/ports unchanged; no upstream type reexport, no new permissions/package. Slow-type risk addressed by owned structural callback types + audit/doc-lint/fresh publish dry-runs. |

## Load-bearing findings spot-checked against current tree

1. **SDK default native resolver forwards only operation/payload** — verified at `packages/sdk/src/desktop/adapters/bind-channel.ts:101-105`: the resolved default invoke builds `[operation]`/`[operation, payload]` and calls the native binding via `Reflect.apply`; the public `DesktopBindingInvoke` (`packages/sdk/src/desktop/domain/types.ts:51-54`) is a two-argument type. D1's "append epoch as a third native argument inside the default adapter only, public seam unchanged" is implementable exactly as locked.
2. **Fresh owns exactly one forever server with a pending-receive failure mode** — verified at `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts:66-77` (one `createDesktopBindServerPort()` created at bind time, its `server.handler` registered once, replacement/upgrade path absent) and `packages/sdk/src/desktop/adapters/bind-channel.ts:265-278` (RECEIVE parks a per-server `receiveWaiter`; a second RECEIVE while pending throws `Desktop receive is already pending`). This is precisely the #2041 failure (`DraftBindingProtocolError` → client `AsyncIdQueue aborted`) after a real document reload, so D2's capture-per-dispatch, close-before-upgrade slot lifecycle addresses the actual defect, not an approximation. Design detail "each dispatched receive captures its own logical server" resolves the known hazard of a dispatcher capturing a stale slot.
3. **No automatic reload path exists** — verified: `DesktopBindableWindow` has no reload member and the Fresh binder never re-binds; issue #2041's requested reconnection capability is genuinely absent today.

## Capability evidence (private sibling probes; classification respected)

Receipt-backed private native probes exist and demonstrate exactly what the plan claims, classified as capability evidence only, never SDK/Fresh acceptance: a real `Deno.BrowserWindow` bind surviving a real `BrowserWindow.reload()`, a changed document `performance.timeOrigin` across reload, and — in the epoch probe — a three-argument renderer call (`operation, payload, timeOrigin`) arriving intact at the host handler across reload (receipt `native-epoch-reload-passed`, timeout-raced, written separate from exit). This substantiates risk row "native marshalling optional argument unsupported" as mitigated-proven distinct from the mandatory D4 typed-oRPC regression through the real production SDK/Fresh stack, which stays the acceptance gate. The probes' receipt/timeout runner pattern also evidences that the deferred "private native launcher mechanics" are safe to resolve inside S3 without changing D1–D4.

## Open-decision sweep (evaluator-run)

Swept against the locked D1–D4 contract. Findings, all sub-material and already pinned by locked text:

- Unstamped (two-argument) calls arriving at the epoch-adopted physical handler: legacy admission semantics are locked by D2's "Legacy unstamped two-argument embedders retain original lifecycle compatibility" — legacy pairs stay on today's behavior, and automatic reload still requires coordinated SDK/Fresh publication. No rework risk.
- Equal-epoch handling: pinned by the "strictly newer epoch" monotonic rule (equal/stale → CLOSED). No rework risk.
- SDK-side invalid `performance.timeOrigin`: D1 pins validation before first call; failure lands as a rejected first call, not a slot-mutating transition; D3 regression coverage pins it. No rework risk.
- Whether `DesktopBindingHandler` (SDK-side) also needs the optional epoch parameter: the epoch-admission glue is Fresh-owned, so the SDK logical slot can stay two-argument as locked; if implementation findings force a widening there, that is a record-and-re-evaluate material-contract change under the plan's own guard clause — correctly flagged, not a silent decision.

No unflagged decision that could force rework was found.

## Debt review

`.llm/harness/debt/arch-debt.md`: no open entry conflicts with D1–D4. The fresh F-7 doc-lint row is RESOLVED; the desktop-native CI `continue-on-error` packaging exception (#859) is accounted for and preserved — D4 adds the strict reload step additively before packaging with no exception/continue-on-error of its own, and requires native reload failure to fail the job independently of that pre-existing bounded exception (verified against `.github/workflows/e2e-cli.yml`: pinned Deno, `desktop-native-gate`/`ci:full` opt-in, `#859` exception script after the packaging step). Plan's conditional "compare every entrypoint diagnostics/exit to main + explicit row + independent adjudication" doc-baseline rule stands ready if the doc gates surface a pre-existing row.

## Verdict

`PASS`

All eight Plan-Gate boxes are satisfied with the evidence above. Implementation may begin at `27b27db11eba23c2147bc6f7f8632430c3235061`, slice S2 first, strictly per locked D1–D4.

## Notes

- Verdict scope: plan only. Per protocol, code, gate outcomes, and the mandatory D4 native reload regression belong to IMPL-EVAL; nothing was pre-implemented or pre-qualified here.
- Evaluation discipline observed: no source edits, no branch/history/public/EIS changes, no CI polling, no dependency installs/locks touched, no broad or native implementation gates executed. Work used only this checkout and the retained private sibling capability evidence.
- Checklist items without dedicated scripts are reported per Phase A reporting as PASS with manual evidence; no uncovered check was omitted.
- This report intentionally excludes operator machine, absolute directory, host, port, token, and allowance details per the run brief.
