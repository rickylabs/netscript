---
layout: layouts/base.vto
title: Observability recipes
nav_title: Recipes
description: Task-oriented recipes for telemetry, one problem each.
templateEngine: [vento, md]
order: 100
---

# Observability recipes

Each recipe here solves one tracing or logging task. It assumes the guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
