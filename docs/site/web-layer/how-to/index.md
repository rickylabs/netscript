---
layout: layouts/base.vto
title: Recipes
templateEngine: [vento, md]
order: 100
---

# Web Layer — recipes

Each recipe solves one concrete web-layer task and assumes you know the guides above it in the
sidebar. The full cross-area catalog lives at
[All how-to recipes]({{ "howto:index" |> xref |> url }}).

- [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/): edit a route, add an island,
  restyle a component, install more UI primitives and re-theme the scaffolded app.
- [Build a server-validated form](/web-layer/how-to/build-a-server-validated-form/): use
  `definePage().withForm()` for route-bound form state, server validation, mutation, and redirect or
  same-page success handling.
- [Build a desktop frontend](/web-layer/how-to/build-a-desktop-frontend/): run one Fresh frontend
  as a browser/Aspire app that gains native window chrome, tray menus, dialogs, notifications and
  typed RPC when hosted by Deno Desktop.
