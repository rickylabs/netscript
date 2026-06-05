# Developing NetScript Skills

Authoring rules, cluster conventions, and the worked example for
concepts-over-procedures. Read this before adding or rewriting a `SKILL.md`.

---

## Skill shape

Every `SKILL.md` in this cluster follows the same sections, in order:

### 1. Preamble (YAML frontmatter)

```yaml
---
name: <skill-name>
description: >
  One-line description that an agent runtime matches against the user's prompt.
---
```

- `name` — kebab-case, matches the folder name.
- `description` — the matching string for agent runtimes. Be specific; vague
  descriptions cause routing errors.

### 2. Canonical mental-model headline

One sentence that captures the skill's core idea. This is the first paragraph
after the frontmatter. It should be memorable enough that an agent can recall it
when the skill is not loaded.

Example:

> This skill is a navigator. The doctrine remains authoritative; read the
> relevant doctrine file before changing or evaluating package/plugin code.

### 3. When to Use

Bullet list of specific triggers. Be concrete:

- Good: "Creating a new Fresh web application"
- Bad: "Working with code"

### 4. When Not to Use

Boundaries prevent routing errors. State what this skill does not cover and
which skill (if any) does.

Example:

> For app, service, frontend, or infrastructure work, use this skill only when
> the work changes or evaluates package/plugin surfaces.

### 5. Key Concepts

The vocabulary an agent needs to reason about this domain. Use tables for
quick reference.

### 6. Workflow

The typical sequence of actions when this skill is active. Numbered list, not
prose narrative.

### 7. Common Pitfalls

Mistakes LLMs commonly make in this domain. Each pitfall names the mistake,
why it happens, and how to avoid it.

### 8. What NetScript doesn't do yet

**Status: draft — pending user approval before becoming mandatory.**

This section names features the framework does not implement, along with:

- the workaround available today,
- the skill or doc to route the request to,
- a note that the feature is tracked (or not yet tracked).

This prevents agents from confabulating plausible-looking API calls against
something that does not exist.

Example shape:

```markdown
## What NetScript doesn't do yet

- **Feature X** — Not implemented. Workaround: use Y. Route to
  `prisma-next-feedback` for tracking.
```

### 9. Reference Files

Canonical files this skill points to. Use a table with "Load when" column.

### 10. Checklist

Quick verification steps before handing off. 3–5 items.

---

## Router convention

One skill in the cluster acts as the router. Currently `netscript-harness`
catches `use harness` prompts, and `netscript-doctrine` catches package/plugin
work. If you add a skill that overlaps with an existing one, update the router
skill's description or add an explicit routing table.

---

## Versioning in lockstep

Skills ship with the repo, not as a separate package. The skill surface must
match the code surface. When the codebase changes:

1. Update the affected skill's content.
2. Update the skills cluster `README.md` scope table if the skill's scope
   changed.
3. Run `deno fmt` on the skill file.

Do not version skills independently of the repo.

---

## Review checklist for new skills

Before committing a new skill:

- [ ] Follows the 10-section shape above.
- [ ] Has a specific, non-vague `description` in YAML frontmatter.
- [ ] Includes "When Not to Use" boundaries.
- [ ] All referenced files exist in the repo.
- [ ] `deno fmt` clean.
- [ ] Added to `.agents/skills/README.md` scope table.
- [ ] Router skill updated if needed.
