// authored stories for "label"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h('div', { class: 'ns-stack ns-stack--xs' }, [
        h(NS.Label, { key: 'l', htmlFor: 'flow' }, 'Flow name'),
        h(NS.Input, { key: 'i', id: 'flow', name: 'flow', value: 'order.fulfillment' }),
      ]);
    },
    Required: function () {
      return h('div', { class: 'ns-stack ns-stack--xs' }, [
        h(NS.Label, { key: 'l', htmlFor: 'queue', required: true }, 'Target queue'),
        h(NS.Select, {
          key: 's',
          id: 'queue',
          name: 'queue',
          value: 'sagas',
          options: [
            { value: 'sagas', label: 'sagas' },
            { value: 'workers', label: 'workers' },
            { value: 'triggers', label: 'triggers' },
          ],
        }),
      ]);
    },
    ScreenReaderOnly: function () {
      return h('div', { class: 'ns-stack ns-stack--xs' }, [
        h(NS.Label, { key: 'l', htmlFor: 'q', srOnly: true }, 'Search runs'),
        h(NS.Input, { key: 'i', id: 'q', type: 'search', placeholder: 'Search runs…' }),
      ]);
    },
  };
})();
