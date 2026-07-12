// authored stories for "responsive-table"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  var rows = [
    { id: '4f2a', flow: 'order.fulfillment', service: 'sagas', state: 'completed', ms: 142 },
    { id: '4f2b', flow: 'invoice.email', service: 'workers', state: 'running', ms: 60 },
    { id: '4f2c', flow: 'nightly.reindex', service: 'triggers', state: 'failed', ms: 8100 },
    { id: '4f2d', flow: 'stock.sync', service: 'streams', state: 'retrying', ms: 940 },
  ];
  var variantFor = {
    completed: 'success',
    running: 'primary',
    failed: 'destructive',
    retrying: 'warning',
  };
  var columns = [
    {
      key: 'id',
      label: 'Run',
      cell: function (row) {
        return h('code', { class: 'ns-font-mono' }, row.id);
      },
    },
    {
      key: 'flow',
      label: 'Flow',
      cell: function (row) {
        return row.flow;
      },
    },
    {
      key: 'service',
      label: 'Service',
      cell: function (row) {
        return row.service;
      },
    },
    {
      key: 'state',
      label: 'State',
      cell: function (row) {
        return h(NS.Badge, { variant: variantFor[row.state] }, row.state);
      },
    },
    {
      key: 'ms',
      label: 'Duration',
      align: 'end',
      cell: function (row) {
        return row.ms + 'ms';
      },
    },
  ];
  window.__dsPreview = {
    Runs: function () {
      return h(NS.ResponsiveTable, {
        caption: 'Recent runs',
        summary: '4 runs · 1 failed',
        columns: columns,
        rows: rows,
        getRowKey: function (row) {
          return row.id;
        },
      });
    },
  };
})();
