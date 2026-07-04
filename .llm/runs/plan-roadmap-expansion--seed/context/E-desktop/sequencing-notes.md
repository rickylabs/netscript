# Sequencing notes (non-binding — evidence for the supervisor, not a verdict)

These are observations that connect findings across `analysis/E-desktop/` and `research/E-desktop/`
into a rough shape. They are explicitly NOT a recommended roadmap order — sequencing/scheduling
decisions are delegated to the Fable supervisor and ultimately the user, per this task's boundaries.

1. **Option (b) (dashboard-only desktop + external services, generalized as a first-class Aspire
   generator primitive per issue #375) is the lowest-risk, already-validated increment.** It
   requires zero `@netscript/sdk` or tursodb architecture change — only Aspire generator work
   (`addExecutable`-style desktop app registration, build-order gating, `--backend cef` wiring,
   opt-in gating). This is the same shape of change #371/#372 already proved out at the KV layer
   (config-driven backend selection + generator-side provisioning, zero SDK surface change).

2. **The sdk in-process link-mode adapter (unblocking option (c)) is smaller in scope than the
   topic-E spec implies**, because the hard server-side half (`ServiceApp`/Hono `.fetch()` mount
   seam) already ships in `@netscript/service`. The remaining work is a client-side
   `ClientLinkPort` implementation plus a `createServiceClient` mode switch — a scoped, additive
   feature, not a from-scratch architecture project.

3. **tursodb single-writer relocation (moving the db handle in-process) is the piece of option (c)
   with no existing prior art in this codebase** — #371/#372 solved the analogous problem at the
   KV/queue layer (config-driven unified-vs-shared backend), but no equivalent has been attempted at
   the SQL layer. This is the part of option (c) most likely to need its own research/spike pass
   before being scoped as an implementation slice.

4. **"172a-2" should likely be struck or corrected as a topic-E dependency** (see
   `analysis/E-desktop/sdk-link-mode-and-service-seam.md` §4) — PR #172 is merged and unrelated to
   sdk link-mode. If the spec intended a different prerequisite, it should be re-identified before
   any beta.8 planning locks it in as a blocking dependency.

5. **The desktop-as-deployment-target question (#327/#375's WATCH/Backlog-Triage placement) and the
   desktop-as-dashboard-shell question (option (b), issue #375's actual content) may not be the same
   question.** If topic E's mandate is narrower than "make `deno desktop` a first-tier NetScript
   deployment target" — e.g., just "let the NetScript dashboard optionally run as a desktop shell" —
   the current WATCH classification in #327 may not actually apply to it, and reconciling that
   framing is worth doing explicitly before treating #327's WATCH status as a hard blocker.

6. Both #393 (compose deploy target never registered) and #394 (no deploy e2e coverage) are reminders
   that **"epic checkbox closed" does not mean "verified working"** in this codebase's recent
   history — any milestone-train claim resting on #327's tier-1 checkboxes should be spot-checked
   against actual e2e coverage before being treated as done.
