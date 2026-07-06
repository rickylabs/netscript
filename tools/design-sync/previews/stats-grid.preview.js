// authored stories for "stats-grid"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    // ns-grid/ns-grid--4 gives the KPI row its layout on the canvas closure,
    // which ships ns-* layout objects rather than the block's raw utilities.
    Overview: function () {
      return h(NS.StatsGrid, { class: 'ns-grid ns-grid--4' }, [
        h(NS.StatsGrid.Card, {
          key: 'runs',
          label: 'Runs · 24h',
          value: '18,204',
          detail: '99.1% completed',
          badge: h(NS.Badge, { variant: 'success' }, 'healthy'),
        }),
        h(NS.StatsGrid.Card, {
          key: 'queue',
          label: 'Queue depth',
          value: '812',
          detail: 'sagas backing up',
          badge: h(NS.Badge, { variant: 'warning' }, 'degraded'),
        }),
        h(NS.StatsGrid.Card, {
          key: 'p95',
          label: 'p95 latency',
          value: '168ms',
          detail: '+22ms vs. 1h ago',
        }),
        h(NS.StatsGrid.Card, {
          key: 'failed',
          label: 'Failed · 1h',
          value: '3',
          detail: 'nightly.reindex',
          badge: h(NS.Badge, { variant: 'destructive' }, 'failed'),
        }),
      ]);
    },
  };
})();
