// authored stories for "detail-layout"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    // Root two-column grid is a `xl:grid-cols-*` utility absent from the canvas
    // closure; an inline grid keeps the main/aside split when the card is wide.
    RunDetail: function () {
      return h(
        NS.DetailLayout,
        {
          style: { display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1.4fr) 280px' },
        },
        [
          h(NS.DetailLayout.Main, { key: 'main' }, [
            h(NS.Card, { key: 'c' }, [
              h(
                NS.Card.Header,
                { key: 'h' },
                h(NS.Card.Title, null, 'order.fulfillment · run 4f2a'),
              ),
              h(
                NS.Card.Body,
                { key: 'b' },
                h(
                  'p',
                  { class: 'ns-text-sm ns-muted-fg' },
                  'Completed 6 of 6 steps in 142ms. Dispatched by triggers, processed on sagas.',
                ),
              ),
            ]),
            h(
              NS.Panel,
              { key: 'p', tone: 'muted' },
              h(
                NS.Panel.Body,
                null,
                h(
                  'p',
                  { class: 'ns-text-sm ns-muted-fg' },
                  'trace tr_9c1d40 · 0 retries · no dead-letters',
                ),
              ),
            ),
          ]),
          h(NS.DetailLayout.Aside, { key: 'aside' }, [
            h(NS.Panel, { key: 'meta' }, [
              h(NS.Panel.Header, { key: 'h' }, h(NS.Panel.Title, null, 'Metadata')),
              h(
                NS.Panel.Body,
                { key: 'b', class: 'ns-stack ns-stack--xs' },
                [
                  h(NS.Badge, { key: 's', variant: 'success' }, 'completed'),
                  h('p', { key: 'q', class: 'ns-text-sm ns-muted-fg' }, 'queue: sagas'),
                  h('p', { key: 'd', class: 'ns-text-sm ns-muted-fg' }, 'duration: 142ms'),
                ],
              ),
            ]),
          ]),
        ],
      );
    },
  };
})();
