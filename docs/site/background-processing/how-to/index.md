---
layout: layouts/base.vto
title: Background processing recipes
nav_title: Recipes
description: Task-oriented recipes for background work, one problem each.
templateEngine: [vento, md]
order: 100
---

# Background processing recipes

Each recipe here solves one background-job or task-runtime task. It assumes the guides above it in
the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
