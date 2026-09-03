---
name: repo-skills
description: Locate and use NetScript repository skills from their authoritative .agents/skills tree.
---

# NetScript repository skills

All NetScript repository skills live in `.agents/skills/`.

When a task names a repository skill, read `.agents/skills/<name>/SKILL.md` completely before
acting, then resolve its relative references from that skill directory. Do not search for or create
copies under `.claude/skills/`; this bridge is the only Claude-local repository skill.
