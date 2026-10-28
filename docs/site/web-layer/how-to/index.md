---
layout: layouts/base.vto
title: Web layer recipes
nav_title: Recipes
description: Task-oriented recipes for web pages, one problem each.
templateEngine: [vento, md]
order: 100
---

# Web layer recipes

Each recipe here solves one concrete web-layer task. It assumes the guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
