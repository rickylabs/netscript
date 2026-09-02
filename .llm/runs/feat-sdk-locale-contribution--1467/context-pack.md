# Context pack

Issue `#1467` adds locale as the first canonical non-auth SDK client contribution. Baseline is clean
`origin/main` at `77ad823dc`. Placement is `packages/sdk/src/client`, exported through the existing
`./client` entrypoint/root barrel; no export-map or dependency change. `accept-language` is allowed,
locale context is optional, cache mode is partitioned, and all private adapter/trace surfaces are
out of scope. The auth reference exists only on `origin/feat/sdk-credential-contribution`, so this
slice uses it as a pattern without integrating it. `PLAN-EVAL: N/A` is owner-directed and justified
in `plan.md`/`worklog.md`. IMPL-EVAL remains a separate supervisor-owned pass after this lane.

The feature is on PR #1922. The branch was re-baselined after the coordinator integrated `main`
`634b83d64`; repair baseline/head is `a628de1a5`. PR #1914's documentation compilers exposed two
narrow example defects: the locale JSDoc left supporting names unbound, and the site fence imported
a module no fence materialized. The JSDoc now uses public imports plus a real oRPC/Zod contract; the
site example defines its contract inline so one fence is independently copyable. No SDK behavior,
docs tooling, gate ceiling, plugin, trace, or prepared-call surface was changed.

Repair gates before commit are green: JSDoc examples exit 0 with 359 examples and deferred census
116 unbound-name / 14 type-error; docs snippets exit 0 with 597 scanned and 24 checked; SDK check
exits 0 over 103 files; SDK tests are 230/0/0. Required carrier generation exits 0 in order. The
lock remains `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`. Remaining work is
the evidence commit, final carrier recheck, explicit-refspec push, and a PR repair comment. Repair
commit `6969d330b` passed all four post-commit carrier checks in the required order.
