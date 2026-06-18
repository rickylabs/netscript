# Lume Documentation Teardown

## Core Value Proposition & Audience
* **Value Prop:** Lume is a fast, flexible, pluggable static site generator built specifically for Deno. It provides solid native support for TypeScript, MDX, Vento template compilation, and Deno's native workspace speeds.
* **Target Audience:** Deno developers, site authors, and technical teams looking for a fast, zero-node-dependency alternative to Astro or Hugo natively running in Deno.
* **Ref URL:** [https://lume.land](https://lume.land)

## Feature Surface Relevant to NetScript
* **Overlap:** Represents the exact static engine in charge of compiling and serving NetScript's rebuilt documentation site.
* **Differentiator:** Lume is purely a static site rendering engine. NetScript is a comprehensive backend system including background jobs, durable sagas, and Aspire orchestration.

---

## Documentation Architecture & Design

### 1. Information Architecture (IA) & Sidebar Model
The sidebar is structured around core setup and the Lume plugin system:
* **Getting Started:** Installation, Create a site, Directory structure, Configuration.
* **Creating Content:** Pages, Layouts, Templates (Vento, Nunjucks, Liquid), Assets.
* **Plugins List:** A massive, categorized index of over 50+ central plugins (Pagefind, KaTeX, Sitemap, SVG, Minify, etc.).
* **Advanced Mechanics:** Hydration, Multi-lingual features, Custom loaders.

**Diátaxis Usage:** Lume uses a practical, task-focused structure. It doesn't strictly label pages with standard Diátaxis terms but organizes guides by concrete outputs (e.g. "How to use Vento templates," "Adding Pages").

### 2. Onboarding & Learning-Curve ("Fil d'Ariane")
* **Zero node dependencies:** Emphasizes that you only need Deno installed (`deno task dev` or `deno task build`).
* **Step-by-step Hello World:** Shows immediate configuration with `_config.ts` and step-by-step page creations.

### 3. Front door & Hero Landing Design
* A clean, playful, mascot-driven cartoon art style (an adorable green slime character representing Lume).
* Shows speed metrics comparing Lume compilation performance to other popular static engines.
* Prominently displays the massive catalog of modular plugins, allowing developers to see that Lume behaves like a Swiss Army knife.

### 4. Signature Components (The "Spark" Elements)
* **Categorized Plugins Index:** An organized, searchable cards grid representing all available plugins.
* **Direct Deno import copy blocks:** All code instances leverage native URL or JSR Deno imports, aligning with standard Deno developer expectations.
* **Vento Template Code switchers:** Allows readers to toggle code blocks between different templating formats (e.g., Vento, Nunjucks, JSX).

## Strengths vs. Weaknesses (Doc Perspective)
* **What makes it excellent:** Superb integration with the Deno ecosystem. Excellent documentation of the massive plugin landscape. Every plugin page features direct setup instructions and clear configuration parameters.
* **What makes it weak:** The documentation structure is heavily centered around mechanical configurations. It lacks step-by-step, storybound beginner tutorials (like those found in Astro), making the initial learning curve steeper for developers who are new to static site generators.
