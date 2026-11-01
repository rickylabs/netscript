# Resume scaffold redesign #2570

Draft PR2572, branch orch/divybot-6557001595. All implementation slices complete and
independently reviewed; no merge/readiness claim. Baseline0af8fd9e. Commits:
ee051a9 plan; c2c85fb S1; d5f0c9a S2;7d9fd6a S3; final S4 sign-off commit follows.

## Final state

Independent Claude Opus5.5 high IMPL-EVAL code PASS (impl-eval.md), no blocking code
findings. Independent read-only Astra visual round2 PASS after one corrected failure:
every page/state>=8 fidelity AND quality; all96 images viewed. Browser72 cases,
12 interactionsets,0pageerrors. Three native generated fixtures: no-db,no-db with
memory service,sqlite/Aspire scaffold with canonical auth/workers/streams/AI plugins.
No fixture source patches. Empty/service/plugin plus DB/post-init checks pass.

Deno2.9.7:302/302 tests across43files;all15root check:*;release:preflight;
docs:accuracy;quality:gate;publish:dry-run PASS. Structured scoped check/lint/fmt
PASS19files plus isolated template test correction. Full carrier regeneration no
newdiff. CSS budgets unchanged; measured totals in s3-css-installed.json.

## What prevents readiness

Exact `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited1:
preflight.aspire and cleanup.aspire-stop failed because Docker daemon unavailable.
Runtime and container cleanup UNPROVEN, not a policy skip. Workers/streams real
ready-path integration remains unproved beyond typed tests; plugin browser correctly
shows unavailable, AI no-samples empty. Keep draft and do NOT post READY until required
runtime is green or an explicit workflow policy skips it. Cockpit alone merges.

FreshUI full-export doclint124diagnostics in unchanged files;CLI doclintclean.
No claim of all-package documentation clean. Baseline attribution is file comparison,
not a separate baseline run. See s4-jsr-audit.md. Foreign Aspire resources untouched;
8 owned preview/service processes stopped with exact cwd/argv proof. No owned preview
remains; Docker resources could not be enumerated. See leak-report.md.

## Scope and follow-up

#2488 remainsOPEN and PR2572 mergeable at final review. If2488 lands before merge,
merge origin/main, reconcile the existing sharedpalette, regenerate and reverify;
never rebase/forcepush. No componentfork or #2571 showcase plumbing. The newly fixed
palette uses its existing callbackAPI, adds filtering/keyboarddispatch/visibleclose.

Accepted CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY is in canonical debtledger: every
app resolves workerscontract; releasepin/parity tests mitigate, optionaltypedadapter
needed before independentmajor upgrades. Other low/nonblocking review observations
are retained in impl-eval.md (probeoverfetch,soft404,footerARIA,navlabels,dateguard).

## Resuming

Read s4-verification.md, impl-eval.md, plan.md B1–B6, drift.md. Canonical service
examples/orderreference and devdesignlinks are preserved. Contributorentrypoint:
packages/cli/src/kernel/assets/app/README.md. Full evidence is this run directory.
Public paths are repo-relative, no sessionids. Raw identities/logs remain private.
The final assignment report is queued only through untracked .divybot-final-report.md;
its existence does not prove publication. Refs2570/2566,no labels,owner process applies.
