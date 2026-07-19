use harness

# Brief — Round 2: adversarial/collaborative pass over corpus r4 (Sol · xhigh, same thread)

You reviewed this run's r1 corpus (SF-1…SF-16). Since then, three amendment waves landed — this
round verifies the WHOLE architecture is still sound after them. Same constructive stance:
findings + concrete adoptable amendments, not demolition.

## What changed since your review (read in this order)

1. `adversarial-sol-triage.md` — all 16 of your findings ACCEPTED; integrated as **r2**.
2. `doc-story-kimi.md` + `doc-story-kimi-triage.md` — Kimi doc-story pass; 13 DX findings
   (KF-1…13) ACCEPTED; integrated as **r3** (highlights: no preinstalled target; `deploy-deno`
   declares NO `emit` — flow `plan → up`; `baremetal` one target with `windows|linux` variants;
   `--env` grammar; `.deploy/<target>[@<env>]/artifact-manifest.json` `--prebuilt` contract;
   `cells apply` + selector vocabulary; `target remove` semantics; capability preview catalog;
   verdict-surface precedence; op grammar sketch).
3. **`design/canonical/DP-9-aspire-composition.md`** + r4 amendments (DP-2 §2/§6, DP-3 §1,
   DP-4 §4, DP-5, plan.md DPB-8/DPB-29 + risk row, `rfc.md` Addendum A) — the owner-directed
   Aspire-composition pass: per-seam keep-or-delegate, the `netscript-capability-check`
   pipeline-step integration, Radius as a future `deploy-aspire` target key.
4. `rfc.md` — the RFC now mirrored as draft PR #891's body (do NOT touch the PR).

## Attack surface (round 2)

1. **DP-9 delegation verdicts** — attack each keep/delegate call. Examples worth pressure:
   is `plan` still *pure* while surfacing `aspire deploy --list-steps`? Does the
   `--env → aspire --environment` pass-through with the production default conflict with the
   config `environments` overlay semantics or the r3 `--env` registry-key mapping? Does
   adopting `addParameter({secret:true})` + `Parameters__*` for `secrets` on Aspire targets
   stay consistent with the secrets-reference/redaction law (values in Aspire's state cache are
   plaintext — is the caveat placement sufficient)? Is `up --prebuilt` on Aspire-managed
   targets concrete — given DP-9 §0's ground truth that `aspire deploy` does not consume
   published assets, WHO is the applier per target (compose vs k8s vs azure) and does the card
   say so?
2. **Cross-revision consistency sweep** — three amendment waves touched DP-0…DP-9, plan.md,
   rfc.md. Hunt contradictions and staleness: op-count naming, `emit` claims vs the deno card,
   preinstalled-target statements, baremetal naming (config keys vs variants vs registry keys),
   `DPB-n` references, DP-N §x cross-references that moved, anything the amendments orphaned.
   `rfc.md` is a summary — flag any place it now misstates the corpus it summarizes.
3. **The `netscript-capability-check` pipeline step** (DP-4 §4, DP-9 §2) — registration point,
   behavior when the deploy plugin is absent from the project, double-gating semantics
   (NetScript CLI plan AND the aspire pipeline step both run the compiler — divergence risk?),
   failure UX inside `aspire deploy`.
4. **Radius position** (DP-9 §3) — is "a `radius` target key on `deploy-aspire`" the right
   shape vs a separate variant/adapter? Is the gating condition (#18759 shipped in the pinned
   CLI + TS surface stable) well-formed and testable?
5. **Anything else** the three waves broke or weakened — board DAG (29 children), gate
   selection, migration map, owner-fork table accuracy.

Verification: corpus + repo ground truth first-hand (as in round 1). The Aspire facts in DP-9
§0 carry citations from same-day doc reads — treat them as given unless internally inconsistent
or contradicted by something you can check; if your tooling can fetch aspire.dev, add
`?aspire-lang=typescript`.

## Output contract (strict)

1. Write `.llm/runs/plan-deploy-plugin--seed/adversarial-sol-r4.md`: H1 + one-paragraph
   overall verdict (is r4 sound to file and implement against?), findings `SG-1…SG-n` with
   `[BLOCKER|MAJOR|MINOR|ENHANCE]`, one-line claim, evidence (corpus/repo refs), concrete
   suggested amendment; then `## Quick wins`.
2. Commit ONLY that file (message:
   `plan(deploy-plugin): Sol r4 adversarial findings — aspire composition + consistency sweep`)
   and push with `git push origin HEAD:plan/deploy-plugin`.
3. End your final response with exactly `DONE` (or `BLOCKED: <reason>`).

## Stop-lines (unchanged)

Findings only — no edits to any other file; no GitHub mutations (no PR/issue/label/milestone
touches); no `packages/`/`plugins/` source edits; no other agents; this branch only.
