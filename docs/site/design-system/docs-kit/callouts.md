---
layout: layouts/base.vto
templateEngine: [vento, md]
title: Callout gallery
description: Semantic documentation notices in the NetScript design system.
url: /design-system/docs-kit/callouts/
order: 1
---

# Callout gallery

Content uses semantic tones. Navigation, links and focus stay in ink.

{{ comp callout { type: "NOTE", title: "Information" } }}
Keep the contract beside the implementation. <a href="/quickstart/">Read the quickstart</a>.
{{ /comp }}

{{ comp callout { type: "TIP", title: "A useful next step" } }}
Copy the generated source into your app and make it yours.
{{ /comp }}

{{ comp callout { type: "IMPORTANT", title: "A requirement to remember" } }}
Review the public contract before changing its behavior.
{{ /comp }}

{{ comp callout { type: "WARNING", title: "Check before proceeding" } }}
This command changes generated files. Review the diff before committing.
{{ /comp }}

{{ comp callout { type: "CAUTION", title: "Destructive action" } }}
Deleting data cannot be undone. <a href="/data-persistence/">Read the database guide</a>.
{{ /comp }}

{{ comp callout { type: "error", title: "Existing error alias" } }}
The operation failed. Correct the input and try again.
{{ /comp }}

{{ comp callout { type: "unknown", title: "Unknown types fall back to NOTE" } }}
The default notice remains informational.
{{ /comp }}
