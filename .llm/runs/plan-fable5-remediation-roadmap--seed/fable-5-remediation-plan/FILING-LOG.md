# Stage-H filing log

Filed on 2026-08-08 after explicit owner ratification. GitHub is now authoritative; the issue
drafts in this planning PR are provenance and implementation context only.

## Milestone train

Existing milestone objects were renamed from highest to lowest so their issue membership stayed
attached while two releases were inserted:

| Milestone object | Previous title | Live title |
| --- | --- | --- |
| #21 | 0.0.13 | 0.0.15 |
| #20 | 0.0.12 | 0.0.14 |
| #19 | 0.0.11 | 0.0.13 |
| #18 | 0.0.10 | 0.0.12 |
| #17 | 0.0.9 | 0.0.11 |
| #16 | 0.0.8 | 0.0.10 |
| #24 | 0.0.7 | 0.0.9 |
| #25 | 0.0.6 | 0.0.8 |
| #26 | — | 0.0.6 (new) |
| #27 | — | 0.0.7 (new) |

The complete former-0.0.6 membership was first restored to new milestone #26. The planned
exceptions were then reconciled: #1279 → 0.0.15; #979 and #980 → 0.0.8; #1000, #175, #767,
#768, #863, and #864 → Backlog / Triage. No existing issue was closed.

## Draft-ID to live-issue map

| Draft | Live issue | Milestone |
| --- | --- | --- |
| T1-01 | #1348 | 0.0.6 |
| T1-02 | #1349 | 0.0.6 |
| T1-03 | #1350 | 0.0.6 |
| T1-04 | #1351 | 0.0.6 |
| T1-05 | #1352 | 0.0.6 |
| T1-06 | #1353 | 0.0.6 |
| T2-01 | #1354 | 0.0.7 |
| T2-02 | #1355 | 0.0.7 |
| T2-03 | #1356 | 0.0.7 |
| T2-04 | #1357 | 0.0.7 |
| T2-05 | #1358 | 0.0.7 |
| T2-06 | #1359 | 0.0.7 |
| T2-07 | #1360 | 0.0.7 |
| T3-01 | #1361 | 0.0.6 |
| T3-02 | #1362 | 0.0.6 |
| T3-03 | #1363 | 0.0.6 |
| T3-04 | #1364 | 0.0.6 |
| T4-01 | #1365 | 0.0.7 |
| T4-02 | #1366 | 0.0.7 |
| T4-03 | #1367 | 0.0.7 |
| T4-04 | #1368 | 0.0.7 |
| T4-05 | #1369 | 0.0.7 |
| T4-06 | #1370 | 0.0.8 |
| T4-07 | #1371 | 0.0.8 |
| T4-08 | #1372 | 0.0.8 |
| T5-01 | #1373 | 0.0.8 |
| T5-02 | #1374 | 0.0.8 |
| T5-03 | #1375 | 0.0.8 |
| T5-04 | #1376 | 0.0.8 |
| T5-05 | #1377 | 0.0.8 |
| T6-01 | #1378 | 0.0.8 |
| T6-02 | #1379 | 0.0.8 |
| T6-03 | #1380 | 0.0.8 |
| T7-01 | #1381 | 0.0.8 |
| TA-01 | #1382 | 0.0.8 |
| TA-02 | #1383 | 0.0.8 |
| TA-03a | #1384 | 0.0.8 |
| TA-03b | #1385 | 0.0.8 |
| TA-03c | #1386 | 0.0.8 |
| TA-04 | #1387 | 0.0.8 |
| TA-05 | #1388 | 0.0.8 |

## Reconciliation receipts

- Created 41 issues (#1348–#1388): 10 in 0.0.6, 12 in 0.0.7, and 19 in 0.0.8.
- Replaced internal Draft-ID dependency references in every live issue with live issue numbers.
- Verified every new issue is open, has exactly one milestone, `status:triage`, and at least one
  `type:`, `area:`, and `priority:` label.
- Posted the ratified additive amendment blocks to #1278, #1276, #1279, #1275, #1245, #1333,
  #1335, #1210, #1208, #922, #301, #1126, #1325, #1326, #1329, #979, #1197, #1090, #175,
  and #823. Marker: `<!-- fable5-remediation-stage-h-pr-1347 -->`.
- Preserved open PR #1215 and every other former-0.0.6 item during the milestone insertion.
- No issue was closed and no implementation work was started by this filing pass.

