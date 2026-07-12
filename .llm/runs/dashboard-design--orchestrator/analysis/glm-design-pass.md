# GLM 5.2 design/UX pass — critique + proposals

> Transport note (capability-test finding): this pass was produced by `z-ai/glm-5.2`
> (OpenRouter, temperature 0.7, 14k max tokens, text-only — GLM 5.2 exposes no image
> endpoint on OpenRouter, so the screenshots could not be attached; the pass worked from
> the detailed screen catalog + improvement axes). Full agentic-session lanes were
> attempted first and are NOT currently viable for GLM 5.2 — see the run eval
> (`agentic-lane-findings`): codex×openrouter fails on Responses-wire native `namespace`
> tool type; claude-custom-env launches but returns an empty completion in print mode;
> the runtime Claude adapter implements smoke only. The direct chat-completions call is
> the only working transport today.

# NetScript Dev Dashboard — Design/UX Critique & Proposals

## 1. Overall Design Verdict

**Score: 7.5/10**

The prototype demonstrates a sophisticated understanding of developer experience (DX) fundamentals. The correlation-ID spine (`ch_3QK9dR2eZ`) linking home, AI, runs, sagas, and streams is a masterstroke for debugging complex distributed systems. The confirm-with-CLI-equivalent pattern respects developer mental models, bridging UI and terminal workflows. 

However, the design is held back by three structural flaws:
1.  **Information Architecture (IA)**: The flat hash router with 15 sibling routes destroys navigability. A selected run, saga, or flow has no URL, making the dashboard un-shareable and breaking the back button. 
2.  **Gated Honesty**: The pervasive "beta.6/beta.7" gating and "preview" framing (Axis 1 violations) shatter the illusion of a finished product and force the user to context-switch to an issue tracker to understand capability.
3.  **Read-Only Bias**: Despite the CLI transparency pattern, the dashboard leans heavily on observation. Writes (scaffold, override, reprocess) are buried or gated, missing the opportunity to be first-class UI flows.

**Visual Language & Density**: The warm-cream default and `ns-*` token system provide a cohesive, high-density canvas appropriate for dev tools. 
**Hierarchy**: Weakened by the flat sidebar. The breadcrumb (`Console / <title>`) is synthetic; it should be derived from a nested URL structure.
**Dark Mode**: Present and functional, but dense tables (S6, S7, S8) will need careful contrast validation to prevent state-pill fatigue.

---

## 2. Per-Screen Critique & Redesign Proposals

### home (S1)
*Critique*: Strong entry point with KPI sparklines and deep-linking stat cards. The AI summary block is a good instinct. The contributed-panels table is static proof-of-concept.
*Proposals*:
1.  **Remove beta prose**: Strip any beta version ties from the footer and stat cards.
2.  **Actionable Contributed Panels**: Make the `DashboardPanelContribution` table interactive; clicking a contributed panel navigates directly to the plugin's contribution-axis map (S5).
3.  **Global Write Actions**: Add a prominent "Create" or "Scaffold" action button in the global chrome, accessible directly from Home, to initiate plugin/resource scaffolding (Axis 3).
4.  **Route Deep-Links**: Ensure the 6 deep-linking stat cards route to specific filtered views (e.g., `/runs?status=failed`) rather than just sibling routes.

### config (S2)
*Critique*: The `ns-stackmap` capability graph is visually compelling, but selection state is in-memory only. 
*Proposals*:
1.  **Addressable Nodes**: Make every node in the graph a deep-linkable URL (e.g., `/config/services/:serviceName`).
2.  **Inline Write Actions**: For `unwired` telemetry badges, add a contextual action to wire the node directly from the right rail, triggering the confirm-with-CLI flow.
3.  **Plugin Overlay**: Allow filtering the graph by contributing plugin (Axis 6) to visualize extension impact on the capability map.

### runtime (S3)
*Critique*: The version chain and override feed are excellent, but write-back is gated. 
*Proposals*:
1.  **Ungate Writes**: Make the override `set/unset` actions live. Retain the confirm dialog printing `netscript config override set …` (Axis 3).
2.  **AI Override Suggestions**: Embed an AI assist in the override feed that suggests an override based on the current drift, pre-filling the confirm dialog (Axis 5).
3.  **Deep-linkable Versions**: Route version chain items to `/runtime/versions/:versionId` to share exact diff states.

### flows (S13)
*Critique*: The three-zone live-flow console and `ns-journey` causal seam chain are flagship features. The "beta.7" prose violates Axis 1.
*Proposals*:
1.  **Purge Beta Prose**: Remove the "boundary events land in beta.7" notice; show the final boundary-event-grade fidelity.
2.  **Journey URLs**: Make the entire flow addressable via `/flows/:correlationId`.
3.  **Inline Seam AI**: Add a "Diagnose" affordance on halted/failed seams (e.g., `fl_201 halted`) that triggers an embedded AI explanation of the failure using the seam's payload context (Axis 5).
4.  **Replay Action**: Add a "Replay from seam" write action on failed steps, confirming the Aspire command seam CLI.

### catalog (S4)
*Critique*: Good provenance and coverage visibility, but the "not-installed" group is gated.
*Proposals*:
1.  **Live Plugin Add**: Ungate the `netscript plugin add crons` action; make it a live, confirm-gated write flow (Axis 3).
2.  **Procedure URLs**: Route methods to `/catalog/procedures/:method` for shareable contract definitions.
3.  **Scaffold Action**: Add a "Scaffold new route" write action for unbound routes, launching a UI wizard mirroring `createPluginAdapter(...).toScaffold()`.

### plugins (S5)
*Critique*: The dogfood centerpiece is strong, but "create from template" is gated. The `ns-axismap` is static.
*Proposals*:
1.  **Live Template Creation**: Ungate "create from template" and implement the full multi-step scaffold flow (Axis 3).
2.  **Navigable Axis Map**: Turn `ns-axismap` into an interactive navigation tool. Clicking a wired axis (e.g., triggers) filters the dashboard sidebar to show only that plugin's contributions (Axis 6).
3.  **Plugin Update Flow**: Implement the `drift auth v0.9.1→1.0.0` update as a live, confirm-gated write action.
4.  **Deep-link Plugins**: Route to `/plugins/:pluginId`.

### runs (S6)
*Critique*: Excellent cross-primitive list and step timeline. Log strip out-links correctly defer to Aspire.
*Proposals*:
1.  **Entity URLs**: Route to `/runs/:runId` with tab state (All/Compact/JSON) in the URL.
2.  **AI Failure Explanation**: Add an inline "Explain failure" button on the step timeline for `data-comp` branches, invoking a contextual AI prompt (Axis 5).
3.  **Retry Write Action**: Add a confirm-gated "Retry run" action directly in the right activity rail.

### workers (S7)
*Critique*: Good registry and drift panel linkage. Polyglot badges need verification.
*Proposals*:
1.  **Verify Polyglot Badges**: Ensure runtime badges (Node, Python, etc.) are explicitly rendered per job/task.
2.  **Deep-link Executions**: Route to `/workers/jobs/:jobId/executions/:execId`.
3.  **Scaffold Job**: Add a "Scaffold new job" write action in the registry header.
4.  **AI Drift Diagnosis**: In the scheduler-vs-config drift panel, add an AI assist to explain the drift cause and suggest the S3 override.

### sagas (S8)
*Critique*: Strong transition timeline with compensation branch styling.
*Proposals*:
1.  **Entity URLs**: Route to `/sagas/instances/:sagaId`.
2.  **Replay Action**: Add a "Replay saga" write action, using the Aspire command seam, confirm-gated.
3.  **AI Compensation Context**: Add an embedded AI assist on the compensation branch explaining *why* compensation was triggered based on the transition history.

### triggers (S9)
*Critique*: Action chains (`ns-achain`) are a great visualization. Write gating tooltips reference beta.
*Proposals*:
1.  **Ungate Enable/Disable**: Remove beta milestone tooltips; make enable/disable live confirm-gated writes.
2.  **Deep-link Triggers**: Route to `/triggers/:triggerId`.
3.  **Action Chain Provenance**: Show which plugin contributed each action in the `ns-achain` (Axis 6).

### streams (S10)
*Critique*: Fan-out timeline is clear. The "read-model not wired" empty state is honest but static.
*Proposals*:
1.  **Fix Empty State**: Instead of a static empty state, provide a contextual "Wire read-model" write action that scaffolds the necessary binding.
2.  **Deep-link Subscribers**: Route to `/streams/subscribers/:subId`.
3.  **Inline Reprocess**: Add a "Reprocess" action directly on failed deliveries in the fan-out timeline, linking to S12 with pre-selected messages.

### ai (new)
*Critique*: The single chat pane is underwhelming and siloed from the rest of the product.
*Proposals*:
1.  **Distribute AI**: Move the prompt bar and agent-run rail into a global, collapsible right-dock accessible from any screen, rather than a dedicated route (Axis 5).
2.  **Contextual Anchoring**: Automatically inject the current screen's state (e.g., a selected run in S6) into the AI prompt context.
3.  **Deep-link Runs**: Route durable agent runs to `/ai/runs/:runId` and link the correlation ID directly to the S13 journey view.

### migrations (S11)
*Critique*: Good drift alert and introspect diff. Run-migrate is gated.
*Proposals*:
1.  **Ungate Run-Migrate**: Make the migration execution live, retaining the CLI confirm dialog.
2.  **Deep-link Migrations**: Route to `/migrations/:migrationId`.
3.  **AI Drift Explanation**: Add an AI assist to explain the prisma-flake drift in natural language.

### dlq (S12)
*Critique*: Gated preview framing violates Axis 1. Depth stats and message tables are solid.
*Proposals*:
1.  **Remove Preview Framing**: Strip "Preview — contract routes pending" and show the final shipped surface.
2.  **Ungate Reprocess**: Make "Reprocess selected" a live action, confirm-gated with CLI.
3.  **Deep-link Messages**: Route to `/dlq/:queueId/:messageId`.
4.  **AI Failure Clustering**: Add an AI-driven grouping view to cluster similar failure payloads to identify systemic issues.

### authc (new)
*Critique*: Good session projections and event stream rail.
*Proposals*:
1.  **Deep-link Sessions**: Route to `/authc/sessions/:sessionId`.
2.  **Revoke Write Action**: Add a confirm-gated "Revoke session" action in the session table.
3.  **Correlation Spine Link**: Ensure `auth.*` events are joinable to the main correlation spine if they trigger downstream sagas/jobs.
4.  **AI Anomaly Detection**: Highlight suspicious session patterns (e.g., impossible travel) inline using an embedded AI assist.

---

## 3. Axis-by-Axis Proposals

### Axis 1: Zero future-beta prose
*   **Action**: Sweep all documented violations. Remove the "boundary events land in beta.7" prose in S13. Strip the `netscript 0.0.1-beta.6` footer string. Remove the "Preview — contract routes pending" framing in S12. Ungate the "create from template" in S5 and write-gating tooltips in S3/S9. 
*   **Design Pattern**: Replace gated tooltips with active, confirm-gated dialogs. If a feature is in the design, it is clickable and executes its CLI equivalent.

### Axis 2: Complete routing-hierarchy resort
*   **Action**: Abandon the flat hash router. Implement a nested tree: `Console / Consoles / Data` groups become parent routes. 
*   **Examples**: `/consoles/sagas/instances/:sagaId`, `/console/flows/:correlationId`, `/data/dlq/:queueId/:messageId`.
*   **Interaction**: Breadcrumbs are derived directly from the URL hierarchy. Sidebar items expand to show entity lists. A global "Journey" route (`/journey/:correlationId`) resolves a single ID across all primitives.

### Axis 3: All features implemented (Writes)
*   **Action**: Implement scaffold/add/generate flows as first-class UI. 
*   **Components**: Add a global `+ Create` button in the topbar. Launch a multi-step modal for `createPluginAdapter(...).toScaffold()`. 
*   **Pattern**: Every write action (override set, trigger enable, DLQ reprocess, plugin add) follows: UI action -> Modal with visual diff/impact preview -> Confirm dialog printing exact CLI -> Execution -> Live feed update.

### Axis 4: Beta.10 cross-coverage
*   **Action**: Map every screen to the beta.10/DDX epic issues. Ensure all 8 trigger types, action chains, polyglot runtimes, and saga history APIs are explicitly visualized in the UI. 
*   **Verification**: The `ns-axismap` (S5) should serve as the visual proof of frontend contribution coverage (DDX-17 #427).

### Axis 5: AI surface distributed
*   **Action**: Demote the `ai` screen to a global, collapsible right-dock. 
*   **Components**: 
    *   **Contextual Buttons**: "Explain this failure" on S6/S8/S13.
    *   **Inline Ghost-Text**: AI override suggestions in S3.
    *   **Embedded Assists**: Migration explanations in S11, auth anomaly detection in authc.
    *   **Tool Transparency**: Render tool-call cards (`workers.executionsByCorrelation`) as interactive chips that deep-link to the referenced entity.

### Axis 6: Dynamic plugin/extension system
*   **Action**: Make `DashboardPanelContribution` and `ns-axismap` live navigation. 
*   **Components**: 
    *   **Extension Manager**: A dedicated view in S5 to manage installed extensions (panel/module/layout taxonomy).
    *   **Contribution Axis Map**: An interactive graph where clicking a plugin filters the entire dashboard sidebar to show only that plugin's contributions.
    *   **⌘K Injection**: Plugins can contribute actions to the global ⌘K palette.

---

## 4. Ten "Wow" Ideas

1.  **Unified Correlation Journey URL**: A single, deep-linkable route (`/journey/:correlationId`) that aggregates the `ns-journey` from S13, run details from S6, and saga history from S8 into one unified timeline view, allowing a developer to share a complete distributed transaction narrative with one link.
2.  **Live Flow Time-Travel**: Add a time-slider control to the S13 `ns-journey` causal seam chain, allowing developers to scrub backward through the SSE feed to replay the exact state of the flow at the moment of failure, rather than just viewing the live tail.
3.  **AI Ghost-Overrides**: In the S3 runtime override feed, when drift is detected, the AI generates a suggested override and renders it as ghost-text in the feed. Pressing `Tab` accepts the suggestion and populates the confirm-with-CLI dialog.
4.  **Interactive Contribution Axis Map**: Transform the static `ns-axismap` in S5 into a force-directed graph. Clicking a plugin node dynamically re-organizes the global sidebar and navigation to display only the UI surfaces (panels, seams, actions) that the plugin contributes.
5.  **Visual CLI Diff Preview**: When executing any write action (e.g., S3 override, S9 trigger enable), the confirm dialog displays a syntax-highlighted visual diff of the underlying config file that the CLI command will modify, bridging the gap between UI clicks and code changes.
6.  **Contextual Seam Diagnosis**: In S13, hovering over a failed seam in the causal chain instantly pops a lightweight AI-generated diagnostic card, analyzing the payload-at-seam disclosure and suggesting the exact CLI command to retry or compensate.
7.  **Global Scaffold Wizard**: A ⌘K-triggered, multi-step wizard that mirrors `createPluginAdapter(...).toScaffold()`. It guides the user through generating files, wiring config, and adding dependencies, ending with a CLI command and a live update to the S2 capability graph.
8.  **Distributed Extension Micro-Panels**: Allow third-party plugins to inject contextual micro-panels directly into the right-rails of entity detail screens (e.g., S6 Run Inspector, S8 Sagas), providing bespoke visualizations or actions specific to that entity's data.
9.  **AI-Driven DLQ Failure Clustering**: In S12, add an AI-powered "Cluster View" that groups dead-letter messages by semantic similarity of their error payloads, instantly revealing systemic issues (e.g., "12 failures due to schema mismatch") rather than forcing manual payload inspection.
10. **Tool-Call Deep-Link Chips**: In the AI durable chat transcript (S9/ai), render tool-call cards (e.g., `sagas.getInstanceHistory`) as interactive chips. Clicking the chip deep-links directly to the referenced entity (e.g., `/sagas/instances/:id`), creating a seamless bridge between AI investigation and manual inspection.