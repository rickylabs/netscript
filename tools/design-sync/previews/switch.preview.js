// authored stories for "switch"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.Switch, {
        name: 'autoscale',
        defaultChecked: true,
        description: 'Scale workers between 2 and 8 replicas by queue depth.',
      }, 'Autoscale workers');
    },
    Group: function () {
      return h('div', { class: 'ns-stack ns-stack--sm' }, [
        h(NS.Switch, {
          key: 'd',
          name: 'dead-letter',
          defaultChecked: true,
          description: 'Route exhausted retries to the dead-letter queue.',
        }, 'Dead-letter routing'),
        h(NS.Switch, {
          key: 'p',
          name: 'pause',
          description: 'Hold new dispatches while draining.',
        }, 'Pause triggers'),
      ]);
    },
    Error: function () {
      return h(NS.Switch, {
        name: 'prod-writes',
        error: true,
        description: 'Production writes require a maintainer approval.',
      }, 'Enable production writes');
    },
  };
})();
