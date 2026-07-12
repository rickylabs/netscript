// authored stories for "form-field"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(
        NS.FormField,
        {
          label: 'Flow name',
          name: 'flow',
          required: true,
          helpText: 'Dotted identifier, e.g. order.fulfillment',
        },
        h(NS.Input, { name: 'flow', value: 'order.fulfillment' }),
      );
    },
    WithSelect: function () {
      return h(
        NS.FormField,
        { label: 'Target queue', name: 'queue', helpText: 'Where the saga is dispatched' },
        h(NS.Select, {
          name: 'queue',
          value: 'sagas',
          options: [
            { value: 'sagas', label: 'sagas' },
            { value: 'workers', label: 'workers' },
            { value: 'triggers', label: 'triggers' },
          ],
        }),
      );
    },
    Error: function () {
      return h(
        NS.FormField,
        {
          label: 'Concurrency',
          name: 'concurrency',
          required: true,
          error: 'Must be between 1 and 64',
        },
        h(NS.Input, { name: 'concurrency', value: '0', error: true }),
      );
    },
  };
})();
