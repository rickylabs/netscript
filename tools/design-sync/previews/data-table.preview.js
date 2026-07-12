// authored stories for "data-table"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  // The DataTable Row lays out via a `grid` utility that is not in the canvas
  // closure, so we pass an inline grid style alongside `cols` — inline styles
  // always apply and give the rows real columns on the card.
  var COLS = '1.3fr 0.9fr 0.9fr 0.7fr';
  var rowStyle = { display: 'grid', gap: '1rem', alignItems: 'center' };
  var variantFor = {
    completed: 'success',
    running: 'primary',
    failed: 'destructive',
    retrying: 'warning',
    queued: 'muted',
  };
  var rows = [
    { id: '4f2a', flow: 'order.fulfillment', service: 'sagas', state: 'completed', ms: '142ms' },
    { id: '4f2b', flow: 'invoice.email', service: 'workers', state: 'running', ms: '60ms' },
    { id: '4f2c', flow: 'nightly.reindex', service: 'triggers', state: 'failed', ms: '8.1s' },
    { id: '4f2d', flow: 'stock.sync', service: 'streams', state: 'retrying', ms: '940ms' },
    { id: '4f2e', flow: 'welcome.email', service: 'workers', state: 'queued', ms: '—' },
  ];
  window.__dsPreview = {
    Runs: function () {
      return h(NS.DataTable, null, [
        h(
          NS.DataTable.Header,
          { key: 'head' },
          h(NS.Card.Title, null, 'Recent runs'),
        ),
        h(
          NS.DataTable.Row,
          { key: 'labels', cols: COLS, style: rowStyle, class: 'ns-text-2xs ns-muted-fg' },
          [
            h('span', { key: 'f' }, 'FLOW'),
            h('span', { key: 's' }, 'SERVICE'),
            h('span', { key: 't' }, 'STATE'),
            h('span', { key: 'd' }, 'DURATION'),
          ],
        ),
        h(
          NS.DataTable.Body,
          { key: 'body' },
          rows.map(function (row) {
            return h(NS.DataTable.Row, { key: row.id, cols: COLS, style: rowStyle }, [
              h('span', { key: 'f', class: 'ns-text-sm' }, [
                h('code', { key: 'c', class: 'ns-font-mono ns-muted-fg' }, row.id + ' '),
                row.flow,
              ]),
              h('span', { key: 's', class: 'ns-text-sm' }, row.service),
              h('span', { key: 't' }, h(NS.Badge, { variant: variantFor[row.state] }, row.state)),
              h('span', { key: 'd', class: 'ns-text-sm ns-muted-fg' }, row.ms),
            ]);
          }),
        ),
        h(
          NS.DataTable.Footer,
          { key: 'foot' },
          h('span', { class: 'ns-text-sm ns-muted-fg' }, '5 runs · 1 failed · 1 retrying'),
        ),
      ]);
    },
  };
})();
