# Phase registry — release-0.0.5 continuation

| Group | Scope                                                                  | Status   | Dependency / gate                                               |
| ----- | ---------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| S0    | Activation, handover, live main/GitHub re-baseline, #1331 verification | complete | current evidence captured                                       |
| S1    | Future-milestone rollover and milestone-24 frontend/non-frontend split | complete | exact before/after verification recorded                        |
| S2    | 0.0.5 disposition, clusters, waves, canary boundaries                  | complete | v3 covers all 38 issues, 18 clusters, 3 cuts                    |
| S3    | Separate Minimax M3 PLAN-EVAL of committed wave plan                   | complete | PASS, session `567e3125-0fe9-4637-b0bb-30c20f9d3c26`            |
| P1338 | DeepSeek max formal IMPL-EVAL default prerequisite                     | active   | PLAN-EVAL PASS; S1 pushed; separate Grok REVIEW pending         |
| W1..N | One supervisor per PR cluster, per-wave gates and canaries             | held     | #1338 landing/live proof + T1-B executed green; preflights ready |
| F     | Cut-time checklist, evidence closures, final pair, stable cut          | prepared | closure contracts prepared; execution waits on waves/cuts       |
