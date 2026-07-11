# Drift

- D1 (owner-authorized): PLAN-EVAL waived for this slice. Plan and design remain recorded before implementation.
- D2 (tool-interface): the brief requests narrow execution as `deno task e2e:cli gates <gate-ids>`, but `gates` accepts one suite and only lists gates; `run` accepts a suite and exposes no gate filter. Both affected IDs are in `scaffold.runtime`, whose full execution the brief reserves for the orchestrator. Used focused helper/call-site tests and recorded the successful suite gate listing instead.
