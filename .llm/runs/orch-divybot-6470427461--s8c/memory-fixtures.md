# Docs fixture rendering

New Markdown pages must explicitly declare `layout: layouts/base.vto` and `templateEngine: [vento, md]`. The root _data.ts does not supply these. Without them Lume emits a bare HTML page and literal component calls; a build pass alone does not prove fixture rendering. Browser main/h1 assertions caught this during slice 1.

Chromium requires shared libraries absent in this minimal worker. An existing project-owned browser-libs directory can be read via LD_LIBRARY_PATH; no system or cache mutation is required. npm ci --ignore-scripts and playwright install chromium succeed with the pinned browser runner.
