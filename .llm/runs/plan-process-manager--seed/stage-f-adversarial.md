# Stage F — Adversarial review (verdict of record + supervisor triage)

**Reviewer:** OpenHands **qwen-3.7-max** (separate session, GitHub Action on PR #504) — Tier-D
fallback recorded in `supervisor.md` (WSL Codex blocked: `usageLimitExceeded`, drift entry 6).
**Unoriented brief:** artifacts-only, findings-only (scratchpad `pm-stage-f-openhands.md`; trigger
comment [#issuecomment-4891518785](https://github.com/rickylabs/netscript/pull/504#issuecomment-4891518785)).
**Verdict comment (artifact of record):**
[#issuecomment-4891678877](https://github.com/rickylabs/netscript/pull/504#issuecomment-4891678877),
2026-07-06T10:21:43Z, Action run 28783668102 (success; sibling run 28783678449 cancelled by per-PR
concurrency — expected).

## Verdict

> **PASS** — The plan is sound enough to file as a GitHub epic after the listed fixes. …
> **18 findings total: 0 blockers, 4 major, 14 minor.**
>
> `OPENHANDS_VERDICT: PASS`

Reviewer's coverage boundary ("not checked"): research synthesis S1–S13/C1–C7/OF-1..7 internals,
design-pack deep contents beyond E1/E2/E3 spot-checks, drift entries 1–4, milestone loading beyond
R7, and the Windows/Linux asymmetry claims (accepted from research packs). Full text in the PR
comment.

## Supervisor triage (per-finding dispositions)

Fix commits land with this file; "plan.md" refers to the Stage-E lock as amended.

| F | Sev | Claim (short) | Disposition |
| --- | --- | --- | --- |
| F-1 | major | PM-0 doesn't name the drift-5 key→member fix | **Reject as stated** — PM-0's row already carries "fix `resolveTargetConfig` key→member mismatch (drift 5)" verbatim (stale read). **Accept the evidence**: the reviewer's independent second citation (`config-section-types.ts:574,580`) corroborates drift 5 from a different file than D3's; recorded in E1. |
| F-2 | major | E4 elides the route list it binds | **Accept** — E4 now enumerates the normative 18-route table from D2 §1.3 and states PM-9/PM-10 acceptance = exactly that set. Note: the reviewer's own 10-route enumeration conflated CLI verbs with contract routes (`reload`/`enable-service`/`disable-service` are CLI/OS-layer, not routes; `token` is `mintToken`/`revokeToken`) — E4 now spells out that mapping too, which is the stronger fix. |
| F-3 | major | E5 extraction into a pm-named package inverts ARCHETYPE-7's expected `deploy-core` ownership | **Accept — the substantive finding of the review.** E5 amended: extraction target is **`packages/deploy-core`** (`@netscript/deploy-core`), the package ARCHETYPE-7 anticipates; pm-core depends on it; CLI re-exports keep imports stable; F-DEPLOY promotion lands in PM-20 with that boundary (also closes F-14). Filed under this epic because the bare-metal target forces the extraction. PM-20 + R9 + §1 recap updated. |
| F-4 | major | `WorkerTaskPermissions` is not on workers-core's public surface | **Accept** — PM-1 gains an explicit precursor: re-export `WorkerTaskPermissions` (+ schema) from `@netscript/plugin-workers-core` `mod.ts`. Rules out the internal-path import (doctrine 02) and duplication (doctrine 09) options the reviewer flagged. |
| F-5 | minor | Loopback-TCP network reachability undocumented | **Accept** — added to PM-11 (the transport slice, rather than the reviewer's PM-25/PM-29 suggestion): control plane is network-reachable on 127.0.0.1; token auth is load-bearing. |
| F-6 | minor→note | PM-0 help-text updates | **No change** — reviewer self-downgraded on re-read; PM-0 already names it. |
| F-7 | minor | §4/§10 slice arithmetic wrong | **Accept** — real error, both directions: milestone-1 count is **32** (not 31) and the `v1-min` floor is **21** (not 19). §4 header, §5 train, §10 filing plan corrected to 32 + 4 = 36. |
| F-8 | minor | PM-31 publish dry-run implies plugin publication | **Accept** — PM-31 now scopes the dry-run to the JSR-published packages (`deploy-core`, `plugin-process-manager-core`); `plugins/process-manager` is workspace-only per doctrine 05. |
| F-9 | minor | "degraded-local reads" undefined | **Accept** — PM-25 defines it: OS-layer + KV snapshot reads marked `source: os-layer (degraded)`; mutations refuse with guidance. |
| F-10 | minor | Memory-poll latency unquantified | **Accept** — PM-4 locks default `pollIntervalMs: 5000`, configurable. |
| F-11 | minor | R1 names no Windows alternative | **Accept** — R1 mitigation now names Job Objects / processor affinity in the warning with a docs link. |
| F-12 | minor | E5 god-core risk has no fallback | **Accept, largely superseded by the F-3 fix** (extraction is now smaller and correctly homed); R9 additionally records the split escape hatch (OsServicePort+renderers first, conventions+registry sibling slice). |
| F-13 | minor | Drift-5 line range too broad for Linux schema | **Note, no change** — reviewer judged it acceptable; drift.md is append-only and the range is correct for the section. |
| F-14 | minor | F-DEPLOY promotion timing ambiguous in PM-20 | **Accept, folded into F-3 fix** — PM-20's acceptance explicitly includes the `reviewed`→`gated` promotion in-slice. |
| F-15 | minor | PM-0 "beta.6-eligible" vs §5 hard placement | **Accept** — W0 header + §5 now say proposed **hard** beta.6; a slip is a Stage-H train update, not a PM-0 re-scope. |
| F-16 | minor | E1 "rejected" should be "superseded" | **Accept** — E1 now marks D5 §1.4 **superseded** (no longer valid design input). |
| F-17 | minor | OF-9 is a recommendation, not a fork | **Accept** — OF-9 is now a **hard fork**: owner must pick beta.7 vs beta.8 for M1 at Stage H; no default. |
| F-18 | minor→note | PM-28 depends on PM-25 | **No change** — reviewer self-downgraded; the dependency is already explicit in the DAG (PM-28 deps: PM-25, PM-13). |

**Score:** 13 accepted (fixes applied), 2 rejected-with-rationale as stated (F-1 stale read, F-13
no-change), 3 self-downgraded notes / already-covered (F-6, F-18, and F-14 folded into F-3).

## Outcome

Verdict **PASS**, zero blockers; all four majors resolved at triage (one substantively — E5's
extraction re-homed to `@netscript/deploy-core`). Plan proceeds to **Stage G PLAN-EVAL**
(OpenHands minimax-M3, separate session) with the amended plan.md as the artifact under evaluation.
The owner may optionally re-run the original Tier-D WSL Codex adversarial pass after the credit
reset (2026-07-07 03:52) — recorded as optional, not gating.
