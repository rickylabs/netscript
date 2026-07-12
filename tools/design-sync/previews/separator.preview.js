// authored stories for "separator"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Horizontal: function () {
      return h('div', { class: 'ns-stack' }, [
        h('span', { key: 't', class: 'ns-text-sm' }, 'Run summary'),
        h(NS.Separator, { key: 's' }),
        h('span', { key: 'b', class: 'ns-text-sm ns-muted-fg' }, 'Timeline'),
      ]);
    },
    Vertical: function () {
      return h('div', { class: 'ns-cluster' }, [
        h('span', { key: 'a', class: 'ns-text-sm' }, 'api'),
        h(NS.Separator, { key: 's', orientation: 'vertical' }),
        h('span', { key: 'b', class: 'ns-text-sm' }, 'workers'),
        h(NS.Separator, { key: 's2', orientation: 'vertical' }),
        h('span', { key: 'c', class: 'ns-text-sm' }, 'sagas'),
      ]);
    },
  };
})();
