// authored stories for "citation-chip"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.CitationChip, { index: 1, source: 'runs/order.fulfillment/4f2a' });
    },
    Inline: function () {
      return h('span', { class: 'ns-text-sm' }, [
        'The saga retried twice before completing ',
        h(NS.CitationChip, { key: 'c1', index: 1, source: 'trace 8821' }),
        ' and emitted a compensation event ',
        h(NS.CitationChip, { key: 'c2', index: 2, source: 'trace 8823', active: true }),
        '.',
      ]);
    },
    Group: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.CitationChip, { key: '1', index: 1, source: 'api access log' }),
        h(NS.CitationChip, { key: '2', index: 2, source: 'workers queue depth', active: true }),
        h(NS.CitationChip, { key: '3', index: 3, source: 'triggers dispatch' }),
      ]);
    },
  };
})();
