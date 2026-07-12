// authored stories for "progress"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Progress, { value: 68, max: 100, label: 'Reindex progress' });
    },
    Variants: function () {
      return h('div', { class: 'ns-stack' }, [
        h(NS.Progress, { key: 'p', value: 42, variant: 'primary', label: 'api deploy' }),
        h(NS.Progress, { key: 's', value: 100, variant: 'success', label: 'workers seeded' }),
        h(NS.Progress, { key: 'w', value: 73, variant: 'warning', label: 'sagas backlog' }),
        h(NS.Progress, { key: 'd', value: 19, variant: 'destructive', label: 'triggers failing' }),
      ]);
    },
    Indeterminate: function () {
      return h(NS.Progress, { indeterminate: true, label: 'Draining streams queue…' });
    },
  };
})();
