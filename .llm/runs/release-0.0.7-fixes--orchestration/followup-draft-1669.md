# Follow-up issue DRAFT — not filed

Prepared for coordinator review. **No issue created, no implementation, no edits to any surface.**
Derived from the two non-blocking advisories in the #1669 IMPL-EVAL
(`.../pull/1669#issuecomment-5303850473`). Neither affects #1461 acceptance and neither invalidates
that PASS.

---

## Title

`docs(sdk): align cache-first loaders on action-then-metadata and document the warm-stale persistence-failure shape`

## Labels / milestone

`type:docs`, `area:sdk`, `priority:p3`, `status:triage` · milestone `Backlog / Triage`

## Body

### Context

PR #1669 (#1461) corrected the published cache-first loader contract on the two authorized docs
sources: `getCachedEntry()` is a KV-only metadata read that never evaluates staleness or schedules a
refresh, and the callable procedure action owns the stale-while-revalidate policy. The corrected
shape is **action-then-metadata**:

```ts
const data = await ordersQueries.list(input, { preferFreshOnStale: true });
const entry = await ordersQueries.list.getCachedEntry(input);
return entry ?? { data, cachedAt: Date.now() };
```

Two things were left out of that PR deliberately, both raised as non-blocking advisories and both
ruled out of its scope by the coordinator. They are recorded here so they are not lost.

### (a) Cross-page consistency — three surfaces still on the older shape

`docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md:124`,
`docs/site/web-layer/layers.md:184`, and `docs/site/index.vto:71` (homepage `withLayer` loader) still
demonstrate a bare `getCachedEntry()` loader rather than the action-then-metadata composition.

**These pages are not wrong.** They attach **no** revalidation claim to `getCachedEntry`, and their
loaders are compatible with a separate page/layer background policy — the homepage example even
carries an explicit cold-cache fallback to `queryOptions(input).queryFn()`. This is **cross-page
consistency debt**, not a correctness defect, and it was correctly excluded from #1669 rather than
widened into a passed PR.

The value in aligning them is that a reader moving from chapter 3 to chapter 4 currently meets two
different loader shapes for the same job, with no stated reason for the difference.

**Scope if actioned:** update the three loaders to the action-then-metadata composition, or add one
sentence to each explaining why the bare metadata read is the right choice for that surface. Either
resolves the inconsistency; the second is cheaper and may be more honest if those surfaces genuinely
intend a pure read.

**Non-goals:** no SDK source change; no new public API; no change to #1461's corrected pages.

### (b) Warm-stale persistence-failure return shape

The documented `entry ?? { data, cachedAt: Date.now() }` fallback covers the **cold-cache** case
correctly: no entry, so the freshly fetched `data` is returned with a current timestamp.

It does not describe the **warm-stale-plus-failed-persistence** case. Under PR #1665's non-fatal
cache-write contract, a refresh whose fetch succeeds but whose `store.set()` fails returns the fetched
data to the caller and leaves the entry uncached — so the cache still holds the **older** entry.
`getCachedEntry()` then returns that older entry rather than `null`, the `??` fallback does not fire,
and the loader returns the **stale** `entry.data` and `entry.cachedAt` even though `data` in the same
scope is fresh.

The behaviour is correct at every layer — it is the documented shape that does not say what happens.
This is an **edge-case documentation caveat**, explicitly non-blocking for the proven common-path
acceptance in #1461.

**Scope if actioned:** state the case in the SDK docs, and decide and document the intended contract —
prefer the fresher `data` when the entry is older than the just-completed refresh, or prefer the
persisted pair for internal consistency. Both are defensible; the point is that the docs currently
choose neither.

**Non-goals:** no change to #1665's non-fatal write contract; no new option or return type unless the
chosen contract demands one, which would need its own scope ruling.

### Acceptance

- [ ] The three surfaces either adopt the action-then-metadata composition or state why a bare
      metadata read is correct there.
- [ ] The SDK docs describe the warm-stale persistence-failure case and state the intended return
      shape.
- [ ] No SDK source behaviour changes as part of (a); any source change implied by (b) is raised for a
      separate scope ruling before implementation.

### Provenance

Non-blocking advisories 2 and 3 of the #1669 IMPL-EVAL, evaluated head
`9aa54ae2d4f53c705b0309ed472abf7bbccebe41`, artifact commit `313cc08d5`, comment
`.../pull/1669#issuecomment-5303850473`. Filed as follow-up rather than absorbed, per the coordinator
ruling that #1669 must not be widened and its PASS must not be invalidated.
