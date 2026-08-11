# Adversarial review — RFC-0002 (DevTools contribution architecture)

Reviewer: unoriented adversarial pass (Claude, Sonnet 5). Read-only. No board/GitHub state checked
(no network); scope is the RFC text, the brief, plan.md, and plan-gate.md, cross-checked against the
worktree source at `main` @ `2256a67bf`.

## Findings

### [SEVERITY: critical] §6's contribution identity model does not match §7's kinds
**Where:** §6 lines 963-989 (`ContributionIdentity`, `DevtoolsContributionBase`) vs §7 lines
1403-1523 (`DevToolsContributionBase`, `DevToolsPanelContribution`, `DevToolsLinkContribution`).
**Finding:** §6 defines the canonical identity model: a host-assigned `mountId` is "THE key for
every generated artifact," and the base contribution type (`DevtoolsContributionBase`, lowercase
`t`) has `id: string` matching pattern `^[a-z][a-z0-9-]*$`, with the fully-qualified form
`<mountId>/<id>` assigned by the host. §7 — for the two kinds that are the actual v1 deliverable —
extends a *different* base (`DevToolsContributionBase`, capital `T`) whose `id` field is typed
`DevToolsContributionId = ${string}/${string}/v${number}` (a plugin-declared, version-suffixed,
slash-containing compound string that could never satisfy §6's own slug regex), and drops `icon`
in favor of a new `description` field. `DevToolsPanelContribution` and `DevToolsLinkContribution`
extend §7's base, not §6's — so §6's entire host-assigned-mountId identity design is never actually
wired to the two kinds that ship. The naming drift is systematic, not a typo: §6 and §8 consistently
use `Devtools*` (`DevtoolsHostDescriptor`, `DevtoolsKindRegistry`, `DevtoolsServerPanelContext`, …);
§7 consistently uses `DevTools*`. §13.2's public API sketch tries to cite §6's types but writes them
with §7's capitalization (`DevToolsHostDescriptor { /* §6 */ }` — but §6 actually exports
`DevtoolsHostDescriptor`), so the sketch doesn't even type-check against either section as written.
**Evidence:** direct `grep -n` of the RFC file confirms the two disjoint naming families and the two
incompatible id-shape definitions (checked in-session).
**Suggested direction:** reconcile §6 and §7 on one identity scheme (either host-assigned mountId +
slug, composed as `<mountId>/<id>`, or plugin-declared version-suffixed compound id — not both) and
one casing convention before this is locked; a copy-editing pass alone won't fix the id-shape clash.

### [SEVERITY: major] Ordering rule is restated inconsistently between §6 and §7
**Where:** §6 lines 1141-1163 (Locked Decision L6) vs §7 lines 1389-1392 ("Cross-kind rules").
**Finding:** §6's normative ordering algorithm is two-tier: host-curated `anchors` render first,
then unanchored contributions sort by the clamped triple `(order ?? 0, mountId, id)`. §7's
"Cross-kind rules" — which the document says exists so kind-level rules "live once here rather than
three times below" — restates ordering as a flat `(order ?? 0, id)` sort with no anchors tier and no
`mountId` in the tie-break. A reader implementing from §7 alone reproduces neither the anchor
priority nor the collision-safety `mountId` tie-break that L6 depends on.
**Evidence:** direct text comparison, both spans read in full.
**Suggested direction:** make §7 reference §6's `orderContributions` function rather than restating
a simplified (and different) rule.

### [SEVERITY: major] The RFC's signature "zero matches" citation does not hold under literal re-run
**Where:** Abstract ("A repo-wide search for `devtools` returns zero matches"), §3.1, §6 line
857, §7 line 1354, capability matrix row 3 — all cite `grep -rn "devtools\|DevTools"` / the
piped-alternation form returning zero hits across `packages/`, `plugins/`, `docs/site`.
**Finding:** Run literally as transcribed (`grep -rn "devtools|_devtools|DevTools" packages plugins
docs/site`, no `-E`), the command returns **zero matches — but only because plain BRE `grep` treats
`|` as a literal character, not alternation**, so the command searches for the literal string
`"devtools|_devtools|DevTools"`, which of course doesn't exist. It doesn't test what the RFC claims
it tests. Run correctly (`-E` or `-i`), the search finds 3 hits: two in `packages/fresh-ui/deno.lock`
(`@tanstack/devtools-event-client`, a transitive dependency) and one in
`docs/site/_plan/research/competitors/tanstack.md` ("The Devtools Demonstration…", competitor-research
prose). None of these overturn the substantive conclusion — there is still no NetScript-owned
DevTools implementation — but the citation is repeated four times as the RFC's flagship "provable
absence" evidence, and as written it is not reproducible.
**Evidence:** ran the exact command and the corrected command in-session; see the Citation
spot-check table.
**Suggested direction:** state the search with `-E`/`-i` and either scope it to exclude lockfiles or
explicitly note the two harmless hits, so the "zero matches" claim survives a literal copy-paste.

### [SEVERITY: minor] INV-2's threat framing overstates what it protects for DevTools itself
**Where:** §9 D-2 ("The two invariants that are non-negotiable," INV-2) and D-3 threat T-2, vs §6
"Discovery and the generated registry" (lines 1047-1051).
**Finding:** §9 elevates the whole-filesystem-permission bug in the *existing*
`installed-runtime-registry-generator.ts` subprocess spawn (used today by jobs/sagas/triggers) to
one of only two "non-negotiable" invariants of the DevTools trust model and a wave-1 gate (INV-2/
G-2). But §6 states the devtools family's own generator "imports the plugin's pointed-to export
**in-process**" and "the **host** writes every artifact" — i.e. no plugin-owned generator subprocess
is in the devtools code path at all. INV-2 therefore doesn't gate anything DevTools itself emits; it
is a fix to an adjacent, pre-existing framework defect that the RFC's own roadmap absorbs under its
banner. The RFC is self-aware of the looseness (owner fork D-6.3 explicitly asks "fix framework-wide
… or scope INV-2 to the new DevTools family"), which is honest, but §9's "non-negotiable" framing
overstates how much this actually defends the DevTools surface specifically.
**Evidence:** §6 lines 1049-1051; §9 lines 2131, 2156-2167, 2176, 2238-2240.
**Suggested direction:** either scope INV-2's gate explicitly to the devtools generation path (and
name a separate, non-blocking debt item for the shared generator), or state plainly in §9 that INV-2
is framework hygiene the RFC piggybacks on, not a DevTools-specific containment property.

### [SEVERITY: minor] Required supersession map is not inlined in the reviewed artifact
**Where:** RFC §6 line 874 ("the supersession section carries the board mechanics") and §15.2.
**Finding:** plan.md's Scope and Hidden Scope sections, and the orchestrator brief's required
deliverables, both call for "a file-level and issue-level supersession map … (KEEP, AMEND, FOLD,
SUPERSEDE, CLOSE-LATER)." The RFC text itself never contains that table — only scattered forks
(F-9…F-13) touching individual pieces (milestone, epic overlap, `CR-DDX-HOSTAGNOSTIC`, #780, union
ratification status). The actual map does exist and is substantial —
`.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md`, 295 lines,
47 KEEP/AMEND/FOLD/SUPERSEDE/CLOSE-LATER dispositions, cross-checked against live `gh` state — so
this is not a missing decision, but a reader of the RFC document alone (the artifact this review was
scoped to) cannot find it; the RFC doesn't even give its path.
**Evidence:** confirmed the file exists and is populated; grepped the RFC for KEEP/AMEND/FOLD/
SUPERSEDE/CLOSE-LATER and found no in-RFC table.
**Suggested direction:** add an explicit pointer (path) to the supersession-map design pack in §6 or
§15, or inline a condensed version.

### [SEVERITY: minor] §10 D-3's "amendments to today's pipeline" reads broader than DevTools' own scope
**Where:** §10 D-3, "Two amendments to today's pipeline follow" (lines 2381-2396).
**Finding:** The first amendment ("the host owns the transaction; the plugin generator writes only
into a staging root…This inverts today's 'plugin writes final paths, host checks existence'") is
phrased as a change to the general plugin-registry-generator write model, not narrowly to the new
devtools family's own (subprocess-free, per §6) pipeline. Only the *second* amendment explicitly
scopes to "The DevTools family binds to the manifest-driven generator only." A reader taking amendment
1 at face value could read the RFC as redesigning the write model for jobs/sagas/triggers too — scope
beyond "DevTools contribution architecture."
**Evidence:** direct text read, §10 D-3.
**Suggested direction:** prefix amendment 1 with an explicit "for the devtools family" qualifier, or
state clearly that this is a recommended pattern for a future generator hardening pass, not something
this RFC's slices implement framework-wide.

### [SEVERITY: minor] IA top level organizes by domain ("what exists"), not by problem ("what's broken")
**Where:** §11.3 route tree.
**Finding:** The seven top-level segments (`/`, `/runtime/*`, `/flows/*`, `/contracts/*`,
`/plugins/*`, `/generated/*`, `/automation/*`) are organized by entity/domain, matching the
framework's own subsystem boundaries. §11.7's state matrix models drift/degradation honestly *within*
each section, and Home aggregates some wiring facts, but there is no cross-cutting "what's currently
degraded/quarantined/incompatible across the whole install" view at the top level — a developer must
visit all six sections to find where the system is unhealthy. For a tool whose entire charter is "see
what's broken that nothing else shows," a top-level problem-first surface (an aggregated drift/
quarantine feed) is a natural v1 candidate and its absence is worth a second look, not a structural
flaw.
**Evidence:** §11.3, §11.7 read in full.
**Suggested direction:** consider promoting a cross-cutting "drift/quarantine" view to the top nav,
or explicitly argue in the RFC why Home's wiring-facts framing already satisfies this without one.

## Citation spot-check

| # | Claim | Cited location | Verified? | Note |
|---|---|---|---|---|
| 1 | `hasRoutes` doc comment = "service routes or HTTP endpoints" | `packages/plugin/src/protocol/manifest.ts:20-21` | Yes | exact line match |
| 2 | `PluginInstallerManifestSchema` ends `.strict()`, `schemaVersion: z.literal(1)` | `manifest.ts:271,282-283` | Yes | `.strict()` at 283 in this checkout, RFC itself notes the 282/283 discrepancy and says it's unaffected — confirmed correct self-correction |
| 3 | `CONTRIBUTION_BUILDERS` = defineJob/defineSaga/defineWebhook, regex-based | `ast-extractor.ts:4-8` | Yes | exact match, confirmed genuinely regex not AST |
| 4 | Three hardcoded `@plugins/*` Vite aliases | `vite.config.ts.template:20-32` | Yes | content and approx. line range match |
| 5 | `DEFAULT_PLUGIN_KIND_PROVIDERS` = `[['api', apiKindProvider]]` | `plugin-kind-registry.ts:12-17` | Yes | exact match |
| 6 | Route manifest treats `_*`/`(_*)` as helper paths | `packages/fresh/src/application/route/manifest.ts:53-55,74-86` | Yes | confirmed via `isRouteHelperDirectoryName`/`isRouteHelperPath` |
| 7 | Vite pinned at `7.2.2` | `deno.json:248`, `packages/fresh/deno.json:56` | Yes | exact line match |
| 8 | Ten axis names vs twelve interface keys | `constants.ts:16-40`, `plugin-contributions.ts:11-40` | Yes | counted both sets exactly |
| 9 | 22 MCP tool names | `packages/mcp/src/domain/tool-types.ts` | Yes | counted `TOOL_NAMES` array = 22 |
| 10 | `TelemetryQueryPort` has 7 methods | `telemetry-query-port.ts:15-79` | Yes | counted exactly 7 |
| 11 | Scalar bundle is 3,475,795 bytes | `scalar.generated.ts` | Yes | `wc -c` matches exactly |
| 12 | `packages/fresh` carries doctrine "Restructure" verdict, doctrine table says fresh = A4 | `10-codebase-verdict-and-handoff.md:39`, `06-archetypes.md:376` | Yes | both confirmed at cited lines |
| 13 | `grep -rn "devtools\|DevTools"` across packages/plugins/docs/site → zero matches | multiple (Abstract, §3, §6, §7) | **No, as literally transcribed** | see major finding above; substantive conclusion still holds, citation mechanics do not |

12 of 13 checked claims verified exactly at their cited `path:line`; one (the recurring "zero
matches" grep) fails on literal re-run due to a regex-alternation error, though the underlying
architectural conclusion is not overturned. Security/readiness discipline was checked separately
(searched for "is isolated/secure/safe/production-ready" assertions): the RFC never crosses the
charter's line — every such phrase found is a *denial* ("Nothing in this RFC may be quoted as
'DevTools is isolated/safe/production-ready'"), consistently paired with UNPROVEN/unverified labels
and named gates.

## Verdict

FINDINGS: 1 critical, 2 major, 4 minor
