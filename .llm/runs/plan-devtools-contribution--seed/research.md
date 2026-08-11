# Research — plan-devtools-contribution--seed

**Stage C complete.** The Tier-A supervisor read the **full** stage-B corpus (14/14 files, 6,327
lines) and synthesized it here. The reasoning trail — twenty-two numbered syntheses `S-1`…`S-22`,
written incrementally as each leg was read — lives in
[`research/SYNTHESIS-NOTES.md`](./research/SYNTHESIS-NOTES.md) and is the authority for *why* each
finding below matters. This file is the navigable summary and the stage-D hand-off.

Every finding traces to a corpus file, which in turn cites `path:line`, a `deno doc` surface, a saved
artifact under `research/sources/`, or a fetched URL. **An uncited load-bearing claim is not a
finding** (`workflow/seed-run.md` § Stage B).

## Re-baseline

| Field | Value |
| --- | --- |
| Baseline claimed by the charter | `origin/main` @ `2256a67bf` |
| Baseline verified at bootstrap | `2256a67bf` — `docs(home): complete the capability outcome story (#1442)` |
| Verification | `git fetch origin`; `git log --oneline -1 origin/main`, 2026-08-11 |
| Divergence | **None.** No rebase performed; none permitted for the rest of the run. |

**The re-baseline changed the run.** Three carried-in assumptions did not survive contact with the
baseline, and each is recorded as drift rather than quietly corrected:

1. #890's envelope is **merged design text with zero implementation** — so "preserve its pattern" is
   a co-dependency on unbuilt work, not reuse of a shipped surface (`S-2`).
2. The gate set this run planned at stage A **did not exist** — `deno task fmt:check` never inspects
   Markdown (`drift.md` D-4).
3. "Inspired by Medusa zones" is **factually wrong about Medusa** — its zones are a closed,
   core-owned vocabulary plugins cannot mint (`S-20`).

## Evidence-input register — final status

| # | Input | Corpus file | Status |
| - | ----- | ----------- | ------ |
| E1 | Frontend Contribution Layer (#890, epic #922, #923–#946, `plan-frontend-contrib--seed`) | `p1` | **re-baselined** |
| E2 | Runtime-Versioned Automation (#1446 @ `6cb79675c`) | `p2` | **re-baselined** |
| E3 | Typed SDK client contributions (#1390, #1348) | `p3` | **re-baselined** |
| E4 | Dev Dashboard board (#400, #685, #780, #506, #410–#432, `dashboard-rescope--seed`) | `b1` | **re-baselined** |
| E5 | Current framework surfaces (`fresh`, `fresh-ui`, plugin axes, registries, CLI, Aspire/telemetry/MCP/Scalar, `/design`) | `r1`–`r5` | **gathered** |
| E6 | Docs, doctrine, live board, Fable-5 roadmap | `b2` | **gathered** |
| E7 | Primary-source market study | `m1`–`m4` | **gathered** (78 artifacts saved under `research/sources/`) |

## Findings

Ordered by how much they constrain the RFC. `S-n` links the reasoning in `SYNTHESIS-NOTES.md`.

| # | Finding | Evidence | Bears on |
| - | ------- | -------- | -------- |
| **F1** | **There is no plugin→UI channel of any kind.** `capabilities.hasRoutes` means *service HTTP endpoints*; no registry kind emits routes/pages/islands; the real mechanism is three hardcoded Vite aliases in the scaffold template. `grep -rn "devtools\|DevTools"` across `packages`/`plugins`/`docs/site` → **0 matches** | `r1` F9-F11, F14 (`packages/plugin/src/protocol/manifest.ts:20-21`; `vite.config.ts.template:20-32`) | Q1–Q3 · `S-1` |
| **F2** | **RFC #890 merged docs only — 32 files, all under `.llm/runs/` plus `labels.yml`. Zero source.** All 24 children + epic #922 OPEN at `status:plan`, milestone `0.0.9`; not even the disposable Wave-0 proofs have run | `p1` F1, F4, F5 (`gh pr view 890 --json files`) | Q1, Q2 · `S-2` |
| **F3** | **#1446 P-6 gives DevTools a quotable mandate and a boundary**: four contracts to consume (management oRPC, audit/history, convergence, OTel) and a *decision sentence* — "production operator management and developer diagnostics are two distinct hosts and two distinct contribution surfaces — not one ambiguous 'cockpit.'" Slice A7 deliberately excludes diagnostics so as not to pre-empt DevTools | `p2` F1-F3 (RFC:491-493, 519-522, 638) | **Q4 (answered)** · `S-3` |
| **F4** | **RFC-A (#1390) does not close the loop DevTools needs.** Its chain terminates at a statically generated services map + caller-supplied context; it explicitly rejects a registry, a locator and any ambient client, and contains zero occurrences of "devtool". But its own sentence — "UI contributions and SDK request contributions are separate named extension axes, not one universal envelope" — licenses a host→panel seam without duplicating it | `p3` F8, F14 (`rfc:1158-1176`, `rfc:1179-1187`, `rfc:1501-1506`) | Q6 · `S-14` |
| **F5** | **A ready-made data plane already exists**: `TelemetryQueryPort` (7 methods, published as `@netscript/telemetry/query`), 22 MCP tools with typed **input *and* output** schemas + `ToolKind` read/mutate/meta, a pure IO-free `@netscript/mcp/openapi-projection`, and `netscript.correlation.id` as the journey join key — **but MCP is newline-delimited stdio only**, so a browser client cannot reach it | `r5` F10-F11, F17-F18, F21, F23, F12-F13 | Q5, Q6 · `S-5` |
| **F6** | **Deep-linking into Aspire is real and cheap** — `/?resource={n}`, `/consolelogs/resource/{n}`, `/structuredlogs/…?traceId=&spanId=&logLevel=`, `/traces/detail/{traceId}?spanId=`, `/metrics/resource/{r}/meter/{m}/instrument/{i}`. **Filtered views are not constructible** (`?filters=` is opaque). Aspire has **no** panel/plugin extension point; its only additive contribution is resource commands, which **vanish when deployed** | `m4` F6-F11, F13-F15 (fetched `.razor` sources) | **Q5 (answered)** · `S-19` |
| **F7** | **No deep-link helper exists anywhere in `packages/`** for Aspire or Scalar, despite both URL grammars being stable and documented. The hand-off thesis has no implementation seam today | `m4` D5; `r5` F8-F9 | Q5 · `S-19` |
| **F8** | **Epic #400's ownership thesis exists verbatim and is already operationalized into three enforceable acceptance lines** — non-duplication ("every merged panel must answer *why can't this just deep-link to Aspire/Scalar?*"), one-generator-two-callers, and flow ≠ waterfall — plus a "killed surfaces" list kept so they cannot creep back | `b1` F3 (issue #400 body) | Q5, Q9, Q10 · `S-6` |
| **F9** | **Board authority is uneven.** #685 **merged** but shipped *analysis* self-labelled "no product code changed", never advancing past `status:research`; #780 is an unlabelled, unmilestoned draft with nothing on `main`; #506 was closed as superseded. The last owner-ratified board event is the 2026-07-06 rescope | `b1` F5-F8 | Q10 · `S-7` |
| **F10** | **Three competing seams already claim one contribution axis**: #427 (`plugin-dashboard-core`, no manifest axis), #890's pointer axis `.withFrontend()`, and #734 (a dashboard axis **in** the plugin manifest — the thing #427 forbids). Separately #933/#944 file dashboard-zone panels under epic #922 at *earlier* milestones than #428–#431 | `b1` D2, D7; `gh issue view 734` | Q10 · `S-8` |
| **F11** | **The archetype question has two conflicting in-repo precedents** (dashboard: A5 + A2; frontend-contrib: A1 + host-as-`fresh`-subpath labelled A3) and the second **contradicts doctrine's own table**, which lists `fresh` as A4. A3 vs A4 changes the gate set (A3 adds F-13) | `b2` F1, D3 (`06-archetypes.md:376`) | Q1, Q11 · `S-9` |
| **F12** | **"The archetype gates apply" is not self-executing.** `deno task arch:check` gates **16 hand-listed roots of 36 live units**; `fresh`, `fresh-ui`, `telemetry`, `cli`, `sdk`, `service` are ungated, and `arch:check:repo` has been `DEBT_ACCEPTED` red since 2026-06-21 | `b2` F7 (`deno.json:156`) | Q7, Q11 · `S-10` |
| **F13** | **Doctrine names the exact traps**: AP-21 flat command surface (a panel-per-seam host hits it immediately), AP-3 god interface (a single `DevToolsContribution` union **is** this shape), AP-9 premature abstraction, AP-24 switch-over-union. And **R-FOLD-LAYERING-MODE explicitly names "dashboard pages" as the vertical/feature-sliced case** | `b2` F5, F4 (`05-folder-structure.md:188-208`) | Q3, Q9, Q11 · `S-11` |
| **F14** | **The RFC home is a three-way fork and an authoritative answer is already scheduled.** `rfcs/` ships (zero numbered RFCs ever merged; number assigned *at acceptance*); `.llm/runs/*/design/canonical/` is what merged PRs actually did; `rfcs/` is claimed by unmerged #1446. **Issue #1380 (`0.0.6`) already carries an acceptance box to resolve it** | `b2` F9; `p2` F12 | Q12 · `S-12` |
| **F15** | **`createServiceClient` cannot send `Authorization` or `x-api-key`** even though `@netscript/service/auth` accepts both, so DevTools auth propagation is blocked on RFC-A/#1348 — and bypassing the SDK is the duplication the charter forbids. Separately, **`plugins/streams` has no oRPC contract surface at all**, so a "contract provenance" panel has nothing to read for it | `b2` F10, F8 | Q6, Q7, Q9 · `S-13` |
| **F16** | **`plugin dev` does not exist.** No watch loop anywhere in the CLI; regeneration is always explicit and command-triggered. Q8 is therefore "must DevTools invent one", not "how does it fit" | `r4` F6 | Q8 · `S-15` |
| **F17** | **Two divergent registry generators write to different paths** (manifest-driven vs SDK walker); the walker's `AstExtractor` is **regex, not AST**, recognizing three hardcoded builders; walker-emitted registries **leak on `plugin remove`**. Registry writes are non-transactional and only file *existence* is asserted | `r4` F3, D4, D5, F10; `r3` F8 | Q5, Q8 · `S-16` |
| **F18** | **The current axis model is closed to third parties, provably**: `cli.doctorChecks` is typed `readonly 'auth-backend'[]`; ten enum names vs twelve interface keys; `mergeContributions` silently drops `cli`; lifecycle hooks are declared and **invoked by nothing**; duplicate plugin identity collapses silently. Adding a kind costs six framework file edits | `r3` F2-F4, F9; `r4` F11 | Q2, Q3 · `S-17` |
| **F19** | **`resolveTarget` accepts absolute and escaping-relative targets** with no containment assertion — inert while first-party, an arbitrary-write primitive the moment a third party contributes a registry item. `--registry-root` **replaces** rather than merges; collision is silent last-wins at three layers, and the winner **flips** with `--force` | `r2` D3, F10, F11 | **Q7** · security |
| **F20** | **The closest analogue deleted its own shell.** Nuxt DevTools v4 removed the floating panel; it is now a dock entry inside Vite DevTools, with all five bespoke subsystems deprecated. `vite-plugin-inspect` v12 did the same. **But that ecosystem requires Vite 8 and NetScript pins Vite 7.2.2** — so the kit is not adoptable; its contract shapes are | `m1` F1, F25, F28, D1, D2 | Q1, Q8 · `S-18` |
| **F21** | **Three upstream assumptions are false**: devtools are *not* stripped in production (build mode is a supported target with **client auth disabled**); iframe ≠ sandboxed (Nuxt injects live app access into same-origin contributed iframes); and `transformIndexHtml` injection **silently no-ops** for apps that render their own HTML — **which Fresh 2 does** | `m1` D3, D4, F9-F11, F13-F14 | Q1, Q7, Q8 · `S-18` |
| **F22** | **"Inspired by Medusa zones" is wrong about Medusa** — its zones are a **closed, core-owned** vocabulary plugins cannot mint, validated by an AST pass at build time, with invalid zones silently dropped. The plugin-minted model is **Strapi's**. In a closed vocabulary, name collision is impossible; the real gap is **ordering, which no surveyed system solved** | `m3` M-2, M-4, X-1, S-2; `m2` F21, F3 | Q2 · `S-20` |
| **F23** | **The Q4 separation verdict, evidence-backed**: admin consoles pay for *untrusted third-party code in a long-lived, RBAC-governed, production-data surface*. Sandboxing, manifest host ranges, per-contribution RBAC and runtime module federation are costs of that **one** condition — which a dev diagnostics tool does not satisfy. Backstage's cost is documented: plugin install became a rebuild-and-redeploy event | `m3` separation table, D-5/D-6, S-6, B-4/B-6 | **Q4** · `S-21` |
| **F24** | **Two tiny mechanisms are worth near-verbatim adoption**: a per-contribution **error boundary** (Grafana logs loudly and renders `null` in prod; **TanStack has none anywhere on its mount path**) and **version-suffixed contribution ids**, from which Grafana derived its entire compatibility story. Plus: use **two independent** production-exclusion mechanisms, because TanStack explicitly distrusted one signal | `m2` F23, F11, F13, F16, F6, F7 | Q2, Q7 · `S-22` |
| **F25** | **A devtools channel becomes privileged fast.** TanStack's dev-server plugin accepts an `install-devtools` event *from the panel* and installs an npm package on the developer's machine, gated only on "dev server only" with no per-plugin permission concept | `m2` F10 | Q7 · `S-22` |
| **F26** | **Aspire removed its in-dashboard Copilot UI in 13.3** and redirected agents to the CLI/MCP server. Trajectory: dashboard = fixed human viewer; agent integration = external API | `m4` F15 | Q1, Q6 · `S-19` |

## Supervisor-delegated decisions resolved at stage C

Recorded so stage D inherits settled ground rather than re-litigating it. Each remains
owner-overridable and appears in the stage-H brief.

| # | Question | Resolution | Basis |
| - | -------- | ---------- | ----- |
| R1 | Does P-6's entry criterion block *writing* this RFC? | **No — it gates implementation.** §11 is titled "prerequisite RFCs, not faked certainty" and the row itself calls P-6 a "DevTools **RFC**" | `p2` F11 (RFC:629, 638) |
| R2 | Is #400's ownership thesis preserved or re-derived? | **Preserved verbatim, and promoted** from prose to the RFC's normative acceptance criteria, using #400's own three acceptance lines | `b1` F3 · F8 |
| R3 | Is Q4 (admin vs diagnostics) an open design question? | **No — it is answered twice over**, by #1446's decision sentence and by the market separation verdict. The RFC records it as a *constraint*, not a fork | `p2` F3; `m3` verdict |
| R4 | Does the RFC adopt `@vitejs/devtools-kit`? | **Cannot** — Vite 8 floor vs NetScript's 7.2.2 pin. Imitate contract shapes; implement natively on Deno/Fresh | `m1` F28, D2 |
| R5 | Is "collision policy" a major design area? | **Downgraded.** Under a host-owned zone vocabulary collision is impossible by construction; budget moves to **ordering**, which no surveyed system solved | `m3` X-1; `m2` F21 |

## Stage-D deep-dive topics (finalized from the corpus)

Amending the provisional set in `phase-registry.md`. Eleven provisional topics collapse to **eight**,
because the corpus closed T4 (Q4/Q5 answered — folded into T1 and T8 as constraints) and merged the
staging question into T8.

| Topic | Charter Qs | Why it survived as a deep dive |
| ----- | ---------- | ------------------------------ |
| `T1-host-shape` | Q1 | Two conflicting archetype precedents, a Vite-7 pin, Fresh-renders-its-own-HTML, and a `(design)`-group routing constraint all land here |
| `T2-contribution-family` | Q2 | Must reconcile three competing seams (#427/#890/#734) and decide envelope reuse vs sibling family against **unbuilt** #890 |
| `T3-contribution-kinds` | Q3 | AP-3 god-interface risk is explicit; each retained kind needs a **real first-party consumer** |
| `T5-data-plane` | Q6 | RFC-A does not close the host→panel loop; MCP is stdio-only; no admin console models a stream contract |
| `T6-trust-model` | Q7 | The `resolveTarget` write primitive, the `install-devtools` precedent, and a production posture that must be **stricter than every system surveyed** |
| `T7-build-dev` | Q8 | `plugin dev` does not exist; two divergent regex-based generators; non-transactional writes |
| `T8-ia-and-staging` | Q9, Q12 | IA grounded in real seams + the full state matrix, plus which seams become follow-up RFCs with entry criteria |
| `T9-supersession` | Q10 | Uneven board authority, three competing seams, two epics claiming the same panels, a dangling `CR-DDX-HOSTAGNOSTIC` |

Q11 (packages, archetypes, API sketches, threat model, gates, DAG) is **not** a separate topic — it
is the integration output assembled by the supervisor at stage E from every pack.

## Open questions carried into stage D

Research-side questions the corpus could not close. Each names what would verify it.

1. **Does Vite serve the app HTML in a NetScript Fresh 2 app**, or does Fresh render it — i.e. is
   NetScript in the documented `transformIndexHtml` failure bucket? *The single most
   decision-relevant unknown for any Vite-shaped design.* Verify by probing the dev server
   (`m1` OQ6).
2. **Does `@fresh/plugin-vite` support a second island root / route root** in one Vite process, and
   can `defineFreshApp({ fsRoutes })` mount two independent trees? Verify via
   `deno doc jsr:@fresh/plugin-vite` + a probe (`r1` OQ1-OQ3).
3. **Is `/design` shipped to production users today?** No gating was found. DevTools must not repeat
   the omission (`r1` OQ5, `r5` OQ5).
4. **Can `@netscript/mcp` be exposed over HTTP/SSE**, or must a DevTools surface call the flows
   in-process? Only `runNewlineStdio` exists (`r5` OQ2).
5. **How does a DevTools page obtain the auto-generated Aspire `Dashboard:Api:PrimaryApiKey`** at
   runtime, and is `Dashboard:Frontend:PublicUrl` set by the generated AppHost? (`m4` OQ2, OQ4).
6. **Is `CR-DDX-HOSTAGNOSTIC` a real recorded change request?** #544 depends on it; it appears in no
   #400 body text and no ratified rescope artifact (`b1` OQ3).
7. **Does picking an RFC location pre-empt #1380's scheduled acceptance item**, and should this RFC
   instead depend on it? (`b2` OQ3).
8. **What `tags` does `@orpc/openapi` emit** for a NetScript router? Generated Scalar `#tag/…` deep
   links are unstable without knowing (`m4` OQ3).

## jsr-audit surface scan

**N/A for the changeset, applied to the plan at stage E.** This run publishes no package. The
`jsr-audit` publishability rubric is applied to the RFC's **proposed** API sketches at stage E, per
`gates/plan-gate.md`'s requirement that it cover the PLANNED surface before slicing.
