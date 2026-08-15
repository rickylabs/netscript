# Research — comparison docs programme #1551

## Authority and baseline

| Authority | Reconciled evidence | Consequence |
| --- | --- | --- |
| Git | `docs/comparison-docs-programme` has no upstream and is exactly at live `origin/main` `01e0960494c95ce56eb35892c211a095eb13e6ed` after `git fetch origin main`. | All carried claims were re-checked from this base. Pushes must name the full remote ref. |
| Live issue | #1551 is open in milestone `0.0.7` with `type:docs`, `area:docs`, `priority:p2`, and `status:triage`; all 17 deliverables remain unchecked. Its two canonical case comments are now definitive pinned analyses, while runnable parity and comparative benchmarks remain deferred. | The corrected comments distinguish measured, inspected, inferred, and deferred claims. This leaf still cannot truthfully close the live issue as written. |
| Coordinator | The approved coordinator artifacts at `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/` bound this leaf to methodology/minimum navigation, one deferred Session case, a migration placeholder, and residual follow-ups. | The broader 17-deliverable/50-topic programme is not 0.0.7 scope. |
| Harness | `SCOPE-docs`, the run loop, lane policy, docs audit, handoff protocol, plan gate/protocol, and this run's supervisor contract were read in full. | Separate opposite-family PLAN-EVAL and IMPL-EVAL are mandatory. The topic orchestrator owns Tier-A review; this generator never self-certifies. |

The coordinator's `1-small-contract` value is an inventory/archetype label, not permission to change framework code. The effective leaf overlay is documentation-only. No `packages/**` or `plugins/**` public surface, doctrine archetype, JSR package, dependency, or lockfile is in scope.

## Live issue re-baseline

#1551 currently asks for 17 deliverables spanning methodology, navigation, runnable equivalent implementations, architectural-significant-choice (ASC) inventory, static counts, type continuity, mutation diagnostics, cold/warm LSP measurements, human and agent discovery tasks, runtime evidence, a comparison matrix, broader case prioritization, migration navigation, a concept map/parity checklist, and freshness metadata. Its acceptance prose additionally requires reproduction from raw artifacts and forbids treating model pretraining or provisional prose as evidence.

The bounded leaf can responsibly own:

1. methodology and minimum navigation;
2. an immutable-source, evidence-backed but explicitly deferred Session case;
3. a matrix in which every row has mechanism, evidence, loser overhead, confidence, and version sensitivity;
4. a source manifest and reproducible procedure for any static numbers actually published;
5. a `Migrate from Next.js` placeholder/roadmap entry; and
6. follow-up ownership for all residual work.

It cannot own a public runnable parity fixture, comparative runtime/LSP measurements, blinded discovery studies, all follow-on cases, or a complete migration map without expanding 0.0.7. The draft PR therefore uses `Part of #1551`. A closing keyword would be truthful only after the live issue explicitly transfers its residual acceptance criteria and maps each retained criterion to verified evidence. Filing follow-ups alone does not rewrite that live acceptance contract.

## Current documentation information architecture

- `docs/site/_data.ts` defines five lanes: Start, Learn, Build, Reference, and Concepts. Navigation is folder-derived through the Lume nav plugin.
- `docs/site/explanation/compared.md` is a broad, existing “how the path compares” explanation for several frameworks. It is not an evidence protocol or a case-study programme. `docs/site/explanation/index.md` links it.
- No `docs/site/comparisons/` or `docs/site/migration/` tree exists at the baseline.
- `docs/site/_data/xref.ts` is the stable cross-reference registry. New public pages should be registered there instead of accumulating fragile relative links.
- `docs/site/_config.ts` configures Lume `2.5.4`, folder navigation, xrefs, base-path handling, and AI-oriented output.
- `docs/site/deno.json` exposes `build`, `check:links`, `check:caveats`, and `verify`; the repository root exposes `docs:links` and `docs:accuracy`.
- The least disruptive navigation change is to add `/comparisons/` and `/migration/` as roots within Concepts. A new top-level lane would overstate this leaf's maturity.
- `git log --follow` shows the current comparison explanation originated in `8f05a8798`; later unrelated history does not provide a reusable rigorous-comparison template.

Relevant current NetScript docs and public API inspection establish these boundaries:

- `definePage()` and `definePartial` are public from `@netscript/fresh/builders`.
- `withRoute`, `withResource`, `withLayer`, `withLayout`, and `withMeta` form the page contract described by the current builder docs.
- Resources are request-scoped. Cross-request freshness belongs to cache-entry-shaped layer data and defer policy; the case must not call resources a server cache.
- `partialName` remains a string coupling even where the endpoint itself is a generated typed route reference.
- `deno doc` confirms `DeferPage` accepts an action URL, partial URL/name, cached content, `cachedAt`, `staleTime`, policy, and stale strategy. It also confirms that `Deferred` is described as Suspense-ready while the current non-streaming Fresh runtime is not equivalent to fully progressive transport.
- The consumer-local `defineRegion` helper is not a NetScript public export and must not be represented as framework-owned.

## Immutable EIS-Chat inspection

Initial P0 research inspected the private repository through existing authorized GitHub access at
immutable commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`. The coordinator later provisioned the
strictly read-only local worktree `/home/codex/repos/eis-chat-007-input` at that same commit for S2
reproduction and the owner-priority canonical-comment correction. No consumer source is copied into
this repository and no business data is extracted.

Inspected source inventory:

- `apps/dashboard/routes/project/[project]/channel/[channel]/session/[session]/index.tsx`
- `apps/dashboard/routes/project/[project]/channel/[channel]/index.tsx`
- `apps/dashboard/router.ts`
- `apps/dashboard/lib/session-regions.ts`
- `apps/dashboard/lib/channel-regions.ts`
- `apps/dashboard/routes/project/[project]/channel/[channel]/session/[session]/(_components)/session-regions.tsx`
- `apps/dashboard/components/blocks/region.tsx`
- `apps/dashboard/routes/partials/session-header/[project]/[channel]/[session].tsx`
- `apps/dashboard/routes/partials/session/[channel]/[session]/transcript.tsx`
- `apps/dashboard/routes/partials/session/[channel]/[session]/context.tsx`
- the six generated-route-bound Channel partials and the typed create-session form/schema leaves
- `apps/dashboard/assets/blocks/session.css`
- the root and dashboard Deno manifests

Pinned facts carried into the canonical #1551 comments:

- The pinned route uses `ctx.path` and generated `.withRoute(...)` binding, not the comment's `ctx.params` sketch.
- Stable `appRoutes` aliases point to generated route leaves; the application facade does not duplicate path patterns.
- The page reads cached Session entries for the full request instead of using the comment's “full request only seed helper” design.
- The page has an `entries` resource, not a page-level `mcp` resource. The authoritative context partial owns MCP-topology I/O so the page shell is not delayed by it.
- Header, transcript, and context are three named deferred layers. Their authoritative partial routes own loaders and settled/error rendering.
- The local three-region helper and generic region primitives are consumer presentation/support code, not NetScript framework surface.
- `session.css` is a substantial route-specific presentation leaf with a two-column grid, overflow containment, an independently scrolling context rail, a mobile breakpoint, and failure styles. Presentation must be held constant and reported separately in any future equivalence fixture.
- The consumer pins NetScript `0.0.6` and Fresh `^2.3.3`. The case is evidence about that immutable consumer revision, not a claim about unreleased 0.0.7 behavior.
- The Channel route uses the same generated `.withRoute(...)`/`ctx.path` chain, five concurrent
  cache-backed entry reads, seven layers, six route-bound authoritative partials, and six
  layout-faithful deferred fallbacks.
- Its form values are inferred from the Zod schema; mutation output is derived from the typed
  service-client return; typed query invalidation and a generated-route redirect remain visible in
  the builder; and the form leaf selects framework-owned document navigation.
- Session-grid links retain a normal href and explicitly request client navigation for plain
  activations, preserving progressive fallback while avoiding an unintended cold full-document
  transition.

The superseded comments' estimated LOC ranges, ASC, feature scores, dependency depth, and effort/time
figures are discarded. The definitive bodies publish only reproduced primary-route counts and, for
the Session surface, the S2 manifest's aggregate output. Private source text is not checked in;
minimal illustrative excerpts in the owner-authored issue comments remain bounded to identifiers
and framework composition, without business data, domain models, CSS, fixtures, or credentials.

## Canonical comment baseline reconciliation

The canonical comments were created at `2026-08-12T11:02:26Z` (Session, comment `5265826161`) and
`2026-08-12T11:17:48Z` (Channel, comment `5265971722`). Their inspected snapshots predated the
improvements integrated into the eventual pin even though the pin itself never changed.

Read-only Git verification established:

- local `HEAD` and `origin/master` are both
  `5191de83f3da97559f21d8891c6c8afdf1cf473a`; no newer product commit exists;
- `834a2b36a5c9ef4acf82f8f1f400522d8dab234b` and the pin both resolve to tree
  `710327bd994fe1c2d0d07821b773316a49d070fa`, so the former is evidence-only;
- the named layout, cache-policy, cold-navigation, generated-route, service-platform,
  cache-preservation, document-form-navigation, and route-bound-partial commits are all ancestral
  to the pin; and
- the read-only input remains clean.

Reproduced physical/nonblank counts:

| Example | Published comment claim | Inspected comment-time snapshot | Pinned route | Delta from snapshot |
| --- | ---: | ---: | ---: | ---: |
| Session | 119 / 117 | 121 / 119 | 94 / 92 | -27 / -27 (-22.3% / -22.7%) |
| Channel | 208 / 204 | 208 / 204 | 181 / 178 | -27 / -26 (-13.0% / -12.7%) |

The Session claim-to-pin delta is -25 / -25 (-21.0% / -21.4%). Both comment bodies were replaced
in place with current snippets, complete inspected feature inventories, exact pinned counts,
explicit evidence labels, and fair Next.js `16.3.0` primary citations. The existing S2 manifest,
measurement tool, and measurements already target the unchanged pin and reproduce byte-identically;
they remain correct and are deliberately untouched.

## Next.js version and primary evidence

Next.js behavior was re-checked against primary project sources on 2026-08-13. The case pins exact stable `next@16.3.0`, the latest non-prerelease official GitHub release published 2026-08-03, rather than a floating `latest` or a remembered major-version behavior.

Primary sources and case-sensitive consequences:

| Source | Inspected behavior | Case consequence |
| --- | --- | --- |
| <https://nextjs.org/blog/next-16-3> and <https://github.com/vercel/next.js/releases/tag/v16.3.0> | Official stable 16.3 release. | Record `16.3.0`, release date, evidence-check date, and refresh policy. |
| <https://nextjs.org/docs/app/getting-started/cache-components> | Cache Components are opt-in with `cacheComponents: true`; uncached request work must be under Suspense or made cacheable. | Any proposed equivalent must state that opt-in and distinguish static shell, cached output, and request-time regions. |
| <https://nextjs.org/docs/app/api-reference/directives/use-cache> | Normal `use cache` cannot read request APIs directly; request values should be passed in. Server storage is in-memory unless a cache handler is configured. | Params become cache keys only through explicit inputs. Do not imply durable or distributed cache parity. |
| <https://nextjs.org/docs/app/api-reference/functions/cacheLife> | `stale` is client-router freshness, `revalidate` is background server refresh, and `expire` can force a blocking refresh; time-based client stale has a 30-second minimum. | NetScript's millisecond cache age and Next's three clocks are not isomorphic. Record loser overhead and version sensitivity instead of equating names. |
| <https://nextjs.org/docs/app/api-reference/functions/revalidateTag> and <https://nextjs.org/docs/app/api-reference/functions/updateTag> | `revalidateTag(tag, "max")` is stale-while-revalidate on next visit; `updateTag` is Server-Action-only read-your-own-writes and blocks for fresh data. | Mutation and webhook paths need different mechanisms. They cannot be collapsed into one “background refresh” claim. |
| <https://nextjs.org/docs/app/api-reference/file-conventions/loading> | Suspense provides streaming fallbacks and selective hydration; headers/status may already be committed after streaming begins. | Loading equivalence is inspectable, but status/error behavior needs runtime measurement. |
| <https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes> | Named slots can stream independently and have independent loading/error states. | Parallel-route slots are the closest mechanism for three independently failing regions; ordinary sibling components alone do not prove isolation. |
| <https://nextjs.org/docs/app/api-reference/file-conventions/error> | Route error boundaries are Client Components and have segment/layout scoping rules. Server errors sent to clients are sanitized in production. | An ad-hoc boundary sketch is insufficient evidence; record the boundary placement and the client overhead. |
| <https://nextjs.org/docs/app/getting-started/metadata-and-og-images> | `generateMetadata` is Server-Component-only and may stream subject to bot behavior. | Metadata belongs in the equivalence contract but is version- and crawler-sensitive. |

The Next.js side remains an inspected mechanism mapping, not a runnable benchmark. RSC transport is not an independently addressable named partial endpoint, and the closest error-isolation design adds parallel-route/file-convention overhead. Those are matrix facts to qualify, not reasons to manufacture a winner.

## Evidence contract for the bounded case

The case holds shared presentation and domain leaves constant conceptually but does not reproduce the private code. Its equivalence contract must cover:

1. the same `/project/[project]/channel/[channel]/session/[session]` route parameters;
2. the same header, transcript, and context regions and stable layout slots;
3. the same cached-entry presence, age, and projection rules;
4. an initial shell that is not delayed by context/MCP topology I/O;
5. independently named loading, settled, and failed states;
6. explicit background versus blocking freshness behavior;
7. typed navigation construction and any remaining string seams;
8. metadata derived from the same session projection;
9. identical or excluded domain components, CSS, test data, and deployment assumptions; and
10. separate presentation counts.

Evidence vocabulary is locked:

- **measured**: reproduced by a published script from pinned inputs, with raw aggregate output;
- **inspected**: directly observed in immutable source or primary documentation but not benchmarked;
- **inferred**: a stated consequence of inspected evidence that has not been executed;
- **deferred**: acceptance owned by a linked follow-up issue.

No numeric comparison may mix one measured side with an estimated side. Every matrix row must include the mechanism, direct evidence, overhead borne by the less direct side, confidence, version sensitivity, and follow-up when measurement is absent.

## Residual ownership

All follow-ups were created in `Backlog / Triage` with `type:docs`, `area:docs`, exactly one `status:triage`, and an explicit priority. They do not expand milestone 0.0.7.

| Residual | Owner | Priority |
| --- | --- | --- |
| Public runnable parity fixture; complete ASC inventory; comparable LOC/file/token outputs; presentation normalization | #1645 | `priority:p1` |
| Type-flow trace, unsafe seams, deliberate contract mutations, diagnostics, cold/warm LSP measurements | #1646 | `priority:p2` |
| Cold/warm/stale runtime, cache clocks, navigation transport, and failure-isolation measurements | #1647 | `priority:p2` |
| Blinded human and coding-agent semantic-navigation/discovery studies | #1648 | `priority:p3` |
| Channel-form candidate and the remaining post-Session comparison programme | #1649 | `priority:p3` |
| Full Next.js concept map, non-isomorphisms, and mapping-derived migration parity checklist | #1650 | `priority:p2` |

## Decisions and resolved questions

- Use `/comparisons/` and `/migration/` under the existing Concepts lane.
- Use one method page, one Session case page, and a small migration index/Next.js roadmap page.
- Pin Next.js `16.3.0` and EIS-Chat commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`; identify the consumer as NetScript `0.0.6`.
- Publish source metadata and aggregate measurements, never private source text.
- Treat the Next.js equivalent as a deferred, evidence-backed mechanism specification. Do not claim runtime or ergonomic parity.
- Preserve `deno.lock` and `docs/site/deno.lock`; no reload, dependency change, release, scaffold, or E2E gate.
- Use `Part of #1551`; the terminality blocker is the unreconciled live acceptance contract.

## jsr-audit surface scan

N/A. No publishable `packages/**` or `plugins/**` surface is approved or changed.
