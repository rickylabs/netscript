# 05 — Issue #218 prior art (Aspire browser-logs in the dashboard)

Stage-B research task 5, item (5). Fetch method used: PowerShell native `gh` failed (`gh` not on
PATH in the PowerShell environment). Direct Bash tool calls to `gh`/`which`/`echo` all returned no
output in this fork's sandbox (tool-level issue, not a `gh` auth issue). **WSL fallback succeeded**:

```
wsl.exe -u codex -e bash -lc 'export PATH=$HOME/.local/bin:$PATH; cd /tmp && gh issue view 218 --repo rickylabs/netscript --json title,body,state,labels,comments'
```

Primary evidence below is the real fetched issue content (not fabricated, not indirect).

## Issue #218 — primary evidence

- **Title:** "devtools: enable Aspire browser-logs integration by default (capture island/browser
  console in the dashboard)"
- **State:** CLOSED
- **Labels:** none set (empty array in the fetched JSON)
- **Comments:** none

**Body (verbatim):**

> Proposal: netscript apphosts should enable the Aspire **browser-logs devtools integration** by
> default (https://aspire.dev/integrations/devtools/browser-logs/?aspire-lang=typescript) so a
> Vite/Fresh app resource forwards its BROWSER console logs into the Aspire dashboard automatically.
>
> Why: debugging a client-side failure in a durable-streams island (an ElectricSQL StreamDB
> consumer throwing `TypeError: Decoding failed`) was invisible from the server logs and OTEL — the
> only signal lived in the browser console. We had to hand-instrument the island with
> `console.info`/`.catch` to surface it. With browser-logs wired by default, the Aspire dashboard
> would have shown the client error immediately.
>
> Also worth surfacing in the streams docs: the durable-streams runtime warns `Using HTTP (not
> HTTPS) limits browsers to ~6 concurrent connections per origin under HTTP/1.1 ... Use HTTPS for
> HTTP/2` (electric-http2) — the local apphost serves the app over http, so multi-stream islands can
> starve connections.

## Implications for the dashboard / Aspire browser-log integration

1. **Prior art confirms the dashboard's Aspire-extension direction is not speculative** — #218
   already identified a concrete, real pain point (a client-only ElectricSQL/durable-streams
   decoding error, invisible to server logs/OTEL) that Aspire's native browser-logs devtools
   integration would have surfaced immediately. This is direct precedent for topic A's "Aspire
   dashboard extension" pillar and for the D-NSONE/Aspire convergence framing in the topic spec.
2. **Scope is narrower than the full dashboard plugin**: #218 is specifically about wiring the
   existing Aspire browser-logs devtools integration into NetScript apphosts by default — it is not
   a proposal for a custom NetScript-built log viewer. This reinforces the AGENTS/topic-spec
   "wrap, do not reinvent" principle: the dashboard's Aspire seam should **extend** Aspire's own
   browser-logs devtools integration (`WithCommand`/interaction-service, per the topic's §5
   dependency on Aspire ≥ 9.4) rather than reimplement client-log capture inside
   `plugins/dashboard`.
3. **Being CLOSED with no comments and no labels** means there is no recorded implementation PR or
   discussion thread attached to this specific issue in the fetched data — it reads as a
   closed/resolved proposal, but the fetched JSON gives no artifact (PR link, commit) proving how or
   whether it was implemented. The plugin-archetype-grounding SKETCH in `04-` treats this as
   directional prior art (the *idea* is validated and closed), not as a finished, ready-to-consume
   API surface — the later Opus deep-dive and the parallel "Aspire dashboard-extension surface
   research" agent should verify current apphost config to see whether browser-logs devtools is
   actually enabled by default today, or whether #218's proposal still needs re-implementing as part
   of the dashboard plugin's Aspire contribution.
4. **Secondary connection (from the eis-chat reference spec, not from #218 itself):**
   `specs/02-eis-chat-reference.md` and `specs/topic-A-dashboard.md` both cite #218 as the named
   prior art for "Aspire browser-logs captured in the dashboard," confirming the owner's original
   framing lines up with the actual issue content fetched here — no drift between the spec's
   paraphrase and the primary source.
5. **Cross-cutting risk flagged in the same issue, worth carrying into the dashboard's data-source
   design**: the HTTP/1.1 six-connections-per-origin ceiling on durable-streams (electric-http2)
   under a non-HTTPS local apphost. If the dashboard itself becomes a durable-streams consumer for
   live panel data (per topic §5's telemetry query/export convergence), this same connection-
   starvation risk applies to the dashboard's own UI and should be noted for the Opus deep-dive
   rather than rediscovered later.
