# fix(scaffold): the canonical island never passes initialDataUpdatedAt, so the loader's cachedAt is computed, displayed and discarded — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T2-07 · **Proposed milestone:** 0.0.6 (one template line plus a regression test and a
migration note; drafted inside the new-0.0.7 pack because T2-01/T2-04 must emit the same wiring, but
it does not depend on them) · **Labels:** `type:fix` `area:cli` `area:fresh` `area:docs`
`priority:p2` `status:triage` · **Depends on:** none (T2-01 and T2-04 must inherit the fixed shape)

## Summary

PR #1265 added `initialDataUpdatedAt` to `IslandQueryOptions` specifically so a server-rendered
snapshot keeps its real cache age across hydration. The generated app's canonical island computes
`cachedAt` in its loader, passes it through as a prop — and then uses it only as a display label,
never as `initialDataUpdatedAt`. The differentiator seam ships unexercised in the one example the
scaffold designates as canonical, so first paint tells TanStack the snapshot is fresh as of
hydration. The most polished downstream consumer made the same mistake independently, which is
evidence the seam is undiscoverable rather than unwanted.

## Evidence

- `research/repo-audit/web-layer.md` §4.2 and gap-register item 11;
  `research/external/eis-chat.md` §6 and §11 S10.
- Repo, verified at `fac9e339042c`:
  - `packages/fresh/src/application/query/query-types.ts:135-136` — the option exists:
    "Timestamp when the server loaded `initialData`, used to preserve its cache age."
  - `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template:67`
    computes `const cachedAt = Date.now();` and `:77` returns it.
  - `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template:43-49`
    calls `useQuery<ServiceListData>({ queryKey, queryFn, initialData: props.initialList,
    staleTime: 15_000 })` — **no `initialDataUpdatedAt`**; `:105` uses `props.cachedAt` only to
    render a "Cached at" stat.
- Downstream consumer evidence (`research/external/eis-chat.md` §6): `cachedAt` is threaded through
  three files (`routes/skills/index.tsx:49` → `(_components)/skills-view.tsx:40-48` →
  `islands/SkillsPanel.tsx:34`) and then discarded at `SkillsPanel.tsx:74`
  (`cachedAt: _cachedAt`).

## Current surface

The seam exists, is documented in the type, and is used nowhere: not in the scaffold, not in the
reference consumer. Nothing fails when it is omitted, so the omission is invisible.

## Target contract

1. The canonical generated island passes `initialDataUpdatedAt: props.cachedAt` alongside
   `initialData`, so the hydrated cache entry carries its true server age and `staleTime` behaves as
   documented.
2. Both showcase variants (`ServiceShowcaseLab.tsx.template` and the memory variant) use the same
   shape, so the two generated paths teach one dialect.
3. A regression test asserts that any generated island seeded with `initialData` from a loader that
   returns `cachedAt` also passes `initialDataUpdatedAt` — the assertion is on the generated output,
   not on prose.
4. T2-01/T2-04 emit the same wiring by construction.
5. **One migration note** for consumers upgrading from beta-era pins tells them to (a) consume a
   threaded `cachedAt` into `initialDataUpdatedAt` instead of dropping it, and (b) delete the
   `clientKey → queryKey` `as unknown as` casts that #1265 made unnecessary. The cast half is
   #1245's remnant scope; this issue contributes the `initialDataUpdatedAt` half and links to it
   rather than duplicating it.

## Acceptance

- [ ] The generated canonical island passes `initialDataUpdatedAt` from the loader's `cachedAt`.
- [ ] Both showcase island variants use the same option shape.
- [ ] A regression test asserts the generated island passes `initialDataUpdatedAt` whenever it
      passes loader-seeded `initialData`.
- [ ] Negative test: removing `initialDataUpdatedAt` from the template fails that test.
- [ ] A migration note documents consuming `cachedAt` into `initialDataUpdatedAt` for apps upgrading
      from beta-era pins.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` type-checks the generated app with
      the corrected island.

## Boundaries

- **#1245** owns the remaining island-query type work — the `getIslandQueryClient()` `@throws`
  JSDoc that documents a guard the body does not implement
  (`packages/fresh/src/application/query/query-client.ts:26-27` vs its body), the `clientKey`
  asymmetry, and the consumer note about deleting the six copied casts. #1245 is ~75% landed via
  #1265 and is proposed for **rescope, not re-implementation**; do not re-file its scope here and do
  not close it with this PR.
- **#1333** owns the default app's broader modernization; this is one line inside it that can land
  independently.
- **T2-01/T2-04** own the generators; this issue fixes the shipped example they should mirror.
- Not in scope: the duplicate `useLiveQuery` exports and `IslandLiveQueryResult.details`
  (`web-layer.md` §4.4), or any change to `packages/fresh` source — this is scaffold + docs only.

## Docs/consumer proof

The proof is behavioral: in a scaffolded project, a page rendered from a server snapshot older than
`staleTime` refetches immediately after hydration, and one rendered from a fresh snapshot does not.
The Web Layer query/cache-first documentation shows the same three lines the scaffold emits, and the
migration note gives a beta-era consumer an exact diff to apply.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/repo-audit/web-layer.md` §4.2 and `research/external/eis-chat.md` §6/S10; every line
re-verified against worktree `fac9e339042c`. No GitHub mutation performed.
