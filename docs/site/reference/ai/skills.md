---
layout: layouts/base.vto
title: "@netscript/ai/skills"
templateEngine: [vento, md]
---

# `@netscript/ai/skills`

Load validated Agent Skills with progressive disclosure and optional semantic matching. A skill is a
`SKILL.md` document, a small front matter block plus Markdown instructions, that an agent discovers
cheaply by tags or embeddings and reads in full only when it is selected. Use this sub-path of
[`@netscript/ai`](/reference/ai/) to load skills at runtime.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/ai/skills` | `./src/skills/mod.ts` | [Composition](#composition), [matching primitives](#matching-primitives) and [types](#types) for loading `SKILL.md` documents. |

The sub-path is a library surface only: it has no CLI verbs and takes no `@netscript/*` runtime
dependency. Nothing here reads the environment or performs IO on its own. Content enters through an
injected `SkillContentSource`, and semantic ranking runs only when you supply a
`SkillEmbeddingProvider`. It is published as the `./skills` export of `@netscript/ai` (version
`{{ releaseVersion }}`):

```ts
import {
  createInMemorySkillContentSource,
  createSkillLoader,
} from "jsr:@netscript/ai{{ releaseSpecifier }}/skills";
```

## The skill document

`parseSkillMarkdown` is the single validator for the `SKILL.md` shape. The front matter must be a
closed `---` block whose only allowed keys are the four required fields; the body is the Markdown
that follows and must be non-empty.

| Frontmatter field | Rule |
| --- | --- |
| `id` | Non-empty; matches `^[a-z0-9][a-z0-9._-]*$` (case-insensitive). |
| `name` | Non-empty human-readable label. |
| `tags` | A YAML list with at least one tag; drives tag matching. |
| `description` | Non-empty short summary used for discovery and semantic matching. |

Unknown keys, duplicate keys, a missing required key, an empty body, or a malformed frontmatter
line each throw a `TypeError`. A minimal document:

```md
---
id: review
name: Code review
tags: [review, quality]
description: Reviews a change for correctness.
---
Inspect the diff and report actionable findings.
```

## Progressive disclosure

Metadata enumeration stays separate from full-content reads. A `SkillContentSource` lists validated
`SkillSummary` rows (id, name, tags, description, no body) and loads the raw `SKILL.md` for one id
on demand. A `SkillLoaderPort` composes over a source: it matches summaries first, and only
`load(id)` parses and validates the full `SkillDocument` (summary plus `body`). The runtime's
`skills` capability port uses the same two-phase shape.

## Surface

### Composition

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createSkillLoader` | function | `createSkillLoader(source: SkillContentSource, options?: SkillLoaderOptions): SkillLoaderPort` | Compose a loader from an injected content source and optional embeddings. |
| `createInMemorySkillContentSource` | function | `createInMemorySkillContentSource(entries: readonly SkillSourceEntry[]): SkillContentSource` | Build an effect-free source from caller-supplied `SKILL.md` strings (rejects duplicate or mismatched ids). |
| `parseSkillMarkdown` | function | `parseSkillMarkdown(markdown: string): SkillDocument` | Parse and validate one `SKILL.md` into a full document, or throw `TypeError`. |

### Matching primitives

The loader delegates to two pure ranking functions, also exported for callers that hold their own
summaries. Both return results sorted by descending score.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `matchByTags` | function | `matchByTags(skills: readonly SkillSummary[], triggers: readonly string[]): readonly SkillMatch[]` | Case-insensitive exact (`score 1`) and substring (`score 0.5`) tag triggers. |
| `matchBySemantic` | function | `matchBySemantic(skills: readonly SkillSummary[], query: string, embeddings: SkillEmbeddingProvider, model?: string): Promise<readonly SkillMatch[]>` | Cosine-similarity ranking over `name`/`description`/`tags` text via an injected embedding provider. |
| `SKILL_MATCH_MODES` | variable | `readonly ["tag", "semantic"]` | The trigger modes a `SkillMatch` can report. |

### Types

| Symbol | Kind | Description |
| --- | --- | --- |
| `SkillLoaderPort` | interface | Discovery + two-phase loading: `list()`, `load(id)`, `matchByTag(tags)`, `matchByQuery(query, options?)`. |
| `SkillContentSource` | interface | Source boundary: `list()` of summaries and `load(id)` of raw content. |
| `SkillSummary` | interface | Cheap metadata (`id`, `name`, `tags`, `description`) with no body. |
| `SkillDocument` | interface | `SkillSummary` extended with the non-empty `body`. |
| `SkillMatch` | interface | A ranked result: `skill` (summary), `score` (0–1), and contributing `modes`. |
| `SkillMatchMode` | type alias | `"tag" \| "semantic"`. |
| `SkillQueryOptions` | interface | `matchByQuery` options: `tags`, `semantic`, `minScore`, `limit`. |
| `SkillLoaderOptions` | interface | Loader composition options: `embeddings`, `embeddingModel`. |
| `SkillEmbeddingProvider` | interface | Minimal `embed(input, options?)` structural view used for semantic matching. |
| `SkillSourceEntry` | interface | Input to the in-memory source: `{ id, markdown }`. |

## Default runtime port

The runtime's `skills` capability is a `SkillLoaderPort`. When `AiRuntimeConfig.skills` is omitted,
`createAiRuntime` injects a no-op loader that lists and matches nothing, so agent code can call the
port before any skills are wired.

| `AiRuntimeConfig` field | Port | Default when omitted |
| --- | --- | --- |
| `skills` | `SkillLoaderPort` | No-op returning no skills (`createNoopSkillLoader` from `@netscript/ai/ports`). |

To provide a real loader, wire one built here into the runtime config; see
[runtime capability ports](/reference/ai/#runtime-capability-ports-and-their-defaults).

## Examples

### Build a loader and match by tag

```ts
import {
  createInMemorySkillContentSource,
  createSkillLoader,
} from "@netscript/ai/skills";

const source = createInMemorySkillContentSource([
  {
    id: "review",
    markdown: `---
id: review
name: Code review
tags: [review, quality]
description: Reviews a change for correctness.
---
Inspect the diff and report actionable findings.
`,
  },
]);

const loader = createSkillLoader(source);
const matches = await loader.matchByTag(["review"]);
if (matches.length > 0) {
  const skill = await loader.load(matches[0].skill.id); // full body disclosed here
  console.log(skill?.body);
}
```

### Add semantic ranking

Pass a `SkillEmbeddingProvider` at composition time and set `semantic: true` on the query. The
`@netscript/ai/openai-embeddings` provider satisfies the structural `embed` shape.

```ts
import "@netscript/ai/openai-embeddings"; // self-registers the provider
import { getEmbeddingProvider } from "@netscript/ai";
import { createSkillLoader } from "@netscript/ai/skills";

const embeddings = getEmbeddingProvider("openai-embeddings", {
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const loader = createSkillLoader(source, { embeddings });
const ranked = await loader.matchByQuery("find bugs in my patch", {
  semantic: true,
  limit: 5,
});
```

### Rank summaries you already hold

`matchByTags` and `matchBySemantic` are pure and work without a loader:

```ts
import { matchByTags } from "@netscript/ai/skills";

const summaries = await source.list();
const results = matchByTags(summaries, ["quality"]);
// results: [{ skill, score, modes: ["tag"] }, ...] sorted by descending score
```

## Installed NetScript skills

This library is distinct from the skill bundle that `netscript agent init` installs for a coding
agent. The bundle is five ready-made skills, installed as an atomic set in `.agents/skills/` with a
symptom playbook at `.agents/skills/help.md`. Hosts, generated files and re-running are covered in
[Agent tooling](/ai/agent-tooling/).

| Skill | Role |
| --- | --- |
| `netscript` | Router. Dispatches a task to the build or operate skill (or to the Aspire skill for orchestration); it is not useful on its own. |
| `netscript-build` | Scaffold and build with real `netscript` CLI verbs: `init`, the contract-first flow, the database lifecycle, adding and syncing plugins, adding services and UI, and generating registries. |
| `netscript-operate` | Monitor, debug, and analyze a running app through the bounded MCP tools: health, recent runs, one execution end to end, recent errors, job results, service and database performance, and doc search. |
| `aspire` | Diagnose orchestration and runtime state from symptoms with resource descriptions, console logs, structured logs, spans, traces, and targeted resource control. |
| `deno` | Diagnose runtime and toolchain problems with focused checks, module-resolution inspection, permissions, test sanitizers, cache evidence, and API docs. |

The upstream Aspire workflow skills (`aspire-init`, `aspire-orchestration`, `aspire-monitoring`,
`aspire-deployment`) can be installed beside NetScript's `aspire` diagnostic skill by explicit name;
they never overwrite `aspire/SKILL.md`.

Agents connect to the Aspire MCP server with `aspire agent mcp`, or with the dashboard-only form
`aspire agent mcp --dashboard-url <url>` (plus an optional `--api-key`). Aspire 13.5.3 exposes a
**14-tool MCP baseline**: `list_resources`, `list_console_logs`, `list_structured_logs`,
`list_traces`, `list_trace_structured_logs`, `execute_resource_command`, `list_apphosts`,
`select_apphost`, `list_integrations`, `list_docs`, `search_docs`, `get_doc`, `doctor`, and
`refresh_tools`. (`get_integration_docs` is documented upstream on aspire.dev but was not observed
at 13.5.3.)
