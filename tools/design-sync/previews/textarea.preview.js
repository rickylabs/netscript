// authored stories for "textarea"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Textarea, {
        rows: 4,
        value: '{\n  "flow": "order.fulfillment",\n  "queue": "sagas",\n  "retries": 3\n}',
      });
    },
    Empty: function () {
      return h(NS.Textarea, {
        rows: 4,
        placeholder: 'Trigger payload (JSON)…',
      });
    },
    Error: function () {
      return h(NS.Textarea, {
        rows: 3,
        error: true,
        value: '{ "flow": "order.fulfillment", "queue": }',
      });
    },
  };
})();
