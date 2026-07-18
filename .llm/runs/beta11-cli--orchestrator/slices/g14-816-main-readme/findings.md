# README Benchmark Study Findings

This document presents the detailed extraction, dimensional scoring, and comparative synthesis for 14 corpus candidates, evaluated against the rubric defined in [criteria.md](file:///home/codex/repos/wt-g14-816/.llm/runs/beta11-cli--orchestrator/slices/g14-816-main-readme/criteria.md).

---

## 1. Per-Candidate Findings

## Deno Fresh (https://github.com/denoland/fresh)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `# fresh`, `## 📖 Documentation`, `## 🚀 Getting started`, `## Contributing`, `## Adding your project to the showcase`, `## Badges`, `## Hashtags`. First code block appears under `## 🚀 Getting started` at line 31 (approx 25% scroll position). Navigation bar: `[Documentation](#-documentation) | [Getting started](#-getting-started) | [API Reference](https://deno.land/x/fresh?doc)` is present. No collapsible sections (`<details>`).
- D2 hook: Logo image (lemon slice dripping juice) right-aligned, `# fresh` header, bold tagline, and a list of 5 stand-out features. Verbatim value proposition: `"Fresh is a next generation web framework, built for speed, reliability, and simplicity."` Two-beat WHAT/WHY quotes: WHAT: `"Fresh is a next generation web framework"` WHY: `"built for speed, reliability, and simplicity."` Time-to-first-code-or-visual: Logo image in first screen.
- D3 visuals: Count: 3 (1 logo image, 2 showcase badge SVG images). No architecture diagrams or screenshots. Primary diagram: None. Dark-mode handling: None (shows separate light and dark static SVG badges).
- D4 quickstart: steps_to_running=3 (`deno run -Ar jsr:@fresh/init` to scaffold, `cd fresh-project`, `deno task dev` to start); prereqs=1 ("Install the latest Deno CLI version", linked); no_install_path=no; claimed_time="none"; payoff="Now open http://localhost:5173 in your browser to view the page. You make changes to the project source code and see them reflected in your browser." and deployment instructions.
- D5 ecosystem: Omitted (no lists or tables of packages/modules, delegated to showcase/docs).
- D6 social proof: Showcase section inviting users to add their project to `showcase.json` and social media hashtags (`#denofresh`, `#deno`).
- D7 length: words≈422; code_blocks=8; tables=0. Docs handoffs: Links to introduction page (`https://usefresh.dev/docs/introduction`), getting started, API reference, showcase, contributing guidelines. High handoff ratio (thin README).
- D8 badges: count=0 (no CI or registry badges at the top, only static showcase badges at the bottom).
- D9 status honesty: None in the README (does not mention versioning or pre-release disclaimers).
- D10 audience routing: On-ramps for new developers (getting started/scaffold), contributors (contributing guidelines), and showcase additions. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 2  | 1  | 3  | 0  | 1  | 2  | 0  | 0  | 2   | 6/10 (Clean and concise but lacks visual engagement and structured packages view.) |

### Lessons
- [D4 quickstart] Minimize scaffold commands by wrapping bootstrap scripts in a single native runtime init execution block (`deno run -Ar jsr:@fresh/init`).

### Notes
- [D5 ecosystem] Deliberately omitted to keep the framework entry point highly focused on getting started.
- [D8 badges] Deliberately omitted to prevent visual clutter in a minimalist design.
- [D9 status honesty] Deliberately omitted to maintain marketing focus on production readiness.

---

## Astro (https://github.com/withastro/astro)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## Install`, `## Documentation`, `## Support`, `## Contributing`, `## Directory`, `## Links`, `## Sponsors`. First code block appears under `## Install` at line 23 (approx 20% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Top banner image (`Build the web you want`), center-aligned link title, and centered tagline. Verbatim value proposition: `"Astro is a website build tool for the modern web — powerful developer experience meets lightweight output."` Two-beat WHAT/WHY quotes: WHAT: `"Astro is a website build tool for the modern web"` WHY: `"powerful developer experience meets lightweight output."` Time-to-first-code-or-visual: Top banner image above the fold.
- D3 visuals: Count: 2 (1 top banner image, 1 sponsors logo grid image). No diagrams or gifs. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=1 (`npm create astro@latest` to install/scaffold); prereqs=0; no_install_path=yes (points to browser play at `https://astro.new/`); claimed_time="none"; payoff=none (delegated to docs).
- D5 ecosystem: Directory table containing 19 core packages and integrations (e.g., `astro`, `@astrojs/react`, `@astrojs/node`) with npm release version badges and changelog links, plus a secondary table with 2 external repositories (`@astrojs/compiler`, `Starlight`). Columns: `Package`, `Release Notes` or `Project`, `Repository`. Placed in README.
- D6 social proof: Discord chat link and a grid of sponsor logos at the bottom (`https://astro.build/sponsors.png`).
- D7 length: words≈380; code_blocks=2; tables=2. Docs handoffs: Links to getting started docs, official documentation, Discord, contributing guide, and astro.new starter play. High handoff ratio (very thin/clean).
- D8 badges: count=4 (CI main build status, MIT License badge, npm version badge, Core Infrastructure Initiative Best Practices badge). Centered row at the top.
- D9 status honesty: None. (Only npm version badge indicates releases, no roadmap or beta disclaimers).
- D10 audience routing: Routes to getting started guides, browser play (`astro.new`), contributors guide, Discord chat, and sponsors. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 3  | 1  | 2  | 4  | 2  | 3  | 2  | 0  | 2   | 8/10 (Polished visual banner and excellent monorepo packaging table make it look highly professional.) |

### Lessons
- [D2 hook] Place a high-quality brand banner image at the absolute top of the README to establish visual identity immediately.
- [D5 ecosystem] Present monorepo packages in a clean markdown table linking each package to its sub-directory and listing its corresponding release badge linked to its CHANGELOG.md.
- [D7 length] Route all documentation, guides, and tutorials to the external docs site, leaving only installation, package registry, and links in the README.

### Notes
- [D9 status honesty] Deliberately omitted because Astro is a mature, stable framework.

---

## Bun (https://github.com/oven-sh/bun)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `### [Read the docs →](https://bun.com/docs)`, `## What is Bun?`, `## Install`, `# with install script (recommended)`, `# on windows`, `# with npm`, `# with Homebrew`, `# with Docker`, `### Upgrade`, `## Quick links`, `## Guides`, `## Contributing`, `## License`. First code block appears under `## What is Bun?` at line 31 (approx 10% scroll position). No collapsible sections.
- D2 hook: Bun mascot logo (oven-shaped bun), `# Bun` title, centered badges (Discord, GitHub stars, speed=fast badge), followed by links to Docs/Discord/Issues/Roadmap. Verbatim value proposition: `"Bun is an all-in-one toolkit for JavaScript and TypeScript apps. It ships as a single executable called bun."` Two-beat WHAT/WHY quotes: WHAT: `"Bun is an all-in-one toolkit for JavaScript and TypeScript apps."` WHY: `"At its core is the Bun runtime, a fast JavaScript runtime designed as a drop-in replacement for Node.js. It's written in Rust and powered by JavaScriptCore under the hood, dramatically reducing startup times and memory usage."` Time-to-first-code-or-visual: Logo image in first screen.
- D3 visuals: Count: 1 (mascot logo). No diagrams, screenshots, or gifs in README. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=1 (`curl -fsSL https://bun.com/install | bash` for Linux/macOS, or other platform commands); prereqs=2 (lists OS requirements like Linux kernel version 5.6+ and x64 CPU baseline requirements); no_install_path=no; claimed_time="none"; payoff=none (briefly mentions commands like `bun run index.tsx` but shows no output).
- D5 ecosystem: Omitted (single-binary distribution).
- D6 social proof: Discord chat link badge, GitHub stars count badge, speed badge, and link to new issues/roadmap.
- D7 length: words≈2062; code_blocks=5; tables=0. Docs handoffs: Extensive nested markdown directories ("Quick links" and "Guides") mapping directly to sub-features, API endpoints, deployment options, and utilities on the docs site. High doc mapping density in README.
- D8 badges: count=3 (Discord chat badge, GitHub stars count, speed=fast badge). Centered row at the top.
- D9 status honesty: No roadmap disclaimers or beta notices in prose, but links to the GitHub Roadmap issue #159 in the top navigation line.
- D10 audience routing: Distinct installation segments for Windows, macOS (Homebrew), Linux (curl), npm, and Docker. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 3  | 3  | 1  | 3  | 0  | 2  | 3  | 2  | 2  | 2   | 8/10 (Extremely practical and structured; acts as a cheat-sheet map for everything the toolkit can do.) |

### Lessons
- [D1 structure] Keep the README organized as a directory of hyperlinked guides ("Quick links" and "Guides") mapped to the docs site to make a massive feature surface scannable.
- [D2 hook] Combine a friendly mascot logo with quick, actionable links (Docs, Discord, Issues, Roadmap) immediately underneath.
- [D4 quickstart] Offer one-liner install scripts for multiple environments (Homebrew, npm, curl, Docker, PowerShell) side-by-side.
- [D7 length] Defer all code tutorials to the documentation site, using the README primarily as an index.

### Notes
- [D5 ecosystem] Deliberately omitted because Bun is distributed as a single all-in-one CLI executable.

---

## Vite (https://github.com/vitejs/vite)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `# Vite ⚡`, `## Packages`, `## Contribution`, `## License`, `## Sponsors`. First code block: None (this README has 0 code blocks). No Table of Contents or collapsible sections.
- D2 hook: Center-aligned prefers-color-scheme logo, row of badges, `# Vite ⚡` header, italicized blockquote: `> Next Generation Frontend Tooling` followed by 6 feature bullets. Verbatim value proposition: `"Vite (French word for \"quick\", pronounced [/viːt/], like \"veet\") is a build tool that aims to provide a faster and leaner development experience for modern web projects."` Two-beat WHAT/WHY quotes: WHAT: `"Vite... is a build tool"` WHY: `"that aims to provide a faster and leaner development experience for modern web projects."` (also details dev server HMR and bundler details). Time-to-first-code-or-visual: Logo at the top.
- D3 visuals: Count: 2 (1 logo image, 1 sponsors image). No diagrams or gifs. Primary diagram: None. Dark-mode handling: Yes, uses a `<picture>` tag with `(prefers-color-scheme)` queries pointing to `vite-light.svg` and `vite-dark.svg` to render properly in light/dark modes.
- D4 quickstart: steps_to_running=0 (none listed in the README itself, delegates to `https://vite.dev`); prereqs=1 (Node.js version compatibility badge); no_install_path=no; claimed_time="none"; payoff=none.
- D5 ecosystem: Packages table containing 3 core packages (`vite`, `@vitejs/plugin-legacy`, `create-vite`) with their versions (linked to CHANGELOG.md). Columns: `Package`, `Version (click for changelogs)`. Placed in README.
- D6 social proof: Discord chat link and GitHub Sponsors wall image (`https://sponsors.vite.dev/sponsors.svg`) at the bottom.
- D7 length: words≈246; code_blocks=0; tables=1. Docs handoffs: Links to Vite main website, Plugin API, JavaScript API, dev server, HMR, Rolldown bundler, and contributing guide. High handoff ratio (thin README).
- D8 badges: count=5 (npm package version, Node compatibility version, CI build status, Oz agents triage badge, Discord chat badge). Single row at the top.
- D9 status honesty: None (only release version badges).
- D10 audience routing: Links to contributing. AI/agent mentions: none (except "Oz agents - triaging issues" badge which is an issue triager).

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 3  | 2  | 0  | 2  | 2  | 3  | 2  | 0  | 1   | 7/10 (Super clean and minimalist, but completely delegates the quickstart which introduces a small friction.) |

### Lessons
- [D3 visuals] Use standard HTML `<picture>` with `(prefers-color-scheme)` media queries to support dark/light logo switching seamlessly.
- [D7 length] Keep a framework README under 300 words by deferring all quickstart/usage guides to the main documentation portal.

### Notes
- [D4 quickstart] Deliberately omitted to avoid duplicating commands that are better maintained on the docs site.
- [D9 status honesty] Deliberately omitted because Vite is a mature, stable project.

---

## React Router (https://github.com/remix-run/react-router)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## Packages`, `## Previous Versions`. First code block: None (0 code blocks in README). No Table of Contents or collapsible sections.
- D2 hook: Two top badges, a 2-sentence value proposition, followed by 4 bulleted links (Framework start, Library start, Upgrade, Changelog). Verbatim value proposition: `"React Router is a multi-strategy router for React. You can use it maximally as a React framework or minimally as a library with your own architecture."` Two-beat WHAT/WHY quotes: WHAT: `"React Router is a multi-strategy router for React."` WHY: `"You can use it maximally as a React framework or minimally as a library with your own architecture."` Time-to-first-code-or-visual: Prose-only. No visuals or code blocks.
- D3 visuals: Count: 0. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=0 (none listed, routes to docs/getting started); prereqs=0; no_install_path=no; claimed_time="none"; payoff=none.
- D5 ecosystem: Packages list containing 9 package directory links. Columns: None (bulleted list). Placed in README.
- D6 social proof: None.
- D7 length: words≈82; code_blocks=0; tables=0. Docs handoffs: Links to Framework install, Library install, Upgrade from v7, changelog, package directories, and previous version docs (v7, v6, v5). Extreme handoff ratio (minimalist README).
- D8 badges: count=2 (npm version badge, GitHub Actions build test status). Single row at the top.
- D9 status honesty: None in prose, but links to version-specific documentation portals (v7, v6, v5) and upgrade paths ("Upgrade from v7") to set expectations.
- D10 audience routing: Explicit split on-ramps in the hook section for "Getting Started - Framework" vs "Getting Started - Library", and "Upgrade from v7". AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 1  | 2  | 0  | 0  | 2  | 0  | 4  | 1  | 2  | 3   | 5/10 (Too brief; feels like a placeholder rather than a welcoming framework landing page.) |

### Lessons
- [D7 length] A minimalist README can serve as a router for different version guides and installation paths if the documentation is robustly hosted elsewhere.
- [D10 audience routing] Offer immediate, side-by-side links for different usage archetypes (e.g., Framework vs Library) at the very top.

### Notes
- [D3 visuals] Deliberately omitted to maintain a zero-maintenance, plain-text entry point.
- [D4 quickstart] Deliberately omitted because the framework offers two completely different execution models (Framework vs Library).
- [D6 social proof] Deliberately omitted as React Router is globally established.

---

## Tauri (https://github.com/tauri-apps/tauri)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## Introduction`, `## Getting Started`, `## Features`, `### Platforms`, `## Contributing`, `### Documentation`, `## Partners`, `## Organization`, `## Licenses`. First code block appears under `## Getting Started` at line 26 (approx 30% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Splash image banner at the top, followed by 8 badges, followed by the introduction section. Verbatim value proposition: `"Tauri is a framework for building tiny, blazingly fast binaries for all major operating systems."` Two-beat WHAT/WHY quotes: WHAT: `"Tauri is a framework for building tiny, blazingly fast binaries for all major operating systems."` WHY: `"Developers can integrate any front-end framework that compiles to HTML, JS and CSS for building their user interface. The backend of the application is a rust-sourced binary with an API that the front-end can interact with."` Time-to-first-code-or-visual: Splash image at line 1.
- D3 visuals: Count: 3 (1 splash image banner, 1 partner logo, 1 FOSSA license check image at the bottom). No diagrams or gifs. Primary diagram: None (links to `ARCHITECTURE.md` file). Dark-mode handling: None.
- D4 quickstart: steps_to_running=1 (`npm create tauri-app@latest`); prereqs=1 (system-level prerequisites like compiler dependencies, linked); no_install_path=no; claimed_time="none"; payoff=none (delegated to docs).
- D5 ecosystem: Omitted (does not list monorepo packages, delegated to docs).
- D6 social proof: Discord badge, partner logo image (CrabNebula), links to Open Collective sponsors, and Commons Conservancy program details.
- D7 length: words≈569; code_blocks=1; tables=1. Docs handoffs: Links to Tauri main app docs, ARCHITECTURE.md, prerequisites guide, create-tauri-app repo, contributing guidelines, Discord, tauri-docs repo, and Open Collective. Medium handoff ratio.
- D8 badges: count=8 (status, License, test core CI status, FOSSA license check, Discord chat, website, Good Labs affirmation, sponsor badge). Two rows of badges above the introduction.
- D9 status honesty: Has a "status-stable" badge linked to the dev branch/releases. Lists platform version support (e.g. Windows 7 and above, macOS 10.15 and above) in a platform matrix table.
- D10 audience routing: Mentions new developers (Getting Started), contributors (guidelines, Discord check), and partners/sponsors. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 3  | 1  | 2  | 0  | 2  | 2  | 3  | 2  | 2   | 7/10 (Solid developer-focused branding, but lacks a local workflow visual or architecture diagram.) |

### Lessons
- [D8 badges] Stack badges in multiple, logical rows (e.g., build/status in row 1, community/support in row 2) if they exceed 5 items.
- [D9 status honesty] Present a support matrix table showing operating systems and minimum version targets to set developer environment expectations.

### Notes
- [D5 ecosystem] Deliberately omitted because Tauri is primarily consumed as a single CLI (`create-tauri-app`) and package core.

---

## Supabase (https://github.com/supabase/supabase)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `# Supabase`, `## Documentation`, `## Community & Support`, `## How it works`, `#### Client libraries`, `## Badges`, `## Translations`. First code block appears under `## Badges` at line 208 (approx 70% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Center logo banner (light/dark versions), `# Supabase` title, 2-sentence introduction, bullet list of features with checkmarks and docs links, followed by a large screenshot of the dashboard, and a watch repository gif. Verbatim value proposition: `"Supabase is the Postgres development platform. We're building the features of Firebase using enterprise-grade open source tools."` Two-beat WHAT/WHY quotes: WHAT: `"Supabase is the Postgres development platform."` WHY: `"We're building the features of Firebase using enterprise-grade open source tools."` Time-to-first-code-or-visual: Logo, dashboard screenshot, and watch gif visible on first screen/scroll.
- D3 visuals: Count: 7 (2 header logo images, 1 dashboard screenshot, 1 "watch repo" gif, 1 architecture SVG diagram, 2 badges SVGs). Primary diagram: Architecture SVG under "How it works" (line 51) illustrating Kong, GoTrue, PostgREST, Realtime, Storage, pg_graphql, and postgres-meta sitting on top of Postgres. Dark-mode handling: Yes, using `#gh-light-mode-only` and `#gh-dark-mode-only` tag hashes at lines 2-3.
- D4 quickstart: steps_to_running=0 (none listed, points out that the hosted platform is sign-up-and-use with 0 installs); prereqs=0; no_install_path=yes (hosted platform link); claimed_time="none"; payoff=none (delegated to docs).
- D5 ecosystem: Massive client libraries table at lines 66-199 with 11 rows of language clients, categorized under Official (JavaScript, Flutter, Swift, Python) and Community (C#, Go, Java, Kotlin, Ruby, Rust, GDScript), listing their sub-libraries (PostgREST, GoTrue, Realtime, Storage, Functions). Columns: `Language`, `Client`, `PostgREST`, `GoTrue`, `Realtime`, `Storage`, `Functions`. Placed in README.
- D6 social proof: Translations list in 45 languages, community links (Discord, discussions), and made-with-supabase badges.
- D7 length: words≈1127; code_blocks=4; tables=1. Docs handoffs: Links to guides (database, auth, REST, GraphQL, Realtime, storage, AI), hosted console, local-dev/self-hosting, developers guide, and client repositories. Balanced handoff.
- D8 badges: count=2 (Made with Supabase light/dark SVGs at the bottom). 0 badges at the top.
- D9 status honesty: None in the README (mentions hosted platform and local dev options but doesn't flag pre-1.0 or beta status in prose).
- D10 audience routing: Routes to self-hosters vs hosted dashboard users, localized translation contributors, and developers. AI/agent mentions: "AI + Vector/Embeddings Toolkit" is listed as a feature with docs link, but no developer routing for AI coding agents.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 3  | 4  | 4  | 1  | 4  | 3  | 3  | 0  | 0  | 2   | 9/10 (Stunning visual design with dark/light mode logos, rich dashboard screenshot, and an architecture diagram that makes a multi-service platform immediately understandable.) |

### Lessons
- [D2 hook] Place a high-quality dashboard screenshot and a short "watch repository" gif above the fold to capture visual interest immediately.
- [D3 visuals] Include a system-architecture block diagram explaining how individual open-source packages orchestrate together to form the platform.
- [D5 ecosystem] Organize multi-language and modular packages in a comprehensive grid indicating Official vs Community support tiers.

### Notes
- [D8 badges] Deliberately omitted badges at the top of the README to preserve a clean, product-grade header aesthetic.
- [D9 status honesty] Deliberately omitted as Supabase functions as a highly stable public platform.

---

## tRPC (https://github.com/trpc/trpc)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## Intro`, `### Features`, `## Quickstart`, `# yarn`, `# npm`, `# pnpm`, `# bun`, `# deno` (nested commands), `## AI Agents`, `## Star History`, `## Core Team`, `### Project leads`, `### Active contributors`, `### Special shout-outs`, `## Sponsors`, `## All contributors ✨`. First code block under `## Quickstart` at line 63 (approx 30% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Logo banner with prefers-color-scheme source tags, `<h1>tRPC</h1>`, tagline: `<h3>Move fast and break nothing.<br />End-to-end typesafe APIs made easy.</h3>`, 5 badges, and a large client-server type safety demo GIF. Verbatim value proposition: `"tRPC allows you to easily build & consume fully typesafe APIs without schemas or code generation."` Two-beat WHAT/WHY quotes: WHAT: `"tRPC allows you to easily build & consume fully typesafe APIs..."` WHY: `"...without schemas or code generation."` Time-to-first-code-or-visual: Banner logo, badges, and demo gif visible on first screen.
- D3 visuals: Count: 5 (1 banner logo, 1 demo gif, 1 star history SVG chart, 1 contributor Rocks image grid, 1 powered-by-vercel logo). Primary diagram/visual: `v10-dark-landscape.gif` at line 30 illustrating VS Code autocompletion and error handling when refactoring the server-side router. Dark-mode handling: Yes, using `<picture>` and `<source>` tags for the banner.
- D4 quickstart: steps_to_running=1 (scaffold command `npm create next-app --example...`); prereqs=0; no_install_path=no; claimed_time="none"; payoff=none (delegated to docs).
- D5 ecosystem: Omitted (no lists or tables of monorepo packages, delegated to docs).
- D6 social proof: Badges, live interactive Star History chart SVG, core team/contributors avatar tables, silver/smaller sponsor walls, and contributor rocks image grid.
- D7 length: words≈852; code_blocks=2; tables=6. Docs handoffs: Links to tRPC.io docs, Discord, Twitter, examples, Awesome tRPC, contributing guide, and sponsors. Balanced handoff.
- D8 badges: count=5 (codecov coverage, weekly downloads, MIT License, Discord chat, Twitter social badge). Centered row at the top.
- D9 status honesty: Features list says "Well-tested and production ready." No roadmap warnings (v10 is stable).
- D10 audience routing: Quickstart routes users into 5 distinct JS package-manager/runtime configurations (yarn, npm, pnpm, bun, deno). **AI/Agent routing**: Has a dedicated section `## AI Agents` instructing developers to run `npx @tanstack/intent@latest install` to equip coding agents (Claude Code, Cursor, Windsurf) with tRPC skills.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 3  | 4  | 4  | 2  | 0  | 4  | 3  | 2  | 1  | 4   | 10/10 (Superb. The demo gif immediately PROVES the value proposition of type safety before a single word of explanation is read, and the AI Agents integration section is a best-in-class pattern.) |

### Lessons
- [D2 hook] Place a short, high-speed GIF showing IDE code-completion and compiler error feedback immediately below the hook to *prove* type-safety/developer-experience claims.
- [D10 audience routing] Provide a dedicated section for AI coding agents (`## AI Agents`) instructing users how to install/equip agents with project-specific skills/context files.

### Notes
- [D5 ecosystem] Deliberately omitted to keep focus on the main wrapper framework adapters (React/Next).

---

## NestJS (https://github.com/nestjs/nest)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## Description`, `## Philosophy`, `## Getting started`, `## Questions`, `## Issues`, `## Consulting`, `## Support`, `#### Principal Sponsors`, `#### Gold Sponsors`, `#### Silver Sponsors`, `#### Sponsors`, `## Backers`, `## Stay in touch`, `## License`. First code block: None (0 code blocks in README). No Table of Contents or collapsible sections.
- D2 hook: Small centered Nest Logo, tagline, and a wall of 10 badges arranged in 3 rows. Verbatim value proposition: `"A progressive Node.js framework for building efficient and scalable server-side applications."` Two-beat WHAT/WHY quotes: WHAT: `"A progressive Node.js framework..."` WHY: `"...for building efficient and scalable server-side applications."` Time-to-first-code-or-visual: Logo at top.
- D3 visuals: Count: 2 (1 logo image, 1 Backers image grid, plus 20+ sponsor logo images in tables). No diagrams, screenshots, or gifs. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=0 (none listed, routes to guide website); prereqs=0; no_install_path=no; claimed_time="none"; payoff=none.
- D5 ecosystem: Omitted (no packages list or tables, delegated to docs).
- D6 social proof: High download count badge, Open Collective backers count badge, enterprise consulting section, 4 tiers of sponsor logo tables, and a large backers image wall mapping Open Collective avatars.
- D7 length: words≈726; code_blocks=0; tables=5. Docs handoffs: Links to guide site, Chinese/Korean/Japanese docs, Discord, submitting guide, enterprise consulting, sponsors list, Open Collective, Kamil's Twitter. Balanced.
- D8 badges: count=10 (npm version, MIT license, downloads, CI build status, Discord, backers count, sponsors count, PayPal, Support Us badge, Twitter follow). Stacked in 3 centered rows at the top.
- D9 status honesty: None.
- D10 audience routing: Routes to English, Chinese, Korean, and Japanese guides. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 2  | 1  | 0  | 0  | 4  | 2  | 3  | 0  | 2   | 6/10 (Looks like a mature corporate-backed open-source project, but the lack of code blocks or diagrams is disappointing.) |

### Lessons
- [D6 social proof] Place multiple structured sponsorship tiers (Principal, Gold, Silver) and a dynamic Open Collective backers image grid at the bottom to demonstrate community/commercial backing.

### Notes
- [D4 quickstart] Deliberately omitted to encourage users to visit the centralized docs site for step-by-step setup guides.
- [D5 ecosystem] Omitted to prevent overwhelming developers with the framework's massive modular ecosystem (e.g., `@nestjs/config`, `@nestjs/typeorm`).

---

## Laravel (https://github.com/laravel/laravel)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## About Laravel`, `## Learning Laravel`, `## Agentic Development`, `## Contributing`, `## Code of Conduct`, `## Security Vulnerabilities`, `## License`. First code block under `## Agentic Development` at line 36 (approx 60% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Large red Laravel logo lockup centered, 4 badges. Verbatim value proposition: `"Laravel is a web application framework with expressive, elegant syntax."` Two-beat WHAT/WHY quotes: WHAT: `"Laravel is a web application framework..."` WHY: `"...with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling."` Time-to-first-code-or-visual: Logo at the top.
- D3 visuals: Count: 1 (logo). No diagrams, screenshots, or gifs. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=0 (none listed, routes to docs/Laracasts); prereqs=0; no_install_path=no; claimed_time="none"; payoff=none.
- D5 ecosystem: Omitted (no packages list or tables, delegated to docs).
- D6 social proof: Download count badge, links to Laracasts and Laravel Learn.
- D7 length: words≈358; code_blocks=1; tables=0. Docs handoffs: Links to routing, container, sessions, cache, ORM, migrations, queues, broadcasting docs, Laracasts, Laravel Learn, contributing guide, and security policy. High handoff ratio (thin README).
- D8 badges: count=4 (CI test workflow status, Packagist total downloads, Packagist version, license). Centered row at the top.
- D9 status honesty: None.
- D10 audience routing: Routes to video tutorials (Laracasts), basic lessons (Laravel Learn), documentation, and contributors. **AI/Agent routing**: Has a dedicated section `## Agentic Development` stating: **"Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot."** instructing how to install `laravel/boost` which provides agents with 15+ tools and skills to build Laravel apps following best practices.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 2  | 1  | 0  | 0  | 2  | 3  | 2  | 0  | 4   | 8/10 (Extremely clean with an exceptional, forward-looking AI Agent integration block that immediately captures attention.) |

### Lessons
- [D10 audience routing] Emphasize framework compatibility with AI coding agents (Claude Code, Cursor) and provide a CLI tool or helper package (`laravel/boost`) that injects custom tools/rules for agent operations.

### Notes
- [D3 visuals] Deliberately omitted to maintain Laravel's iconic, clean text-only README signature.
- [D4 quickstart] Deliberately omitted because the framework CLI tool (`laravel new`) has complex local runtime requirements (PHP, Composer) that are better explained in the installation docs.
- [D5 ecosystem] Deliberately omitted because Laravel's package family (Breeze, Jetstream, Horizon) is cataloged on the website.

---

## Rails (https://github.com/rails/rails)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `# Welcome to Rails`, `## What's Rails?`, `## Model layer`, `## View layer`, `## Controller layer`, `## Frameworks and libraries`, `## Getting Started`, `## Contributing`, `## License`. First code block under `## Getting Started` at line 61 (approx 60% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Plain `# Welcome to Rails` title, no badges, no logos, followed by description prose. Verbatim value proposition: `"Rails is a web application framework that includes everything needed to create database-backed web applications according to the Model-View-Controller (MVC) pattern."` Two-beat WHAT/WHY quotes: WHAT: `"Rails is a web application framework..."` WHY: `"...that includes everything needed to create database-backed web applications according to the Model-View-Controller (MVC) pattern."` Time-to-first-code-or-visual: Prose-only. No visuals.
- D3 visuals: Count: 0. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=4 (`gem install rails` to install, `rails new myapp` to scaffold, `cd myapp`, `bin/rails server` to start); prereqs=0 (Ruby is assumed); no_install_path=no; claimed_time="none"; payoff="Go to http://localhost:3000 and you'll see the Rails bootscreen with your Rails and Ruby versions."
- D5 ecosystem: Lists the independent libraries/frameworks bundled in Rails in a bulleted list at lines 49-55 (Action Mailer, Action Mailbox, Active Job, Action Cable, Active Storage, Action Text, Active Support). Columns: None (bulleted list). Placed in README.
- D6 social proof: Links to contributors website. No sponsor lists or stars charts in README.
- D7 length: words≈620; code_blocks=3; tables=0. Docs handoffs: Links to MVC Wikipedia page, Active Record, Active Model, Action Pack, Action View readme files, Rails Guides, API documentation, contributing guide, and security policy. Balanced.
- D8 badges: count=0.
- D9 status honesty: None.
- D10 audience routing: Links to getting started docs and API docs for developers, contributing guides for contributors. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 3  | 2  | 0  | 3  | 2  | 1  | 3  | 0  | 0  | 2   | 7/10 (A classic text-heavy README that does a great job explaining the philosophy of MVC, but feels dated visually.) |

### Lessons
- [D1 structure] Dedicate individual sections to explain core architectural concepts (e.g., Model layer, View layer, Controller layer) to ground new users in the framework's philosophy.
- [D4 quickstart] Provide a sequential, numbered checklist of commands that guides developers from installation to a running local server URL.

### Notes
- [D3 visuals] Deliberately omitted to maintain a traditional, documentation-centric codebase entry.
- [D8 badges] Deliberately omitted to avoid marketing distractions.
- [D9 status honesty] Deliberately omitted because Rails is an industry-standard stable framework.

---

## .NET Aspire (https://github.com/dotnet/aspire)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `# Aspire`, `## What is Aspire?`, `## A simple app definition`, `## Getting started`, `### Install the Aspire CLI`, `## Useful links`, `## What is in this repo?`, `## Contributing`, `## Reporting security issues and security bugs`, `### Note on containers used by Aspire resource and client integrations`, `## License`. First code block under `## A simple app definition` at line 21 (approx 20% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Title `# Aspire`, row of 5 badges, followed by description prose. Verbatim value proposition: `"Aspire is a multi-language, code-first toolchain for building, running, and deploying distributed applications."` Two-beat WHAT/WHY quotes: WHAT: `"Aspire is a multi-language, code-first toolchain for building, running, and deploying distributed applications."` WHY: `"Describe how services, frontends, containers, databases, caches, and connections fit together in code. The Aspire CLI runs the whole app locally, exposes OpenTelemetry-based observability, and carries the same definition into deployment."` Time-to-first-code-or-visual: Badges at top, code blocks (C# and TS) visible on first scroll.
- D3 visuals: Count: 0. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=1 (`curl -sSL https://aspire.dev/install.sh | bash` or PowerShell equivalent to install CLI); prereqs=0; no_install_path=no; claimed_time="none"; payoff=none (delegated to docs).
- D5 ecosystem: Omitted (only a prose description of repository packages).
- D6 social proof: Discord badge, Help Wanted / Good First Issue issue badges.
- D7 length: words≈434; code_blocks=4; tables=0. Docs handoffs: Links to main documentation, first app tutorial, sample repository, Developer Control Plane, daily build guide, contributing guide, and security policy. Thin README.
- D8 badges: count=5 (CI workflow status, Tests workflow status, Help Wanted issue count, Good First Issue count, Discord chat). Single row at the top.
- D9 status honesty: Warns about daily builds: "If you want to use the latest daily builds instead of the released version, follow the instructions..." but doesn't mention beta/RC disclaimers for the main release.
- D10 audience routing: Side-by-side apphost definitions for C# vs TypeScript developers, links to first-app getting started guides, and contributing paths. AI/agent mentions: none.

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 3  | 3  | 0  | 2  | 0  | 2  | 3  | 2  | 1  | 3   | 7/10 (Clear, code-first layout that illustrates C# vs TS usage, but missing a diagram of the dashboard or service relationships.) |

### Lessons
- [D10 audience routing] Present equivalent configuration code blocks side-by-side (or sequentially) for different programming language targets (e.g., C# AppHost vs TypeScript AppHost) to signal multi-language support.

### Notes
- [D3 visuals] Deliberately omitted to emphasize the code-first API definition approach.
- [D5 ecosystem] Omitted as Aspire's 50+ component integrations are indexed on NuGet.

---

## Hono (https://github.com/honojs/hono)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## Quick Start`, `## Features`, `## Documentation`, `## Migration`, `## Communication`, `## Contributing`, `## Contributors`, `## Authors`, `## License`. First code block appears at line 26 under the hook paragraph (approx 20% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Large centered Hono title image, horizontal rule, followed by a wall of 12 badges arranged in 2 rows, followed by the hook paragraph. Verbatim value proposition: `"Hono - means flame🔥 in Japanese - is a small, simple, and ultrafast web framework built on Web Standards."` Two-beat WHAT/WHY quotes: WHAT: `"Hono ... is a small, simple, and ultrafast web framework built on Web Standards."` WHY: `"It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, AWS Lambda, Lambda@Edge, and Node.js."` Time-to-first-code-or-visual: Title logo at the top. Code block at line 26.
- D3 visuals: Count: 1 (title logo image). No diagrams or gifs. Primary diagram: None. Dark-mode handling: None.
- D4 quickstart: steps_to_running=1 (`npm create hono@latest`); prereqs=0; no_install_path=no; claimed_time="none"; payoff=none (delegated to docs).
- D5 ecosystem: Omitted (no lists or tables of packages/middleware in README, delegated to docs).
- D6 social proof: Badge wall (commit activity, downloads, stars implicit), list of contributors, and Yusuke Wada listed as author.
- D7 length: words≈327; code_blocks=2; tables=0. Docs handoffs: Links to hono.dev documentation, migration guide, Discord, X, and contributing guide. High handoff ratio (thin README).
- D8 badges: count=12 (GitHub actions, License, npm version, npm downloads, JSR version, Bundlephobia min, Bundlephobia minzipped, GitHub commit activity, last commit, codecov coverage, Discord online, Ask DeepWiki badge). Two rows at the top.
- D9 status honesty: None.
- D10 audience routing: Links to migration guide, contributing guidelines, and author socials. AI/agent mentions: none (except the "Ask DeepWiki" search assistant badge).

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 2  | 3  | 1  | 2  | 0  | 2  | 3  | 4  | 0  | 2   | 8/10 (Superb, code-first minimalist page with a impressive badge wall that builds instant trust in the project's health.) |

### Lessons
- [D8 badges] Utilize bundlesize and coverage badges (e.g. Bundlephobia, Codecov) to immediately signal to developers that the codebase is highly optimized and well-tested.

### Notes
- [D3 visuals] Deliberately omitted to emphasize the raw, lightweight nature of the router.
- [D5 ecosystem] Deliberately omitted because Hono's middleware and adapters are documented on the website.

---

## Encore (https://github.com/encoredev/encore)
- status: swept
- snapshot_date: 2026-07-18

### Extraction
- D1 structure: Heading list: `## What is Encore?`, `### Example: Declaring resources`, `### Configuration`, `### Language SDKs`, `## The Development Workflow`, `## Adopting Encore`, `### Migrating Away`, `## Limitations`, `## How Encore Compares`, `## Quick Start`, `## AI Integration`, `## Local Dev Dashboard`, `## Deployment Platform`, `## Who's Using Encore`, `## Resources`, `## License`. First code block under `### Example: Declaring resources` at line 26 (approx 15% scroll position). No Table of Contents or collapsible sections.
- D2 hook: Centered SVG icon logo, bold title `Encore: Infrastructure orchestration from local to your cloud`, 4 badges, followed by introduction text. Verbatim value proposition: `"Encore is the infrastructure platform for the intelligence era, where engineers and AI agents build production systems without waiting on infrastructure."` Two-beat WHAT/WHY quotes: WHAT: `"Encore is the infrastructure platform for the intelligence era, where engineers and AI agents build production systems without waiting on infrastructure."` WHY: `"Run and validate with real infrastructure locally and in preview environments, then deploy to your own AWS or GCP account."` Time-to-first-code-or-visual: Logo at top. Code block at line 26.
- D3 visuals: Count: 2 (1 logo icon, 1 local dev dashboard video link). Primary diagram/visual: Video link at line 141 demonstrating the local development dashboard, trace graph, and architecture visualizer. Dark-mode handling: None.
- D4 quickstart: steps_to_running=4 (1. `brew install encoredev/tap/encore` or curl/powershell script to install CLI, 2. `encore app create` to scaffold, 3. `cd myapp`, 4. `encore run` to run); prereqs=0; no_install_path=no; claimed_time="none"; payoff="run locally with provisioned infra + dev dashboard" available at `localhost:9400`.
- D5 ecosystem: Present in two tables: Language SDKs table under line 66 (TypeScript, Go, Python, columns: `Language`, `Docs`), and a Resource-Mapping table under line 43 listing how resources (SQL Database, Pub/Sub, Object Storage, Cache, Cron, Secrets, Compute) map locally vs AWS vs GCP. "How Encore Compares" comparison table under line 107. Placed in README.
- D6 social proof: Discord link, list of customer teams (Ashby, Bookshop.org, Later.com, Playwire, Pave Bank, Groupon) under "Who's Using Encore", case studies link.
- D7 length: words≈1533; code_blocks=2; tables=4. Docs handoffs: Links to Cloud dashboard docs, Terraform provider docs, TS/Go SDK docs, CLI infra namespaces, Neon DB branch docs, development workflow, migration guide, migrate-away guide, quickstart walkthrough, AI integration docs, pricing, Docker self-hosting, customer case studies, roadmap. Low handoff ratio (very comprehensive README).
- D8 badges: count=4 (license MPL-2.0, Discord link, Go package doc, TS npm version). Centered row at the top.
- D9 status honesty: Has a dedicated `## Limitations` section detailing language support (TypeScript/Go, Python coming soon), infrastructure scope, cloud providers (AWS/GCP, Azure roadmap), and self-hosting alternatives.
- D10 audience routing: Enlists explicit paths for new developers (Quick Start), migrators (Adopting Encore/Migrating Away), production teams (Deployment Platform/Who's Using Encore). **AI/Agent routing**: Has a dedicated section `## AI Integration` stating: **"Encore is built for AI-assisted development. When you run `encore app create`, you can pick your AI tool (Cursor, Claude Code, etc.) and Encore generates the right rules files for it, plus configures an MCP server that lets agents introspect your app: services, APIs, databases, traces."**

### Scores
| D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|----|----|----|----|----|----|----|----|----|-----|------------------|
| 4  | 4  | 2  | 3  | 3  | 3  | 3  | 2  | 4  | 4   | 10/10 (Superb. The README is a masterclass in positioning an infrastructure-orchestrated backend framework, and its proactive AI/agent integration details are exceptionally forward-thinking.) |

### Lessons
- [D1 structure] Include a comprehensive "How it Compares" table in the README to clearly differentiate your product from nearest competitors (PaaS, BaaS, IaC).
- [D9 status honesty] Create a dedicated "Limitations" section to transparently lay out language support, cloud targets, and architectural constraints, building instant trust.
- [D10 audience routing] Explicitly target AI agents as first-class users of your codebase and explain how your CLI scaffolds configuration files (e.g., Cursor rules, MCP server) to enable agent introspection.

### Notes
- [D3 visuals] Lacks a static architecture diagram in the README (uses a video link instead), which could have further improved the immediate understanding of the infrastructure graph.

---

## 2. Comparative Synthesis

### 2.1 Score Matrix

| Candidate | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9 | D10 | first_impression |
|-----------|----|----|----|----|----|----|----|----|----|-----|------------------|
| Deno Fresh| 2  | 2  | 1  | 3  | 0  | 1  | 2  | 0  | 0  | 2   | 6/10             |
| Astro     | 2  | 3  | 1  | 2  | 4  | 2  | 3  | 2  | 0  | 2   | 8/10             |
| Bun       | 3  | 3  | 1  | 3  | 0  | 2  | 3  | 2  | 2  | 2   | 8/10             |
| Vite      | 2  | 3  | 2  | 0  | 2  | 2  | 3  | 2  | 0  | 1   | 7/10             |
| React Rtr | 1  | 2  | 0  | 0  | 2  | 0  | 4  | 1  | 2  | 3   | 5/10             |
| Tauri     | 2  | 3  | 1  | 2  | 0  | 2  | 2  | 3  | 2  | 2   | 7/10             |
| Supabase  | 3  | 4  | 4  | 1  | 4  | 3  | 3  | 0  | 0  | 2   | 9/10             |
| tRPC      | 3  | 4  | 4  | 2  | 0  | 4  | 3  | 2  | 1  | 4   | 10/10            |
| NestJS    | 2  | 2  | 1  | 0  | 0  | 4  | 2  | 3  | 0  | 2   | 6/10             |
| Laravel   | 2  | 2  | 1  | 0  | 0  | 2  | 3  | 2  | 0  | 4   | 8/10             |
| Rails     | 3  | 2  | 0  | 3  | 2  | 1  | 3  | 0  | 0  | 2   | 7/10             |
| .NET Asp. | 3  | 3  | 0  | 2  | 0  | 2  | 3  | 2  | 1  | 3   | 7/10             |
| Hono      | 2  | 3  | 1  | 2  | 0  | 2  | 3  | 4  | 0  | 2   | 8/10             |
| Encore    | 4  | 4  | 2  | 3  | 3  | 3  | 3  | 2  | 4  | 4   | 10/10            |

---

### 2.2 Dimension Winners

- **D1 (Structure)**: **Encore (4)**. Techniques: Structure the README to map local vs cloud infrastructure transitions transparently, using comparative tables, limitation sections, and clean conceptual splits.
- **D2 (Hook)**: **tRPC (4)** and **Encore (4)**. Techniques: Hook developers by immediately pairing the textual value proposition with a highly dynamic visual (GIF or interactive schema) proving the UX claim.
- **D3 (Visuals)**: **Supabase (4)** and **tRPC (4)**. Techniques: Use prefers-color-scheme SVG tags for headers, high-fidelity dashboard previews, and dynamic GIFs showing IDE autocomplete and error highlights.
- **D4 (Quickstart)**: **Bun (4)**. Techniques: Display multi-platform install scripts (curl, brew, npm, powershell, docker) side-by-side with clear architecture constraints.
- **D5 (Ecosystem)**: **Astro (4)** and **Supabase (4)**. Techniques: Present modular packages and official vs community SDK clients in structured tables detailing version badges and links.
- **D6 (Social Proof)**: **tRPC (4)** and **NestJS (4)**. Techniques: Integrate dynamic live charts (e.g., star history) and structured sponsor walls categorized by donation tiers.
- **D7 (Length)**: **React Router (4)**. Techniques: Maintain a clean, minimal "router-like" README that redirects users to focused sub-paths if the docs portal is robustly designed.
- **D8 (Badges)**: **Hono (4)**. Techniques: Enlist optimized bundle size (min + zipped) and test coverage statistics at the top of the file to build instant technical confidence.
- **D9 (Status Honesty)**: **Encore (4)**. Techniques: Create a dedicated "Limitations" section outlining architectural constraints, supported cloud platforms, and migration paths.
- **D10 (Audience Routing)**: **tRPC (4)**, **Laravel (4)**, and **Encore (4)**. Techniques: Dedicate explicit sections targeting AI Coding Agents, instructing how to install custom rules files and MCP server integrations.

---

### 2.3 NetScript Need-Mapping

#### 1. Agentic combo as flagship differentiator
- **Candidate Lesson (Encore D10, Laravel D10)**: Establish AI agents as first-class citizens in the framework. Provide a dedicated section (`## AI Integration` or `## Agentic Development`) highlighting Cursor/Claude Code support and instruct how the CLI bootstrap creates custom rules and configures an MCP server (e.g., Encore's `encoreapp create` setting up MCP for agents to query traces/databases).
- **Anti-pattern to avoid**: Leaving AI agent usage completely unaddressed or hidden in contributing docs, missing the opportunity to capture the developer mindshare in the intelligence era.

#### 2. Contract-first typed pipeline
- **Candidate Lesson (tRPC D2/D3)**: Use a high-quality GIF showing side-by-side client/server code frames where a change in the server route schema immediately triggers a TypeScript compilation error in the client code panel.
- **Anti-pattern to avoid**: Explaining the mechanics of type-safety in heavy prose instead of showing a fast-paced interactive demo.

#### 3. Full-coverage CLI story
- **Candidate Lesson (Bun D4, Rails D4)**: List the developer commands in a numbered list (1 to 4) specifying prerequisites and ending with a verifiable local server URL (e.g., `http://localhost:5173`) and hot-reloading confirmation.
- **Anti-pattern to avoid**: Vite's quickstart omission where the README has zero code blocks or CLI commands, forcing new users to exit Github to see basic commands.

#### 4. Runtime/services model + Aspire orchestration
- **Candidate Lesson (Supabase D3, Encore D5)**: Use a system architecture SVG diagram illustrating how services (APIs, frontends), local containers, and databases connect under a unified control plane, paired with a table mapping how local components correspond to cloud infrastructure equivalents.
- **Anti-pattern to avoid**: Writing a complex explanation of background service lifecycles without any block diagrams.

#### 5. Ecosystem scale without overwhelm
- **Candidate Lesson (Astro D5, Supabase D5)**: Lay out package/integration families in a matrix table grouping packages by category (e.g. Official vs Community, core runtime vs adapters) and showing package name links, version badges, and CHANGELOG pointers.
- **Anti-pattern to avoid**: Listing dozens of packages as a bare bulleted list without versioning metadata or clear support classifications.

#### 6. Deploy targets incl. native desktop lane
- **Candidate Lesson (Tauri D9)**: Use a compatibility/targets matrix table in the README indicating support tiers for different operating systems (macOS, Windows, Linux, Mobile) to show Tauri's multi-platform capabilities.
- **Anti-pattern to avoid**: Explaining target distribution in prose, which is hard to scan for cross-platform compatibility checks.

#### 7. Docs/tutorial map
- **Candidate Lesson (Bun D7)**: Create a "Quick links" or "Guides" index at the bottom of the README with categorized, bulleted references mapping directly to specific paths on the docs portal (e.g., "HTTP Server", "SQLite Database", "Cron Jobs").
- **Anti-pattern to avoid**: Providing a single, generic "Documentation" link that dumps the user on the homepage of the external docs site.

#### 8. Honest pre-release status
- **Candidate Lesson (Encore D9, React Router D10)**: Create a dedicated "Limitations" section that lists pre-release caveats, upcoming roadmap targets (e.g. "Coming soon" or "On the roadmap"), and outlines clear migration or exit paths (e.g. "Migrating Away" guide) to minimize lock-in anxiety.
- **Anti-pattern to avoid**: Over-promising production stability while in early beta, or omitting upgrade/migration guides.

---

### 2.4 Structural Consensus

For the top-5 first-impression candidates (tRPC, Encore, Supabase, Astro, Bun), the following section-order consensus emerges:
1. **Brand Header & Badges**: Logo banner (often with dark/light mode switches), subtitle tagline, and a single/double row of build, version, and community badges. (All top-5).
2. **Visual Hook / Proof**: A dynamic GIF demonstrating the key differentiator in action (tRPC) or high-fidelity dashboard screenshot/video link (Supabase, Encore).
3. **Core Concept / Value Prop**: 2-3 paragraph summary detailing "What is it?" and "Why does it exist?". (All top-5).
4. **Quickstart / Installation**: Platform-specific installation commands and project initialization steps. (Bun, Encore, Astro).
5. **Ecosystem / Packages Directory**: Tabular overview of monorepo packages, libraries, or mapped cloud resources. (Astro, Supabase, Encore).
6. **Social Proof & Sponsors**: Sponsor walls, backers grids, case studies, or star history charts. (tRPC, Supabase, NestJS).
7. **Audience Routing (including AI Agents)**: Links to localized documentation, migration paths, or AI/agent intent skills configuration. (tRPC, Encore, Laravel).
8. **Project Metadata (License/Contributing)**: Standards compliance, license types, and contributing entry gates. (All top-5).

---

### 2.5 Open Questions for the Redactor

1. **README Density**: Should the entry point be a "thin router" that delegates immediately to the documentation site (e.g., Vite, React Router, Laravel) or a "fat index" that contains full CLI quickstarts, feature lists, and guides directories (e.g., Bun, Encore)?
2. **AI/Agent Positioning**: Should the AI-agent capability be featured as the primary hook tagline at the top of the README (Encore style) or as a dedicated section further down the page to avoid alienating human developers (tRPC, Laravel style)?
3. **Visual Proof Mechanism**: Should the first screen rely on a static, high-fidelity system architecture diagram (Supabase style) or an animated terminal GIF demonstrating DX/typesafety loop speed (tRPC style)?
4. **Sponsor Grid vs. Corporate Cleanliness**: Should the README host full sponsor avatar grids and backer walls (NestJS, tRPC style) or maintain a strictly minimalist layout that delegates funding details to a sub-file or website (Rails, Supabase style)?
5. **Monorepo Packages Listing**: Should the root README index all 36 packages and 6 plugins in a detailed markdown table (Astro, Supabase style) or delegate this registry entirely to the JSR/npm registry pages (Bun, NestJS style)?

---

### 2.6 Deviations

- None. (All 14 candidates were successfully swept and analyzed via raw GitHub CDNs).
