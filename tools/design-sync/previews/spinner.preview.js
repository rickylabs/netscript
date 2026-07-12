// authored stories for "spinner"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Spinner, { label: 'Loading runs…' });
    },
    Sizes: function () {
      return h('div', { class: 'ns-cluster' }, [
        h(NS.Spinner, { key: 'sm', size: 'sm', label: 'Small' }),
        h(NS.Spinner, { key: 'md', size: 'md', label: 'Medium' }),
        h(NS.Spinner, { key: 'lg', size: 'lg', label: 'Large' }),
      ]);
    },
  };
})();
