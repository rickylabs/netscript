# Plan

Repair native chat-send compatibility for PR #2087 without changing pins or lock. Profile: Archetype
2 integration boundary within Fresh (package Archetype 4 Keep); frontend scope limited to consumer
types, no visual/browser behavior changes. LOCKED: derive send branches from upstream UIMessage and
ModelMessage; retain readonly opaque parts/content/tool-call containers for the established
forward-compatible transport. Preserve cancellation, disposal, subscriptions and payload forwarding.
One slice: public type + activity consumer fixture + identity/wire regression coverage + local
README + harness evidence. Gates: the owner's RED/green scoped check; Fresh check task; AI tests
only; AI peers; frozen install; Fresh lint; touched-file fmt. Additional harness gates:
quality:scan, arch:check, focused AI doc-lint and JSR/manual surface audit, independent IMPL-EVAL.
Risks: narrowing opaque containers or accidentally converting activity; mitigate with existing
future-part tests and native activity payload tests. Deriving upstream declarations may expose
private types; check AI doc-lint. Open decisions: none. No new debt expected; retain existing Fresh
documentation debt. Deferred: full tests/E2E (owner forbids full suite), merge, release, publication
and unrelated documentation repairs.
