# 2026-10-31 — Windows dispatch from an unmerged branch

The registered `e2e-cli-prod.yml` workflow accepts branch-added workflow_dispatch inputs when dispatched with `--ref`. The command `gh workflow run e2e-cli-prod.yml --repo rickylabs/netscript --ref orch/divybot-6544155256 -f published-version=0.0.8 -f generated-surface-only=true` was accepted before merge and created run 41207980660 at CI implementation commit 1af3160878aa64773a7a15f316fe243bfdf05643. This avoids registering a new workflow on main just to collect Windows evidence.

Use the canonical final-report file handoff for the issue, not gh issue comment. PR phase comments remain explicitly authorized and are separate from the canonical issue report.
