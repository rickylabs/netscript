# Plan — issue #380

## Profile and scope

- Archetype: **1 — Small Contract**. The product is a small deterministic value-composition contract, not a fluent DSL or runtime.
- Scope overlays: none.
- Doctrine verdict: `@netscript/ai` is not listed in the historical package verdict; apply current doctrine to the additive surface.
- In-scope anti-patterns: AP-1, AP-2, AP-7, AP-9, AP-13, AP-14, AP-15, AP-16, AP-20, AP-22, AP-25.

## Locked decisions

1. A section is `{ name, content, precedence }`; lower numeric precedence renders first.
2. Equal precedence preserves caller insertion order using the platform's stable array sort.
3. Whitespace-only sections are omitted and retained section content is trimmed.
4. Rendered sections are separated by exactly two LF characters (`\n\n`), with no leading or trailing separator.
5. Duplicate names throw `DuplicatePromptSectionError`, including duplicates whose content would be omitted.
6. `composeSystemPrompt` is the primary pure seam; `PromptAssembler` is a thin immutable wrapper around a supplied section list.
7. Export from the package root. The result is a plain string accepted directly by `AgentLoopInput.system` today.

## Gates

- Focused unit tests for order, precedence, empty omission, duplicate policy, separator behavior, and agent-loop input compatibility.
- Scoped check, lint, and format wrappers for `packages/ai`.
- Full package tests.
- Full export-map `deno doc --lint` through the repo wrapper.
- Package publish dry-run because the root public export changes.

## Risks and mitigations

- Ambiguous precedence direction: document and test lower-first semantics.
- Unstable ties: rely on standardized stable `Array.prototype.sort` and test insertion order.
- Hidden content ownership: accept opaque strings only; do not name or generate skill/memory/catalog content.

## Open-decision sweep

- No must-resolve decisions remain.
- Named precedence constants are deferred: the framework must not own app-specific section names or ranks.

## Debt and deferred scope

- No new/deepened architecture debt expected.
- Mutable incremental registration, async contributors, token budgets, templates, and loop redesign are out of scope.
