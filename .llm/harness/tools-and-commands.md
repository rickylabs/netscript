# Harness Tools & Commands

This page is a habit and pointer index, not a command reference. It tells a harness agent which
tool to reach for at each step of a run and links to the one authoritative home for each. It does
not restate the command tables — those live in the domain skills.

## `deno doc` first — learn a surface before reading source

When a run needs to understand an internal `@netscript/*` package API, reach for `deno doc` **before**
opening source files. It is the cheapest way to see a package's public surface, and it keeps research
honest about what is actually exported.

- `deno doc <module>` — read a package's full public API without opening source.
- `deno doc --filter <symbol> <module>` — jump straight to one symbol's signature and docs.
- `deno why <pkg>` — answer "what pulls this in" before touching a dependency.

This is the same discipline the run loop encodes: prefer `deno doc` over broad implementation reads
during Research and Implement (see `workflow/run-loop.md` § 2 Research and § 5 Implement, and the
retrieval order in `workflow/retrieval-order.md` § Code).

The authoritative command map (every inspection/dependency command, the `deps:*` wrappers, and the
TypeScript 2.8 surface notes) lives in the **`netscript-deno-toolchain`** skill
(`.agents/skills/netscript-deno-toolchain/SKILL.md` § Inspection commands). Do not duplicate that
table here — link to it.

## `deno doc --lint` is the publish bar

`deno doc --lint` enforces a documented public surface and is part of the publishability check, not
the everyday "read a surface" workflow. For package/plugin waves it is a required input to the
Plan-Gate. The full JSR readiness rubric — including `deno doc --lint` as the publish-quality bar and
the slow-types / documentation factors that drive the JSR score — lives in the **`jsr-audit`** skill
(`.agents/skills/jsr-audit/SKILL.md`). Reach for that skill, do not restate it here.

## Where each command lives

| Need | Canonical home |
| ---- | -------------- |
| Inspect a package surface (`deno doc`, `--filter`, `deno why`) | `.agents/skills/netscript-deno-toolchain/SKILL.md` § Inspection commands |
| Dependency "latest / outdated / why / audit / prod-install" | `.agents/skills/netscript-deno-toolchain/SKILL.md` (+ `.llm/tools/deps/` wrappers) |
| JSR publishability + `deno doc --lint` as the publish bar | `.agents/skills/jsr-audit/SKILL.md` |
| Scoped check / lint / fmt validation wrappers | `.agents/skills/netscript-tools` + `.llm/tools/run-deno-*.ts` |
| Gate sets and gate selection | `gates/archetype-gate-matrix.md` |
