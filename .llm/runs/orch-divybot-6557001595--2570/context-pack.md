# Resume scaffold redesign #2570

Draft PR #2572, branch orch/divybot-6557001595. PLAN-EVAL passed round 2.
S1 passed independent review and is committed/pushed as c2c85fb.
S2 passed independent re-review (s2-terminal-review.md). Sign-off commit includes
typed live readers and safe post-init connection. S3 may now begin. Read worklog.

S2 adds memory/database typed record adapters and bounded memory detail lookup;
optional request-local auth client discovery; metadata-based plugin identity,
workers list, validated streams readiness and in-process AI model projection.
Resource-slice initialInput fixes canonical memory list calls without altering
service contracts. Actual CLI diagnostic grammar corrections are in drift.md.

Gates: 90 focused scaffold/resource/service-add tests; memory/DB app check 63 files each,
plugin app check 50 files; 17 source files check/lint/fmt; quality gate passes.
Browser evidence proves actual service records/detail/missing ID and generated
signin form. After native config set enables plugin references, unavailable
runtimes and empty no-samples AI are displayed truthfully. These are slice proofs,
not final visual or merge acceptance.

S3 terminal PASS: independent Claude code sign-off and Astra visual round2 PASS.
All 96 images reviewed; every page/state minimum fidelity and quality >=8/10.
Clean review-* fixtures pass72 browser cases/12 interactions,0 page errors.
Source/carrier hashes and actual emitted CSS agree. S4 final gates now authorized.
Read visual-review.md and s3-code-terminal-review.md. Final independent IMPL-EVAL
still required; no READY until required checks green or policy-skipped.

Read plan.md B1–B6 plus drift.md. Preserve canonical service examples, reference
order route and development design links. Current #2488 remains OPEN; merge main
when it lands. Do not duplicate gap components or implement showcase #2571.

Owner mandates Claude Opus 5.5 high read-only evaluations and separate Astra visual
review. Public artifacts are repo-relative and omit session ids. Raw logs require
normalization before publication. Final report uses untracked
.divybot-final-report.md handoff. Keep PR draft, Refs-only, no labels.
