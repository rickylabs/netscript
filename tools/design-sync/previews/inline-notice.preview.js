// authored stories for "inline-notice"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Info: function () {
      return h(
        NS.InlineNotice,
        { variant: 'info', title: 'Local source mode' },
        'This project links @netscript/* from local packages — publish before deploying.',
      );
    },
    Success: function () {
      return h(
        NS.InlineNotice,
        { variant: 'success' },
        'Registry generated — 4 plugins wired: workers, sagas, triggers, streams.',
      );
    },
    Warning: function () {
      return h(
        NS.InlineNotice,
        { variant: 'warning', title: 'Concurrency capped' },
        'sagas concurrency is pinned at 8; raise it to clear the 812-job backlog.',
      );
    },
    Destructive: function () {
      return h(
        NS.InlineNotice,
        { variant: 'destructive', title: 'Dispatch blocked' },
        'triggers cannot dispatch: streams holds the reindex lock.',
      );
    },
  };
})();
