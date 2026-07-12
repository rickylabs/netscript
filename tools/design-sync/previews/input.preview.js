// authored stories for "input"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Input, {
        type: 'text',
        placeholder: 'Service name (e.g. api, workers)',
        value: 'workers',
      });
    },
    Search: function () {
      return h(NS.Input, {
        type: 'search',
        placeholder: 'Filter runs by flow or trace id…',
      });
    },
    Error: function () {
      return h(NS.Input, {
        type: 'text',
        value: 'sagas orders#',
        error: true,
        'aria-invalid': 'true',
      });
    },
  };
})();
