# Opus-CD — Open questions for the owner / cross-topic items

Resolvable-by-me items are already resolved in `proposal.md`; this file carries only what the owner
or another topic must decide. Each item states my recommendation + evidence so the owner can ratify
fast.

---

## OQ-1 — #232 fork: rescope vs new child epic *(OWNER DECIDES)*

Both options drafted concretely (proposal §1, epic-and-issues §1). **My recommendation: Option 2
(new docs-cut child epic under #301; #232 stays the accuracy umbrella).** Evidence: #232's live body
is 100% accuracy/coverage debt with zero rewrite/positioning overlap (drift CD1;
`analysis/C-tutorials/03-docs-cut-logistics.md`), and its storefront-Run-2 item is *partly superseded
by* the storefront rewrite — so a rescope's re-filing step risks orphaning load-bearing debt. Owner
picks.

## OQ-2 — Missing `0.0.1-beta.7` GitHub milestone *(OWNER CREATES)*

Neither `0.0.1-beta.6` nor `0.0.1-beta.7` exists (only beta.3–beta.5, stable, Backlog/Triage). The
AGENTS.md milestone obligation blocks issue-filing until `0.0.1-beta.7` exists. **Owner creates it at
ratification.** (Shared with the spine-1 topics, which need beta.6.) No mutation this run.

## OQ-3 — Tutorial scope: 5 rewrites + minimal, or bounded "4 + minimal"? *(OWNER CONFIRMS)*

The site has **5** live tracks, not 4 (`chat` landed later, `2f643f49`). **My recommendation: rewrite
all 5 domain-diverse tracks + add the minimal-eis-chat on-ramp** (preserves the 8-hub nav diversity;
proposal §3.1). **Owner lever if scope must be bounded to the literal "4 + minimal":** defer `chat`'s
full rewrite (it is `publish:false`-gated anyway) to a fast-follow and ship 4 rewrites + minimal + a
light chat accuracy pass at beta.7. Confirm which.

## OQ-4 — `@netscript/ai` publish state at the beta.7 authoring window *(CROSS-TOPIC / FACT CHECK)*

The chat track + AI-stack positioning are authored against the **shipped `@netscript/fresh/ai`**
surface; the `@netscript/ai` *engine* is `publish:false` and its tutorial claims it "arrives in
beta.2" (already slipped). **Ask:** will `@netscript/ai` reach `publish:true` before the beta.7 docs
authoring window? If yes, engine content can become runnable; if no, it stays a caveated forward-ref
(proposal §3.5). This intersects the flagship-AI mandate and the telemetry topic (ai=F instrumented
from zero). Not a blocker either way — the design ships against shipped surface — but the answer sets
how much AI-engine content is runnable vs forward-referenced.

## OQ-5 — Competitor-comparison density vs "sparse by design" *(OWNER RATIFIES a boundary call)*

The task frames competitor mentions as "sparse by design — 2 today"; the owner's Topic-D brief asks
to "compare with other frameworks." **My resolution: "sparse" governs taste, not whether — one sharp
factual comparison per Tier-1/2 feature (~13 total), never per trivial page, never a wall of
vs-tables** (proposal §4.1). This raises named comparisons from 2 to ~13, all factual/falsifiable and
positioning-law-compliant. It brushes the locked-positioning boundary, so I surface it: **ratify the
~13 one-per-major-feature density, or hold nearer the current sparse baseline?**

## OQ-6 — eis-chat has ZERO auth: how to back the auth story/track *(OWNER ACKS)*

eis-chat uses no auth (elevator "confirmed gaps"; `context/D-positioning/open-questions.md` Q4).
**My plan (no owner action strictly required, ack only):** the workspace track's auth chapters and
the `identity-access/auth.md` story are backed by the framework's own `builder-auth_test` 401/403/200
pattern + package reference docs — **never** a fabricated eis-chat auth proof. The
`arch-debt:seamless-auth-roadmap` (no org/tenant/RBAC primitive) is a plain factual "here's how you
extend it" note (Q2 confirmed compliant with the honesty-framing ban). Flag if the owner would rather
defer the auth positioning page until a dogfooding proof exists.

## OQ-7 — Two net-new pillar pages (CLI/scaffold, MCP) — in scope for beta.7? *(OWNER CONFIRMS)*

CLI/scaffold and MCP have strong positioning material but **no hub today** (audit §1;
`context/D-positioning/open-questions.md` Q2). **My recommendation: add both** —
`orchestration-runtime/cli-scaffold.md` (Encore file-count + AdonisJS) and `ai/mcp.md` (Encore MCP;
eis-chat `legacy-archeo-mcp` boundary) — as net-new leaves S0 stubs and D fills. **Deployment stays
OUT** (owned by the deployment epic — MEMORY `netscript-deployment-epic`); only a positioning stub +
cross-link. Confirm the two net-new pages are in beta.7 scope.

## OQ-8 — Two doc-accuracy bug fixes folded into D slices *(FYI / no decision)*

Folding two known defects into their owning D slices (proposal §4.5): (a) `explanation/
plugin-system.md` under-claims "no auth telemetry/audit surface yet," contradicting `auth-model.md` +
`observability.md` (the redacted audit surface via `createAuthTelemetry` **is** real) → fixed in D5;
(b) `concepts.vto` "alpha … late 2026" vs the site's "beta" → Sonnet-trivial fix. FYI; flag if either
should instead route to #232's accuracy track.

## OQ-9 — Lane for S0 (IA-reconciliation): WSL Codex vs Opus-low workflow *(MINOR)*

**My recommendation: WSL Codex** (structural nav/redirect/`_data.ts` plumbing needs a real
build+`check:links` loop; the Opus doc-authoring exception is for *prose*, not nav plumbing —
proposal §2.4). Alternative: an Opus-low workflow could do the moves, but the build-verification loop
favors Codex. Minor; recorded for completeness.
