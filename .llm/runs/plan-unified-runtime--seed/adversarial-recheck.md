# Stage-F adversarial recheck — f85d4919

## 1. PARTIALLY-RESOLVED — obsolete Deno Deploy cell

Evidence: `design/canonical/UR-6.md:32-39` withdraws Classic/`deployctl` from v1, but `design/D2-capability-matrix/agent-briefs.md:62-66` still instructs a Stage-I lane to build-reject C2 and `:101-104` still assigns C2 writer-ownership behavior.

## 2. RESOLVED — #451 was over-folded into UR-4

Evidence: `design/canonical/UR-4.md:31-40,49,53-60` limits UR-4 to the host bridge, keeps #451 open for its full SDK contract, and restores owner fork O-1 as F-7.

## 3. RESOLVED — #453/#454 desktop realization was lost

Evidence: `design/canonical/UR-7.md:11-12,25-38` and `design/canonical/UR-10.md:11-12,26-40` make the UR cards foundations while preserving #453/#454 as open desktop-realization issues.

## 4. RESOLVED — #455 implementation was falsely superseded

Evidence: `design/canonical/UR-8.md:10-11,24-38` defines only the profile/prerequisite contract and explicitly keeps #455 open for the Turso Sync engine and behavioral acceptance.

## 5. PARTIALLY-RESOLVED — Nitro hosting bypassed shipped lifecycle semantics

Evidence: `design/canonical/UR-0.md:26-44,55-63` adds the prerequisite hostable lifecycle contract and reuses `ServiceShutdownCoordinator`, but `design/D1-composition-host/agent-briefs.md:58-62` still directs implementation to invent and drain a disposer registry as the lifecycle contract.

## 6. RESOLVED — owner brief had placeholders and a missing fork

Evidence: `design/D3-board-mechanics/decision-brief.md:3-29` materializes F-1…F-17, including restored #451 O-1 as F-7, with no placeholder rows.

## 7. RESOLVED — implementation briefs omitted mandatory stop-lines

Evidence: `design/D1-composition-host/agent-briefs.md:64-68` and `design/D2-capability-matrix/agent-briefs.md:69-74` exemplify the exact five-line block; mechanical count finds eight complete blocks in each pack (template plus seven briefs).

## 8. PARTIALLY-RESOLVED — filing lacked deterministic canonical bodies

Evidence: `design/canonical/slot-map.md:5-35` maps every slot to canonical inputs, but `design/D3-board-mechanics/filing-manifest.md:81-84` tells the filer to copy an entire canonical artifact verbatim rather than extracting its `## Body` and acceptance sections.

## 9. RESOLVED — filing was non-resumable and crossed an unmet prerequisite

Evidence: `design/D3-board-mechanics/filing-manifest.md:16-32,36-58,74-92` supplies per-slot idempotency, immediate logging, read-after-write, compare-before-edit, recovery rules, and a merged label-parity prerequisite.

## 10. RESOLVED — filing taxonomy had multiple statuses and label drift

Evidence: `design/D3-board-mechanics/filing-manifest.md:96-114` gives an exact per-slot label/milestone table with exactly one `status:` label and a preflight failure rule for missing repository labels.

## 11. RESOLVED — milestone train and deferred-cell representation conflicted

Evidence: `design/D3-board-mechanics/decision-brief.md:21-22` fixes one beta.13 UR train, while `design/canonical/UR-6.md:32-39` and `design/canonical/DD-RESEARCH.md:3-10` represent Deno Deploy as a separately milestoned research successor.

## 12. PARTIALLY-RESOLVED — owner fork choices still require post-ratification rewriting

Evidence: `design/D3-board-mechanics/decision-brief.md:54-59` provides committed A/B deltas for only six body-changing forks, while F-12 at `:24` can change the number of issues and slot map without a materialized branch artifact.

## 13. RESOLVED — #327 remained a contradictory authority

Evidence: `design/D3-board-mechanics/filing-manifest.md:130-147` specifies a compare-before-edit, non-closing #327 addendum that supersedes the saga exclusion and links UR-5 while preserving unrelated clauses.

## 14. RESOLVED — Stage-I lacked architecture prerequisites

Evidence: `design/canonical/UR-11.md:18-42,49-53` makes package/export ownership, doctrine archetypes, requirement schema, and build/CLI seam an acceptance-gated prerequisite blocking UR-1/UR-4/UR-5.

## 15. RESOLVED — cited dated evidence was absent

Evidence: `evidence/SHA256SUMS:1-6` covers all six committed extracts and `sha256sum -c evidence/SHA256SUMS` verifies every entry, including the new-platform Deno Deploy snapshot used by `research/deno-deploy-new.md`.

## 16. RESOLVED — #349 retained an invalid terminal status

Evidence: `design/D3-board-mechanics/filing-manifest.md:133-136` requires owner classification followed by `status:shipped` for completed closure or removal of `status:triage` for not-planned closure.

## 17. RESOLVED — locked and filing namespaces disagreed

Evidence: `design/canonical/slot-map.md:5-35` and `design/D3-board-mechanics/filing-manifest.md:94-111` consistently enumerate UR-0…UR-12 plus the non-UR DD-RESEARCH successor; no legacy UR-H handle remains.

## NEW-1. [MAJOR] Verbatim canonical-file filing would publish planning metadata and duplicate the idempotency marker

Evidence: `design/D3-board-mechanics/filing-manifest.md:10-12,81-84` mandates whole-file verbatim copy, while `design/canonical/UR-6.md:1-17` contains the marker both at file scope and inside the intended body, with title/labels/dependency metadata between them.

## NEW-2. [MAJOR] F-2 branch B creates a dependency cycle between UR-6 and DD-RESEARCH

Evidence: `design/canonical/DD-RESEARCH.md:9-10` depends on UR-6, but `design/canonical/UR-6.md:63-68` requires DD-RESEARCH to complete before branch-B UR-6 can become the four-cell suite.

## NEW-3. [MINOR] UR-6's canonical title still promises a four-cell conformance suite

Evidence: `design/canonical/UR-6.md:3` says “four-cell conformance suite,” contradicting its three-cell v1 definition and gates at `:22-39,51-54`.
