// authored stories for "page-header"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    ServiceDetail: function () {
      return h(NS.PageHeader, null, [
        h(NS.PageHeader.Main, { key: 'main' }, [
          h(NS.PageHeader.Badges, { key: 'badges' }, [
            h(NS.Badge, { key: 's', variant: 'primary' }, 'running'),
            h(NS.Badge, { key: 'k', variant: 'muted' }, 'background worker'),
          ]),
          h(NS.PageHeader.Intro, { key: 'intro' }, [
            h('h1', { key: 't', class: 'ns-text-lg' }, 'workers'),
            h(
              'p',
              { key: 'd', class: 'ns-text-sm ns-muted-fg' },
              'Processes background jobs from the sagas and triggers queues.',
            ),
          ]),
          h(NS.PageHeader.Actions, { key: 'actions' }, [
            h(NS.Button, { key: 'd', variant: 'primary', icon: '↻' }, 'Redeploy'),
            h(NS.Button, { key: 'l', variant: 'outline' }, 'View logs'),
            h(NS.Button, { key: 's', variant: 'ghost' }, 'Scale'),
          ]),
        ]),
        h(NS.PageHeader.Status, { key: 'status' }, [
          h('span', { key: 'r' }, 'revision 42'),
          h('span', { key: 'i' }, '24 inflight'),
          h('span', { key: 'q' }, 'depth 812'),
          h('span', { key: 'p' }, 'p95 168ms'),
        ]),
      ]);
    },
  };
})();
