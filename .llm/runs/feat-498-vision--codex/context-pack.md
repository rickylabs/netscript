# Context pack

- Objective: issue #498 dedicated OpenAI-compatible `VisionProviderPort` adapter.
- Baseline: `955b4abf639522c7da50bd15d20c6e999acb808f`.
- Branch: `feat/498-vision-adapter`.
- Profile: Archetype 2 Integration; no overlay.
- Key drift: baseline carried vision code inside the embeddings adapter; it is now a dedicated
  adapter registered from the existing OpenAI-compatible provider-family composition root. A new
  root subpath was rejected because it violated F-16.
- Validation: scoped check/lint/fmt clean; 91 tests pass; doc lint and scoped doctrine checker
  clean; publish dry-run succeeds with pre-existing MCP dynamic-import warnings.
- Status: implementation and generator gates complete; ready for commit/push and external IMPL-EVAL.
