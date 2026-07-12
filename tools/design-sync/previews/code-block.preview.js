// authored stories for "code-block"
(function () {
  var R = window.React;
  var NS = window.NSOne || {};
  var h = R.createElement;
  window.__dsPreview = {
    Default: function () {
      return h(NS.CodeBlock, {
        filename: 'sagas/order.fulfillment.ts',
        lang: 'ts',
        code: 'export const orderFulfillment = saga({\n' +
          '  trigger: "order.placed",\n' +
          '  steps: [reserveStock, chargeCard, dispatch],\n' +
          '  compensate: [releaseStock, refundCard],\n' +
          '});',
      });
    },
    Shell: function () {
      return h(NS.CodeBlock, {
        filename: 'terminal',
        lang: 'bash',
        code: 'netscript workers scale --service api --replicas 4\n' +
          '✓ api scaled to 4 replicas (queue depth 812 → draining)',
      });
    },
    Plain: function () {
      return h(NS.CodeBlock, {
        code: 'GET /runs/order.fulfillment/4f2a → 200 (142ms)',
      });
    },
  };
})();
