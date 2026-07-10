# Research — Antigravity evidence-acquisition lane (#578)

## Re-baseline

- Carried-in sources: issue #578, the #576 controller contracts, existing
  `runtime/adapters/antigravity-adapter.ts`, and merged #577 provider profiles.
- Re-derived against integration commit `800848ae` on 2026-07-10; current HEAD before this slice was
  `4e11797ce78ef8105e64e9dcb4c3df2251596ab5` and descends from that integration commit.
- The #577 surface is present at `.llm/tools/agentic/runtime/provider-profiles.ts`.
- Plain `git fetch origin` failed with raw exit 128 because `remote.origin.fetch` names the deleted
  branch `feat/fresh-ui-pixel-polish`. The two required refs were fetched explicitly without changing
  repository configuration.
- The existing untracked `codex-thread-ids.md` belongs to the coordinator and was preserved.

## Safety method

Live output was classified in memory. Raw stdout/stderr, credentials, cookies, OAuth data, and
account identifiers were neither printed nor persisted. Prompts contained only synthetic markers.
The first invocation's orchestration capture was empty, so it is recorded as missing evidence rather
than assigned a provider exit. The single retry produced a classified result. After its auth/service
timeout indicators, live probing stopped in accordance with the owner rule.

## Findings

| # | Finding | Evidence / verification |
| - | ------- | ----------------------- |
| 1 | Canonical binary is `/home/codex/.local/bin/agy`, version `1.1.1`, running from native ext4 as user `codex`. | Static `agy --version`; supervisor facts. |
| 2 | `agy --help` advertises headless `--print`/`-p`, `--print-timeout`, `--model`, `--agent`, `--project`, `--conversation`, `--continue`, `--sandbox`, and `--dangerously-skip-permissions`. | Static help probe, raw exit 0. |
| 3 | The advertised surface has no JSON or JSONL output flag. Structured provider output is therefore unsupported by the proven CLI surface, not silently inferred from stdout. | Static help probe. |
| 4 | The retry of a minimal exact-marker headless prompt returned raw exit `1` after 30,660 ms, with no stdout and classified authentication, service-failure, and timeout indicators in stderr. | `antigravity-capability-evidence.json`; raw text discarded. |
| 5 | Headless success is not proven. The first attempt had no captured classifier record and the retry was blocked. | Machine evidence file. |
| 6 | Sandbox behavior, web search/fetch, citation persistence, and instruction-file loading remain unproven because continuing after an auth/service block would spend quota without a ready session. | Explicit negative/deferred result. |
| 7 | `~/.gemini` exists, but presence is not proof of a usable live session. Existing `local-state-adapter.ts` already maps unambiguous legacy `gemini` state to canonical `antigravity` and rejects mixed state. | Static filesystem presence and focused source inspection. |
| 8 | Existing Antigravity adapter deliberately supports only static version planning and returns issue-578 deferral for live evidence. It never implements launch/resume. | `runtime/adapters/antigravity-adapter.ts`. |
| 9 | #576 results prohibit raw output and credential values; #577 canaries already model fail-closed capability evidence. The evidence lane should extend those conventions rather than create a second controller/result model. | `runtime/{contract,ports,provider-canary}.ts`. |
| 10 | Run-local external resource aggregation requires proven upstream behavior and cited extracts. Because web/citation behavior did not pass, no provider-derived resource is aggregated in this plan slice. | `.llm/harness/workflow/resource-aggregation.md`. |

## Capability verdict

| Capability | Verdict | Consequence |
| ---------- | ------- | ----------- |
| Headless success | unproven / blocked | No live adapter integration yet. |
| Failure exit behavior | partially proven | Exit 1 is evidence for the observed timeout path only; no global exit-code table is inferred. |
| Model/agent/project/conversation flags | advertised | May be represented as optional request fields, but only exercised after session readiness. |
| Sandbox | advertised, live unproven | Default evidence probe remains sandboxed/read-only; fail closed if unsupported. |
| JSON/JSONL | unsupported by advertised surface | Classifier owns bounded text classification; raw output never becomes evidence. |
| Web search/fetch + citations | deferred | No resource aggregation or synthesis handoff until a bounded canary proves both acquisition and persisted citations. |
| Subscription/quota | no signal observed | #578 may classify explicit signals only; fallback/history/restoration remain #579. |
| `AGENTS.md` / `GEMINI.md` | deferred | Must be proven with synthetic, non-secret markers after live readiness. |
| Legacy Gemini state | compatible at state parser only | Do not create a `gemini` alias or infer Gemini CLI semantics. |

## jsr-audit surface scan

N/A. This is internal `.llm/tools/agentic` tooling; no package export, JSR manifest, dependency, or
published surface changes are planned. Internal exported symbols still require explicit return types
under workspace `isolatedDeclarations`.

## Open questions

- Safe to defer: which advertised model/agent names are available to this subscription. Query only
  after owner-confirmed session readiness; never persist account identity.
- Safe to defer: exact `AGENTS.md` versus `GEMINI.md` precedence. Prove with a bounded synthetic
  fixture rather than relying on legacy Gemini documentation.
- Safe to defer to #579: exact quota/rate-limit taxonomy, transition history, fallback choice, reset,
  and restoration timing.
- Must resolve before implementation integration: live headless success plus sandbox and citation
  persistence must pass. Until then the production adapter continues returning issue-578 deferral.
