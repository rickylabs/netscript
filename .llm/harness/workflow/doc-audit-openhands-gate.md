# OpenHands docs-accuracy gate

Pending consolidation into `.llm/harness/workflow/doc-audit.md` when PR #805 lands: the automatic
OpenHands Minimax M3 gate is the CI-level documentation-accuracy backstop and runs for every PR with
`type:docs` or `area:docs` regardless of the agent-level pipeline. Minimax M3 is deliberately used
because its prose accuracy and low hallucination rate are affordable enough for quick manual testing
of small scaffolds, exact command snippets, paths, and claimed outputs—not just a reread of the
prose; maintainers can apply `docs-eval:skip` as the on-demand escape hatch, which the workflow
records as an explicit attributed “skipped on demand” summary.
