# Root review: database architecture RFC

## Review receipt

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| Reviewer         | Root Codex supervisor                |
| Date             | 2026-08-13                           |
| Evaluated commit | `05e5fbac2`                          |
| Evaluated file   | `rfcs/0000-database-architecture.md` |
| Raw size         | 28,194 words; 3,140 lines            |
| Verdict          | `REVISE_CONSOLIDATE`                 |

The draft is evidence-complete and contains the approved architecture, but it is not an acceptable
reader-facing RFC. The owner explicitly rejected a book-length result. The next version must be a
specific architectural decision document whose center of gravity is the end-state API and developer
experience. Research, source traces, implementation gates, and review provenance should be linked,
not recopied.

Target **8,000–10,000 words**. Hard ceiling **12,000 words**. The final document should be useful to
an implementer who reads it once and to an owner who wants to decide whether the proposed database
story is the right one.

## Consolidated draft receipt

| Field            | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| Reviewer         | Root Codex supervisor                                               |
| Date             | 2026-08-13                                                          |
| Evaluated commit | `5dfc4e8eb`                                                         |
| Authoring lane   | Native Claude Code `claude-opus-5`, high, session `de518f07-68e0-…` |
| Evaluated file   | `rfcs/0000-database-architecture.md`                                |
| Size             | 11,205 words; 1,296 lines                                           |
| Verdict          | `PASS_TO_FOCUSED_REVIEW`                                            |

Root read the complete consolidated RFC, not only the diff. The rewrite removes 60% of the raw
draft, deletes the appendices and inline evidence taxonomy, retains one lifecycle diagram, links the
research corpus, and moves the center of gravity to the native contract, NetScript definition,
app-local binding, Standard Schema, plugin-space/extension, runtime, and plan/apply DX. Findings
R1–R10 below are resolved in the committed text.

Root made three narrow correctness corrections before accepting the checkpoint:

- downstream runtime now consumes the compiled manifest and generated binding, not the authored
  `DatabaseDefinition`; this preserves the manifest join point and package-free plugin deployment;
- the authority section now distinguishes the five control-flow values from each space's
  provider-owned `ContractArtifact`, instead of silently changing the locked taxonomy; and
- `partial-success` now requires mixed successful and unsuccessful target outcomes; a run in which
  no target succeeds cannot be called partial success.

The draft is ready for the owner-locked Qwen 3.8 Max focused review. It is below the mandatory
12,000-word ceiling but remains 1,205 words above the preferred band. Subsequent reviewers must
identify deletions or consolidations alongside findings; they must not grow the RFC into another
research report. The final target is at most 10,000 words when that can be achieved without removing
an API contract, a safety invariant, or an explicit refusal.

## What the RFC must make obvious

After reading the RFC, a contributor should be able to answer these questions without opening the
research corpus:

1. What does an application author write to define a database contract, target, and space?
2. How do native Prisma TypeScript contract types flow into an application-local typed binding?
3. How does a plugin contribute an independently owned database space or a permitted augmentation?
4. How does one extension registration supply authoring, control, runtime, and validation facets?
5. How are `StandardSchemaV1` input and output validators obtained, and where does validation fail
   closed?
6. What is pure and deterministic, what needs a live database, and what is mutating?
7. What artifacts exist, who owns each artifact, and how do plan, apply, receipt, and recovery
   differ?
8. What is deliberately removed, and how can existing production data be adopted without a dual
   runtime or schema mutation?

The document should lead with one coherent end-to-end journey and a small number of executable-shape
API examples. Reference details should exist only when they constrain implementation or prevent an
unsafe interpretation.

## Required editorial changes

### Keep and sharpen

- The native, model-first Prisma `defineContract` example. State plainly that NetScript wraps the
  contract with identity, ownership, policy, and lifecycle; it neither clones nor re-exports the
  Prisma builder.
- One `defineDatabase` composition example, one generated binding/runtime example, one validation
  example, one plugin-space/extension example, and one plan/apply example.
- The contract-first type-flow promise: authored contract → manifest → app-local binding → native
  query types → boundary schemas → operation artifacts.
- The five distinct artifact roles: definition, manifest, executable plan, provider ledger/marker,
  immutable receipt. Prefer a compact authority table to full interface declarations.
- The bounded, fail-closed Standard Schema decision and the `runtime | json` representation split.
- The ownership/removal rule, explicit target identity, no silent omission, and multi-target saga
  semantics.
- The clean-break law and data-safe adoption protocol.
- The major refusals: no query DSL, no compatibility stack, no global registry/service locator, no
  false portability, and no hosted control plane in this RFC.

### Replace with links or remove

- Remove process front matter, evidence-tag vocabulary, “how to read” mechanics, reviewer order,
  session identifiers, and claim-by-claim provenance from the public RFC.
- Remove Appendices A–G. D-01–D-47, W0–W11, the conformance matrix, JSR audit, risk register, claim
  ledger, and review trace already have canonical run artifacts.
- Replace per-package ownership/dependency/permission/publication/gate subsections with one package
  graph table that says why each boundary exists.
- Remove the optional policy factory from v1. The thin Candidate-A surface is the decision; a future
  factory need not compete with it in the main narrative.
- Replace large TypeScript declarations for every artifact, diagnostic, port, and operation with the
  smallest signatures necessary to lock the public contract.
- Keep at most one lifecycle diagram. Summarize the other state machines as invariants or short
  transition lines.
- Replace the large market matrix with four to six lessons and link `research/market-analysis.md`
  for the evidence.
- Move exact current-state counts, verb-by-verb disposition, exhaustive gates, kill criteria, and
  publication mechanics to the linked research/plan unless a number is essential to the decision.
- Eliminate repeated statements of the same refusal or clean-break rule.
- Replace `[RC1]`, `[PROPOSAL]`, `[NS-SRC]`, and similar inline tags with normal prose and direct
  links near the few claims for which stability or evidence class matters.

## Required technical corrections

These are blocking findings for the consolidated draft.

### R1 — first-adapter namespace contradiction

The guide maps `app` and `auth` to separate physical namespaces and claims namespaces prevent plugin
table collisions, while the reference section withholds Prisma multi-namespace certification. The
first certified PostgreSQL adapter examples must use its one supported physical namespace. Logical
`SpaceId` and ownership coordinates prevent silent merging; they do not make identical physical
table names coexist. Until upstream type/runtime parity is proven, composition must refuse physical
name collisions and non-default namespace requests.

### R2 — target-key type-check location

An independently evaluated `defineDatabaseSpace({ target: 'primary' })` call cannot know the keys of
a later `targets` object. State that the mismatch is rejected when the space is composed by
`defineDatabase`, unless implementation proves a contextual factory signature. Do not promise a type
error at the standalone space call site.

### R3 — pure control must be structurally offline

The guide constructs `createDatabaseControl` with `connections` and then calls `emit` “with no
connection.” Make the API boundary prove that claim: construct the pure compiler/control catalog
without live connections, and pass explicit live dependencies only to `inspect`, `plan` when live
state is needed, `apply`, and `verify`; or expose distinct pure and live executors. The public
example must not rely on a promise that an injected connection resolver simply goes unused.

### R4 — operation classification

Signing an artifact is not a target-database mutation and must not require a migration lock. Keep
artifact-side policy/signature work separate from live database mutation. Operation classes should
be intuitive from the API rather than supported by an exhaustive catalog declaration.

### R5 — one binding generic model

The draft alternates between `AppBinding<'primary', AppContract>` and a runtime `bind` signature
whose second generic acts like a query type. Choose one model and show it consistently. The
generated application-local binding should own the contract-to-query association, while
provider-specific `QueryOf<Contract>` remains inside generated/provider code and does not leak into
framework packages.

### R6 — validation API and example semantics

Choose one small public vocabulary. Recommended reader-facing shape:

```ts
const users = primaryBinding.ref({ space: 'app' }).model('User');

const createUser = users.input('create', { representation: 'json' });
const publicUser = users.output(
  { select: { id: true, email: true } },
  { representation: 'json' },
);
```

An explicit whole-model form may be `users.output('model', options)` if needed. Avoid competing
`value`/`operation`/`result` and `input`/`output` vocabularies. Reuse the create-input schema at an
input boundary and the selected-output schema at output boundaries; do not validate an arbitrary
Fresh payload with a query-result schema. Preserve the decisive limitation: unsupported operation or
selection metadata throws `DB_VALIDATION_UNSUPPORTED` at schema construction, while invalid user
data produces path-rich Standard Schema issues.

### R7 — plugin contribution modes must be implementable

The RFC both forbids published app fragments because provider helper types cannot cross a stable
published boundary and shows a generated `authFragment`-style contribution. Define the v1 modes
without contradiction:

- persistent plugins contribute full independently versioned spaces with pinned artifacts by
  default;
- application-local composition may use const-preserving, two-phase native fragments;
- cross-space augmentation is explicit, capability-limited, and ownership-checked;
- a published package may not masquerade as an app-local native fragment unless W3 proves a
  generated-source or provider-specific package mechanism that preserves exact inference.

### R8 — transaction and import surfaces must not overclaim

Do not assert that a transaction exposes exactly the ordinary `TQuery` surface until W4 proves it;
use a distinct inferred transaction query type or keep the example illustrative. Use one coherent
package/subpath import story throughout. Do not introduce `@netscript/database/connection` unless
the package graph explicitly owns that public subpath.

### R9 — receipts need a recovery read path

A write-only `ReceiptSink` cannot by itself support resume and evidence lookup. The concise RFC need
not lock every port method, but it must state that the immutable receipt store supports append and
lookup by `RunId`/resume token, or name separate source and sink roles.

### R10 — adoption cannot silently proceed on a subset

“Proceed for reachable targets only” conflicts with explicit target closure and no silent omission.
Adoption may operate on an explicitly selected target set and must return a status for every
selected target. Full cutover is blocked until all intended targets are reachable, attributed,
baselined, and verified. Marker removal should be promised only where provider semantics prove it.

## Recommended final structure and budget

Preserve the repository RFC template headings, with roughly this allocation:

| Section                        | Purpose                                                                    |      Budget |
| ------------------------------ | -------------------------------------------------------------------------- | ----------: |
| Summary                        | Decision, scope, non-goals, one architecture flow                          |     500–700 |
| Motivation                     | Manual surface and why Prisma 8 changes the opportunity                    |   700–1,000 |
| Guide-level explanation        | End-state authoring, composition, binding, validation, plugins, operations | 3,000–3,800 |
| Reference-level explanation    | Concepts, package boundaries, artifacts, invariants, capabilities          | 2,000–2,800 |
| Drawbacks                      | Real costs and upstream coupling                                           |     400–700 |
| Rationale and alternatives     | Why this layer, why not the rejected shapes, short market lessons          |   700–1,000 |
| Breaking changes and migration | Clean break, safe adoption, parallel branch strategy                       |   700–1,100 |
| Prior art                      | Links and the lessons actually adopted                                     |     300–500 |
| Unresolved questions           | Only decisions genuinely left to implementation or upstream proof          |     250–500 |
| Future possibilities           | Explicitly deferred capabilities                                           |     200–400 |

The section budgets are guidance; the 12,000-word ceiling is mandatory.

## Acceptance for the next draft

- 8,000–10,000 words preferred; no more than 12,000.
- Template headings remain and the title is shortened.
- The first two pages expose the decision and the end-state API/DX, not process metadata.
- Every code sample participates in one coherent API and respects the first adapter's actual
  capabilities.
- The native contract type is preserved through composition and an app-local binding without a
  NetScript query DSL or Prisma type leakage into provider-neutral packages.
- Plugin space, extension bundle, validation, control, and adoption stories each fit in one focused
  subsection.
- All ten technical findings above are corrected or explicitly dispositioned in this review file.
- Exhaustive evidence remains reachable through direct links to the run research and approved plan.
- No compatibility shim, dual runtime, or false multi-provider claim is reintroduced while editing.
