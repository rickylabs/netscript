# Documentation checks in the OpenHands phase evaluator

Documentation accuracy is part of the unified automatic IMPL-EVAL rather than a second evaluator
run. The trusted IMPL-EVAL prompt requires the evaluator to read every changed document and
hand-test representative executable commands, snippets, paths, and outputs. A PR can select
`eval:model:minimax` before the ready transition when the cheaper documentation-oriented model is
appropriate. `impl-eval:skip` is the single attributed escape hatch; `docs-eval:skip` remains only
as a deprecated compatibility label and does not suppress the unified gate.
