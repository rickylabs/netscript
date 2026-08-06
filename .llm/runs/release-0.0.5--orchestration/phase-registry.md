# Phase registry — release-0.0.5 continuation

| Group | Scope                                                                  | Status   | Dependency / gate                                    |
| ----- | ---------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| S0    | Activation, handover, live main/GitHub re-baseline, #1331 verification | complete | current evidence captured                            |
| S1    | Future-milestone rollover and milestone-24 frontend/non-frontend split | complete | exact before/after verification recorded             |
| S2    | 0.0.5 disposition, clusters, waves, canary boundaries                  | complete | v3 covers all 38 issues, 18 clusters, 3 cuts         |
| S3    | Separate Minimax M3 PLAN-EVAL of committed wave plan                   | complete | PASS, session `567e3125-0fe9-4637-b0bb-30c20f9d3c26` |
| W1..N | One supervisor per PR cluster, per-wave gates and canaries             | active   | T1-A `FAIL_FIX` repair; T1-B ready-merge CI active    |
| F     | Cut-time checklist, final canary pair, stable cut                      | pending  | every milestone disposition complete                 |
