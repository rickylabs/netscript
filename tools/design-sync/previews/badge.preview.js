// authored stories for "badge"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    RunStates: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Badge, { key: 'c', variant: 'success' }, 'completed'),
        h(NS.Badge, { key: 'r', variant: 'primary' }, 'running'),
        h(NS.Badge, { key: 'f', variant: 'destructive' }, 'failed'),
        h(NS.Badge, { key: 'y', variant: 'warning' }, 'retrying'),
        h(NS.Badge, { key: 'd', variant: 'warning' }, 'degraded'),
        h(NS.Badge, { key: 'q', variant: 'muted' }, 'queued'),
      ]);
    },
    Counts: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Badge, { key: 'w', variant: 'primary' }, 'workers · 24 inflight'),
        h(NS.Badge, { key: 's', variant: 'secondary' }, 'sagas · 812 queued'),
        h(NS.Badge, { key: 'f', variant: 'destructive' }, '3 failed'),
      ]);
    },
  };
})();
