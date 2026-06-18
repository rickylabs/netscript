# Lume & Vento Plugins Research Let us explore which Lume plugins, Vento template engine features, and configuration patterns the NetScript documentation site is *not yet using*, and how they can be leveraged to implement leading doc-architecture patterns.

---

## 1. Unused Lume Plugins and Their Doc-Quality Value

The current `docs/site/_config.ts` uses only three plugins: `basePath`, `pagefind`, and `codeHighlight` (which is standard Prism-based highlight). Under the hood, Lume ([lume.land](https://lume.land)) has over 50+ central plugins. The following are the most high-leverage additions for NetScript:

### A. `lume/plugins/nav.ts` (Dynamic Navigation Engine)
* **What it is:** Generates a hierarchical navigation tree from the files, directories, and front matter of the project.
* **Why NetScript needs it:** Managing site directories manually inside Vento templates is highly fragile. By loading the `nav` plugin, the `_includes/layouts/base.vto` sidebar can render a dynamic, nested sidebar automatically. Directories like `reference/workers` and `tutorials/` are automatically organized into structured sections, respecting a custom config hierarchy or alphabetical sorting rules.

### B. `lume/plugins/toc.ts` (Table of Contents Generator)
* **What it is:** Parses the compiled HTML of a page and extracts `h2`, `h3`, and `h4` headings into a structured array, adding custom slug IDs automatically.
* **Why NetScript needs it:** Every comprehensive reference page in a Diátaxis setup needs an on-page "On This Page" right-hand sidebar. This encourages active reading, allowing developers to jump directly to specific subpaths. The `toc` plugin outputs a clean `toc` data array directly into our Vento templates without any manual Markdown work.

### C. `lume/plugins/shiki.ts` (VS Code-Grade Class Highlighting)
* **What it is:** Replaces standard Prism/Code-Highlight with Shiki, which utilizes VS Code’s TextMate grammar engine and themes (like Material-Theme, OneDark, or Github-Dark).
* **Why NetScript needs it:** Traditional Prism highlights token patterns naively. Shiki reads actual compiler tokens, providing identical type highlights to those in Visual Studio Code or Zed. This is a gamechanger for a TypeScript-first library like `@netscript/sdk`.

### D. `lume/plugins/search.ts` (Global Pages Database)
* **What it is:** Exposes a powerful `search` helper within Vento templates to query pages, sibling folders, directories, or front matter.
* **Why NetScript needs it:** We can easily write lightweight Vento scripts to auto-generate lists (e.g. `search.pages("type=tutorial")` to render index cards, or `search.pages("tags*=saga")` to instantly index and cross-link all Saga-related how-tos and reference endpoints).

### E. `lume/plugins/sitemap.ts` (Search Engine SEO Optimization)
* **What it is:** Automated, standard XML sitemap compiler.
* **Why NetScript needs it:** Builds domain awareness for search crawlers (e.g., Google, Bing) once published on GitHub Pages, indexing new features instantly.

---

## 2. Advanced Vento Features to Implement "Components that Spark"

Vento ([vento.js.org](https://vento.js.org)) is Lume's flagship template engine. It provides powerful features that allow us to create highly polished, interactive documentation components:

### A. Dynamic Imports and Vento templates
* **The Feature:** `{{ include "templates/tabs.vto" { id: "p1", options: [...] } }}`
* **How NetScript can apply it:**
  * **Code Tabbables:** Create a reusable template under `_includes/templates/code-tabs.vto` that accepts an array of language files or configurations (e.g., swapping code snippets between "Deno KV" and "Postgres").
  * **Command Installers:** Include templates that render terminal code copy boxes with dynamic tabs for system shell platforms (`Bash`, `Powershell`, `CMD`).

### B. Inline Functions and Blocks
* **The Feature:** Vento allows declaring local inline functions using `{{ function my_fun }} ... {{ /function }}` or yielding named slots from custom layout contexts.
* **How NetScript can apply it:**
  * **Interactive Notice Boxes:** Build a custom `callout` macro that accepts a category parameters (such as `Warning`, `Tip`, `Locked-Decision`) and renders standard, styled warning blocks with a consistent theme.

### C. Custom Vento Filters in `_config.ts`
* **The Feature:** `site.filter("my_filter", (arg) => ...)`
* **How NetScript can apply it:**
  * Create an automated JSR reference resolver wrapper (e.g., `{{ "sdk" | jsr }}` resolves natively to `https://jsr.io/@netscript/sdk`), ensuring external references are generated consistently and never break.

---

## 3. Structural Integration Plan: Plugin to Pattern Matrix

Here is how the unused plugins explicitly unlock the signature documentation patterns NetScript needs, leveraging Lume's own documentation (lume.land) as the canonical example:

| High-Leverage Lume/Vento Feature | Targeted Pattern | Concrete Implementation in Rebuild |
| :--- | :--- | :--- |
| **`lume/plugins/nav.ts`** | Capability-Hub Sidebar | Dynamically group sidebars by Diátaxis folders (`tutorials`, `how-to`, `reference`, `explanation`) with nested directories for child plugins. |
| **`lume/plugins/toc.ts`** | Progressive Reading | Compile a sticky right-hand table-of-contents list for long API catalogs to keep readers oriented. |
| **`lume/plugins/shiki.ts`** | Professional Code-Sample | Render rich, colored IDE formatting matching the VS Code theme. |
| **`lume/plugins/search.ts`** | Segmented Index Cards | Auto-render beautiful visual galleries of available tutorial maps and how-tos directly on `/tutorials/` and `/how-to/` index landing pages. |
| **Vento Component Imports** | Interactive Switchers | Implement custom tab buttons for client implementations (`Vanilla TS`, `React Hook`, `Fresh Island`). |
| **Vento Layout Slots** | Immersive Documentation Chrome | Split page structures into sidebar nav, central reading prose, right-hand table of contents, and a floating global search console. |
