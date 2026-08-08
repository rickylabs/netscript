# Competitive Benchmark Verification (fetched 2026-08-04)

Verifies claims in `competitive-benchmark.md` §1 (per-competitor tutorial analysis) against live-fetched
pages. Benchmark file was NOT edited; this is an independent check.

---

## 1.1 Next.js

**URLs**
- `https://nextjs.org/learn/dashboard-app` — CONFIRMED live, resolves.
- `https://nextjs.org/docs/getting-started/installation` — CONFIRMED resolves, but the page's own
  canonical URL is `https://nextjs.org/docs/app/getting-started/installation` (old path likely
  redirects/aliases). Cite the canonical form if precision matters.

**Structure & steps** — PARTIALLY CONFIRMED. The live "Learn Next.js: Dashboard App" course does have
16 content chapters in the same order the benchmark lists (Getting Started → CSS Styling → Fonts/Images
→ Layouts/Pages → Navigating → Database → Fetching Data → Static/Dynamic → Streaming →
Search/Pagination → Mutating Data → Handling Errors → Accessibility → Authentication → Metadata →
Next Steps). However, the site's own numbering is **off by one** from the benchmark's: the site
prepends an unnumbered "Introduction" node, so on-site "Getting Started" = benchmark's #1 is really
listed as the 2nd item, "Fetching Data" is the 8th listed item (not "Chapter 7" as the benchmark's
prose says), "Mutating Data" is the 12th (not "Chapter 11"), etc. Content/order claims are right;
specific chapter numbers cited in the benchmark's "How Early Differentiators" line ("Chapter 4", "Chapter 7",
"Chapter 11") are each one lower than the site's actual listing position.

**First-win moment** — UNVERIFIABLE from fetch (course landing page doesn't expose chapter-1 body
content), but directionally plausible and not contradicted.

**Cross-linking to API refs** — UNVERIFIABLE directly from the course pages fetched; the installation
doc itself does heavily cross-link to API reference pages (`create-next-app`, `next/font` via style
guides, etc.), consistent with the claim.

## 1.2 Nuxt

**URLs** — both CONFIRMED live (`nuxt.com/docs/getting-started/introduction`,
`nuxt.com/docs/4.x/getting-started/installation`).

**Structure & steps** — WRONG (ordering and completeness). Actual sidebar order under "Getting
Started" is: Installation, Configuration, **Views, Assets, Styling**, **Routing**, SEO and Meta,
Transitions, **Data Fetching**, **State Management**, Error Handling, Server, Layers, Prerendering,
Deployment, Testing, Upgrade Guide — 17 sections, not the benchmark's condensed 7. Specifically:
- Benchmark's step 3 "Views" is correct as a section but Assets and Styling sit between Views and
  Routing, not covered.
- Benchmark's step 4 "Routing" is correct in substance (`<NuxtLink>`, `[id].vue`) but is NOT adjacent
  to Data Fetching/State Management — SEO/Meta and Transitions intervene.
- Benchmark's step 5 "Data Fetching" and step 6 "State Management" are real sections but appear much
  later (9th and 10th), not immediately after Routing.
- Benchmark's step 7 "Assets & Deployment" conflates two separate, non-adjacent sections (Assets is
  near the top; Deployment is near the bottom, after Testing/Layers/Prerendering).

Individual technical claims (auto-imports, `useFetch`/`useAsyncData`/`$fetch`, `useState()`,
`nuxt.config.ts` rendering modes) are technically accurate content, just mis-sequenced.

**First-win moment** — CONFIRMED. Installation page: `npx nuxi@latest init` + dev server opens
`localhost:3000` with a welcome page, StackBlitz online option also offered.

## 1.3 SvelteKit

**URLs** — all CONFIRMED live: `svelte.dev/docs/kit/introduction`, `/routing`, `/load`,
`/form-actions`; `learn.svelte.dev` resolves via a 308 redirect to `svelte.dev/tutorial` (still
functionally correct, but the canonical URL to cite going forward is `https://svelte.dev/tutorial`).

**Structure & steps** — CONFIRMED in substance. `/routing` verifies `+page.svelte`/`+layout.svelte`/
`+server.js` file conventions and `[slug]` params as described. `/load` verifies universal vs.
server-only `load()` functions (`+page.js` vs `+page.server.js`) exactly as claimed. `/form-actions`
verifies `export const actions`, `use:enhance` progressive enhancement, and the actions-vs-`+server.js`
distinction, matching the benchmark's claim closely. Note: the benchmark's 5-step list is a
reasonable topic summary but is not the docs' literal page order (introduction is followed by
"Creating a project" first, per the live sidebar) — a minor simplification, not a factual error.

**First-win moment** — CONFIRMED. `learn.svelte.dev`/`svelte.dev/tutorial` is a real interactive
in-browser editor+preview, organized into Basic Svelte / Advanced Svelte / Basic SvelteKit / Advanced
SvelteKit tracks (more granular than the benchmark states, but the "instant in-browser preview" claim
is accurate).

**Cross-linking (`$types`)** — CONFIRMED. `/load` page explicitly emphasizes generated `$types`
modules for type safety.

## 1.4 Laravel Bootcamp / Rails Guides

### Laravel — WRONG (URL dead, content materially changed)
- `https://bootcamp.laravel.com` — 302-redirects to `https://laravel.com/learn` (not a standalone
  Bootcamp site anymore). Corrected URL: `https://laravel.com/learn/getting-started-with-laravel`.
- `https://laravel.com/docs/getting-started` — **404, dead link**. Correct current URL:
  `https://laravel.com/docs/installation` (or versioned `https://laravel.com/docs/13.x/installation`).
  There is no "getting-started" landing page in current Laravel docs; the TOC goes straight to
  Installation.
- **Content claim is WRONG.** The "Bootcamp" is now a 13-lesson **video course** ("Getting Started
  with Laravel", ~2 hr, released Aug 25 2025) still building the Chirper microblog app, but the
  chapter list does **not** match the benchmark's 6-step breakdown. Actual lessons: What are we
  building? → Setting up your Laravel project → Your first route → Deploying your app → What is MVC? →
  Working with the database → Our first model → Showing the feed → Creating and storing Chirps →
  Edit and delete Chirps → Basic authentication: Registration → Basic authentication: Login/Logout →
  What's Next?. There is **no "Notifications & Email" chapter** and **no "Authorization" /
  `ChirpPolicy` chapter** in the current course — the benchmark's items 5 ("Notifications & Email")
  and 6 ("Authorization") do not exist in the live course; it ends at basic login/logout auth plus a
  "what's next" wrap-up. The "Deploying your app" step (Laravel Cloud) now happens early (step 4),
  not at the end, which also contradicts the benchmark's implicit late-deployment framing.

### Rails — WRONG (domain/app changed)
- `https://guides.rubyonrails.org/getting_started.html` — CONFIRMED URL resolves.
- **Content claim is WRONG.** The guide no longer builds a "Blog" app with `Article`/`ArticlesController`
  and nested `Comments`. The current guide builds a **Product store**: models/controllers are
  `Product`/`ProductsController`, plus `Subscriber`/`SubscribersController` and a `ProductMailer` for
  stock notifications (not `_form.html.erb` blog partials or comment nesting as described).
- Authentication is generated via Rails' built-in **authentication generator** (creates a `User`
  model, BCrypt password hashing) — not `has_secure_password` used directly as the benchmark states
  (BCrypt/has_secure_password is the mechanism under the hood, but the guide frames it as the
  generator, not manual `has_secure_password` wiring).
- Deployment via **Kamal** — CONFIRMED, matches the benchmark.
- The guide is also considerably longer than the benchmark's 6-step summary (23 numbered
  sections including Action Text, Active Storage, I18n, testing, RuboCop, CI, and deployment).

**First-win moment** — CONFIRMED directionally for both (`laravel new`/`rails new` + local server
gives an immediate running app), though Laravel's actual first lesson now pushes users toward
`laravel.com/learn`'s guided video rather than a bare `artisan serve` welcome screen ordering the
benchmark implies.

---

## Bottom line

- **Next.js**: structure/order claims essentially sound; only the specific chapter numbers are
  off-by-one and the installation URL should point at the canonical `/docs/app/getting-started/installation`.
- **Nuxt**: technical claims (composables, auto-imports, rendering modes) are accurate, but the
  7-step "Getting Started track" is a materially wrong simplification of the real 17-section, differently
  ordered sidebar — Data Fetching and State Management are not early/adjacent steps.
- **SvelteKit**: CONFIRMED — URLs live, technical claims about routing/load/form-actions/`$types`
  accurate, `learn.svelte.dev` still works (redirects to `svelte.dev/tutorial`).
- **Laravel/Rails**: WRONG on both — `bootcamp.laravel.com` no longer stands alone (redirects to
  `laravel.com/learn`), `laravel.com/docs/getting-started` 404s, the Laravel course's actual 13-lesson
  structure omits the benchmark's claimed Notifications/Authorization chapters, and the Rails guide
  now teaches a Product/store app (not a blog with Article/Comment models).

**Gap-analysis soundness**: §2 and §3's gap analyses (NetScript vs. peers on data loading, forms,
type safety, auth, and the unique-differentiator table) rest on the *general shape* of each
competitor's approach (server-side data loading conventions, form actions, contract/type generation,
policy-based authz, background job/orchestration gaps) — those general characterizations hold up and
do **not** need rework. What needs rework before this benchmark is cited as evidence: (1) the Laravel
Bootcamp URL and its step-5/step-6 chapter claims in §1.4 and any place §2.4 leans on "Notifications
& Email"/"Authorization" as bootcamp chapter titles, (2) the dead `laravel.com/docs/getting-started`
URL, (3) the Rails app domain/model names if cited verbatim elsewhere, and (4) Nuxt's §1.2 step
list/ordering if used to justify placement of a NetScript recommendation ("data fetching appears in
step 5" is not true of Nuxt's real doc order). Next.js and SvelteKit sections can be cited as-is
modulo the Next.js chapter-number off-by-one.
