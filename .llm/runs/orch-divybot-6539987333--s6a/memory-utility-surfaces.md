# Utility surface evidence

Read the feedback/layout ledger deviations before the prose spec. Utility Card uses transparent card-bg and token per-side border widths (top only); Panel uses surface/card. Status callouts and toasts use tone/subtle + tone/border + tone/text. Dark primary progress and standalone spinners use marker, not graphite primary/default. Toast's old eyebrow is hidden for the one-title header.

The earlier broad preset card selector has six attribute/pseudo-class specificity points. A plain Utility root+scope+part selector has five and cannot replace its border width. Include the existing default variant qualifier and assert side/bottom widths in Chromium. A radius-only assertion misses the wrong full box.

Component galleries must include the actual scaffold Tailwind preflight. Otherwise paragraph default margins create false visual gaps. Pass its local path through UTILITY_PREFLIGHT to capture-utility.mjs. Toast timers/wrappers are frozen only in the multi-specimen gallery; separate pages check unmodified placement at mobile/desktop LTR/RTL.
