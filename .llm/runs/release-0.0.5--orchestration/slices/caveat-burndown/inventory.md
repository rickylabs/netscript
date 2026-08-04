# Docs-caveat burn-down — inventory & classification (owner goal, 2026-08-04)

Goal (owner): most docs caveat call-outs GONE by end of 0.0.5. Docs tag caveats with
`<!-- caveat: arch-debt:<id> -->` markers (27 tagged occurrences across 10 debt ids on
origin/main) plus a handful of untagged call-outs. "Gone" means the underlying limitation is
fixed and the call-out removed in the closing PR — never deleted while still true.

## Kill list (fix this milestone — issues filed, wave 5/6 slices)

| Debt id | Markers | Issue | Size | Notes |
| --- | --- | --- | --- | --- |
| workers-scaffold-job-tools-noop | 5 | #1228 | M | Telemetry machinery real; helpers are stubs — wiring work |
| (untagged) sagas mirror startup-only | 1 (tutorial 05-live-stream) | #1225 (pulled to 0.0.5) | M | Transport exists; producer needs per-transition upserts |
| triggers-defer-unsupported | 2 | #1229 | M-L | One-shot scheduler/replay port; fake-clock tests |
| fresh-app-telemetry-defaults | 1 | #1230 | S-M | Activate the reserved seam |
| runtime-app-wide-shutdown-orchestrator | 1 | #1231 | M | Compose existing drains under one budget |

Kill list covers 10 of 27 tagged markers + the highest-visibility tutorial caveat.

## Reframe list (true v1 boundaries — rewrite from warning to design statement, docs lane)

| Debt id | Markers | Why it stays |
| --- | --- | --- |
| seamless-auth-roadmap | 6 | 9 better-auth plugins first-class integration — roadmap-scale |
| auth-single-active-backend-boundary | 4 | Deliberate v1 boundary per the debt entry itself |
| workers-non-deno-task-sandbox-boundary | 3 | OS-level sandboxing for non-Deno runtimes — security-scale work |
| streams-manifest-helpers-unsupported | 3 | Generic topic pub/sub transport — feature-scale |
| cli-deploy-artifacts-missing | 1 | Deploy artifact generation — 0.0.6+ epic territory |
| fresh-hosted-example-sandboxes | 1 | External hosting infra, not a code slice |

Reframe = the call-out stops reading as an apology and states the v1 design boundary and the
roadmap pointer; count of scary-warning callouts drops to near zero while staying truthful.
Routing: docs-authoring lane (documentation exception), coordinated with docsorch's sweep.

## Fix-driven caveat corrections already owed (standing rule, recorded earlier)

#1224 sagas projection (none found tagged), #1211 ports (8 files with fixed-port prose —
verify each is example-accurate rather than caveat-stale), #1206/#1218 (no stale prose found).

## Sequencing

Kill-list slices enter waves 5–6 ahead of p3 docs items; existing wave-5/6 issues yield slots
only where lanes are contended (recorded per displacement in plan.md). Reframe pass runs once
kill-list PRs land, so the docs sweep sees final truth. Cut-time checklist gains: "caveat
markers on main ≤ reframe list; no warning-type callout without a matching open debt entry."
