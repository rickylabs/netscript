---
layout: layouts/base.vto
title: AI recipes
nav_title: Recipes
description: Task-oriented recipes for AI features, one problem each.
templateEngine: [vento, md]
order: 100
---

# AI recipes

Each recipe here solves one AI or agent task. It assumes the guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
