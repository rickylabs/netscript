---
layout: layouts/base.vto
title: Durable workflows recipes
nav_title: Recipes
description: Task-oriented recipes for durable workflows, one problem each.
templateEngine: [vento, md]
order: 100
---

# Durable workflows recipes

Each recipe here solves one concrete problem with sagas, triggers, queues or streams. It assumes the
guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
