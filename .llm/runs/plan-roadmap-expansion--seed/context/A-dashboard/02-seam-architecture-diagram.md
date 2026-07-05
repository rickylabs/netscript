# Topic A — Dashboard seam architecture (B4 diagrams)

ASCII/mermaid views of the two structurally-separate Aspire seams and the proposed plugin shape, for
the Fable synthesis + Opus deep-dive. Grounded in `research/A-dashboard/02` and `analysis/A-dashboard/04`.

## 1. The two Aspire seams today (the reconciliation problem)

The dashboard plugin wants to do BOTH "register a Fresh UI app as an Aspire resource" AND "add
`withCommand` actions". Today these live on **two different paths** that do not meet:

```
                    NetScript scaffold / apphost composition
                                   │
          ┌────────────────────────┴─────────────────────────┐
          │                                                    │
  PLUGIN-CONTRIBUTION SEAM                          APP-REGISTRATION SEAM
  (@netscript/aspire)                               (scaffolded apphost helpers)
          │                                                    │
  AspireNSPluginContribution.contribute()           register-apps.mts (config-driven)
          │                                                    │
  returns AspireResourceKind  ── CLOSED SET ──►      raw SDK: builder.addExecutable(...)
   (db / cache / service / ... )                              .withBrowserLogs()   ← #218
          │                                                    .withCommand(...)   ← reachable HERE
   NO "app" kind. NO "command" kind.                          (only by hand-editing .mts)
          │                                                    │
          ▼                                                    ▼
  A dashboard plugin CANNOT, through contribute(),   A dashboard can be embedded + get commands,
  register a Fresh app OR a withCommand action.      but ONLY via raw-SDK escape hatch, not a plugin.
```

**Implication for the design:** either (a) extend `AspireResourceKind` with an `app`/`command` kind
so the plugin-contribution seam can express dashboard registration + actions (a `@netscript/aspire`
framework slice — WSL Codex), or (b) accept the raw-SDK `register-apps.mts` path for v1 and defer the
seam unification. This is a genuine fork for the Opus deep-dive + Fable to resolve.

## 2. `withCommand` = one seam, three surfaces (the win)

```
  resource.withCommand("reset", "Reset stack", exec, { arguments, iconName, confirmationMessage })
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                           ▼
  Aspire dashboard          `aspire resource <name>      MCP tool caller
  "Actions" ellipsis        reset [args]` (CLI)          (payload = TextContentBlock)
  menu (UI dialog from      stdout=payload/stderr=status
  `arguments` InteractionInput)  pipeable to jq
```

Interaction-service (`IInteractionService`) is **not** available in the TS AppHost SDK — command
`arguments` (array of `InteractionInput`, rendered as a dashboard prompt dialog) is the only
interactive-input substitute today.

## 3. Data-source sequencing for beta.6 (telemetry-consumer seam)

```
  Fresh dashboard UI  ──poll/subscribe──►  [ ranked by reachability today ]
                                            1. OTLP endpoint          (OPEN, easy, beta.6 first)
                                            2. aspire MCP server tools (structured query, best-now)
                                            3. resource-service gRPC  (INTERNAL, undocumented)
                                            ─ later ─
                                            4. Topic B telemetry query/export surface (co-lands beta.6)
```

## 4. Proposed plugin shape (SKETCH — folders only, not locked)

Rhymes with `plugins/streams` (thin) + `packages/plugin-streams-core` (fat). Full rationale in
`analysis/A-dashboard/04`.

```
packages/plugin-dashboard-core/        plugins/dashboard/
  src/domain/      (panel model,         mod.ts
     resource-graph, run model)          cli.ts
  src/ports/       (data-source port,    contracts/v1/mod.ts   (EXTENDS @netscript/plugin base contract)
     aspire/otlp/telemetry adapters)     scaffold.plugin.json  (provider.kind → dynamic register)
  src/application/ (panel orchestration) scaffold.ts
  src/adapters/    (aspire, otlp, mcp)   src/adapter/plugin.ts
  (public surface via mod.ts)            src/adapter/resources/**  (Fresh routes/islands = the UI)
                                         src/public/mod.ts
```

- The **Fresh build-console is the plugin's UI** (routes/islands under `src/adapter/resources/`).
- The **Aspire extension** (`withCommand` + Fresh-app-as-resource) is the plugin's Aspire integration
  (via the seam-reconciliation choice in §1).
- UI is built on `@netscript/fresh-ui` — with the L3-blocks gap from `analysis/…/03` filled per the
  D-NSONE outcome.
