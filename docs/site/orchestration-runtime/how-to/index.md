---
layout: layouts/base.vto
title: Orchestration & runtime recipes
nav_title: Recipes
description: Task-oriented recipes for running and deploying a workspace, one problem each.
templateEngine: [vento, md]
order: 100
---

# Orchestration & runtime recipes

Each recipe here solves one concrete problem with plugins, the Aspire AppHost, runtime
configuration, deployment or process lifecycle. It assumes the guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
