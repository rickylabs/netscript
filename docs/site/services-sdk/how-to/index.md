---
layout: layouts/base.vto
title: Services & SDK recipes
nav_title: Recipes
description: Task-oriented recipes for services and the SDK, one problem each.
templateEngine: [vento, md]
order: 100
---

# Services & SDK recipes

Each recipe here solves one task with services and the typed SDK. It assumes the guides above it in
the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
