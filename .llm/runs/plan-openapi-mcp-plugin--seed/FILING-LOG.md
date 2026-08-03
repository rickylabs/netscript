# Filing log — plan-openapi-mcp-plugin--seed

Board filed 2026-08-03 under owner authorization (relayed). Precedent matched: #890 (epic #922)
and #891 (epic #892). **GitHub wins on conflict from this point.**

## Fork ratification (owner, 2026-08-03)

| Fork | Ruling |
| --- | --- |
| F1 | **NOT ratified by fiat — proof-arbitrated.** S-7 unlocked it: (a) post-allocation callback stands only if #1127's committed `proofs/P1-verdict.md` demonstrates the seam; a FAIL is a legitimate verdict that activates (b) the `aspire-cli` adapter. #1127's verdict decides. |
| F2 | **(a) ratified** — introspection v1; execution v2 behind opt-in. #1139 filed but out of scope until the owner flips F2. |
| F3 | **(a) ratified** — all first-party contracts enriched in one slice (#1137). |
| F4 | **(a) ratified** — receipts accepted (not required), and only after the S-15 fix (#1136 blocked by #1134). |
| F5 | Already applied to PR #1123; matches precedent. |

## Label created

`epic:openapi-mcp` (color 5319e7) — added to `.github/labels.yml` first, then created live.
Verified against the live taxonomy: none of the 15 existing `epic:*` labels fit.

## Mapping (all issues milestone **0.0.5**, label set per netscript-pr taxonomy, exactly one `status:` = `status:plan`, every child carries `Part of #1126`)

| OMB | Issue | Title | Labels beyond epic/status/milestone |
| --- | --- | --- | --- |
| — (epic) | #1126 | Epic: OpenAPI→MCP service introspection | type:umbrella area:tooling area:service priority:p1 — **no closing keyword anywhere in its body** |
| OMB-1 | #1127 | [S1] P1 proof: post-allocation endpoint-manifest seam (arbitrates F1) | type:test area:tooling area:aspire p0 |
| OMB-2 | #1128 | [S2] P2 proof: spec fidelity + size dry-run | type:test area:tooling area:service p0 |
| OMB-3 | #1129 | [S3] P3 proof: auth-guarded spec fixture | type:test area:tooling area:service p0 |
| OMB-4 | #1130 | [S4] Projection domain module | type:feat area:tooling p1 |
| OMB-5 | #1131 | [S5] Endpoint directory + source adapters | type:feat area:tooling p1 · **blocked by #1127 verdict** |
| OMB-6 | #1132 | [S6] Three read tools | type:feat area:tooling p1 |
| OMB-7 | #1133 | [S7] Manifest emission from the P1-proven seam | type:feat area:cli area:aspire p1 · **blocked by #1127 verdict** |
| OMB-8 | #1134 | [S8] Truncation metadata + receipt-after-validation fixes | type:fix area:tooling p1 |
| OMB-9 | #1135 | [S9] Activation surfaces + migration fixture | type:feat area:cli area:tooling p1 |
| OMB-10 | #1136 | [S10] Evidence-gate acceptance (F4a) | type:feat area:tooling p1 · **blocked by #1134, rationale in body (S-15)** |
| OMB-11 | #1137 | [S11] Contract summary/tags enrichment | type:feat area:service p1 |
| OMB-12 | #1138 | [S12] Docs reference + cross-links | type:docs area:docs p2 |
| OMB-13 | #1139 | [S13] EndpointPolicy + invoke (gated on F2) | type:feat area:tooling p2 · **fail-closed fixture set is the gate** |
| OMB-14 | #1140 | [S14] Wave observation (→ #1090) | type:chore area:tooling p2 · **cannot be closed by a PR; wave-four baseline carried in body** |

## Owner-mandated constraints carried into issue text (verified present)

- #1127: FAIL is legitimate → F1(b); gates #1131/#1133 (both bodies carry the block).
- #1139: F2 gate + the absent/malformed/empty/partial deny fixtures as `gate:` acceptance —
  the predicate-bug class 0.0.4 shipped twice, named in the body.
- #1140: observational, PR-unclosable, routed to #1090, wave-four baseline (0 docs-MCP calls /
  3 of 3 blind curl / ~25 min silent hang) in the body.
- #1136: dependency on #1134 explained in prose (pre-validation receipts would import the S-15
  defect into #1078's machinery), not only in the table.

## Milestone note

The 0.0.6+ renumber (same day) did not touch 0.0.4/0.0.5; every issue here targets milestone
0.0.5 (GitHub milestone number 23) and no body references a milestone above 0.0.5.
