// authored stories for "chart-block"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    RequestsByService: function () {
      return h(NS.ChartBlock, {
        title: 'Requests / min by service',
        sub: 'Last 5 minutes',
        unit: 'req',
        variant: 'bar',
        data: [
          { label: 'api', value: 4820, tone: 'primary' },
          { label: 'workers', value: 3110, tone: 'success' },
          { label: 'sagas', value: 1240, tone: 'secondary' },
          { label: 'triggers', value: 640, tone: 'warning' },
          { label: 'streams', value: 210, tone: 'destructive' },
        ],
      });
    },
    LatencyByHour: function () {
      return h(NS.ChartBlock, {
        title: 'p95 latency',
        sub: 'api gateway, last 6h',
        unit: 'ms',
        variant: 'column',
        data: [
          { label: '09', value: 142 },
          { label: '10', value: 168 },
          { label: '11', value: 205, tone: 'warning' },
          { label: '12', value: 312, tone: 'destructive' },
          { label: '13', value: 176 },
          { label: '14', value: 151 },
        ],
      });
    },
  };
})();
