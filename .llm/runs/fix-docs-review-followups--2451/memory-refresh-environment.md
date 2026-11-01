# Refresh environment — 2026-11-01

Deno 2.9.7 is already installed, matching CI. RTK is absent; use focused git/gh output and the repository's structured validation wrappers. Prior memory is stored in committed run memory files; no dedicated memory connector is available. Read the saved docs validation, browser environment, carrier freshness, and Claude read-only evaluation recipes before rediscovering them.

This checkout initially has only main's remote-tracking ref. `git fetch origin main fix/docs-review-followups` downloads both histories but `FETCH_HEAD` resolves its first entry (main), not the requested PR branch. Resume by the API-verified exact PR head, then push explicitly to fix/docs-review-followups. Never infer the PR head from bare FETCH_HEAD.

Specific owner directives override dispatcher defaults: refresh existing PR #2452, use Refs links without closing keywords, stop at READY, and publish the final issue report using excluded .divybot-final-report files.
