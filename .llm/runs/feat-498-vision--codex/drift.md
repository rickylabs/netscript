# Drift

## D1 — PLAN-EVAL owner waiver

The slice brief explicitly waives PLAN-EVAL and directs this lane to plan in the worklog, then
implement. IMPL-EVAL remains orchestrator-owned.

## D2 — carried vision behavior in embeddings adapter

The baseline already contains vision request/parsing behavior in `OpenAiEmbeddingsProvider`,
registered under `openai-embeddings`. The issue asks for the dedicated analyze-image seam; the plan
extracts this into an honestly named adapter and subpath rather than treating the mixed adapter as
done.

## D3 — reuse provider-family composition root

The first implementation draft added an `openai-vision` root subpath, which caused the scoped F-16
checker to report 13 immediate package children against a cap of 12. The adapter remains dedicated,
but registration and exports moved to the existing `openai-compatible` provider-family subpath so
the feature does not deepen folder-cardinality debt.
