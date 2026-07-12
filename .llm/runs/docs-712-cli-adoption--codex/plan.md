# Plan: scaffold-verb adoption and stub upgrades

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-712-cli-adoption--codex` |
| Branch | `docs/712-cli-adoption` |
| Phase | `implement` |
| Target | workers/sagas/triggers/auth plugins and tutorials |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `docs` |

## Archetype and doctrine verdict

Archetype 5 applies because all code changes are first-party plugin scaffold glue; the embedded CLI
concern is folded into the larger plugin archetype. Current doctrine marks workers and triggers as
Refactor surfaces, so this slice must not deepen existing debt. The generated code composes existing
core builders and types and adds no plugin-owned convention.

## Goal and scope

- Add a Zod payload-schema block to generated worker jobs and test its emission.
- Add a compiling saga compensation skeleton and test its emission.
- Rewrite selected tutorials/how-to pages to invoke all requested scaffold verbs before editing only
  generated handler/config bodies.
- Correct auth installation wording to `plugin install`.

Non-scope: new CLI verbs, runtime semantics, core contracts, dependency/version changes, `deno.lock`,
PR creation, and scaffold runtime E2E (orchestrator-owned).

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Keep generated stubs on existing core APIs. | Preserves Archetype 5 thinness and avoids public-surface changes. |
| L2 | Use current standalone spellings (`ns-workers add job/task`, `ns-triggers add ...`, `ns-sagas add saga`). | These are the command usages defined by current source. |
| L3 | Tutorials show the scaffold command, then only the meaningful replacement body/config. | Meets verb-first adoption without duplicating an entire generated file. |
| L4 | Add `.compensate(...)` to the existing saga builder chain. | It is the current typed core compensation API and compiles in the generated definition. |

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact tutorial example IDs/flags | resolved | Derived from each existing example and current command definitions. |
| Runtime E2E execution | safe to defer | Explicitly owned by the orchestrator. |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Docs claim flags that do not exist | Verify every shown command against current command/input source. |
| Stub compiles in isolation but not as generated userland | Run focused plugin checks/tests and generated artifact assertions. |
| Public docs leak internal language | Run the mandated added-line grep and require zero hits. |
| Unrelated worktree changes enter the commit | Inspect raw git status/diff and stage only owned paths. |

## Anti-patterns, debt, and gates

- Avoid AP-14/AP-23/AP-24/AP-25 by composing existing typed builders and keeping generated handlers
  explicit and side-effect-free by default.
- No new or deepened architecture debt is expected.
- Gates: focused resource tests, scoped check/lint/fmt wrappers for both plugin roots, docs source
  alignment/terminology/link checks, acceptance greps, public-docs-law grep, raw git/lock hygiene.

## Deferred scope

- `scaffold.runtime` and `deno task e2e:cli` are prohibited for this lane and remain the
  orchestrator's acceptance gate.
- No dashboard design-prompt edits are included because the acceptance contract scopes tutorials,
  stubs, and auth wording.
