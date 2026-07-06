// authored stories for "toast"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  // Long duration keeps the redirect-flash visible on the static preview card.
  var HOLD = 600000;
  // ns-toast-wrapper is position:fixed; the card cell collapses to no height so
  // the toast escapes and clips. A sized, transform'd block becomes the
  // containing block for the fixed toast and gives it room to render in-card.
  function stage(node) {
    return h(
      'div',
      {
        style:
          'position:relative;transform:translateZ(0);height:200px;overflow:hidden;border-radius:8px',
      },
      node,
    );
  }
  window.__dsPreview = {
    Success: function () {
      return stage(h(NS.Toast, {
        type: 'success',
        title: 'Service scaled',
        message: 'api scaled to 4 replicas.',
        duration: HOLD,
      }));
    },
    Error: function () {
      return stage(h(NS.Toast, {
        type: 'error',
        title: 'Run failed',
        message: 'nightly.reindex failed: index lock held by streams.',
        duration: HOLD,
      }));
    },
    Warning: function () {
      return stage(h(NS.Toast, {
        type: 'warning',
        title: 'Queue backing up',
        message: 'triggers depth crossed 600 jobs.',
        duration: HOLD,
      }));
    },
    Info: function () {
      return stage(h(NS.Toast, {
        type: 'info',
        message: 'workers deploy started — draining old replicas.',
        duration: HOLD,
      }));
    },
  };
})();
