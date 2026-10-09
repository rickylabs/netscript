# Drift — release 0.0.8 milestone run

| When (2026-10-09) | Drift | Resolution |
| --- | --- | --- |
| 18:34Z | The run record was to be stream plus KV only (harness#692), but the #692 writer and reader are not built yet. | The event stream and state were kept outside the repo. At 19:25Z the owner picked this run to be committed: this directory is the sanitized projection. |
| 18:40Z | The netscript `agentic:*` launchers are WSL/Windows-centric, and this host is Linux. | Implementers launch with the `claude` CLI (requested and observed model recorded per launch). Evaluators run through `codex exec`. Both run under the owner's routing override. |
| 18:58Z | Topic lanes were not given separate orchestrator sessions. | They are logical roles in the coordinator session, to respect the 2-implementer fleet cap (validator-accepted identities). |
| 19:01Z | PLAN-EVAL round 1 could not read the plan: the Codex read-only sandbox cannot create a namespace on this host. | The evaluator was re-run with filesystem access and stayed read-only by contract. Recorded in the verdicts. |
| 19:14Z | Wave 1 was dispatched on round 2's explicit wave-1 confirmation, while later-wave findings were still open. | All six findings were applied. Round 3 APPROVED at 19:18Z. |
| 19:20Z | The implementer contract opened the draft PR only after the first meaningful commit, but the harness method requires the draft PR first. | Running leaves were told to open draft PRs immediately (#2116, #2117), and the contract now makes STEP 1 an intent commit, a push and the draft PR, before any code. |
| 19:22Z | #1383 leaf: `plugin new` emitted unformatted sources, which would have failed the runtime suite's format gate once the guarded gate joined `scaffold.runtime`. | Fixed in scope through the existing generated-source formatter, and pinned by a test. |
