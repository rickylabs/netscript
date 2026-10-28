# Pagefind API and empty-result controls

Use the real generated API at pagefind/pagefind.js relative to the browser module's public base. Await filters() once to load lane counts; search.totalFilters gives query counts across lanes and search.filters reflects the selected filter. Only load the current page of result.data() fragments. Use meta.title and sub_results for titles/headings.

Pagefind expands unmatched prefixes: an unquoted nonsense word can still match a short indexed prefix (observed z and q in code). The empty-state integration control must use a quoted impossible phrase, e.g. "qxvplmnoexistzz", which the real index returns as zero. Do not add UI-side ranking/search logic to hide native engine behavior.

A native type=search field may consume Escape to clear itself; explicitly close the dialog on Escape to preserve the palette contract. Ignore queued close events if the dialog has already reopened, and close before same-page heading navigation.
