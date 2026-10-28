---
layout: layouts/base.vto
templateEngine: [vento, md]
title: Callout gallery
description: Semantic documentation notices in the NetScript design system.
url: /design-system/docs-kit/callouts/
order: 1
---

# Callout gallery

Content uses semantic tones. Each header has one label beside its icon, with the body aligned to the same text column. Navigation, links and focus stay in ink.

## Default labels

{{ comp callout { type: "NOTE" } }}
Keep the contract beside the implementation. <a href="/quickstart/">Read the quickstart</a>.
{{ /comp }}

{{ comp callout { type: "TIP" } }}
Copy the generated source into your app and make it yours.
{{ /comp }}

{{ comp callout { type: "IMPORTANT" } }}
Review the public contract before changing its behavior.
{{ /comp }}

{{ comp callout { type: "WARNING" } }}
This command changes generated files. Review the diff before committing.
{{ /comp }}

{{ comp callout { type: "CAUTION" } }}
Deleting data cannot be undone. <a href="/data-persistence/">Read the database guide</a>.
{{ /comp }}

{{ comp callout { type: "error" } }}
The operation failed. Correct the input and try again.
{{ /comp }}

{{ comp callout { type: "danger" } }}
Danger is a destructive alias and keeps the Caution marker in Markdown.
{{ /comp }}

## Custom titles

An author's title replaces the visible type label. The type remains available to assistive technology and in Markdown alert markers. These longer titles demonstrate first-line icon alignment when a label wraps.

{{ comp callout { type: "NOTE", title: "Keep the public contract beside the implementation so that readers can check the expected inputs, outputs and ownership rules before they change a service or copy its generated source into an application" } }}
The icon stays beside the first line. The body starts on the same left edge as the label.
{{ /comp }}

{{ comp callout { type: "TIP", title: "Start with the generated source and adapt one part at a time so that you can inspect the result, keep the working example nearby and verify each change before moving on to the next part of the application" } }}
The icon stays beside the first line. The body starts on the same left edge as the label.
{{ /comp }}

{{ comp callout { type: "IMPORTANT", title: "Review the exported contract and its compatibility guarantees before changing a shared type because other applications may depend on its current inputs, return values and documented failure behavior" } }}
The icon stays beside the first line. The body starts on the same left edge as the label.
{{ /comp }}

{{ comp callout { type: "WARNING", title: "Check the destination and review the generated diff before continuing because this command can replace files that your application already uses and those changes need a deliberate review before committing" } }}
The icon stays beside the first line. The body starts on the same left edge as the label.
{{ /comp }}

{{ comp callout { type: "CAUTION", title: "Confirm the data and recovery plan before deleting anything because this operation cannot be undone and every affected application needs a verified backup or another explicit way to recover its records" } }}
The icon stays beside the first line. The body starts on the same left edge as the label.
{{ /comp }}
