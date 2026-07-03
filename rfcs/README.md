# NetScript RFC Process

Most changes to NetScript — bug fixes, docs, small enhancements — need only a normal issue and PR.
Some changes are **substantial** enough that they deserve a design discussion and a written record
before code is written. That is what the RFC (Request for Comments) process is for.

This process is deliberately lightweight. It borrows the shape of the
[Rust](https://github.com/rust-lang/rfcs), [React](https://github.com/reactjs/rfcs), and
[Ember](https://github.com/emberjs/rfcs) RFC repos and the staged model of
[TC39](https://tc39.es/process-document/): a numbered document in `rfcs/`, a public discussion, and
an explicit accept/reject decision that leaves an auditable trail.

## When an RFC is required

Open an RFC if the change does any of the following:

- Adds, removes, or changes a **public API** or a `@netscript/*` package export surface.
- Is a **breaking change**, or changes the **release / publish surface**.
- Changes **plugin contracts**, the plugin/service base seam, or the **architecture doctrine** under
  `docs/architecture/doctrine/`.
- Is **cross-cutting** across multiple packages or plugins, or introduces a new package/plugin
  archetype.
- Establishes a **new convention** that contributors will be expected to follow.

If you are unsure, start a thread in
[Discussions → Ideas](https://github.com/rickylabs/netscript/discussions/categories/ideas) or ask a
maintainer. When in doubt, a lightweight issue first is fine — a maintainer will ask for an RFC if
one is warranted.

**Not required for:** bug fixes, docs, tests, refactors with no surface change, and scoped
enhancements that fit a single package without changing its public contract. Use a
[feature request](https://github.com/rickylabs/netscript/issues/new/choose) for those.

## Lifecycle

```text
Draft ──▶ Discussion ──▶ Final Comment Period ──▶ Accepted ──▶ (tracking issue) ──▶ Implemented
                              │
                              ├──▶ Rejected
                              └──▶ Withdrawn
```

1. **Draft.** Copy [`0000-template.md`](0000-template.md) to `rfcs/0000-<short-slug>.md` (keep the
   `0000` until a number is assigned). Fill it in. Open a PR that adds the file, and open the
   companion **RFC tracking issue** ([`rfc:` form](https://github.com/rickylabs/netscript/issues/new/choose))
   labelled `rfc`. Optionally open a Discussion in the **RFCs** category for open-ended debate.
2. **Discussion.** Design feedback happens on the RFC PR (line-level) and the RFCs Discussion
   (open-ended). Iterate the document. The tracking issue carries the `status:*` label.
3. **Final Comment Period (FCP).** When discussion converges, a maintainer announces a ~7-day FCP
   with a disposition (accept / reject). This is the last call for objections.
4. **Decision.**
   - **Accepted** — a maintainer assigns the next RFC number, the PR is renamed to
     `rfcs/NNNN-<slug>.md` with the metadata filled in, and the PR is merged. The tracking issue is
     assigned to a **milestone** and stays open to track implementation.
   - **Rejected** — the PR is closed with a summary of the rationale recorded in the RFC's
     "Rationale and alternatives" section (merged as a rejected record when useful, or closed).
   - **Withdrawn** — the author closes the PR; the reason is noted on the tracking issue.
5. **Implementation.** Implementation happens in separate PRs that reference the tracking issue
   (`Part of #<issue>`). The tracking issue closes when the accepted RFC is fully implemented.

## Numbering

RFC numbers are assigned by a maintainer at acceptance (next free integer), not by the author. Use
`0000` in the filename while the RFC is in draft. This avoids number races between concurrent drafts.

## Relationship to milestones and labels

- An **accepted** RFC's tracking issue is placed on the milestone it targets (e.g. `0.0.1-beta.1`,
  `0.0.1-stable`). This is how the roadmap and the RFC record stay linked.
- Labels: `rfc` on the tracking issue and the RFC PR; one `status:*` label reflecting the phase; and
  `breaking` if applicable.

## Governance note

The formal, binding "what requires an RFC" policy is part of NetScript's architecture governance and
is being reconciled with the architecture doctrine (`.agents/skills/netscript-doctrine`,
`docs/architecture/doctrine/`). This document is the operational process; if it ever conflicts with a
ratified doctrine governance statement, doctrine wins and this file will be updated to match.
