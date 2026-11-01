# STATUS — 0.0.9 (mc009e; one line per group; reread first after a compact)
- 0.0.9-canary.1 PUBLISHED from f4aa307b5 (22:05Z; canary-pair success; e2e-cli-prod green). #2396 closed (published-graph proof). Lanes may merge again.
- COMBINED CANARY READY TO CUT at 6c3f8a118 (18:16Z, comment 6547307997; supersedes .1 15cffa2fe and .2 7feb24c7d; includes Fresh UI S6a) · Eric cuts
- H01/H02/A1/A2/A3/E1 DONE (all closed)
- DECISIONS EXECUTED (Eric "Approved" ~18:45Z): #2159 closed (follow-up #2543), #2259 → Backlog (#2278), #1655 → Backlog, #2185 closed, #2268 closed (box1 → #2544), #1366 closed (box5 → #429-431, consumer proof → #2545), #2068 closed (eis-chat#518)
- NON-DESIGN SCOPE COMPLETE. Eric 11-01: 0.0.9 ships everything the Fresh UI lane decided (all DS1 except S6b; stable target ~11-03). Next: #2488 merge → auto-qualify → canary.2 (approved) → remaining DS1 gate list → terminal canary (needs Eric go) → atelier-cockpit qualification (EIS Chat skipped) → stable on Eric's go.
- C1 DONE: #2267 #2132 #2338 #1367 #2377 #2373 #2390 closed
- F1 #2384 #2375 #2411 #2379 #2409 closed; #2406 waits on the Fresh UI lane's PR #2408 (asked Cockpit 14:52Z)
- BUDGET: Codex weekly at 89% (Cockpit 16:05Z): no new Codex leaves unless canary-blocking; finish running ones
- Rules: merge.sh confirms MERGED before recording; drop e2e label when a PR's e2e completes; keep a leaf's issue open while its worker continues; check closingIssuesReferences before partial merges
