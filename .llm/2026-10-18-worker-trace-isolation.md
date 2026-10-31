# 2026-10-18 — Worker trace isolation

Incoming trace extraction must begin at ROOT_CONTEXT. Seeding a propagator with the worker's active
span lets missing/invalid carriers retain its lifetime trace; a no-op propagator can even mask valid
message headers. Local nested work still uses the active delivery context. A message boundary and
a local span boundary have different parenting rules.

Validate this with an actual AsyncLocalStorage context manager and SDK span exporter: unrelated
messages need distinct trace IDs, a valid producer retains its trace ID, and consumer/job/handler
span IDs must form a real parent chain. Include overlap and a failed delivery followed by success.
Preserve the full tracestate list; commas are valid vendor-entry separators.

Harness run: `.llm/runs/orch-divybot-750--worker-traces/`; issue #2393, inbox harness#750.
Consult saved NetScript memory before building. This host needs explicit mise tool selection for
generated-project subprocesses and the existing DinD endpoint; do not change global tool defaults.
Known doc-lint errors should be measured on the exact unchanged baseline before claiming drift.
