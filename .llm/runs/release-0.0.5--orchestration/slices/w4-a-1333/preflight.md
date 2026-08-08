# W4-A preflight — idiomatic default frontend reference

Observed on 2026-08-06 before dispatch:

- The scaffold exposes powerful Fresh/Fresh-UI/page-builder/query/form/telemetry patterns, but its
  foregrounded default allowed a Wave 6 agent to build raw duplicate controls, direct service calls,
  hand-written CSS, and a 676-line island.
- `eis-chat` demonstrates the intended architecture; useful current scaffold examples must be
  retained or upgraded rather than replaced wholesale.
- The default app name is fixed to `dashboard` despite an explicit `--app-name` option.

## Required design checkpoint

1. Ground the reference in one concrete subject, audience, and job: a new NetScript developer/agent
   must learn the canonical resource flow by running and modifying the default product surface.
2. Inventory the live Fresh-UI registry, `/design`, `/design/composition`, eis-chat patterns,
   current scaffold routes, and generated contracts before proposing visuals or information
   architecture.
3. Produce a compact design system: named 4–6 color tokens, deliberate display/body/utility type
   roles, responsive layout concept, one subject-specific signature element, interaction/motion,
   keyboard/reduced-motion/light/dark behavior, and real copy for all states.
4. Self-critique generic AI defaults and revise the plan before code. Spend visual boldness once;
   every structural device must encode the resource workflow rather than decorate it.
5. Obtain the required GLM design review through the checked-in agentic route and record artifact,
   model/effort, and limitations. Implementation begins only after the orchestrator accepts the
   checkpoint.

## Required implementation mission

1. Derive omitted `--app-name` deterministically from the project/purpose with collision-safe stable
   naming; explicit `--app-name` remains authoritative. Add golden and negative cases.
2. Build executable Fresh 2.x starter routes using app-owned registry components and small islands,
   with coherent resource-local `(_components)`/`(_islands)` organization.
3. Demonstrate contract → typed SDK/query factory → layered page builder → QueryIsland hydration/
   cache-first → optimistic mutation/rollback, managed forms, partial navigation, telemetry,
   auth-ready boundary, and DB-generated schema feeding a versioned contract.
4. Implement directional loading/error/empty/success states and link `/design` plus
   `/design/composition` as living references. Preserve or upgrade useful existing examples.
5. Run scaffold goldens, source wrappers, Fresh/package/doctrine gates, generated project
   type/lint/fmt, browser route/state flows with screenshots at responsive light/dark sizes,
   accessibility/keyboard/reduced-motion checks, and exact one-pass `scaffold.runtime`.
6. Open a draft PR with `Refs #1333`, not `Closes`; leave it at `status:impl-eval` for separate Qwen
   evaluation. After merge/publish, the orchestrator runs a measured Quickstart agent smoke and
   records adoption or explicit rejection before hand-closing #1333.

Visual polish without the typed resource flow is false completion; architecture without a usable,
distinctive rendered reference is equally incomplete.
