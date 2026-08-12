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

### Canonical location and harness provenance

The canonical accepted design record is `rfcs/NNNN-*.md`. Numbered RFCs 0001 through 0005 establish
that practice in this tree. Files under `.llm/runs/*/design/canonical/` are durable research,
provenance, and draft-design artifacts; despite the historical `canonical` folder name, they do not
become accepted RFCs unless their decision is reviewed, numbered, and merged here.

The following architecture-debt decisions are mapped to this process but are **not filed by this
documentation change**. Until an RFC draft exists, the debt entry remains the decision's source of
truth; if the maintainer chooses a public or cross-cutting change, the proposal starts as
`rfcs/0000-<slug>.md` and receives its number only at acceptance.

| Debt decision ID | RFC-process mapping |
| --- | --- |
| `CRON-SUBSYSTEM-DUP` | Decide the canonical scheduling surface through a future RFC before removing or blessing either public path. |
| `RUN-ARTIFACT-ARCHIVAL-POLICY` | Ratify any cross-repository evidence-retention convention through a future RFC before pruning run provenance. |
| `PAGEBUILDER-LEGACY-COMPAT-TREE` | Route the public builder compatibility decision through a future RFC before a breaking removal or permanent dual surface. |
| `FORMPAGEPROPS-PLAYGROUND-MIGRATION` | Bind the transitional public type's disposition to the PageBuilder RFC decision and migration sequence. |
| `REDIS-LEGACY-VALUE-FALLBACK` | Route any hard data-compatibility break or durable migration convention through a future RFC before removing the fallback. |

## Relationship to milestones and labels

- An **accepted** RFC's tracking issue is placed on the normal `0.0.x` release milestone it targets
  (for example `0.0.3`), or `Backlog / Triage` until scheduled. This is how the roadmap and RFC
  record stay linked.
- Labels: `rfc` on the tracking issue and the RFC PR; one `status:*` label reflecting the phase; and
  `breaking` if applicable.

## Governance note

This file is the canonical operational location for numbered RFCs and their lifecycle. Architecture
doctrine defines package/plugin constraints; if a future ratified doctrine rule changes what requires
an RFC, this process is updated in the same change rather than creating a second RFC location.
