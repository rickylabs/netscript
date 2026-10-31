# Drift

- Before implementation: actual coordinated bump lives in `.llm/tools/deps/`; corrected write surface.
- Environment: rtk unavailable. Use direct commands with structured wrappers for verdicts.
- Owner override: `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high`, read-only.
- Operator directive takes precedence over generic footer: draft, Refs #2548 only, no labels/session identifiers; stop at READY for Cockpit.

- Local runtime environment lacks Docker daemon; scaffold.runtime preflight/cleanup fail. Runtime proof must come from configured CI, not a local bypass. Leak-check foreign AppHost left untouched.

- Independent source slice review: FAIL_FIX (F1). Registry embedding was regenerated but missing from the prepared release staging set. Add that explicit generated output and test staged coverage plus decoded release pins. No source commit was made before review.
- F2 recorded tooling limitation: the existing generic coordinated writer treats any JSON `version` field matching the old release as release-owned. Fresh UI catalog `meta.version` is currently 0.1.0. A future bump FROM 0.1.0 would also advance that metadata field. This does not affect 0.0.8 → 0.0.9 or the canary; preserving independent catalog version semantics will require a field-aware writer/residue policy before that future cut. Scope remains the approved blocker; no broad rewrite-policy redesign or residue suppression is introduced.

- Second independent source review: FAIL_FIX (F3). Adding the carrier to the generated release allowlist requires its own source-to-carrier freshness check in stable evidence reuse. Added registry:embed:check before downstream barrels and a negative ordering/short-circuit regression.
- Evaluation stop: two terminal failure verdicts reached the supplied leaf limit. No third round; see evaluation-decision.md. Draft delivery remains review-required, not READY.
