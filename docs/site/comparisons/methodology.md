---
layout: layouts/base.vto
title: Comparison methodology
description: A repeatable contract for equivalent cases, evidence labels, source manifests, measurements, and version-sensitive conclusions.
templateEngine: [vento, md]
order: 2
---

# Comparison methodology

Use this methodology when deciding between NetScript and another framework for a concrete workload,
or when contributing a comparison case. It is designed to expose non-isomorphic mechanisms and
uncertainty, not to manufacture a single winner.

The broad {{ comp.xref({ key: "explain:compared", text: "How NetScript's path compares" }) }} page
explains the frameworks' different learning paths and trade-offs. A case built here asks a different
question: given the same externally visible responsibilities, what mechanism does each framework
require, what evidence supports that mapping, and what overhead remains?

## 1. Write the equivalence contract first

Before inspecting implementation details, state the observable responsibilities that both sides
must satisfy. For a page-level case that contract includes:

- route shape and input parameters;
- named regions and stable layout slots;
- the data projection each region receives, including cached-entry presence and age;
- initial shell, loading, settled, empty, and failed states;
- blocking, background, and explicit invalidation behavior;
- navigation construction, metadata inputs, and relevant type boundaries; and
- deployment assumptions, test data, domain leaves, and presentation held constant or excluded.

Decompose responsibility before comparing syntax. A server component, named partial endpoint,
parallel route, cache entry, and request-scoped resource may solve overlapping responsibilities but
are not interchangeable transports. Record the closest mechanism on each side and preserve the
non-isomorphism in the matrix.

## 2. Label every claim

Every factual or comparative statement uses one of four evidence labels:

| Label | Meaning |
| --- | --- |
| **measured** | Reproduced by a published script from pinned inputs, with raw aggregate output and environment metadata. |
| **inspected** | Directly observed in immutable source or primary documentation, but not benchmarked. |
| **inferred** | A stated consequence of inspected evidence that has not been executed. |
| **deferred** | Not established in this case; the remaining acceptance has a linked owner. |

“Provisional” describes the status of source prose, not its evidence strength. It never upgrades an
estimate to **measured**. Do not put a measured value for one framework beside an estimate for the
other; leave the unmatched cell **deferred**.

## 3. Pin a source manifest

Each case publishes a machine-readable manifest before publishing measured output. The manifest
records:

- repository and immutable commit or release identifier for every source;
- framework and runtime versions, relevant feature flags, and the inspection date;
- included paths and blob hashes;
- one inclusion class per path: framework glue, consumer orchestration, presentation/domain held
  constant, generated, or excluded; and
- the measurement tool version and the environment fields that can affect its output.

The first Session case pins the NetScript repository baseline
`01e0960494c95ce56eb35892c211a095eb13e6ed`, the private EIS-Chat consumer revision
`5191de83f3da97559f21d8891c6c8afdf1cf473a` (NetScript `0.0.6`, Fresh `^2.3.3`), and Next.js
`16.3.0`. These identifiers establish freshness; they are not results.

The EIS-Chat inputs are private. Reproducing aggregates from that source therefore requires
authorized access to the exact pinned revision. The public manifest, classifications, hashes,
procedure, and aggregate output allow an authorized reviewer to reproduce and audit the result,
but do not make the private source publicly obtainable.

## 4. Make measurements repeatable

A measured value must ship with its raw aggregate input/output and the exact command or script
procedure that produced it. The procedure must:

1. verify every source revision and file hash before reading;
2. reject missing, changed, or unclassified inputs;
3. apply declared counting rules deterministically;
4. emit aggregate data without source contents, secrets, or business prose; and
5. reproduce byte-identical substantive output when inputs and tool version are unchanged, apart
   from an explicitly identified observation timestamp.

For static source measurements, report physical lines, nonblank lines, comment lines, and tokens as
separate fields. State the parser/tokenizer version. Generated files and dependencies are excluded
unless the case question explicitly includes them, and exclusions apply symmetrically.

No runtime, editor, usability, or discovery result may be inferred from a static count. Those need
their own fixtures, environments, repetitions, and raw observations.

## 5. Count architecture-significant choices consistently

An architecture-significant choice (ASC) is a decision that changes a boundary, mechanism, type
continuity, state lifetime, transport, freshness behavior, failure isolation, or operational
responsibility needed to satisfy the equivalence contract.

Count one ASC per independently reversible decision. Split a decision when its alternatives or
failure consequences differ; combine syntax steps that only enact the same decision. Do not count
formatting, naming, imports, presentation styling, generated output, or domain behavior held
constant. Each counted ASC must cite its mechanism and source locator. Disagreements are reported as
an explicit alternate count, never silently resolved in favor of one framework.

## 6. Hold presentation constant

Shared presentation includes leaf components, CSS, content fixtures, test data, domain projections,
and layout intent. Hold those inputs constant conceptually and exclude them from framework-glue
totals, or publish them as a separate presentation class on both sides. Never copy private consumer
presentation into a public comparison.

If a framework forces presentation work across a boundary—for example, a client error boundary or
a transport-specific wrapper—classify only that incremental adapter as mechanism overhead. Do not
charge the shared leaf presentation to either framework.

## 7. Complete every matrix row

Each responsibility becomes one row with all of these columns:

| Column | Required content |
| --- | --- |
| Responsibility | The equivalence-contract behavior being compared. |
| NetScript mechanism | Concrete public or consumer-owned mechanism, clearly attributed. |
| Other-framework mechanism | Closest concrete mechanism and required configuration. |
| Evidence | Label plus immutable source, primary documentation, raw artifact, or follow-up. |
| Loser overhead | Additional code, configuration, runtime, boundary, or uncertainty on the less-direct side; “none established” when evidence cannot select one. |
| Confidence | High, medium, or low, with a reason. |
| Version sensitivity | Version/feature dependence and what would invalidate the row. |
| Residual owner | Linked follow-up for any deferred evidence or acceptance. |

A row may conclude that mechanisms differ without declaring a loser. “Loser overhead” describes the
extra responsibility exposed by the evidence; it is not permission to invent a score.

## 8. Bound conclusions and keep them fresh

Conclusions apply only to the pinned versions, equivalence contract, included source classes, and
evidence actually present. Separate what was inspected from what was measured. State limitations,
missing values, and residual owners beside the conclusion rather than in a distant disclaimer.

Review a case at least every 90 days and whenever a pinned framework publishes a relevant stable
release, changes an experimental or opt-in feature used by the mapping, or changes a cited primary
document. A refresh updates the inspection date, manifest hashes, evidence labels, and affected
matrix rows. If the source or procedure cannot be revalidated, mark the claim **deferred** rather
than carrying it forward as current.

Before publication, a reviewer checks that the equivalence contract is complete, glossary terms are
used consistently, presentation is normalized, every claim is labeled, every number reproduces,
every matrix column is populated, links resolve, and conclusions remain bounded to the evidence.

{{ comp.nextPrev({ prev: { label: "Comparisons", href: "/comparisons/" } }) }}
