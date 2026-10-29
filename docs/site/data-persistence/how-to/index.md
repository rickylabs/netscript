---
layout: layouts/base.vto
title: Data & persistence recipes
nav_title: Recipes
description: Task-oriented recipes for data and persistence, one problem each.
templateEngine: [vento, md]
order: 100
---

# Data & persistence recipes

Each recipe here solves one database or queue task. It assumes the guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
