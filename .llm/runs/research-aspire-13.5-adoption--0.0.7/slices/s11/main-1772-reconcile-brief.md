Supervisor steering (same conversation, S11 #1723 / PR #1771) — MAIN RECONCILE, prose only. main
advanced to de57fab0 (#1772 "document background reference preflight"), which edited
docs/site/orchestration-runtime/how-to/deploy-local-aspire.md — the same page you rewrote — and
regenerated the agent-docs/publish-asset carriers. Your branch base stays S10' a46ea16d (the code
stack is not moving for this). Do exactly this as ONE docs-only commit: (1) read main's version of
that page (`git show origin/main:docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`) and
port #1772's background-reference-preflight content into your version of the page verbatim in
meaning (keep your 13.5 corrections: `@microsoft/aspire-cli`, installation-aware
`aspire update --self`, current-13.4.6 / target-13.5.3 framing); do not revert anything #1772 added;
(2) `deno task gen:agent-docs-prose` and `deno task gen:publish-assets` to regenerate the carriers;
(3) `check:agent-docs-prose`, `check:publish-assets`, `docs:links`, Lume build; scans on the page:
no "D-", "OF-", "/home/agent", "receipt", ".NET Aspire"; keep aspire ps [] and docker ps -a empty;
commit as `docs(aspire): reconcile deploy-local-aspire with main #1772`, push with
`git push origin HEAD:refs/heads/docs/aspire-13-5-s11-public-docs-refresh` (no force), post
`## [PHASE: IMPL] S11 reconcile with main #1772` on PR #1771 (three lines: what #1772 added, how it
was merged, gates), update your run dir, end with the exact final line DONE or BLOCKED: <reason>.
Note: this pre-resolves the conflict that would otherwise surface when the stack next converges; the
rebase itself happens later.
