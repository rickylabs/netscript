// authored stories for "theme-toggle"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.ThemeToggle, null);
    },
    InTopbar: function () {
      return h('div', { class: 'ns-cluster ns-cluster--between' }, [
        h('span', { key: 'l', class: 'ns-text-sm ns-muted-fg' }, 'Appearance'),
        h(NS.ThemeToggle, { key: 't' }),
      ]);
    },
  };
})();
