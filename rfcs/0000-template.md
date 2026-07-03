---
rfc: 0000            # assigned by a maintainer at acceptance; keep 0000 while drafting
title: <RFC title>
status: Draft        # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ["@your-handle"]
created: YYYY-MM-DD
tracking-issue: <link to the rfc: tracking issue, once opened>
target-milestone: <e.g. 0.0.1-beta.1 | 0.0.1-stable | backlog>
---

# <RFC title>

## Summary

One paragraph. What is being proposed, in plain terms.

## Motivation

Why are we doing this? What problem does it solve, and for whom? What is the cost of not doing it?
What use cases does it unlock? Be concrete.

## Guide-level explanation

Explain the proposal as if it were already shipped and you were teaching it to a NetScript user.
Introduce any new named concepts, show example usage (commands, config, code), and describe how it
changes the developer experience. Prefer examples over prose.

## Reference-level explanation

The technical detail. Public API/type surface, package/plugin placement, contracts and doctrine
archetype, interaction with existing features, edge cases, and migration mechanics. This should be
detailed enough that an implementer could build it and a reviewer could spot holes.

## Drawbacks

Why might we *not* want to do this? Cost, complexity, maintenance burden, surface-area growth.

## Rationale and alternatives

- Why is this design the best of those considered?
- What other designs were considered and why were they rejected?
- What is the impact of not doing this?

## Breaking changes and migration

Is this a breaking change? If so, what breaks, and what is the migration path? (Label the tracking
issue and PR `breaking`.)

## Prior art

Relevant designs from other frameworks, prior discussions, or existing NetScript patterns.

## Unresolved questions

- What parts of the design are still open and expected to be resolved during discussion/implementation?

## Future possibilities

Natural extensions this enables, explicitly out of scope for this RFC.
