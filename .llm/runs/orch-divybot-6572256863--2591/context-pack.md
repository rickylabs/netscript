# Resume

Issue 2591; branch `orch/divybot-6572256863`; baseline `6766130bbafbe78a9bb5870f704987cb0743c5e6`.
See plan.md and worklog.md. S0 complete; S1 implemented and undergoing independent repair review.

Root causes: startup-only seed dispatch and app-only default stream links. Existing runtime
suite explicitly restarts workers after seed and adds the users stream link in a storage fixture.
Local Deno 2.9.7 works, RTK absent, Docker daemon absent. Isolated reproduction AppHost is owned
by `.llm/tmp/2591-repro/documented-2591/aspire/apphost.mts`; leave foreign AppHosts alone.

Next: implement filesystem-driven handoff lifetime, explicit service consumer install option,
document exact commands, then independent clean runtime acceptance with both negative controls.
Separate cross-family IMPL-EVAL required. Public artifacts use repository-relative paths.
Draft PR with Refs #2591; no closing keyword, rebase, force push or merge. READY only after
final-head runtime CI and required check evidence. Final report through ignored file handoff.

S1 focused tests: 112 PASS, including real filesystem late publication/rearm/failure controls.
Independent review found sample failure isolation and service re-selection gaps; fixed with
startup readiness separated from observer lifetime and revocation of only prior managed edges.
Next after S1 review: commit/push S1, then implement S2 documented-order runtime gate with controls.

S1 independent repair review PASS. All 112 focused results and 14 owned-source wrapper checks pass.
Root check/lint/fmt and carrier tasks pass on the prior baseline with scoped repaired-source checks;
S2 must complete final-head validation. No accepted product debt. Proceed to S1 commit/push, then S2.
