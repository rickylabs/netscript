# Research

Current main baseline 4ef93c2532e4aeabdbd26874cd36cd7d37e593fd; no source diff. Issue #2040 inspected live. MCP find_guidance/search_docs consulted before design, points to docs/site/web-layer/route.md and existing builder hooks. READ-ONLY EIS PR #434 router evidence: it replaces reference.href with reference.nav.makeHref while keeping generated references/schema construction. No EIS writes.

The current contract-runtime.ts funnels single and paired href/partialHref/getLinkProps through getBoundLinkProps. link.tsx getBoundLinkProps calls readNavigationContext unconditionally; context.ts hides useContext behind try/catch. nav.makeHref already calls validated buildHref with null context. Link is the proper render boundary. Existing useCurrentSearch and usePageRoute are explicit hooks; the latter returns a getLinkProps closure capturing context without further hooks. No new public hook needed.

The documented preserveSearchParams utility behavior must migrate to an explicit capability. Current test coverage already preserves usePageRoute().getLinkProps current-search, component Link and mismatch behavior; pure helpers will remain default-based even inside a route. Existing schema/encoding/paired/type tests remain required.

Production browser toolchain is qualified. Real Fresh Vite production server/static files and actual TanStack useChat can exercise memo URL construction before state/callback hooks, varying links, actual partial navigation and native chat cleanup/resume. Use locked workspace dependency identities; no upgrade, dependency-range changes or handwritten transport substitute in the URL boundary.

Doctrine: retain Fresh integration/public builder shape (Archetype 2 plus existing Archetype 4 builder concern), SCOPE-frontend. No new port/module export or speculative seam. Planned public types unchanged; renamed context reader is internal, directly named hook. JSR rubric: existing explicit public return/type contracts retained, no upstream reexports, no casts/ignores introduced in production source. Run all-export doc lint; any pre-existing residue requires exact baseline comparison and explicit debt adjudication, never a false green.
