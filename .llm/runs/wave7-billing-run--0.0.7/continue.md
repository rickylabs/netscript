# Product owner steer #10 — runtime evidence phase. Owner has granted the runtime lease.

The code is strong. **What is missing is proof.** Everything below is about producing evidence a
reader can verify, and you have a documented toolchain for it that you have not touched.

## 1. Use the Aspire surface you were given — it is installed and documented

Your own `AGENTS.md` names it, and the skills are installed at `.agents/skills/`:
`aspire`, `aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`.
`aspire` CLI is on PATH at **13.5.3**. Read those skills before you improvise.

**Do not treat Aspire as a process launcher.** The documented diagnostic path, verbatim from your
AGENTS.md: *"Before hand-rolled curl probes or print debugging, run `netscript plugin doctor`,
`aspire doctor --format Json`, `aspire logs`, and `aspire otel logs`, `aspire otel spans`, or
`aspire otel traces`."*

Also use the **NetScript MCP runtime tools** — you have used the docs tools well and the runtime
tools not at all: `get_app_status`, `list_runs`, `get_run`, `get_recent_errors`,
`analyze_service_performance`, `analyze_db_bottlenecks`, `doctor`. These return bounded summaries
designed exactly for this.

## 2. Bring the stack up and prove it

`aspire start`, then verify the **real resource graph**, not a curl and a green label. Capture:

- `aspire doctor --format Json` — prerequisites
- the resource graph with every resource healthy
- `aspire otel traces` — **at least one correlated end-to-end trace** across the interesting
  boundary: operator issues a run → service → worker job → saga → billing call. `traceparent` is
  already threaded through your jobs, so this should link. This is a P0 acceptance item and no prior
  build in this series has produced it.
- `aspire otel logs` / `spans` for the same window
- the generated **Scalar API reference**

## 3. Seed real data, then drive the real flows

Seed enough that screens are populated and interesting — several customers on different plans, usage
accrued, invoices across the whole lifecycle, at least one failed payment, one retry, one refund.
Empty screens prove nothing.

Then drive, through the UI where possible:
- a full run: compute → review → issue, watched live
- **two browser tabs on the same run**, both updating with no reload
- a **compensation reaching terminal state**, using your chaos switch — then show the saga instance
  status from the instances API and the refund on the customer
- a failed payment and its retry
- a webhook delivery and a replay

## 4. Screenshots — these go in the article, so shoot them properly

Capture at a real desktop viewport, **light and dark**, and make the two genuinely different images.
Populated states only. At minimum:

run console mid-run · run detail with saga instance state · invoice detail with line items and a
correction · the customers list · the webhooks delivery log with a replay · the `/design` gallery
showing YOUR components · the Aspire dashboard resource graph · a correlated trace · the Scalar API
reference.

Redact nothing real but check for tokens or machine paths in any captured shell. Save to a
predictable directory in the repo and name them by what they prove.

## 5. Gates — run each separately and report exit codes

*"Verify the artefact, never the exit code."* A wrapper's last exit code is not "all gates passed".
Enumerate every configured gate and run it: `deno task check`, `test`, `lint`, `fmt:check`,
`netscript plugin doctor`, and the quality gates. Report each one's real result.

## 6. Tests — the one place you are behind

**42 cases across 4 files.** The bar is ≥60 tests / ≥120 assertions with every mutating procedure
covered, and ≥15 negative-authorization tests. You have `negative-auth_test.ts`, which is already
more than any prior build managed — extend it to cover every privileged mutation with 401/403/200.
Your terminal-compensation runtime test is excellent and is the thing prior builds never had; keep
that standard.

## Priority

Runtime up and traced → seed → drive the flows → capture → gates → tests. Keep committing.
Report what you proved with the exact command that proved it.
