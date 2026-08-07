# Phase registry — release-0.0.5 continuation

| Group | Scope                                                                  | Status   | Dependency / gate                                               |
| ----- | ---------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| S0    | Activation, handover, live main/GitHub re-baseline, #1331 verification | complete | current evidence captured                                       |
| S1    | Future-milestone rollover and milestone-24 frontend/non-frontend split | complete | exact before/after verification recorded                        |
| S2    | 0.0.5 disposition, clusters, waves, canary boundaries                  | complete | v3 covers all 38 issues, 18 clusters, 3 cuts                    |
| S3    | Separate Minimax M3 PLAN-EVAL of committed wave plan                   | complete | PASS, session `567e3125-0fe9-4637-b0bb-30c20f9d3c26`            |
| P1338 | DeepSeek max formal IMPL-EVAL default prerequisite                     | complete | PR #1339 merged to canary.14 at `10dbea37c`; local IMPL-EVAL PASS |
| T1/T2 | Existing #1315/#1316/#1317/#1318 queue                                 | complete | merged; #1295/#1189/#1117/#1115 auto-closed                      |
| C14   | Payload #1340, OIDC publish, registry and pinned E2E pair               | complete | main `d6db645a`; tag `d405def4`; runs 31128595811/31128614286 green |
| W1    | First canary.15 group; three independent direct-to-main PRs            | ready    | W1-A #1312/#1148; W1-B #1024/#1328; W1-C #1324/#1330            |
| W2..N | Remaining direct-to-main clusters and later canary boundaries          | held     | consume verified C14 main; respect recorded cross-wave dependencies |
| F     | Evidence closures, final pair, stable cut                              | prepared | closure contracts prepared; execution waits on remaining waves/cuts |
