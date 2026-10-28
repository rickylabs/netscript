# Plan & Design — READY FOR REVIEW

Bound snippet compilation processes and the Pages build without weakening any checks.
Preserve compile-only snippet semantics and copied-lock isolation. Use a process-group deadline
with stdin closed and diagnostics mapped back to source fences. Exercise a nonterminating fixture
and red/green negative control. Size workflow limits from completed Pages builds.

One implementation slice: compiler/process lifecycle, fixture/tests, build-only workflow limits.
Gates: docs:snippets:test, docs:snippets on main documentation, scoped structured check/lint/format,
existing documentation workflow contract, full CLI E2E attempt, independent read-only IMPL-EVAL.

PLAN-EVAL: N/A — scoped bug repair with established compiler/extractor contracts and no framework
or public API changes. Main risk is losing descendant cleanup or changing check isolation;
real-process timeout and success tests plus existing compiler fixtures cover these.

Export drift investigation is evidence-only; defer multi-line performance fixes. No package/plugin
architecture or publish surface changes; JSR and framework doctrine gates are not applicable.
