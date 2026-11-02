# Resume

Issue 2591; branch `orch/divybot-6572256863`; baseline `6766130bbafbe78a9bb5870f704987cb0743c5e6`.
See plan.md and worklog.md. S0 complete; implementation not started.

Root causes: startup-only seed dispatch and app-only default stream links. Existing runtime
suite explicitly restarts workers after seed and adds the users stream link in a storage fixture.
Local Deno 2.9.7 works, RTK absent, Docker daemon absent. Isolated reproduction AppHost is owned
by `.llm/tmp/2591-repro/documented-2591/aspire/apphost.mts`; leave foreign AppHosts alone.

Next: implement filesystem-driven handoff lifetime, explicit service consumer install option,
document exact commands, then independent clean runtime acceptance with both negative controls.
Separate cross-family IMPL-EVAL required. Public artifacts use repository-relative paths.
Draft PR with Refs #2591; no closing keyword, rebase, force push or merge. READY only after
final-head runtime CI and required check evidence. Final report through ignored file handoff.
