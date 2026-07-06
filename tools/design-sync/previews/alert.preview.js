// authored stories for "alert"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Info: function () {
      return h(
        NS.Alert,
        { variant: 'info', title: 'Deploy in progress' },
        'workers is rolling out revision 42 — old replicas drain as new pods pass health checks.',
      );
    },
    Success: function () {
      return h(
        NS.Alert,
        { variant: 'success', title: 'Migration applied' },
        'Prisma migration 0007_add_dead_letter completed across api, sagas, and triggers.',
      );
    },
    Warning: function () {
      return h(
        NS.Alert,
        { variant: 'warning', title: 'Queue depth climbing' },
        'triggers depth crossed 600 jobs with p95 dispatch at 168ms. Consider scaling consumers.',
      );
    },
    Destructive: function () {
      return h(
        NS.Alert,
        { variant: 'destructive', title: 'Run failed' },
        'nightly.reindex failed after 3 retries: index lock held by streams. Trace tr_9c1d40.',
      );
    },
  };
})();
