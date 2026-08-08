# Phase registry — release-0.0.5 continuation

| Group   | Scope                                                                   | Status     | Dependency / gate                                                       |
| ------- | ----------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| S0      | Activation, handover, live main/GitHub re-baseline, #1331 verification  | complete   | current evidence captured                                               |
| S1      | Future-milestone rollover and milestone-24 frontend/non-frontend split  | complete   | exact before/after verification recorded                                |
| S2      | 0.0.5 disposition, clusters, waves, canary boundaries                   | complete   | v3 covers all 38 issues, 18 clusters, 3 cuts                            |
| S3      | Separate Minimax M3 PLAN-EVAL of committed wave plan                    | complete   | PASS, session `567e3125-0fe9-4637-b0bb-30c20f9d3c26`                    |
| P1338   | DeepSeek max formal IMPL-EVAL default prerequisite                      | complete   | PR #1339 merged to canary.14 at `10dbea37c`; local IMPL-EVAL PASS       |
| T1/T2   | Existing #1315/#1316/#1317/#1318 queue                                  | complete   | merged; #1295/#1189/#1117/#1115 auto-closed                             |
| C14     | Payload #1340, OIDC publish, registry and pinned E2E pair               | complete   | main `d6db645a`; tag `d405def4`; runs 31128595811/31128614286 green     |
| W1      | First canary.15 group; three independent direct-to-main PRs             | complete   | #1341/#1342/#1344 merged; #1312/#1148/#1024/#1328/#1324/#1330 closed    |
| C15/C16 | canary.15 cut, pinned-E2E red, repaired forward by #1346, canary.16 cut | complete   | canary.16 green pair 31201279314 / 31201560939; #1343 deferred to 0.0.6 |
| W2      | #1325 · #1329 · #1202+#1327                                             | dispatched | plan v4; three independent direct-to-main PRs                           |
| W3      | #1326 · #1102+#1197+#1375+#1376 · #1119                                 | held       | W3-A depends W2-B                                                       |
| C17     | canary publish + pinned production E2E pair                             | held       | W2 + W3 landed                                                          |
| W4      | #1333+#1359 · #1356 · #1108                                             | held       | after C17; W4-A takes the GLM design pass                               |
| W5      | #1373 · #1137+#1138 · #1332+#1334 · #1208                               | held       | W5-A coordinates naming with W4-A; W5-D depends W4-A+W5-A               |
| C18     | final canary pair; stable-cut prerequisite for the same content         | held       | W4 + W5 landed; no merge between C18 and the cut                        |
| F       | Evidence closures #1004/#1090/#1126/#1166/#1169/#1338, stable cut       | prepared   | closure contracts prepared; execution waits on C17/C18                  |
