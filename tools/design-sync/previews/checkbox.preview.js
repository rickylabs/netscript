// authored stories for "checkbox"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Checkbox, {
        name: 'retry',
        defaultChecked: true,
        description: 'Failed runs re-enter the queue with exponential backoff.',
      }, 'Retry on failure');
    },
    Group: function () {
      return h('div', { class: 'ns-stack ns-stack--sm' }, [
        h(NS.Checkbox, { key: 'w', name: 'svc-workers', defaultChecked: true }, 'workers'),
        h(NS.Checkbox, { key: 's', name: 'svc-sagas', defaultChecked: true }, 'sagas'),
        h(NS.Checkbox, { key: 't', name: 'svc-triggers' }, 'triggers'),
        h(NS.Checkbox, {
          key: 'x',
          name: 'svc-streams',
          disabled: true,
          description: 'Draining — cannot subscribe.',
        }, 'streams'),
      ]);
    },
    Error: function () {
      return h(NS.Checkbox, {
        name: 'terms',
        error: true,
        description: 'You must acknowledge the drain before continuing.',
      }, 'Acknowledge queue drain');
    },
  };
})();
