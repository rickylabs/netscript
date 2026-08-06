# Phase registry — release-0.0.5 continuation

| Group | Scope                                                                  | Status   | Dependency / gate                                               |
| ----- | ---------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| S0    | Activation, handover, live main/GitHub re-baseline, #1331 verification | complete | current evidence captured                                       |
| S1    | Future-milestone rollover and milestone-24 frontend/non-frontend split | complete | exact before/after verification recorded                        |
| S2    | 0.0.5 disposition, clusters, waves, canary boundaries                  | complete | v3 covers all 38 issues, 18 clusters, 3 cuts                    |
| S3    | Separate Minimax M3 PLAN-EVAL of committed wave plan                   | complete | PASS, session `567e3125-0fe9-4637-b0bb-30c20f9d3c26`            |
| P1338 | DeepSeek max formal IMPL-EVAL default prerequisite                     | complete | PR #1339 merged to canary.14 at `10dbea37c`; local IMPL-EVAL PASS |
| T1    | Inherited #1315/#1316 train repairs                                    | active   | T1-A fresh DeepSeek max evaluating; T1-B current-head CI queued  |
| W1..N | One supervisor per PR cluster, per-wave gates and canaries             | held     | T1 pair merge + next verified canary; preflights ready           |
| F     | Cut-time checklist, evidence closures, final pair, stable cut          | prepared | closure contracts prepared; execution waits on waves/cuts       |
