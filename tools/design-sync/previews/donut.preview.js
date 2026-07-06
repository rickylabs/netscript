// authored stories for "donut"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    RunOutcomes: function () {
      return h(NS.Donut, {
        data: [
          { label: 'completed', value: 1840, tone: 'success' },
          { label: 'running', value: 96, tone: 'primary' },
          { label: 'retrying', value: 41, tone: 'warning' },
          { label: 'failed', value: 23, tone: 'destructive' },
        ],
      });
    },
    QueueShare: function () {
      return h(NS.Donut, {
        total: '5.1k',
        data: [
          { label: 'workers', value: 3110 },
          { label: 'sagas', value: 1240 },
          { label: 'triggers', value: 640 },
          { label: 'streams', value: 210 },
        ],
      });
    },
  };
})();
