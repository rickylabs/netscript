var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  1 ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react/19.2.0/cjs/react.development.js
var require_react_development = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react/19.2.0/cjs/react.development.js"(exports, module) {
    "use strict";
    (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, publicInstance), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type) switch ("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof) {
          case REACT_PORTAL_TYPE:
            return "Portal";
          case REACT_CONTEXT_TYPE:
            return type.displayName || "Context";
          case REACT_CONSUMER_TYPE:
            return (type._context.displayName || "Context") + ".Consumer";
          case REACT_FORWARD_REF_TYPE:
            var innerType = type.render;
            type = type.displayName;
            type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
            return type;
          case REACT_MEMO_TYPE:
            return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
          case REACT_LAZY_TYPE:
            innerType = type._payload;
            type = type._init;
            try {
              return getComponentNameFromType(type(innerType));
            } catch (x) {
            }
        }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
          enumerable: false,
          value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(oldElement.type, newKey, oldElement.props, oldElement._owner, oldElement._debugStack, oldElement._debugTask);
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = {
          "=": "=0",
          ":": "=2"
        };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
              "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
            }, function(error) {
              "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            })), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else switch (type) {
          case "bigint":
          case "string":
          case "number":
            invokeCallback = true;
            break;
          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
                break;
              case REACT_LAZY_TYPE:
                return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
            }
        }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + childKey), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
        else if (i = getIteratorFn(children), "function" === typeof i) for (i === children.entries && (didWarnAboutMaps || console.warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; ) nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
        else if ("object" === type) {
          if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
          array = String(children);
          throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(function(moduleObject) {
            if (0 === payload._status || -1 === payload._status) {
              payload._status = 1;
              payload._result = moduleObject;
              var _ioInfo = payload._ioInfo;
              null != _ioInfo && (_ioInfo.end = performance.now());
              void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
            }
          }, function(error) {
            if (0 === payload._status || -1 === payload._status) {
              payload._status = 2;
              payload._result = error;
              var _ioInfo2 = payload._ioInfo;
              null != _ioInfo2 && (_ioInfo2.end = performance.now());
              void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
            }
          });
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            ioInfo.value = thenable;
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status) return ioInfo = payload._result, void 0 === ioInfo && console.error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", ioInfo), "default" in ioInfo || console.error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", ioInfo), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl) try {
          var requireString = ("require" + Math.random()).slice(0, 7);
          enqueueTaskImpl = (module && module[requireString]).call(module, "timers").setImmediate;
        } catch (_err) {
          enqueueTaskImpl = function(callback) {
            false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."));
            var channel = new MessageChannel();
            channel.port1.onmessage = callback;
            channel.port2.postMessage(void 0);
          };
        }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue) if (0 !== queue.length) try {
          flushActQueue(queue);
          enqueueTask(function() {
            return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
          });
          return;
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs) deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(deprecatedAPIs, UnknownOwner)();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(children, function() {
            forEachFunc.apply(this, arguments);
          }, forEachContext);
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length) throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(function(returnValue) {
                popActScope(prevActQueue, prevActScopeDepth);
                if (0 === prevActScopeDepth) {
                  try {
                    flushActQueue(queue), enqueueTask(function() {
                      return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    });
                  } catch (error$0) {
                    ReactSharedInternals.thrownErrors.push(error$0);
                  }
                  if (0 < ReactSharedInternals.thrownErrors.length) {
                    var _thrownError = aggregateErrors(ReactSharedInternals.thrownErrors);
                    ReactSharedInternals.thrownErrors.length = 0;
                    reject(_thrownError);
                  }
                } else resolve(returnValue);
              }, function(error) {
                popActScope(prevActQueue, prevActScopeDepth);
                0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
              });
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error("A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length) throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(returnValue$jscomp$0, resolve, reject);
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(config, "ref").get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++) JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(element.type, key, props, owner, element._debugStack, element._debugTask);
        for (key = 2; key < arguments.length; key++) validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++) validateChildKeys(arguments[i]);
        i = {};
        var key = null;
        if (null != config) for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn("Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform")), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++) childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(i, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(type, key, i, getOwner(), propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack, propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
      };
      exports.createRef = function() {
        var refObject = {
          current: null
        };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).") : "function" !== typeof render ? console.error("forwardRef requires a render function but was given %s.", null === render ? "null" : typeof render) : 0 !== render.length && 2 !== render.length && console.error("forwardRef render functions accept exactly two parameters: props and ref. %s", 1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
        null != render && null != render.defaultProps && console.error("forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?");
        var elementType = {
          $$typeof: REACT_FORWARD_REF_TYPE,
          render
        }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", {
              value: name
            }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        ctor = {
          _status: -1,
          _result: ctor
        };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [
          {
            awaited: ioInfo
          }
        ];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error("memo: The first argument must be a component. Instead received: %s", null === type ? "null" : typeof type);
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", {
              value: name
            }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.")), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error("We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(action, initialState, permalink);
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error("Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?");
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn("React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?");
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn("React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?");
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn("React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?");
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.2.0";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react/19.2.0/index.js
var require__ = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react/19.2.0/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/scheduler/0.27.0/cjs/scheduler.development.js
var require_scheduler_development = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/scheduler/0.27.0/cjs/scheduler.development.js"(exports) {
    "use strict";
    (function() {
      function performWorkUntilDeadline() {
        needsPaint = false;
        if (isMessageLoopRunning) {
          var currentTime = exports.unstable_now();
          startTime = currentTime;
          var hasMoreWork = true;
          try {
            a: {
              isHostCallbackScheduled = false;
              isHostTimeoutScheduled && (isHostTimeoutScheduled = false, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
              isPerformingWork = true;
              var previousPriorityLevel = currentPriorityLevel;
              try {
                b: {
                  advanceTimers(currentTime);
                  for (currentTask = peek(taskQueue); null !== currentTask && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
                    var callback = currentTask.callback;
                    if ("function" === typeof callback) {
                      currentTask.callback = null;
                      currentPriorityLevel = currentTask.priorityLevel;
                      var continuationCallback = callback(currentTask.expirationTime <= currentTime);
                      currentTime = exports.unstable_now();
                      if ("function" === typeof continuationCallback) {
                        currentTask.callback = continuationCallback;
                        advanceTimers(currentTime);
                        hasMoreWork = true;
                        break b;
                      }
                      currentTask === peek(taskQueue) && pop(taskQueue);
                      advanceTimers(currentTime);
                    } else pop(taskQueue);
                    currentTask = peek(taskQueue);
                  }
                  if (null !== currentTask) hasMoreWork = true;
                  else {
                    var firstTimer = peek(timerQueue);
                    null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
                    hasMoreWork = false;
                  }
                }
                break a;
              } finally {
                currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = false;
              }
              hasMoreWork = void 0;
            }
          } finally {
            hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = false;
          }
        }
      }
      function push(heap, node) {
        var index = heap.length;
        heap.push(node);
        a: for (; 0 < index; ) {
          var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
          if (0 < compare(parent, node)) heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
          else break a;
        }
      }
      function peek(heap) {
        return 0 === heap.length ? null : heap[0];
      }
      function pop(heap) {
        if (0 === heap.length) return null;
        var first = heap[0], last = heap.pop();
        if (last !== first) {
          heap[0] = last;
          a: for (var index = 0, length = heap.length, halfLength = length >>> 1; index < halfLength; ) {
            var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
            if (0 > compare(left, last)) rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
            else if (rightIndex < length && 0 > compare(right, last)) heap[index] = right, heap[rightIndex] = last, index = rightIndex;
            else break a;
          }
        }
        return first;
      }
      function compare(a, b) {
        var diff = a.sortIndex - b.sortIndex;
        return 0 !== diff ? diff : a.id - b.id;
      }
      function advanceTimers(currentTime) {
        for (var timer = peek(timerQueue); null !== timer; ) {
          if (null === timer.callback) pop(timerQueue);
          else if (timer.startTime <= currentTime) pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
          else break;
          timer = peek(timerQueue);
        }
      }
      function handleTimeout(currentTime) {
        isHostTimeoutScheduled = false;
        advanceTimers(currentTime);
        if (!isHostCallbackScheduled) if (null !== peek(taskQueue)) isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline());
        else {
          var firstTimer = peek(timerQueue);
          null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
      }
      function shouldYieldToHost() {
        return needsPaint ? true : exports.unstable_now() - startTime < frameInterval ? false : true;
      }
      function requestHostTimeout(callback, ms) {
        taskTimeoutID = localSetTimeout(function() {
          callback(exports.unstable_now());
        }, ms);
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      exports.unstable_now = void 0;
      if ("object" === typeof performance && "function" === typeof performance.now) {
        var localPerformance = performance;
        exports.unstable_now = function() {
          return localPerformance.now();
        };
      } else {
        var localDate = Date, initialTime = localDate.now();
        exports.unstable_now = function() {
          return localDate.now() - initialTime;
        };
      }
      var taskQueue = [], timerQueue = [], taskIdCounter = 1, currentTask = null, currentPriorityLevel = 3, isPerformingWork = false, isHostCallbackScheduled = false, isHostTimeoutScheduled = false, needsPaint = false, localSetTimeout = "function" === typeof setTimeout ? setTimeout : null, localClearTimeout = "function" === typeof clearTimeout ? clearTimeout : null, localSetImmediate = "undefined" !== typeof setImmediate ? setImmediate : null, isMessageLoopRunning = false, taskTimeoutID = -1, frameInterval = 5, startTime = -1;
      if ("function" === typeof localSetImmediate) var schedulePerformWorkUntilDeadline = function() {
        localSetImmediate(performWorkUntilDeadline);
      };
      else if ("undefined" !== typeof MessageChannel) {
        var channel = new MessageChannel(), port = channel.port2;
        channel.port1.onmessage = performWorkUntilDeadline;
        schedulePerformWorkUntilDeadline = function() {
          port.postMessage(null);
        };
      } else schedulePerformWorkUntilDeadline = function() {
        localSetTimeout(performWorkUntilDeadline, 0);
      };
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(task) {
        task.callback = null;
      };
      exports.unstable_forceFrameRate = function(fps) {
        0 > fps || 125 < fps ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return currentPriorityLevel;
      };
      exports.unstable_next = function(eventHandler) {
        switch (currentPriorityLevel) {
          case 1:
          case 2:
          case 3:
            var priorityLevel = 3;
            break;
          default:
            priorityLevel = currentPriorityLevel;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_requestPaint = function() {
        needsPaint = true;
      };
      exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
        switch (priorityLevel) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            priorityLevel = 3;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_scheduleCallback = function(priorityLevel, callback, options) {
        var currentTime = exports.unstable_now();
        "object" === typeof options && null !== options ? (options = options.delay, options = "number" === typeof options && 0 < options ? currentTime + options : currentTime) : options = currentTime;
        switch (priorityLevel) {
          case 1:
            var timeout = -1;
            break;
          case 2:
            timeout = 250;
            break;
          case 5:
            timeout = 1073741823;
            break;
          case 4:
            timeout = 1e4;
            break;
          default:
            timeout = 5e3;
        }
        timeout = options + timeout;
        priorityLevel = {
          id: taskIdCounter++,
          callback,
          priorityLevel,
          startTime: options,
          expirationTime: timeout,
          sortIndex: -1
        };
        options > currentTime ? (priorityLevel.sortIndex = options, push(timerQueue, priorityLevel), null === peek(taskQueue) && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = true, requestHostTimeout(handleTimeout, options - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline())));
        return priorityLevel;
      };
      exports.unstable_shouldYield = shouldYieldToHost;
      exports.unstable_wrapCallback = function(callback) {
        var parentPriorityLevel = currentPriorityLevel;
        return function() {
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = parentPriorityLevel;
          try {
            return callback.apply(this, arguments);
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/scheduler/0.27.0/index.js
var require__2 = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/scheduler/0.27.0/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_scheduler_development();
    }
  }
});

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react-dom/19.2.0/cjs/react-dom.development.js
var require_react_dom_development = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react-dom/19.2.0/cjs/react-dom.development.js"(exports) {
    "use strict";
    (function() {
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        try {
          testStringCoercion(key);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        JSCompiler_inline_result && (console.error("The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", "function" === typeof Symbol && Symbol.toStringTag && key[Symbol.toStringTag] || key.constructor.name || "Object"), testStringCoercion(key));
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: null == key ? null : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      function getCrossOriginStringAs(as, input) {
        if ("font" === as) return "";
        if ("string" === typeof input) return "use-credentials" === input ? input : "";
      }
      function getValueDescriptorExpectingObjectForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : 'something with type "' + typeof thing + '"';
      }
      function getValueDescriptorExpectingEnumForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : "string" === typeof thing ? JSON.stringify(thing) : "number" === typeof thing ? "`" + thing + "`" : 'something with type "' + typeof thing + '"';
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
        return dispatcher;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React2 = require__(), Internals = {
        d: {
          f: noop,
          r: function() {
            throw Error("Invalid form element. requestFormReset must be passed a form that was rendered by React.");
          },
          D: noop,
          C: noop,
          L: noop,
          m: noop,
          X: noop,
          S: noop,
          M: noop
        },
        p: 0,
        findDOMNode: null
      }, REACT_PORTAL_TYPE = Symbol.for("react.portal"), ReactSharedInternals = React2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      "function" === typeof Map && null != Map.prototype && "function" === typeof Map.prototype.forEach && "function" === typeof Set && null != Set.prototype && "function" === typeof Set.prototype.clear && "function" === typeof Set.prototype.forEach || console.error("React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills");
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType) throw Error("Target container is not a DOM element.");
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f() && console.error("flushSync was called from inside a lifecycle method. React cannot flush when React is already rendering. Consider moving this call to a scheduler task or micro task.");
        }
      };
      exports.preconnect = function(href, options) {
        "string" === typeof href && href ? null != options && "object" !== typeof options ? console.error("ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.", getValueDescriptorExpectingEnumForWarning(options)) : null != options && "string" !== typeof options.crossOrigin && console.error("ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.", getValueDescriptorExpectingObjectForWarning(options.crossOrigin)) : console.error("ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.", getValueDescriptorExpectingObjectForWarning(href));
        "string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
      };
      exports.prefetchDNS = function(href) {
        if ("string" !== typeof href || !href) console.error("ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.", getValueDescriptorExpectingObjectForWarning(href));
        else if (1 < arguments.length) {
          var options = arguments[1];
          "object" === typeof options && options.hasOwnProperty("crossOrigin") ? console.error("ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.", getValueDescriptorExpectingEnumForWarning(options)) : console.error("ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.", getValueDescriptorExpectingEnumForWarning(options));
        }
        "string" === typeof href && Internals.d.D(href);
      };
      exports.preinit = function(href, options) {
        "string" === typeof href && href ? null == options || "object" !== typeof options ? console.error("ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered %s instead.", getValueDescriptorExpectingEnumForWarning(options)) : "style" !== options.as && "script" !== options.as && console.error('ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered %s instead. Valid values for `as` are "style" and "script".', getValueDescriptorExpectingEnumForWarning(options.as)) : console.error("ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.", getValueDescriptorExpectingObjectForWarning(href));
        if ("string" === typeof href && options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
          "style" === as ? Internals.d.S(href, "string" === typeof options.precedence ? options.precedence : void 0, {
            crossOrigin,
            integrity,
            fetchPriority
          }) : "script" === as && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "script" !== options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingEnumForWarning(options.as) + ".");
        if (encountered) console.error("ReactDOM.preinitModule(): Expected up to two arguments, a non-empty `href` string and, optionally, an `options` object with a valid `as` property.%s", encountered);
        else switch (encountered = options && "string" === typeof options.as ? options.as : "script", encountered) {
          case "script":
            break;
          default:
            encountered = getValueDescriptorExpectingEnumForWarning(encountered), console.error('ReactDOM.preinitModule(): Currently the only supported "as" type for this function is "script" but received "%s" instead. This warning was generated for `href` "%s". In the future other module types will be supported, aligning with the import-attributes proposal. Learn more here: (https://github.com/tc39/proposal-import-attributes)', encountered, href);
        }
        if ("string" === typeof href) if ("object" === typeof options && null !== options) {
          if (null == options.as || "script" === options.as) encountered = getCrossOriginStringAs(options.as, options.crossOrigin), Internals.d.M(href, {
            crossOrigin: encountered,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        } else null == options && Internals.d.M(href);
      };
      exports.preload = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        null == options || "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : "string" === typeof options.as && options.as || (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error('ReactDOM.preload(): Expected two arguments, a non-empty `href` string and an `options` object with an `as` property valid for a `<link rel="preload" as="..." />` tag.%s', encountered);
        if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
          encountered = options.as;
          var crossOrigin = getCrossOriginStringAs(encountered, options.crossOrigin);
          Internals.d.L(href, encountered, {
            crossOrigin,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0,
            type: "string" === typeof options.type ? options.type : void 0,
            fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
            referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
            imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
            imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
            media: "string" === typeof options.media ? options.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "string" !== typeof options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error('ReactDOM.preloadModule(): Expected two arguments, a non-empty `href` string and, optionally, an `options` object with an `as` property valid for a `<link rel="modulepreload" as="..." />` tag.%s', encountered);
        "string" === typeof href && (options ? (encountered = getCrossOriginStringAs(options.as, options.crossOrigin), Internals.d.m(href, {
          as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
          crossOrigin: encountered,
          integrity: "string" === typeof options.integrity ? options.integrity : void 0
        })) : Internals.d.m(href));
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a) {
        return fn(a);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return resolveDispatcher().useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return resolveDispatcher().useHostTransitionStatus();
      };
      exports.version = "19.2.0";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react-dom/19.2.0/index.js
var require__3 = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react-dom/19.2.0/index.js"(exports, module) {
    "use strict";
    if (false) {
      checkDCE();
      module.exports = null;
    } else {
      module.exports = require_react_dom_development();
    }
  }
});

// ../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react-dom/19.2.0/cjs/react-dom-client.development.js
var require_react_dom_client_development = __commonJS({
  "../../../../../../../../Users/chaut/AppData/Local/deno/npm/registry.npmjs.org/react-dom/19.2.0/cjs/react-dom-client.development.js"(exports) {
    "use strict";
    (function() {
      function findHook(fiber, id) {
        for (fiber = fiber.memoizedState; null !== fiber && 0 < id; ) fiber = fiber.next, id--;
        return fiber;
      }
      function copyWithSetImpl(obj, path, index, value) {
        if (index >= path.length) return value;
        var key = path[index], updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
        updated[key] = copyWithSetImpl(obj[key], path, index + 1, value);
        return updated;
      }
      function copyWithRename(obj, oldPath, newPath) {
        if (oldPath.length !== newPath.length) console.warn("copyWithRename() expects paths of the same length");
        else {
          for (var i = 0; i < newPath.length - 1; i++) if (oldPath[i] !== newPath[i]) {
            console.warn("copyWithRename() expects paths to be the same except for the deepest key");
            return;
          }
          return copyWithRenameImpl(obj, oldPath, newPath, 0);
        }
      }
      function copyWithRenameImpl(obj, oldPath, newPath, index) {
        var oldKey = oldPath[index], updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
        index + 1 === oldPath.length ? (updated[newPath[index]] = updated[oldKey], isArrayImpl(updated) ? updated.splice(oldKey, 1) : delete updated[oldKey]) : updated[oldKey] = copyWithRenameImpl(obj[oldKey], oldPath, newPath, index + 1);
        return updated;
      }
      function copyWithDeleteImpl(obj, path, index) {
        var key = path[index], updated = isArrayImpl(obj) ? obj.slice() : assign({}, obj);
        if (index + 1 === path.length) return isArrayImpl(updated) ? updated.splice(key, 1) : delete updated[key], updated;
        updated[key] = copyWithDeleteImpl(obj[key], path, index + 1);
        return updated;
      }
      function shouldSuspendImpl() {
        return false;
      }
      function shouldErrorImpl() {
        return null;
      }
      function warnInvalidHookAccess() {
        console.error("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks");
      }
      function warnInvalidContextAccess() {
        console.error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }
      function noop() {
      }
      function warnForMissingKey() {
      }
      function setToSortedString(set) {
        var array = [];
        set.forEach(function(value) {
          array.push(value);
        });
        return array.sort().join(", ");
      }
      function createFiber(tag, pendingProps, key, mode) {
        return new FiberNode(tag, pendingProps, key, mode);
      }
      function scheduleRoot(root2, element) {
        root2.context === emptyContextObject && (updateContainerImpl(root2.current, 2, element, root2, null, null), flushSyncWork$1());
      }
      function scheduleRefresh(root2, update) {
        if (null !== resolveFamily) {
          var staleFamilies = update.staleFamilies;
          update = update.updatedFamilies;
          flushPendingEffects();
          scheduleFibersWithFamiliesRecursively(root2.current, update, staleFamilies);
          flushSyncWork$1();
        }
      }
      function setRefreshHandler(handler) {
        resolveFamily = handler;
      }
      function isValidContainer(node) {
        return !(!node || 1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType);
      }
      function getNearestMountedFiber(fiber) {
        var node = fiber, nearestMounted = fiber;
        if (fiber.alternate) for (; node.return; ) node = node.return;
        else {
          fiber = node;
          do
            node = fiber, 0 !== (node.flags & 4098) && (nearestMounted = node.return), fiber = node.return;
          while (fiber);
        }
        return 3 === node.tag ? nearestMounted : null;
      }
      function getSuspenseInstanceFromFiber(fiber) {
        if (13 === fiber.tag) {
          var suspenseState = fiber.memoizedState;
          null === suspenseState && (fiber = fiber.alternate, null !== fiber && (suspenseState = fiber.memoizedState));
          if (null !== suspenseState) return suspenseState.dehydrated;
        }
        return null;
      }
      function getActivityInstanceFromFiber(fiber) {
        if (31 === fiber.tag) {
          var activityState = fiber.memoizedState;
          null === activityState && (fiber = fiber.alternate, null !== fiber && (activityState = fiber.memoizedState));
          if (null !== activityState) return activityState.dehydrated;
        }
        return null;
      }
      function assertIsMounted(fiber) {
        if (getNearestMountedFiber(fiber) !== fiber) throw Error("Unable to find node on an unmounted component.");
      }
      function findCurrentFiberUsingSlowPath(fiber) {
        var alternate = fiber.alternate;
        if (!alternate) {
          alternate = getNearestMountedFiber(fiber);
          if (null === alternate) throw Error("Unable to find node on an unmounted component.");
          return alternate !== fiber ? null : fiber;
        }
        for (var a = fiber, b = alternate; ; ) {
          var parentA = a.return;
          if (null === parentA) break;
          var parentB = parentA.alternate;
          if (null === parentB) {
            b = parentA.return;
            if (null !== b) {
              a = b;
              continue;
            }
            break;
          }
          if (parentA.child === parentB.child) {
            for (parentB = parentA.child; parentB; ) {
              if (parentB === a) return assertIsMounted(parentA), fiber;
              if (parentB === b) return assertIsMounted(parentA), alternate;
              parentB = parentB.sibling;
            }
            throw Error("Unable to find node on an unmounted component.");
          }
          if (a.return !== b.return) a = parentA, b = parentB;
          else {
            for (var didFindChild = false, _child = parentA.child; _child; ) {
              if (_child === a) {
                didFindChild = true;
                a = parentA;
                b = parentB;
                break;
              }
              if (_child === b) {
                didFindChild = true;
                b = parentA;
                a = parentB;
                break;
              }
              _child = _child.sibling;
            }
            if (!didFindChild) {
              for (_child = parentB.child; _child; ) {
                if (_child === a) {
                  didFindChild = true;
                  a = parentB;
                  b = parentA;
                  break;
                }
                if (_child === b) {
                  didFindChild = true;
                  b = parentB;
                  a = parentA;
                  break;
                }
                _child = _child.sibling;
              }
              if (!didFindChild) throw Error("Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue.");
            }
          }
          if (a.alternate !== b) throw Error("Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue.");
        }
        if (3 !== a.tag) throw Error("Unable to find node on an unmounted component.");
        return a.stateNode.current === a ? fiber : alternate;
      }
      function findCurrentHostFiberImpl(node) {
        var tag = node.tag;
        if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
        for (node = node.child; null !== node; ) {
          tag = findCurrentHostFiberImpl(node);
          if (null !== tag) return tag;
          node = node.sibling;
        }
        return null;
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type) switch ("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof) {
          case REACT_PORTAL_TYPE:
            return "Portal";
          case REACT_CONTEXT_TYPE:
            return type.displayName || "Context";
          case REACT_CONSUMER_TYPE:
            return (type._context.displayName || "Context") + ".Consumer";
          case REACT_FORWARD_REF_TYPE:
            var innerType = type.render;
            type = type.displayName;
            type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
            return type;
          case REACT_MEMO_TYPE:
            return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
          case REACT_LAZY_TYPE:
            innerType = type._payload;
            type = type._init;
            try {
              return getComponentNameFromType(type(innerType));
            } catch (x) {
            }
        }
        return null;
      }
      function getComponentNameFromOwner(owner) {
        return "number" === typeof owner.tag ? getComponentNameFromFiber(owner) : "string" === typeof owner.name ? owner.name : null;
      }
      function getComponentNameFromFiber(fiber) {
        var type = fiber.type;
        switch (fiber.tag) {
          case 31:
            return "Activity";
          case 24:
            return "Cache";
          case 9:
            return (type._context.displayName || "Context") + ".Consumer";
          case 10:
            return type.displayName || "Context";
          case 18:
            return "DehydratedFragment";
          case 11:
            return fiber = type.render, fiber = fiber.displayName || fiber.name || "", type.displayName || ("" !== fiber ? "ForwardRef(" + fiber + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 26:
          case 27:
          case 5:
            return type;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return getComponentNameFromType(type);
          case 8:
            return type === REACT_STRICT_MODE_TYPE ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 14:
          case 15:
            if ("function" === typeof type) return type.displayName || type.name || null;
            if ("string" === typeof type) return type;
            break;
          case 29:
            type = fiber._debugInfo;
            if (null != type) {
              for (var i = type.length - 1; 0 <= i; i--) if ("string" === typeof type[i].name) return type[i].name;
            }
            if (null !== fiber.return) return getComponentNameFromFiber(fiber.return);
        }
        return null;
      }
      function createCursor(defaultValue) {
        return {
          current: defaultValue
        };
      }
      function pop(cursor, fiber) {
        0 > index$jscomp$0 ? console.error("Unexpected pop.") : (fiber !== fiberStack[index$jscomp$0] && console.error("Unexpected Fiber popped."), cursor.current = valueStack[index$jscomp$0], valueStack[index$jscomp$0] = null, fiberStack[index$jscomp$0] = null, index$jscomp$0--);
      }
      function push(cursor, value, fiber) {
        index$jscomp$0++;
        valueStack[index$jscomp$0] = cursor.current;
        fiberStack[index$jscomp$0] = fiber;
        cursor.current = value;
      }
      function requiredContext(c) {
        null === c && console.error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
        return c;
      }
      function pushHostContainer(fiber, nextRootInstance) {
        push(rootInstanceStackCursor, nextRootInstance, fiber);
        push(contextFiberStackCursor, fiber, fiber);
        push(contextStackCursor, null, fiber);
        var nextRootContext = nextRootInstance.nodeType;
        switch (nextRootContext) {
          case 9:
          case 11:
            nextRootContext = 9 === nextRootContext ? "#document" : "#fragment";
            nextRootInstance = (nextRootInstance = nextRootInstance.documentElement) ? (nextRootInstance = nextRootInstance.namespaceURI) ? getOwnHostContext(nextRootInstance) : HostContextNamespaceNone : HostContextNamespaceNone;
            break;
          default:
            if (nextRootContext = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI) nextRootInstance = getOwnHostContext(nextRootInstance), nextRootInstance = getChildHostContextProd(nextRootInstance, nextRootContext);
            else switch (nextRootContext) {
              case "svg":
                nextRootInstance = HostContextNamespaceSvg;
                break;
              case "math":
                nextRootInstance = HostContextNamespaceMath;
                break;
              default:
                nextRootInstance = HostContextNamespaceNone;
            }
        }
        nextRootContext = nextRootContext.toLowerCase();
        nextRootContext = updatedAncestorInfoDev(null, nextRootContext);
        nextRootContext = {
          context: nextRootInstance,
          ancestorInfo: nextRootContext
        };
        pop(contextStackCursor, fiber);
        push(contextStackCursor, nextRootContext, fiber);
      }
      function popHostContainer(fiber) {
        pop(contextStackCursor, fiber);
        pop(contextFiberStackCursor, fiber);
        pop(rootInstanceStackCursor, fiber);
      }
      function getHostContext() {
        return requiredContext(contextStackCursor.current);
      }
      function pushHostContext(fiber) {
        null !== fiber.memoizedState && push(hostTransitionProviderCursor, fiber, fiber);
        var context = requiredContext(contextStackCursor.current);
        var type = fiber.type;
        var nextContext = getChildHostContextProd(context.context, type);
        type = updatedAncestorInfoDev(context.ancestorInfo, type);
        nextContext = {
          context: nextContext,
          ancestorInfo: type
        };
        context !== nextContext && (push(contextFiberStackCursor, fiber, fiber), push(contextStackCursor, nextContext, fiber));
      }
      function popHostContext(fiber) {
        contextFiberStackCursor.current === fiber && (pop(contextStackCursor, fiber), pop(contextFiberStackCursor, fiber));
        hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor, fiber), HostTransitionContext._currentValue = NotPendingTransition);
      }
      function disabledLog() {
      }
      function disableLogs() {
        if (0 === disabledDepth) {
          prevLog = console.log;
          prevInfo = console.info;
          prevWarn = console.warn;
          prevError = console.error;
          prevGroup = console.group;
          prevGroupCollapsed = console.groupCollapsed;
          prevGroupEnd = console.groupEnd;
          var props = {
            configurable: true,
            enumerable: true,
            value: disabledLog,
            writable: true
          };
          Object.defineProperties(console, {
            info: props,
            log: props,
            warn: props,
            error: props,
            group: props,
            groupCollapsed: props,
            groupEnd: props
          });
        }
        disabledDepth++;
      }
      function reenableLogs() {
        disabledDepth--;
        if (0 === disabledDepth) {
          var props = {
            configurable: true,
            enumerable: true,
            writable: true
          };
          Object.defineProperties(console, {
            log: assign({}, props, {
              value: prevLog
            }),
            info: assign({}, props, {
              value: prevInfo
            }),
            warn: assign({}, props, {
              value: prevWarn
            }),
            error: assign({}, props, {
              value: prevError
            }),
            group: assign({}, props, {
              value: prevGroup
            }),
            groupCollapsed: assign({}, props, {
              value: prevGroupCollapsed
            }),
            groupEnd: assign({}, props, {
              value: prevGroupEnd
            })
          });
        }
        0 > disabledDepth && console.error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
      function formatOwnerStack(error) {
        var prevPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        error = error.stack;
        Error.prepareStackTrace = prevPrepareStackTrace;
        error.startsWith("Error: react-stack-top-frame\n") && (error = error.slice(29));
        prevPrepareStackTrace = error.indexOf("\n");
        -1 !== prevPrepareStackTrace && (error = error.slice(prevPrepareStackTrace + 1));
        prevPrepareStackTrace = error.indexOf("react_stack_bottom_frame");
        -1 !== prevPrepareStackTrace && (prevPrepareStackTrace = error.lastIndexOf("\n", prevPrepareStackTrace));
        if (-1 !== prevPrepareStackTrace) error = error.slice(0, prevPrepareStackTrace);
        else return "";
        return error;
      }
      function describeBuiltInComponentFrame(name) {
        if (void 0 === prefix) try {
          throw Error();
        } catch (x) {
          var match = x.stack.trim().match(/\n( *(at )?)/);
          prefix = match && match[1] || "";
          suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
        }
        return "\n" + prefix + name + suffix;
      }
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) return "";
        var frame = componentFrameCache.get(fn);
        if (void 0 !== frame) return frame;
        reentry = true;
        frame = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        var previousDispatcher2 = null;
        previousDispatcher2 = ReactSharedInternals.H;
        ReactSharedInternals.H = null;
        disableLogs();
        try {
          var RunInRootFrame = {
            DetermineComponentFrameRoot: function() {
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  });
                  if ("object" === typeof Reflect && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      var control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x$0) {
                      control = x$0;
                    }
                    fn.call(Fake.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x$1) {
                    control = x$1;
                  }
                  (Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {
                  });
                }
              } catch (sample) {
                if (sample && control && "string" === typeof sample.stack) return [
                  sample.stack,
                  control.stack
                ];
              }
              return [
                null,
                null
              ];
            }
          };
          RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
          var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, "name");
          namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", {
            value: "DetermineComponentFrameRoot"
          });
          var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
          if (sampleStack && controlStack) {
            var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
            for (_RunInRootFrame$Deter = namePropDescriptor = 0; namePropDescriptor < sampleLines.length && !sampleLines[namePropDescriptor].includes("DetermineComponentFrameRoot"); ) namePropDescriptor++;
            for (; _RunInRootFrame$Deter < controlLines.length && !controlLines[_RunInRootFrame$Deter].includes("DetermineComponentFrameRoot"); ) _RunInRootFrame$Deter++;
            if (namePropDescriptor === sampleLines.length || _RunInRootFrame$Deter === controlLines.length) for (namePropDescriptor = sampleLines.length - 1, _RunInRootFrame$Deter = controlLines.length - 1; 1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter && sampleLines[namePropDescriptor] !== controlLines[_RunInRootFrame$Deter]; ) _RunInRootFrame$Deter--;
            for (; 1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter; namePropDescriptor--, _RunInRootFrame$Deter--) if (sampleLines[namePropDescriptor] !== controlLines[_RunInRootFrame$Deter]) {
              if (1 !== namePropDescriptor || 1 !== _RunInRootFrame$Deter) {
                do
                  if (namePropDescriptor--, _RunInRootFrame$Deter--, 0 > _RunInRootFrame$Deter || sampleLines[namePropDescriptor] !== controlLines[_RunInRootFrame$Deter]) {
                    var _frame = "\n" + sampleLines[namePropDescriptor].replace(" at new ", " at ");
                    fn.displayName && _frame.includes("<anonymous>") && (_frame = _frame.replace("<anonymous>", fn.displayName));
                    "function" === typeof fn && componentFrameCache.set(fn, _frame);
                    return _frame;
                  }
                while (1 <= namePropDescriptor && 0 <= _RunInRootFrame$Deter);
              }
              break;
            }
          }
        } finally {
          reentry = false, ReactSharedInternals.H = previousDispatcher2, reenableLogs(), Error.prepareStackTrace = frame;
        }
        sampleLines = (sampleLines = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(sampleLines) : "";
        "function" === typeof fn && componentFrameCache.set(fn, sampleLines);
        return sampleLines;
      }
      function describeFiber(fiber, childFiber) {
        switch (fiber.tag) {
          case 26:
          case 27:
          case 5:
            return describeBuiltInComponentFrame(fiber.type);
          case 16:
            return describeBuiltInComponentFrame("Lazy");
          case 13:
            return fiber.child !== childFiber && null !== childFiber ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
          case 19:
            return describeBuiltInComponentFrame("SuspenseList");
          case 0:
          case 15:
            return describeNativeComponentFrame(fiber.type, false);
          case 11:
            return describeNativeComponentFrame(fiber.type.render, false);
          case 1:
            return describeNativeComponentFrame(fiber.type, true);
          case 31:
            return describeBuiltInComponentFrame("Activity");
          default:
            return "";
        }
      }
      function getStackByFiberInDevAndProd(workInProgress2) {
        try {
          var info = "", previous = null;
          do {
            info += describeFiber(workInProgress2, previous);
            var debugInfo = workInProgress2._debugInfo;
            if (debugInfo) for (var i = debugInfo.length - 1; 0 <= i; i--) {
              var entry = debugInfo[i];
              if ("string" === typeof entry.name) {
                var JSCompiler_temp_const = info;
                a: {
                  var name = entry.name, env = entry.env, location = entry.debugLocation;
                  if (null != location) {
                    var childStack = formatOwnerStack(location), idx = childStack.lastIndexOf("\n"), lastLine = -1 === idx ? childStack : childStack.slice(idx + 1);
                    if (-1 !== lastLine.indexOf(name)) {
                      var JSCompiler_inline_result = "\n" + lastLine;
                      break a;
                    }
                  }
                  JSCompiler_inline_result = describeBuiltInComponentFrame(name + (env ? " [" + env + "]" : ""));
                }
                info = JSCompiler_temp_const + JSCompiler_inline_result;
              }
            }
            previous = workInProgress2;
            workInProgress2 = workInProgress2.return;
          } while (workInProgress2);
          return info;
        } catch (x) {
          return "\nError generating stack: " + x.message + "\n" + x.stack;
        }
      }
      function describeFunctionComponentFrameWithoutLineNumber(fn) {
        return (fn = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(fn) : "";
      }
      function getCurrentFiberOwnerNameInDevOrNull() {
        if (null === current) return null;
        var owner = current._debugOwner;
        return null != owner ? getComponentNameFromOwner(owner) : null;
      }
      function getCurrentFiberStackInDev() {
        if (null === current) return "";
        var workInProgress2 = current;
        try {
          var info = "";
          6 === workInProgress2.tag && (workInProgress2 = workInProgress2.return);
          switch (workInProgress2.tag) {
            case 26:
            case 27:
            case 5:
              info += describeBuiltInComponentFrame(workInProgress2.type);
              break;
            case 13:
              info += describeBuiltInComponentFrame("Suspense");
              break;
            case 19:
              info += describeBuiltInComponentFrame("SuspenseList");
              break;
            case 31:
              info += describeBuiltInComponentFrame("Activity");
              break;
            case 30:
            case 0:
            case 15:
            case 1:
              workInProgress2._debugOwner || "" !== info || (info += describeFunctionComponentFrameWithoutLineNumber(workInProgress2.type));
              break;
            case 11:
              workInProgress2._debugOwner || "" !== info || (info += describeFunctionComponentFrameWithoutLineNumber(workInProgress2.type.render));
          }
          for (; workInProgress2; ) if ("number" === typeof workInProgress2.tag) {
            var fiber = workInProgress2;
            workInProgress2 = fiber._debugOwner;
            var debugStack = fiber._debugStack;
            if (workInProgress2 && debugStack) {
              var formattedStack = formatOwnerStack(debugStack);
              "" !== formattedStack && (info += "\n" + formattedStack);
            }
          } else if (null != workInProgress2.debugStack) {
            var ownerStack = workInProgress2.debugStack;
            (workInProgress2 = workInProgress2.owner) && ownerStack && (info += "\n" + formatOwnerStack(ownerStack));
          } else break;
          var JSCompiler_inline_result = info;
        } catch (x) {
          JSCompiler_inline_result = "\nError generating stack: " + x.message + "\n" + x.stack;
        }
        return JSCompiler_inline_result;
      }
      function runWithFiberInDEV(fiber, callback, arg0, arg1, arg2, arg3, arg4) {
        var previousFiber = current;
        setCurrentFiber(fiber);
        try {
          return null !== fiber && fiber._debugTask ? fiber._debugTask.run(callback.bind(null, arg0, arg1, arg2, arg3, arg4)) : callback(arg0, arg1, arg2, arg3, arg4);
        } finally {
          setCurrentFiber(previousFiber);
        }
        throw Error("runWithFiberInDEV should never be called in production. This is a bug in React.");
      }
      function setCurrentFiber(fiber) {
        ReactSharedInternals.getCurrentStack = null === fiber ? null : getCurrentFiberStackInDev;
        isRendering = false;
        current = fiber;
      }
      function typeName(value) {
        return "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
      }
      function willCoercionThrow(value) {
        try {
          return testStringCoercion(value), false;
        } catch (e) {
          return true;
        }
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkAttributeStringCoercion(value, attributeName) {
        if (willCoercionThrow(value)) return console.error("The provided `%s` attribute is an unsupported type %s. This value must be coerced to a string before using it here.", attributeName, typeName(value)), testStringCoercion(value);
      }
      function checkCSSPropertyStringCoercion(value, propName) {
        if (willCoercionThrow(value)) return console.error("The provided `%s` CSS property is an unsupported type %s. This value must be coerced to a string before using it here.", propName, typeName(value)), testStringCoercion(value);
      }
      function checkFormFieldValueStringCoercion(value) {
        if (willCoercionThrow(value)) return console.error("Form field values (value, checked, defaultValue, or defaultChecked props) must be strings, not %s. This value must be coerced to a string before using it here.", typeName(value)), testStringCoercion(value);
      }
      function injectInternals(internals) {
        if ("undefined" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return false;
        var hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook.isDisabled) return true;
        if (!hook.supportsFiber) return console.error("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://react.dev/link/react-devtools"), true;
        try {
          rendererID = hook.inject(internals), injectedHook = hook;
        } catch (err) {
          console.error("React instrumentation encountered an error: %o.", err);
        }
        return hook.checkDCE ? true : false;
      }
      function setIsStrictModeForDevtools(newIsStrictMode) {
        "function" === typeof log$1 && unstable_setDisableYieldValue(newIsStrictMode);
        if (injectedHook && "function" === typeof injectedHook.setStrictMode) try {
          injectedHook.setStrictMode(rendererID, newIsStrictMode);
        } catch (err) {
          hasLoggedError || (hasLoggedError = true, console.error("React instrumentation encountered an error: %o", err));
        }
      }
      function clz32Fallback(x) {
        x >>>= 0;
        return 0 === x ? 32 : 31 - (log(x) / LN2 | 0) | 0;
      }
      function getHighestPriorityLanes(lanes) {
        var pendingSyncLanes = lanes & 42;
        if (0 !== pendingSyncLanes) return pendingSyncLanes;
        switch (lanes & -lanes) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return lanes & 261888;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return lanes & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return lanes & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return console.error("Should have found matching lanes. This is a bug in React."), lanes;
        }
      }
      function getNextLanes(root2, wipLanes, rootHasPendingCommit) {
        var pendingLanes = root2.pendingLanes;
        if (0 === pendingLanes) return 0;
        var nextLanes = 0, suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
        root2 = root2.warmLanes;
        var nonIdlePendingLanes = pendingLanes & 134217727;
        0 !== nonIdlePendingLanes ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, 0 !== pendingLanes ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, 0 !== nonIdlePendingLanes ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
        return 0 === nextLanes ? 0 : 0 !== wipLanes && wipLanes !== nextLanes && 0 === (wipLanes & suspendedLanes) && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || 32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)) ? wipLanes : nextLanes;
      }
      function checkIfRootIsPrerendering(root2, renderLanes2) {
        return 0 === (root2.pendingLanes & ~(root2.suspendedLanes & ~root2.pingedLanes) & renderLanes2);
      }
      function computeExpirationTime(lane, currentTime) {
        switch (lane) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return currentTime + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return currentTime + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return console.error("Should have found matching lanes. This is a bug in React."), -1;
        }
      }
      function claimNextRetryLane() {
        var lane = nextRetryLane;
        nextRetryLane <<= 1;
        0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
        return lane;
      }
      function createLaneMap(initial) {
        for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
        return laneMap;
      }
      function markRootUpdated$1(root2, updateLane) {
        root2.pendingLanes |= updateLane;
        268435456 !== updateLane && (root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0);
      }
      function markRootFinished(root2, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
        var previouslyPendingLanes = root2.pendingLanes;
        root2.pendingLanes = remainingLanes;
        root2.suspendedLanes = 0;
        root2.pingedLanes = 0;
        root2.warmLanes = 0;
        root2.expiredLanes &= remainingLanes;
        root2.entangledLanes &= remainingLanes;
        root2.errorRecoveryDisabledLanes &= remainingLanes;
        root2.shellSuspendCounter = 0;
        var entanglements = root2.entanglements, expirationTimes = root2.expirationTimes, hiddenUpdates = root2.hiddenUpdates;
        for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes; ) {
          var index = 31 - clz32(remainingLanes), lane = 1 << index;
          entanglements[index] = 0;
          expirationTimes[index] = -1;
          var hiddenUpdatesForLane = hiddenUpdates[index];
          if (null !== hiddenUpdatesForLane) for (hiddenUpdates[index] = null, index = 0; index < hiddenUpdatesForLane.length; index++) {
            var update = hiddenUpdatesForLane[index];
            null !== update && (update.lane &= -536870913);
          }
          remainingLanes &= ~lane;
        }
        0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, 0);
        0 !== suspendedRetryLanes && 0 === updatedLanes && 0 !== root2.tag && (root2.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
      }
      function markSpawnedDeferredLane(root2, spawnedLane, entangledLanes) {
        root2.pendingLanes |= spawnedLane;
        root2.suspendedLanes &= ~spawnedLane;
        var spawnedLaneIndex = 31 - clz32(spawnedLane);
        root2.entangledLanes |= spawnedLane;
        root2.entanglements[spawnedLaneIndex] = root2.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
      }
      function markRootEntangled(root2, entangledLanes) {
        var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
        for (root2 = root2.entanglements; rootEntangledLanes; ) {
          var index = 31 - clz32(rootEntangledLanes), lane = 1 << index;
          lane & entangledLanes | root2[index] & entangledLanes && (root2[index] |= entangledLanes);
          rootEntangledLanes &= ~lane;
        }
      }
      function getBumpedLaneForHydration(root2, renderLanes2) {
        var renderLane = renderLanes2 & -renderLanes2;
        renderLane = 0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
        return 0 !== (renderLane & (root2.suspendedLanes | renderLanes2)) ? 0 : renderLane;
      }
      function getBumpedLaneForHydrationByLane(lane) {
        switch (lane) {
          case 2:
            lane = 1;
            break;
          case 8:
            lane = 4;
            break;
          case 32:
            lane = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            lane = 128;
            break;
          case 268435456:
            lane = 134217728;
            break;
          default:
            lane = 0;
        }
        return lane;
      }
      function addFiberToLanesMap(root2, fiber, lanes) {
        if (isDevToolsPresent) for (root2 = root2.pendingUpdatersLaneMap; 0 < lanes; ) {
          var index = 31 - clz32(lanes), lane = 1 << index;
          root2[index].add(fiber);
          lanes &= ~lane;
        }
      }
      function movePendingFibersToMemoized(root2, lanes) {
        if (isDevToolsPresent) for (var pendingUpdatersLaneMap = root2.pendingUpdatersLaneMap, memoizedUpdaters = root2.memoizedUpdaters; 0 < lanes; ) {
          var index = 31 - clz32(lanes);
          root2 = 1 << index;
          index = pendingUpdatersLaneMap[index];
          0 < index.size && (index.forEach(function(fiber) {
            var alternate = fiber.alternate;
            null !== alternate && memoizedUpdaters.has(alternate) || memoizedUpdaters.add(fiber);
          }), index.clear());
          lanes &= ~root2;
        }
      }
      function lanesToEventPriority(lanes) {
        lanes &= -lanes;
        return 0 !== DiscreteEventPriority && DiscreteEventPriority < lanes ? 0 !== ContinuousEventPriority && ContinuousEventPriority < lanes ? 0 !== (lanes & 134217727) ? DefaultEventPriority : IdleEventPriority : ContinuousEventPriority : DiscreteEventPriority;
      }
      function resolveUpdatePriority() {
        var updatePriority = ReactDOMSharedInternals.p;
        if (0 !== updatePriority) return updatePriority;
        updatePriority = window.event;
        return void 0 === updatePriority ? DefaultEventPriority : getEventPriority(updatePriority.type);
      }
      function runWithPriority(priority, fn) {
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          return ReactDOMSharedInternals.p = priority, fn();
        } finally {
          ReactDOMSharedInternals.p = previousPriority;
        }
      }
      function detachDeletedInstance(node) {
        delete node[internalInstanceKey];
        delete node[internalPropsKey];
        delete node[internalEventHandlersKey];
        delete node[internalEventHandlerListenersKey];
        delete node[internalEventHandlesSetKey];
      }
      function getClosestInstanceFromNode(targetNode) {
        var targetInst = targetNode[internalInstanceKey];
        if (targetInst) return targetInst;
        for (var parentNode = targetNode.parentNode; parentNode; ) {
          if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
            parentNode = targetInst.alternate;
            if (null !== targetInst.child || null !== parentNode && null !== parentNode.child) for (targetNode = getParentHydrationBoundary(targetNode); null !== targetNode; ) {
              if (parentNode = targetNode[internalInstanceKey]) return parentNode;
              targetNode = getParentHydrationBoundary(targetNode);
            }
            return targetInst;
          }
          targetNode = parentNode;
          parentNode = targetNode.parentNode;
        }
        return null;
      }
      function getInstanceFromNode(node) {
        if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
          var tag = node.tag;
          if (5 === tag || 6 === tag || 13 === tag || 31 === tag || 26 === tag || 27 === tag || 3 === tag) return node;
        }
        return null;
      }
      function getNodeFromInstance(inst) {
        var tag = inst.tag;
        if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
        throw Error("getNodeFromInstance: Invalid argument.");
      }
      function getResourcesFromRoot(root2) {
        var resources = root2[internalRootNodeResourcesKey];
        resources || (resources = root2[internalRootNodeResourcesKey] = {
          hoistableStyles: /* @__PURE__ */ new Map(),
          hoistableScripts: /* @__PURE__ */ new Map()
        });
        return resources;
      }
      function markNodeAsHoistable(node) {
        node[internalHoistableMarker] = true;
      }
      function registerTwoPhaseEvent(registrationName, dependencies) {
        registerDirectEvent(registrationName, dependencies);
        registerDirectEvent(registrationName + "Capture", dependencies);
      }
      function registerDirectEvent(registrationName, dependencies) {
        registrationNameDependencies[registrationName] && console.error("EventRegistry: More than one plugin attempted to publish the same registration name, `%s`.", registrationName);
        registrationNameDependencies[registrationName] = dependencies;
        var lowerCasedName = registrationName.toLowerCase();
        possibleRegistrationNames[lowerCasedName] = registrationName;
        "onDoubleClick" === registrationName && (possibleRegistrationNames.ondblclick = registrationName);
        for (registrationName = 0; registrationName < dependencies.length; registrationName++) allNativeEvents.add(dependencies[registrationName]);
      }
      function checkControlledValueProps(tagName, props) {
        hasReadOnlyValue[props.type] || props.onChange || props.onInput || props.readOnly || props.disabled || null == props.value || ("select" === tagName ? console.error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set `onChange`.") : console.error("You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`."));
        props.onChange || props.readOnly || props.disabled || null == props.checked || console.error("You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.");
      }
      function isAttributeNameSafe(attributeName) {
        if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) return true;
        if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return false;
        if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) return validatedAttributeNameCache[attributeName] = true;
        illegalAttributeNameCache[attributeName] = true;
        console.error("Invalid attribute name: `%s`", attributeName);
        return false;
      }
      function getValueForAttributeOnCustomComponent(node, name, expected) {
        if (isAttributeNameSafe(name)) {
          if (!node.hasAttribute(name)) {
            switch (typeof expected) {
              case "symbol":
              case "object":
                return expected;
              case "function":
                return expected;
              case "boolean":
                if (false === expected) return expected;
            }
            return void 0 === expected ? void 0 : null;
          }
          node = node.getAttribute(name);
          if ("" === node && true === expected) return true;
          checkAttributeStringCoercion(expected, name);
          return node === "" + expected ? expected : node;
        }
      }
      function setValueForAttribute(node, name, value) {
        if (isAttributeNameSafe(name)) if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
              node.removeAttribute(name);
              return;
            case "boolean":
              var prefix2 = name.toLowerCase().slice(0, 5);
              if ("data-" !== prefix2 && "aria-" !== prefix2) {
                node.removeAttribute(name);
                return;
              }
          }
          checkAttributeStringCoercion(value, name);
          node.setAttribute(name, "" + value);
        }
      }
      function setValueForKnownAttribute(node, name, value) {
        if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          checkAttributeStringCoercion(value, name);
          node.setAttribute(name, "" + value);
        }
      }
      function setValueForNamespacedAttribute(node, namespace, name, value) {
        if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          checkAttributeStringCoercion(value, name);
          node.setAttributeNS(namespace, name, "" + value);
        }
      }
      function getToStringValue(value) {
        switch (typeof value) {
          case "bigint":
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return value;
          case "object":
            return checkFormFieldValueStringCoercion(value), value;
          default:
            return "";
        }
      }
      function isCheckable(elem) {
        var type = elem.type;
        return (elem = elem.nodeName) && "input" === elem.toLowerCase() && ("checkbox" === type || "radio" === type);
      }
      function trackValueOnNode(node, valueField, currentValue) {
        var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
        if (!node.hasOwnProperty(valueField) && "undefined" !== typeof descriptor && "function" === typeof descriptor.get && "function" === typeof descriptor.set) {
          var get = descriptor.get, set = descriptor.set;
          Object.defineProperty(node, valueField, {
            configurable: true,
            get: function() {
              return get.call(this);
            },
            set: function(value) {
              checkFormFieldValueStringCoercion(value);
              currentValue = "" + value;
              set.call(this, value);
            }
          });
          Object.defineProperty(node, valueField, {
            enumerable: descriptor.enumerable
          });
          return {
            getValue: function() {
              return currentValue;
            },
            setValue: function(value) {
              checkFormFieldValueStringCoercion(value);
              currentValue = "" + value;
            },
            stopTracking: function() {
              node._valueTracker = null;
              delete node[valueField];
            }
          };
        }
      }
      function track(node) {
        if (!node._valueTracker) {
          var valueField = isCheckable(node) ? "checked" : "value";
          node._valueTracker = trackValueOnNode(node, valueField, "" + node[valueField]);
        }
      }
      function updateValueIfChanged(node) {
        if (!node) return false;
        var tracker = node._valueTracker;
        if (!tracker) return true;
        var lastValue = tracker.getValue();
        var value = "";
        node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value);
        node = value;
        return node !== lastValue ? (tracker.setValue(node), true) : false;
      }
      function getActiveElement(doc) {
        doc = doc || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof doc) return null;
        try {
          return doc.activeElement || doc.body;
        } catch (e) {
          return doc.body;
        }
      }
      function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
        return value.replace(escapeSelectorAttributeValueInsideDoubleQuotesRegex, function(ch) {
          return "\\" + ch.charCodeAt(0).toString(16) + " ";
        });
      }
      function validateInputProps(element, props) {
        void 0 === props.checked || void 0 === props.defaultChecked || didWarnCheckedDefaultChecked || (console.error("%s contains an input of type %s with both checked and defaultChecked props. Input elements must be either controlled or uncontrolled (specify either the checked prop, or the defaultChecked prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component", props.type), didWarnCheckedDefaultChecked = true);
        void 0 === props.value || void 0 === props.defaultValue || didWarnValueDefaultValue$1 || (console.error("%s contains an input of type %s with both value and defaultValue props. Input elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled input element and remove one of these props. More info: https://react.dev/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component", props.type), didWarnValueDefaultValue$1 = true);
      }
      function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
        element.name = "";
        null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type ? (checkAttributeStringCoercion(type, "type"), element.type = type) : element.removeAttribute("type");
        if (null != value) if ("number" === type) {
          if (0 === value && "" === element.value || element.value != value) element.value = "" + getToStringValue(value);
        } else element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value));
        else "submit" !== type && "reset" !== type || element.removeAttribute("value");
        null != value ? setDefaultValue(element, type, getToStringValue(value)) : null != defaultValue ? setDefaultValue(element, type, getToStringValue(defaultValue)) : null != lastDefaultValue && element.removeAttribute("value");
        null == checked && null != defaultChecked && (element.defaultChecked = !!defaultChecked);
        null != checked && (element.checked = checked && "function" !== typeof checked && "symbol" !== typeof checked);
        null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name ? (checkAttributeStringCoercion(name, "name"), element.name = "" + getToStringValue(name)) : element.removeAttribute("name");
      }
      function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating2) {
        null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type && (checkAttributeStringCoercion(type, "type"), element.type = type);
        if (null != value || null != defaultValue) {
          if (!("submit" !== type && "reset" !== type || void 0 !== value && null !== value)) {
            track(element);
            return;
          }
          defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
          value = null != value ? "" + getToStringValue(value) : defaultValue;
          isHydrating2 || value === element.value || (element.value = value);
          element.defaultValue = value;
        }
        checked = null != checked ? checked : defaultChecked;
        checked = "function" !== typeof checked && "symbol" !== typeof checked && !!checked;
        element.checked = isHydrating2 ? element.checked : !!checked;
        element.defaultChecked = !!checked;
        null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name && (checkAttributeStringCoercion(name, "name"), element.name = name);
        track(element);
      }
      function setDefaultValue(node, type, value) {
        "number" === type && getActiveElement(node.ownerDocument) === node || node.defaultValue === "" + value || (node.defaultValue = "" + value);
      }
      function validateOptionProps(element, props) {
        null == props.value && ("object" === typeof props.children && null !== props.children ? React2.Children.forEach(props.children, function(child) {
          null == child || "string" === typeof child || "number" === typeof child || "bigint" === typeof child || didWarnInvalidChild || (didWarnInvalidChild = true, console.error("Cannot infer the option value of complex children. Pass a `value` prop or use a plain string as children to <option>."));
        }) : null == props.dangerouslySetInnerHTML || didWarnInvalidInnerHTML || (didWarnInvalidInnerHTML = true, console.error("Pass a `value` prop if you set dangerouslyInnerHTML so React knows which value should be selected.")));
        null == props.selected || didWarnSelectedSetOnOption || (console.error("Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>."), didWarnSelectedSetOnOption = true);
      }
      function getDeclarationErrorAddendum() {
        var ownerName = getCurrentFiberOwnerNameInDevOrNull();
        return ownerName ? "\n\nCheck the render method of `" + ownerName + "`." : "";
      }
      function updateOptions(node, multiple, propValue, setDefaultSelected) {
        node = node.options;
        if (multiple) {
          multiple = {};
          for (var i = 0; i < propValue.length; i++) multiple["$" + propValue[i]] = true;
          for (propValue = 0; propValue < node.length; propValue++) i = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i && (node[propValue].selected = i), i && setDefaultSelected && (node[propValue].defaultSelected = true);
        } else {
          propValue = "" + getToStringValue(propValue);
          multiple = null;
          for (i = 0; i < node.length; i++) {
            if (node[i].value === propValue) {
              node[i].selected = true;
              setDefaultSelected && (node[i].defaultSelected = true);
              return;
            }
            null !== multiple || node[i].disabled || (multiple = node[i]);
          }
          null !== multiple && (multiple.selected = true);
        }
      }
      function validateSelectProps(element, props) {
        for (element = 0; element < valuePropNames.length; element++) {
          var propName = valuePropNames[element];
          if (null != props[propName]) {
            var propNameIsArray = isArrayImpl(props[propName]);
            props.multiple && !propNameIsArray ? console.error("The `%s` prop supplied to <select> must be an array if `multiple` is true.%s", propName, getDeclarationErrorAddendum()) : !props.multiple && propNameIsArray && console.error("The `%s` prop supplied to <select> must be a scalar value if `multiple` is false.%s", propName, getDeclarationErrorAddendum());
          }
        }
        void 0 === props.value || void 0 === props.defaultValue || didWarnValueDefaultValue || (console.error("Select elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled select element and remove one of these props. More info: https://react.dev/link/controlled-components"), didWarnValueDefaultValue = true);
      }
      function validateTextareaProps(element, props) {
        void 0 === props.value || void 0 === props.defaultValue || didWarnValDefaultVal || (console.error("%s contains a textarea with both value and defaultValue props. Textarea elements must be either controlled or uncontrolled (specify either the value prop, or the defaultValue prop, but not both). Decide between using a controlled or uncontrolled textarea and remove one of these props. More info: https://react.dev/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component"), didWarnValDefaultVal = true);
        null != props.children && null == props.value && console.error("Use the `defaultValue` or `value` props instead of setting children on <textarea>.");
      }
      function updateTextarea(element, value, defaultValue) {
        if (null != value && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), null == defaultValue)) {
          element.defaultValue !== value && (element.defaultValue = value);
          return;
        }
        element.defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
      }
      function initTextarea(element, value, defaultValue, children) {
        if (null == value) {
          if (null != children) {
            if (null != defaultValue) throw Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
            if (isArrayImpl(children)) {
              if (1 < children.length) throw Error("<textarea> can only have at most one child.");
              children = children[0];
            }
            defaultValue = children;
          }
          null == defaultValue && (defaultValue = "");
          value = defaultValue;
        }
        defaultValue = getToStringValue(value);
        element.defaultValue = defaultValue;
        children = element.textContent;
        children === defaultValue && "" !== children && null !== children && (element.value = children);
        track(element);
      }
      function findNotableNode(node, indent) {
        return void 0 === node.serverProps && 0 === node.serverTail.length && 1 === node.children.length && 3 < node.distanceFromLeaf && node.distanceFromLeaf > 15 - indent ? findNotableNode(node.children[0], indent) : node;
      }
      function indentation(indent) {
        return "  " + "  ".repeat(indent);
      }
      function added(indent) {
        return "+ " + "  ".repeat(indent);
      }
      function removed(indent) {
        return "- " + "  ".repeat(indent);
      }
      function describeFiberType(fiber) {
        switch (fiber.tag) {
          case 26:
          case 27:
          case 5:
            return fiber.type;
          case 16:
            return "Lazy";
          case 31:
            return "Activity";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 0:
          case 15:
            return fiber = fiber.type, fiber.displayName || fiber.name || null;
          case 11:
            return fiber = fiber.type.render, fiber.displayName || fiber.name || null;
          case 1:
            return fiber = fiber.type, fiber.displayName || fiber.name || null;
          default:
            return null;
        }
      }
      function describeTextNode(content, maxLength) {
        return needsEscaping.test(content) ? (content = JSON.stringify(content), content.length > maxLength - 2 ? 8 > maxLength ? '{"..."}' : "{" + content.slice(0, maxLength - 7) + '..."}' : "{" + content + "}") : content.length > maxLength ? 5 > maxLength ? '{"..."}' : content.slice(0, maxLength - 3) + "..." : content;
      }
      function describeTextDiff(clientText, serverProps, indent) {
        var maxLength = 120 - 2 * indent;
        if (null === serverProps) return added(indent) + describeTextNode(clientText, maxLength) + "\n";
        if ("string" === typeof serverProps) {
          for (var firstDiff = 0; firstDiff < serverProps.length && firstDiff < clientText.length && serverProps.charCodeAt(firstDiff) === clientText.charCodeAt(firstDiff); firstDiff++) ;
          firstDiff > maxLength - 8 && 10 < firstDiff && (clientText = "..." + clientText.slice(firstDiff - 8), serverProps = "..." + serverProps.slice(firstDiff - 8));
          return added(indent) + describeTextNode(clientText, maxLength) + "\n" + removed(indent) + describeTextNode(serverProps, maxLength) + "\n";
        }
        return indentation(indent) + describeTextNode(clientText, maxLength) + "\n";
      }
      function objectName(object) {
        return Object.prototype.toString.call(object).replace(/^\[object (.*)\]$/, function(m, p0) {
          return p0;
        });
      }
      function describeValue(value, maxLength) {
        switch (typeof value) {
          case "string":
            return value = JSON.stringify(value), value.length > maxLength ? 5 > maxLength ? '"..."' : value.slice(0, maxLength - 4) + '..."' : value;
          case "object":
            if (null === value) return "null";
            if (isArrayImpl(value)) return "[...]";
            if (value.$$typeof === REACT_ELEMENT_TYPE) return (maxLength = getComponentNameFromType(value.type)) ? "<" + maxLength + ">" : "<...>";
            var name = objectName(value);
            if ("Object" === name) {
              name = "";
              maxLength -= 2;
              for (var propName in value) if (value.hasOwnProperty(propName)) {
                var jsonPropName = JSON.stringify(propName);
                jsonPropName !== '"' + propName + '"' && (propName = jsonPropName);
                maxLength -= propName.length - 2;
                jsonPropName = describeValue(value[propName], 15 > maxLength ? maxLength : 15);
                maxLength -= jsonPropName.length;
                if (0 > maxLength) {
                  name += "" === name ? "..." : ", ...";
                  break;
                }
                name += ("" === name ? "" : ",") + propName + ":" + jsonPropName;
              }
              return "{" + name + "}";
            }
            return name;
          case "function":
            return (maxLength = value.displayName || value.name) ? "function " + maxLength : "function";
          default:
            return String(value);
        }
      }
      function describePropValue(value, maxLength) {
        return "string" !== typeof value || needsEscaping.test(value) ? "{" + describeValue(value, maxLength - 2) + "}" : value.length > maxLength - 2 ? 5 > maxLength ? '"..."' : '"' + value.slice(0, maxLength - 5) + '..."' : '"' + value + '"';
      }
      function describeExpandedElement(type, props, rowPrefix) {
        var remainingRowLength = 120 - rowPrefix.length - type.length, properties = [], propName;
        for (propName in props) if (props.hasOwnProperty(propName) && "children" !== propName) {
          var propValue = describePropValue(props[propName], 120 - rowPrefix.length - propName.length - 1);
          remainingRowLength -= propName.length + propValue.length + 2;
          properties.push(propName + "=" + propValue);
        }
        return 0 === properties.length ? rowPrefix + "<" + type + ">\n" : 0 < remainingRowLength ? rowPrefix + "<" + type + " " + properties.join(" ") + ">\n" : rowPrefix + "<" + type + "\n" + rowPrefix + "  " + properties.join("\n" + rowPrefix + "  ") + "\n" + rowPrefix + ">\n";
      }
      function describePropertiesDiff(clientObject, serverObject, indent) {
        var properties = "", remainingServerProperties = assign({}, serverObject), propName;
        for (propName in clientObject) if (clientObject.hasOwnProperty(propName)) {
          delete remainingServerProperties[propName];
          var maxLength = 120 - 2 * indent - propName.length - 2, clientPropValue = describeValue(clientObject[propName], maxLength);
          serverObject.hasOwnProperty(propName) ? (maxLength = describeValue(serverObject[propName], maxLength), properties += added(indent) + propName + ": " + clientPropValue + "\n", properties += removed(indent) + propName + ": " + maxLength + "\n") : properties += added(indent) + propName + ": " + clientPropValue + "\n";
        }
        for (var _propName in remainingServerProperties) remainingServerProperties.hasOwnProperty(_propName) && (clientObject = describeValue(remainingServerProperties[_propName], 120 - 2 * indent - _propName.length - 2), properties += removed(indent) + _propName + ": " + clientObject + "\n");
        return properties;
      }
      function describeElementDiff(type, clientProps, serverProps, indent) {
        var content = "", serverPropNames = /* @__PURE__ */ new Map();
        for (propName$jscomp$0 in serverProps) serverProps.hasOwnProperty(propName$jscomp$0) && serverPropNames.set(propName$jscomp$0.toLowerCase(), propName$jscomp$0);
        if (1 === serverPropNames.size && serverPropNames.has("children")) content += describeExpandedElement(type, clientProps, indentation(indent));
        else {
          for (var _propName2 in clientProps) if (clientProps.hasOwnProperty(_propName2) && "children" !== _propName2) {
            var maxLength$jscomp$0 = 120 - 2 * (indent + 1) - _propName2.length - 1, serverPropName = serverPropNames.get(_propName2.toLowerCase());
            if (void 0 !== serverPropName) {
              serverPropNames.delete(_propName2.toLowerCase());
              var propName$jscomp$0 = clientProps[_propName2];
              serverPropName = serverProps[serverPropName];
              var clientPropValue = describePropValue(propName$jscomp$0, maxLength$jscomp$0);
              maxLength$jscomp$0 = describePropValue(serverPropName, maxLength$jscomp$0);
              "object" === typeof propName$jscomp$0 && null !== propName$jscomp$0 && "object" === typeof serverPropName && null !== serverPropName && "Object" === objectName(propName$jscomp$0) && "Object" === objectName(serverPropName) && (2 < Object.keys(propName$jscomp$0).length || 2 < Object.keys(serverPropName).length || -1 < clientPropValue.indexOf("...") || -1 < maxLength$jscomp$0.indexOf("...")) ? content += indentation(indent + 1) + _propName2 + "={{\n" + describePropertiesDiff(propName$jscomp$0, serverPropName, indent + 2) + indentation(indent + 1) + "}}\n" : (content += added(indent + 1) + _propName2 + "=" + clientPropValue + "\n", content += removed(indent + 1) + _propName2 + "=" + maxLength$jscomp$0 + "\n");
            } else content += indentation(indent + 1) + _propName2 + "=" + describePropValue(clientProps[_propName2], maxLength$jscomp$0) + "\n";
          }
          serverPropNames.forEach(function(propName) {
            if ("children" !== propName) {
              var maxLength = 120 - 2 * (indent + 1) - propName.length - 1;
              content += removed(indent + 1) + propName + "=" + describePropValue(serverProps[propName], maxLength) + "\n";
            }
          });
          content = "" === content ? indentation(indent) + "<" + type + ">\n" : indentation(indent) + "<" + type + "\n" + content + indentation(indent) + ">\n";
        }
        type = serverProps.children;
        clientProps = clientProps.children;
        if ("string" === typeof type || "number" === typeof type || "bigint" === typeof type) {
          serverPropNames = "";
          if ("string" === typeof clientProps || "number" === typeof clientProps || "bigint" === typeof clientProps) serverPropNames = "" + clientProps;
          content += describeTextDiff(serverPropNames, "" + type, indent + 1);
        } else if ("string" === typeof clientProps || "number" === typeof clientProps || "bigint" === typeof clientProps) content = null == type ? content + describeTextDiff("" + clientProps, null, indent + 1) : content + describeTextDiff("" + clientProps, void 0, indent + 1);
        return content;
      }
      function describeSiblingFiber(fiber, indent) {
        var type = describeFiberType(fiber);
        if (null === type) {
          type = "";
          for (fiber = fiber.child; fiber; ) type += describeSiblingFiber(fiber, indent), fiber = fiber.sibling;
          return type;
        }
        return indentation(indent) + "<" + type + ">\n";
      }
      function describeNode(node, indent) {
        var skipToNode = findNotableNode(node, indent);
        if (skipToNode !== node && (1 !== node.children.length || node.children[0] !== skipToNode)) return indentation(indent) + "...\n" + describeNode(skipToNode, indent + 1);
        skipToNode = "";
        var debugInfo = node.fiber._debugInfo;
        if (debugInfo) for (var i = 0; i < debugInfo.length; i++) {
          var serverComponentName = debugInfo[i].name;
          "string" === typeof serverComponentName && (skipToNode += indentation(indent) + "<" + serverComponentName + ">\n", indent++);
        }
        debugInfo = "";
        i = node.fiber.pendingProps;
        if (6 === node.fiber.tag) debugInfo = describeTextDiff(i, node.serverProps, indent), indent++;
        else if (serverComponentName = describeFiberType(node.fiber), null !== serverComponentName) if (void 0 === node.serverProps) {
          debugInfo = indent;
          var maxLength = 120 - 2 * debugInfo - serverComponentName.length - 2, content = "";
          for (propName in i) if (i.hasOwnProperty(propName) && "children" !== propName) {
            var propValue = describePropValue(i[propName], 15);
            maxLength -= propName.length + propValue.length + 2;
            if (0 > maxLength) {
              content += " ...";
              break;
            }
            content += " " + propName + "=" + propValue;
          }
          debugInfo = indentation(debugInfo) + "<" + serverComponentName + content + ">\n";
          indent++;
        } else null === node.serverProps ? (debugInfo = describeExpandedElement(serverComponentName, i, added(indent)), indent++) : "string" === typeof node.serverProps ? console.error("Should not have matched a non HostText fiber to a Text node. This is a bug in React.") : (debugInfo = describeElementDiff(serverComponentName, i, node.serverProps, indent), indent++);
        var propName = "";
        i = node.fiber.child;
        for (serverComponentName = 0; i && serverComponentName < node.children.length; ) maxLength = node.children[serverComponentName], maxLength.fiber === i ? (propName += describeNode(maxLength, indent), serverComponentName++) : propName += describeSiblingFiber(i, indent), i = i.sibling;
        i && 0 < node.children.length && (propName += indentation(indent) + "...\n");
        i = node.serverTail;
        null === node.serverProps && indent--;
        for (node = 0; node < i.length; node++) serverComponentName = i[node], propName = "string" === typeof serverComponentName ? propName + (removed(indent) + describeTextNode(serverComponentName, 120 - 2 * indent) + "\n") : propName + describeExpandedElement(serverComponentName.type, serverComponentName.props, removed(indent));
        return skipToNode + debugInfo + propName;
      }
      function describeDiff(rootNode) {
        try {
          return "\n\n" + describeNode(rootNode, 0);
        } catch (x) {
          return "";
        }
      }
      function describeAncestors(ancestor, child, props) {
        for (var fiber = child, node = null, distanceFromLeaf = 0; fiber; ) fiber === ancestor && (distanceFromLeaf = 0), node = {
          fiber,
          children: null !== node ? [
            node
          ] : [],
          serverProps: fiber === child ? props : fiber === ancestor ? null : void 0,
          serverTail: [],
          distanceFromLeaf
        }, distanceFromLeaf++, fiber = fiber.return;
        return null !== node ? describeDiff(node).replaceAll(/^[+-]/gm, ">") : "";
      }
      function updatedAncestorInfoDev(oldInfo, tag) {
        var ancestorInfo = assign({}, oldInfo || emptyAncestorInfoDev), info = {
          tag
        };
        -1 !== inScopeTags.indexOf(tag) && (ancestorInfo.aTagInScope = null, ancestorInfo.buttonTagInScope = null, ancestorInfo.nobrTagInScope = null);
        -1 !== buttonScopeTags.indexOf(tag) && (ancestorInfo.pTagInButtonScope = null);
        -1 !== specialTags.indexOf(tag) && "address" !== tag && "div" !== tag && "p" !== tag && (ancestorInfo.listItemTagAutoclosing = null, ancestorInfo.dlItemTagAutoclosing = null);
        ancestorInfo.current = info;
        "form" === tag && (ancestorInfo.formTag = info);
        "a" === tag && (ancestorInfo.aTagInScope = info);
        "button" === tag && (ancestorInfo.buttonTagInScope = info);
        "nobr" === tag && (ancestorInfo.nobrTagInScope = info);
        "p" === tag && (ancestorInfo.pTagInButtonScope = info);
        "li" === tag && (ancestorInfo.listItemTagAutoclosing = info);
        if ("dd" === tag || "dt" === tag) ancestorInfo.dlItemTagAutoclosing = info;
        "#document" === tag || "html" === tag ? ancestorInfo.containerTagInScope = null : ancestorInfo.containerTagInScope || (ancestorInfo.containerTagInScope = info);
        null !== oldInfo || "#document" !== tag && "html" !== tag && "body" !== tag ? true === ancestorInfo.implicitRootScope && (ancestorInfo.implicitRootScope = false) : ancestorInfo.implicitRootScope = true;
        return ancestorInfo;
      }
      function isTagValidWithParent(tag, parentTag, implicitRootScope) {
        switch (parentTag) {
          case "select":
            return "hr" === tag || "option" === tag || "optgroup" === tag || "script" === tag || "template" === tag || "#text" === tag;
          case "optgroup":
            return "option" === tag || "#text" === tag;
          case "option":
            return "#text" === tag;
          case "tr":
            return "th" === tag || "td" === tag || "style" === tag || "script" === tag || "template" === tag;
          case "tbody":
          case "thead":
          case "tfoot":
            return "tr" === tag || "style" === tag || "script" === tag || "template" === tag;
          case "colgroup":
            return "col" === tag || "template" === tag;
          case "table":
            return "caption" === tag || "colgroup" === tag || "tbody" === tag || "tfoot" === tag || "thead" === tag || "style" === tag || "script" === tag || "template" === tag;
          case "head":
            return "base" === tag || "basefont" === tag || "bgsound" === tag || "link" === tag || "meta" === tag || "title" === tag || "noscript" === tag || "noframes" === tag || "style" === tag || "script" === tag || "template" === tag;
          case "html":
            if (implicitRootScope) break;
            return "head" === tag || "body" === tag || "frameset" === tag;
          case "frameset":
            return "frame" === tag;
          case "#document":
            if (!implicitRootScope) return "html" === tag;
        }
        switch (tag) {
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            return "h1" !== parentTag && "h2" !== parentTag && "h3" !== parentTag && "h4" !== parentTag && "h5" !== parentTag && "h6" !== parentTag;
          case "rp":
          case "rt":
            return -1 === impliedEndTags.indexOf(parentTag);
          case "caption":
          case "col":
          case "colgroup":
          case "frameset":
          case "frame":
          case "tbody":
          case "td":
          case "tfoot":
          case "th":
          case "thead":
          case "tr":
            return null == parentTag;
          case "head":
            return implicitRootScope || null === parentTag;
          case "html":
            return implicitRootScope && "#document" === parentTag || null === parentTag;
          case "body":
            return implicitRootScope && ("#document" === parentTag || "html" === parentTag) || null === parentTag;
        }
        return true;
      }
      function findInvalidAncestorForTag(tag, ancestorInfo) {
        switch (tag) {
          case "address":
          case "article":
          case "aside":
          case "blockquote":
          case "center":
          case "details":
          case "dialog":
          case "dir":
          case "div":
          case "dl":
          case "fieldset":
          case "figcaption":
          case "figure":
          case "footer":
          case "header":
          case "hgroup":
          case "main":
          case "menu":
          case "nav":
          case "ol":
          case "p":
          case "section":
          case "summary":
          case "ul":
          case "pre":
          case "listing":
          case "table":
          case "hr":
          case "xmp":
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            return ancestorInfo.pTagInButtonScope;
          case "form":
            return ancestorInfo.formTag || ancestorInfo.pTagInButtonScope;
          case "li":
            return ancestorInfo.listItemTagAutoclosing;
          case "dd":
          case "dt":
            return ancestorInfo.dlItemTagAutoclosing;
          case "button":
            return ancestorInfo.buttonTagInScope;
          case "a":
            return ancestorInfo.aTagInScope;
          case "nobr":
            return ancestorInfo.nobrTagInScope;
        }
        return null;
      }
      function findAncestor(parent, tagName) {
        for (; parent; ) {
          switch (parent.tag) {
            case 5:
            case 26:
            case 27:
              if (parent.type === tagName) return parent;
          }
          parent = parent.return;
        }
        return null;
      }
      function validateDOMNesting(childTag, ancestorInfo) {
        ancestorInfo = ancestorInfo || emptyAncestorInfoDev;
        var parentInfo = ancestorInfo.current;
        ancestorInfo = (parentInfo = isTagValidWithParent(childTag, parentInfo && parentInfo.tag, ancestorInfo.implicitRootScope) ? null : parentInfo) ? null : findInvalidAncestorForTag(childTag, ancestorInfo);
        ancestorInfo = parentInfo || ancestorInfo;
        if (!ancestorInfo) return true;
        var ancestorTag = ancestorInfo.tag;
        ancestorInfo = String(!!parentInfo) + "|" + childTag + "|" + ancestorTag;
        if (didWarn[ancestorInfo]) return false;
        didWarn[ancestorInfo] = true;
        var ancestor = (ancestorInfo = current) ? findAncestor(ancestorInfo.return, ancestorTag) : null, ancestorDescription = null !== ancestorInfo && null !== ancestor ? describeAncestors(ancestor, ancestorInfo, null) : "", tagDisplayName = "<" + childTag + ">";
        parentInfo ? (parentInfo = "", "table" === ancestorTag && "tr" === childTag && (parentInfo += " Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by the browser."), console.error("In HTML, %s cannot be a child of <%s>.%s\nThis will cause a hydration error.%s", tagDisplayName, ancestorTag, parentInfo, ancestorDescription)) : console.error("In HTML, %s cannot be a descendant of <%s>.\nThis will cause a hydration error.%s", tagDisplayName, ancestorTag, ancestorDescription);
        ancestorInfo && (childTag = ancestorInfo.return, null === ancestor || null === childTag || ancestor === childTag && childTag._debugOwner === ancestorInfo._debugOwner || runWithFiberInDEV(ancestor, function() {
          console.error("<%s> cannot contain a nested %s.\nSee this log for the ancestor stack trace.", ancestorTag, tagDisplayName);
        }));
        return false;
      }
      function validateTextNesting(childText, parentTag, implicitRootScope) {
        if (implicitRootScope || isTagValidWithParent("#text", parentTag, false)) return true;
        implicitRootScope = "#text|" + parentTag;
        if (didWarn[implicitRootScope]) return false;
        didWarn[implicitRootScope] = true;
        var ancestor = (implicitRootScope = current) ? findAncestor(implicitRootScope, parentTag) : null;
        implicitRootScope = null !== implicitRootScope && null !== ancestor ? describeAncestors(ancestor, implicitRootScope, 6 !== implicitRootScope.tag ? {
          children: null
        } : null) : "";
        /\S/.test(childText) ? console.error("In HTML, text nodes cannot be a child of <%s>.\nThis will cause a hydration error.%s", parentTag, implicitRootScope) : console.error("In HTML, whitespace text nodes cannot be a child of <%s>. Make sure you don't have any extra whitespace between tags on each line of your source code.\nThis will cause a hydration error.%s", parentTag, implicitRootScope);
        return false;
      }
      function setTextContent(node, text) {
        if (text) {
          var firstChild = node.firstChild;
          if (firstChild && firstChild === node.lastChild && 3 === firstChild.nodeType) {
            firstChild.nodeValue = text;
            return;
          }
        }
        node.textContent = text;
      }
      function camelize(string) {
        return string.replace(hyphenPattern, function(_, character) {
          return character.toUpperCase();
        });
      }
      function setValueForStyle(style2, styleName, value) {
        var isCustomProperty = 0 === styleName.indexOf("--");
        isCustomProperty || (-1 < styleName.indexOf("-") ? warnedStyleNames.hasOwnProperty(styleName) && warnedStyleNames[styleName] || (warnedStyleNames[styleName] = true, console.error("Unsupported style property %s. Did you mean %s?", styleName, camelize(styleName.replace(msPattern, "ms-")))) : badVendoredStyleNamePattern.test(styleName) ? warnedStyleNames.hasOwnProperty(styleName) && warnedStyleNames[styleName] || (warnedStyleNames[styleName] = true, console.error("Unsupported vendor-prefixed style property %s. Did you mean %s?", styleName, styleName.charAt(0).toUpperCase() + styleName.slice(1))) : !badStyleValueWithSemicolonPattern.test(value) || warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value] || (warnedStyleValues[value] = true, console.error(`Style property values shouldn't contain a semicolon. Try "%s: %s" instead.`, styleName, value.replace(badStyleValueWithSemicolonPattern, ""))), "number" === typeof value && (isNaN(value) ? warnedForNaNValue || (warnedForNaNValue = true, console.error("`NaN` is an invalid value for the `%s` css style property.", styleName)) : isFinite(value) || warnedForInfinityValue || (warnedForInfinityValue = true, console.error("`Infinity` is an invalid value for the `%s` css style property.", styleName))));
        null == value || "boolean" === typeof value || "" === value ? isCustomProperty ? style2.setProperty(styleName, "") : "float" === styleName ? style2.cssFloat = "" : style2[styleName] = "" : isCustomProperty ? style2.setProperty(styleName, value) : "number" !== typeof value || 0 === value || unitlessNumbers.has(styleName) ? "float" === styleName ? style2.cssFloat = value : (checkCSSPropertyStringCoercion(value, styleName), style2[styleName] = ("" + value).trim()) : style2[styleName] = value + "px";
      }
      function setValueForStyles(node, styles, prevStyles) {
        if (null != styles && "object" !== typeof styles) throw Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
        styles && Object.freeze(styles);
        node = node.style;
        if (null != prevStyles) {
          if (styles) {
            var expandedUpdates = {};
            if (prevStyles) {
              for (var key in prevStyles) if (prevStyles.hasOwnProperty(key) && !styles.hasOwnProperty(key)) for (var longhands = shorthandToLonghand[key] || [
                key
              ], i = 0; i < longhands.length; i++) expandedUpdates[longhands[i]] = key;
            }
            for (var _key in styles) if (styles.hasOwnProperty(_key) && (!prevStyles || prevStyles[_key] !== styles[_key])) for (key = shorthandToLonghand[_key] || [
              _key
            ], longhands = 0; longhands < key.length; longhands++) expandedUpdates[key[longhands]] = _key;
            _key = {};
            for (var key$jscomp$0 in styles) for (key = shorthandToLonghand[key$jscomp$0] || [
              key$jscomp$0
            ], longhands = 0; longhands < key.length; longhands++) _key[key[longhands]] = key$jscomp$0;
            key$jscomp$0 = {};
            for (var _key2 in expandedUpdates) if (key = expandedUpdates[_key2], (longhands = _key[_key2]) && key !== longhands && (i = key + "," + longhands, !key$jscomp$0[i])) {
              key$jscomp$0[i] = true;
              i = console;
              var value = styles[key];
              i.error.call(i, "%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.", null == value || "boolean" === typeof value || "" === value ? "Removing" : "Updating", key, longhands);
            }
          }
          for (var styleName in prevStyles) !prevStyles.hasOwnProperty(styleName) || null != styles && styles.hasOwnProperty(styleName) || (0 === styleName.indexOf("--") ? node.setProperty(styleName, "") : "float" === styleName ? node.cssFloat = "" : node[styleName] = "");
          for (var _styleName in styles) _key2 = styles[_styleName], styles.hasOwnProperty(_styleName) && prevStyles[_styleName] !== _key2 && setValueForStyle(node, _styleName, _key2);
        } else for (expandedUpdates in styles) styles.hasOwnProperty(expandedUpdates) && setValueForStyle(node, expandedUpdates, styles[expandedUpdates]);
      }
      function isCustomElement(tagName) {
        if (-1 === tagName.indexOf("-")) return false;
        switch (tagName) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      function getAttributeAlias(name) {
        return aliases.get(name) || name;
      }
      function validateProperty$1(tagName, name) {
        if (hasOwnProperty.call(warnedProperties$1, name) && warnedProperties$1[name]) return true;
        if (rARIACamel$1.test(name)) {
          tagName = "aria-" + name.slice(4).toLowerCase();
          tagName = ariaProperties.hasOwnProperty(tagName) ? tagName : null;
          if (null == tagName) return console.error("Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.", name), warnedProperties$1[name] = true;
          if (name !== tagName) return console.error("Invalid ARIA attribute `%s`. Did you mean `%s`?", name, tagName), warnedProperties$1[name] = true;
        }
        if (rARIA$1.test(name)) {
          tagName = name.toLowerCase();
          tagName = ariaProperties.hasOwnProperty(tagName) ? tagName : null;
          if (null == tagName) return warnedProperties$1[name] = true, false;
          name !== tagName && (console.error("Unknown ARIA attribute `%s`. Did you mean `%s`?", name, tagName), warnedProperties$1[name] = true);
        }
        return true;
      }
      function validateProperties$2(type, props) {
        var invalidProps = [], key;
        for (key in props) validateProperty$1(type, key) || invalidProps.push(key);
        props = invalidProps.map(function(prop) {
          return "`" + prop + "`";
        }).join(", ");
        1 === invalidProps.length ? console.error("Invalid aria prop %s on <%s> tag. For details, see https://react.dev/link/invalid-aria-props", props, type) : 1 < invalidProps.length && console.error("Invalid aria props %s on <%s> tag. For details, see https://react.dev/link/invalid-aria-props", props, type);
      }
      function validateProperty(tagName, name, value, eventRegistry) {
        if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) return true;
        var lowerCasedName = name.toLowerCase();
        if ("onfocusin" === lowerCasedName || "onfocusout" === lowerCasedName) return console.error("React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React."), warnedProperties[name] = true;
        if ("function" === typeof value && ("form" === tagName && "action" === name || "input" === tagName && "formAction" === name || "button" === tagName && "formAction" === name)) return true;
        if (null != eventRegistry) {
          tagName = eventRegistry.possibleRegistrationNames;
          if (eventRegistry.registrationNameDependencies.hasOwnProperty(name)) return true;
          eventRegistry = tagName.hasOwnProperty(lowerCasedName) ? tagName[lowerCasedName] : null;
          if (null != eventRegistry) return console.error("Invalid event handler property `%s`. Did you mean `%s`?", name, eventRegistry), warnedProperties[name] = true;
          if (EVENT_NAME_REGEX.test(name)) return console.error("Unknown event handler property `%s`. It will be ignored.", name), warnedProperties[name] = true;
        } else if (EVENT_NAME_REGEX.test(name)) return INVALID_EVENT_NAME_REGEX.test(name) && console.error("Invalid event handler property `%s`. React events use the camelCase naming convention, for example `onClick`.", name), warnedProperties[name] = true;
        if (rARIA.test(name) || rARIACamel.test(name)) return true;
        if ("innerhtml" === lowerCasedName) return console.error("Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`."), warnedProperties[name] = true;
        if ("aria" === lowerCasedName) return console.error("The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead."), warnedProperties[name] = true;
        if ("is" === lowerCasedName && null !== value && void 0 !== value && "string" !== typeof value) return console.error("Received a `%s` for a string attribute `is`. If this is expected, cast the value to a string.", typeof value), warnedProperties[name] = true;
        if ("number" === typeof value && isNaN(value)) return console.error("Received NaN for the `%s` attribute. If this is expected, cast the value to a string.", name), warnedProperties[name] = true;
        if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
          if (lowerCasedName = possibleStandardNames[lowerCasedName], lowerCasedName !== name) return console.error("Invalid DOM property `%s`. Did you mean `%s`?", name, lowerCasedName), warnedProperties[name] = true;
        } else if (name !== lowerCasedName) return console.error("React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.", name, lowerCasedName), warnedProperties[name] = true;
        switch (name) {
          case "dangerouslySetInnerHTML":
          case "children":
          case "style":
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "defaultValue":
          case "defaultChecked":
          case "innerHTML":
          case "ref":
            return true;
          case "innerText":
          case "textContent":
            return true;
        }
        switch (typeof value) {
          case "boolean":
            switch (name) {
              case "autoFocus":
              case "checked":
              case "multiple":
              case "muted":
              case "selected":
              case "contentEditable":
              case "spellCheck":
              case "draggable":
              case "value":
              case "autoReverse":
              case "externalResourcesRequired":
              case "focusable":
              case "preserveAlpha":
              case "allowFullScreen":
              case "async":
              case "autoPlay":
              case "controls":
              case "default":
              case "defer":
              case "disabled":
              case "disablePictureInPicture":
              case "disableRemotePlayback":
              case "formNoValidate":
              case "hidden":
              case "loop":
              case "noModule":
              case "noValidate":
              case "open":
              case "playsInline":
              case "readOnly":
              case "required":
              case "reversed":
              case "scoped":
              case "seamless":
              case "itemScope":
              case "capture":
              case "download":
              case "inert":
                return true;
              default:
                lowerCasedName = name.toLowerCase().slice(0, 5);
                if ("data-" === lowerCasedName || "aria-" === lowerCasedName) return true;
                value ? console.error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.', value, name, name, value, name) : console.error('Received `%s` for a non-boolean attribute `%s`.\n\nIf you want to write it to the DOM, pass a string instead: %s="%s" or %s={value.toString()}.\n\nIf you used to conditionally omit it with %s={condition && value}, pass %s={condition ? value : undefined} instead.', value, name, name, value, name, name, name);
                return warnedProperties[name] = true;
            }
          case "function":
          case "symbol":
            return warnedProperties[name] = true, false;
          case "string":
            if ("false" === value || "true" === value) {
              switch (name) {
                case "checked":
                case "selected":
                case "multiple":
                case "muted":
                case "allowFullScreen":
                case "async":
                case "autoPlay":
                case "controls":
                case "default":
                case "defer":
                case "disabled":
                case "disablePictureInPicture":
                case "disableRemotePlayback":
                case "formNoValidate":
                case "hidden":
                case "loop":
                case "noModule":
                case "noValidate":
                case "open":
                case "playsInline":
                case "readOnly":
                case "required":
                case "reversed":
                case "scoped":
                case "seamless":
                case "itemScope":
                case "inert":
                  break;
                default:
                  return true;
              }
              console.error("Received the string `%s` for the boolean attribute `%s`. %s Did you mean %s={%s}?", value, name, "false" === value ? "The browser will interpret it as a truthy value." : 'Although this works, it will not work as expected if you pass the string "false".', name, value);
              warnedProperties[name] = true;
            }
        }
        return true;
      }
      function warnUnknownProperties(type, props, eventRegistry) {
        var unknownProps = [], key;
        for (key in props) validateProperty(type, key, props[key], eventRegistry) || unknownProps.push(key);
        props = unknownProps.map(function(prop) {
          return "`" + prop + "`";
        }).join(", ");
        1 === unknownProps.length ? console.error("Invalid value for prop %s on <%s> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior ", props, type) : 1 < unknownProps.length && console.error("Invalid values for props %s on <%s> tag. Either remove them from the element, or pass a string or number value to keep them in the DOM. For details, see https://react.dev/link/attribute-behavior ", props, type);
      }
      function sanitizeURL(url) {
        return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
      }
      function noop$1() {
      }
      function getEventTarget(nativeEvent) {
        nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
        nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement);
        return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
      }
      function restoreStateOfTarget(target) {
        var internalInstance = getInstanceFromNode(target);
        if (internalInstance && (target = internalInstance.stateNode)) {
          var props = target[internalPropsKey] || null;
          a: switch (target = internalInstance.stateNode, internalInstance.type) {
            case "input":
              updateInput(target, props.value, props.defaultValue, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name);
              internalInstance = props.name;
              if ("radio" === props.type && null != internalInstance) {
                for (props = target; props.parentNode; ) props = props.parentNode;
                checkAttributeStringCoercion(internalInstance, "name");
                props = props.querySelectorAll('input[name="' + escapeSelectorAttributeValueInsideDoubleQuotes("" + internalInstance) + '"][type="radio"]');
                for (internalInstance = 0; internalInstance < props.length; internalInstance++) {
                  var otherNode = props[internalInstance];
                  if (otherNode !== target && otherNode.form === target.form) {
                    var otherProps = otherNode[internalPropsKey] || null;
                    if (!otherProps) throw Error("ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.");
                    updateInput(otherNode, otherProps.value, otherProps.defaultValue, otherProps.defaultValue, otherProps.checked, otherProps.defaultChecked, otherProps.type, otherProps.name);
                  }
                }
                for (internalInstance = 0; internalInstance < props.length; internalInstance++) otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
              }
              break a;
            case "textarea":
              updateTextarea(target, props.value, props.defaultValue);
              break a;
            case "select":
              internalInstance = props.value, null != internalInstance && updateOptions(target, !!props.multiple, internalInstance, false);
          }
        }
      }
      function batchedUpdates$1(fn, a, b) {
        if (isInsideEventHandler) return fn(a, b);
        isInsideEventHandler = true;
        try {
          var JSCompiler_inline_result = fn(a);
          return JSCompiler_inline_result;
        } finally {
          if (isInsideEventHandler = false, null !== restoreTarget || null !== restoreQueue) {
            if (flushSyncWork$1(), restoreTarget && (a = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a), fn)) for (a = 0; a < fn.length; a++) restoreStateOfTarget(fn[a]);
          }
        }
      }
      function getListener(inst, registrationName) {
        var stateNode = inst.stateNode;
        if (null === stateNode) return null;
        var props = stateNode[internalPropsKey] || null;
        if (null === props) return null;
        stateNode = props[registrationName];
        a: switch (registrationName) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (props = !props.disabled) || (inst = inst.type, props = !("button" === inst || "input" === inst || "select" === inst || "textarea" === inst));
            inst = !props;
            break a;
          default:
            inst = false;
        }
        if (inst) return null;
        if (stateNode && "function" !== typeof stateNode) throw Error("Expected `" + registrationName + "` listener to be a function, instead got a value of `" + typeof stateNode + "` type.");
        return stateNode;
      }
      function getData() {
        if (fallbackText) return fallbackText;
        var start, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
        for (start = 0; start < startLength && startValue[start] === endValue[start]; start++) ;
        var minEnd = startLength - start;
        for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++) ;
        return fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0);
      }
      function getEventCharCode(nativeEvent) {
        var keyCode = nativeEvent.keyCode;
        "charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, 0 === nativeEvent && 13 === keyCode && (nativeEvent = 13)) : nativeEvent = keyCode;
        10 === nativeEvent && (nativeEvent = 13);
        return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
      }
      function functionThatReturnsTrue() {
        return true;
      }
      function functionThatReturnsFalse() {
        return false;
      }
      function createSyntheticEvent(Interface) {
        function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
          this._reactName = reactName;
          this._targetInst = targetInst;
          this.type = reactEventType;
          this.nativeEvent = nativeEvent;
          this.target = nativeEventTarget;
          this.currentTarget = null;
          for (var propName in Interface) Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
          this.isDefaultPrevented = (null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : false === nativeEvent.returnValue) ? functionThatReturnsTrue : functionThatReturnsFalse;
          this.isPropagationStopped = functionThatReturnsFalse;
          return this;
        }
        assign(SyntheticBaseEvent.prototype, {
          preventDefault: function() {
            this.defaultPrevented = true;
            var event = this.nativeEvent;
            event && (event.preventDefault ? event.preventDefault() : "unknown" !== typeof event.returnValue && (event.returnValue = false), this.isDefaultPrevented = functionThatReturnsTrue);
          },
          stopPropagation: function() {
            var event = this.nativeEvent;
            event && (event.stopPropagation ? event.stopPropagation() : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = true), this.isPropagationStopped = functionThatReturnsTrue);
          },
          persist: function() {
          },
          isPersistent: functionThatReturnsTrue
        });
        return SyntheticBaseEvent;
      }
      function modifierStateGetter(keyArg) {
        var nativeEvent = this.nativeEvent;
        return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : false;
      }
      function getEventModifierState() {
        return modifierStateGetter;
      }
      function isFallbackCompositionEnd(domEventName, nativeEvent) {
        switch (domEventName) {
          case "keyup":
            return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
          case "keydown":
            return nativeEvent.keyCode !== START_KEYCODE;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function getDataFromCustomEvent(nativeEvent) {
        nativeEvent = nativeEvent.detail;
        return "object" === typeof nativeEvent && "data" in nativeEvent ? nativeEvent.data : null;
      }
      function getNativeBeforeInputChars(domEventName, nativeEvent) {
        switch (domEventName) {
          case "compositionend":
            return getDataFromCustomEvent(nativeEvent);
          case "keypress":
            if (nativeEvent.which !== SPACEBAR_CODE) return null;
            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;
          case "textInput":
            return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
          default:
            return null;
        }
      }
      function getFallbackBeforeInputChars(domEventName, nativeEvent) {
        if (isComposing) return "compositionend" === domEventName || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = false, domEventName) : null;
        switch (domEventName) {
          case "paste":
            return null;
          case "keypress":
            if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
              if (nativeEvent.char && 1 < nativeEvent.char.length) return nativeEvent.char;
              if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
            }
            return null;
          case "compositionend":
            return useFallbackCompositionData && "ko" !== nativeEvent.locale ? null : nativeEvent.data;
          default:
            return null;
        }
      }
      function isTextInputElement(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return "input" === nodeName ? !!supportedInputTypes[elem.type] : "textarea" === nodeName ? true : false;
      }
      function isEventSupported(eventNameSuffix) {
        if (!canUseDOM) return false;
        eventNameSuffix = "on" + eventNameSuffix;
        var isSupported = eventNameSuffix in document;
        isSupported || (isSupported = document.createElement("div"), isSupported.setAttribute(eventNameSuffix, "return;"), isSupported = "function" === typeof isSupported[eventNameSuffix]);
        return isSupported;
      }
      function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [
          target
        ] : restoreTarget = target;
        inst = accumulateTwoPhaseListeners(inst, "onChange");
        0 < inst.length && (nativeEvent = new SyntheticEvent("onChange", "change", null, nativeEvent, target), dispatchQueue.push({
          event: nativeEvent,
          listeners: inst
        }));
      }
      function runEventInBatch(dispatchQueue) {
        processDispatchQueue(dispatchQueue, 0);
      }
      function getInstIfValueChanged(targetInst) {
        var targetNode = getNodeFromInstance(targetInst);
        if (updateValueIfChanged(targetNode)) return targetInst;
      }
      function getTargetInstForChangeEvent(domEventName, targetInst) {
        if ("change" === domEventName) return targetInst;
      }
      function stopWatchingForValueChange() {
        activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
      }
      function handlePropertyChange(nativeEvent) {
        if ("value" === nativeEvent.propertyName && getInstIfValueChanged(activeElementInst$1)) {
          var dispatchQueue = [];
          createAndAccumulateChangeEvent(dispatchQueue, activeElementInst$1, nativeEvent, getEventTarget(nativeEvent));
          batchedUpdates$1(runEventInBatch, dispatchQueue);
        }
      }
      function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
        "focusin" === domEventName ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : "focusout" === domEventName && stopWatchingForValueChange();
      }
      function getTargetInstForInputEventPolyfill(domEventName) {
        if ("selectionchange" === domEventName || "keyup" === domEventName || "keydown" === domEventName) return getInstIfValueChanged(activeElementInst$1);
      }
      function getTargetInstForClickEvent(domEventName, targetInst) {
        if ("click" === domEventName) return getInstIfValueChanged(targetInst);
      }
      function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
        if ("input" === domEventName || "change" === domEventName) return getInstIfValueChanged(targetInst);
      }
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      function shallowEqual(objA, objB) {
        if (objectIs(objA, objB)) return true;
        if ("object" !== typeof objA || null === objA || "object" !== typeof objB || null === objB) return false;
        var keysA = Object.keys(objA), keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;
        for (keysB = 0; keysB < keysA.length; keysB++) {
          var currentKey = keysA[keysB];
          if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey])) return false;
        }
        return true;
      }
      function getLeafNode(node) {
        for (; node && node.firstChild; ) node = node.firstChild;
        return node;
      }
      function getNodeForCharacterOffset(root2, offset) {
        var node = getLeafNode(root2);
        root2 = 0;
        for (var nodeEnd; node; ) {
          if (3 === node.nodeType) {
            nodeEnd = root2 + node.textContent.length;
            if (root2 <= offset && nodeEnd >= offset) return {
              node,
              offset: offset - root2
            };
            root2 = nodeEnd;
          }
          a: {
            for (; node; ) {
              if (node.nextSibling) {
                node = node.nextSibling;
                break a;
              }
              node = node.parentNode;
            }
            node = void 0;
          }
          node = getLeafNode(node);
        }
      }
      function containsNode(outerNode, innerNode) {
        return outerNode && innerNode ? outerNode === innerNode ? true : outerNode && 3 === outerNode.nodeType ? false : innerNode && 3 === innerNode.nodeType ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : false : false;
      }
      function getActiveElementDeep(containerInfo) {
        containerInfo = null != containerInfo && null != containerInfo.ownerDocument && null != containerInfo.ownerDocument.defaultView ? containerInfo.ownerDocument.defaultView : window;
        for (var element = getActiveElement(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement; ) {
          try {
            var JSCompiler_inline_result = "string" === typeof element.contentWindow.location.href;
          } catch (err) {
            JSCompiler_inline_result = false;
          }
          if (JSCompiler_inline_result) containerInfo = element.contentWindow;
          else break;
          element = getActiveElement(containerInfo.document);
        }
        return element;
      }
      function hasSelectionCapabilities(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName && ("input" === nodeName && ("text" === elem.type || "search" === elem.type || "tel" === elem.type || "url" === elem.type || "password" === elem.type) || "textarea" === nodeName || "true" === elem.contentEditable);
      }
      function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
        var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : 9 === nativeEventTarget.nodeType ? nativeEventTarget : nativeEventTarget.ownerDocument;
        mouseDown || null == activeElement || activeElement !== getActiveElement(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = {
          start: doc.selectionStart,
          end: doc.selectionEnd
        } : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        }), lastSelection && shallowEqual(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent("onSelect", "select", null, nativeEvent, nativeEventTarget), dispatchQueue.push({
          event: nativeEvent,
          listeners: doc
        }), nativeEvent.target = activeElement)));
      }
      function makePrefixMap(styleProp, eventName) {
        var prefixes = {};
        prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
        prefixes["Webkit" + styleProp] = "webkit" + eventName;
        prefixes["Moz" + styleProp] = "moz" + eventName;
        return prefixes;
      }
      function getVendorPrefixedEventName(eventName) {
        if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
        if (!vendorPrefixes[eventName]) return eventName;
        var prefixMap = vendorPrefixes[eventName], styleProp;
        for (styleProp in prefixMap) if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) return prefixedEventNames[eventName] = prefixMap[styleProp];
        return eventName;
      }
      function registerSimpleEvent(domEventName, reactName) {
        topLevelEventsToReactNames.set(domEventName, reactName);
        registerTwoPhaseEvent(reactName, [
          domEventName
        ]);
      }
      function getArrayKind(array) {
        for (var kind = EMPTY_ARRAY, i = 0; i < array.length; i++) {
          var value = array[i];
          if ("object" === typeof value && null !== value) if (isArrayImpl(value) && 2 === value.length && "string" === typeof value[0]) {
            if (kind !== EMPTY_ARRAY && kind !== ENTRIES_ARRAY) return COMPLEX_ARRAY;
            kind = ENTRIES_ARRAY;
          } else return COMPLEX_ARRAY;
          else {
            if ("function" === typeof value || "string" === typeof value && 50 < value.length || kind !== EMPTY_ARRAY && kind !== PRIMITIVE_ARRAY) return COMPLEX_ARRAY;
            kind = PRIMITIVE_ARRAY;
          }
        }
        return kind;
      }
      function addObjectToProperties(object, properties, indent, prefix2) {
        for (var key in object) hasOwnProperty.call(object, key) && "_" !== key[0] && addValueToProperties(key, object[key], properties, indent, prefix2);
      }
      function addValueToProperties(propertyName, value, properties, indent, prefix2) {
        switch (typeof value) {
          case "object":
            if (null === value) {
              value = "null";
              break;
            } else {
              if (value.$$typeof === REACT_ELEMENT_TYPE) {
                var typeName2 = getComponentNameFromType(value.type) || "\u2026", key = value.key;
                value = value.props;
                var propsKeys = Object.keys(value), propsLength = propsKeys.length;
                if (null == key && 0 === propsLength) {
                  value = "<" + typeName2 + " />";
                  break;
                }
                if (3 > indent || 1 === propsLength && "children" === propsKeys[0] && null == key) {
                  value = "<" + typeName2 + " \u2026 />";
                  break;
                }
                properties.push([
                  prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
                  "<" + typeName2
                ]);
                null !== key && addValueToProperties("key", key, properties, indent + 1, prefix2);
                propertyName = false;
                for (var propKey in value) "children" === propKey ? null != value.children && (!isArrayImpl(value.children) || 0 < value.children.length) && (propertyName = true) : hasOwnProperty.call(value, propKey) && "_" !== propKey[0] && addValueToProperties(propKey, value[propKey], properties, indent + 1, prefix2);
                properties.push([
                  "",
                  propertyName ? ">\u2026</" + typeName2 + ">" : "/>"
                ]);
                return;
              }
              typeName2 = Object.prototype.toString.call(value);
              typeName2 = typeName2.slice(8, typeName2.length - 1);
              if ("Array" === typeName2) {
                if (propKey = getArrayKind(value), propKey === PRIMITIVE_ARRAY || propKey === EMPTY_ARRAY) {
                  value = JSON.stringify(value);
                  break;
                } else if (propKey === ENTRIES_ARRAY) {
                  properties.push([
                    prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
                    ""
                  ]);
                  for (propertyName = 0; propertyName < value.length; propertyName++) typeName2 = value[propertyName], addValueToProperties(typeName2[0], typeName2[1], properties, indent + 1, prefix2);
                  return;
                }
              }
              if ("Promise" === typeName2) {
                if ("fulfilled" === value.status) {
                  if (typeName2 = properties.length, addValueToProperties(propertyName, value.value, properties, indent, prefix2), properties.length > typeName2) {
                    properties = properties[typeName2];
                    properties[1] = "Promise<" + (properties[1] || "Object") + ">";
                    return;
                  }
                } else if ("rejected" === value.status && (typeName2 = properties.length, addValueToProperties(propertyName, value.reason, properties, indent, prefix2), properties.length > typeName2)) {
                  properties = properties[typeName2];
                  properties[1] = "Rejected Promise<" + properties[1] + ">";
                  return;
                }
                properties.push([
                  "\xA0\xA0".repeat(indent) + propertyName,
                  "Promise"
                ]);
                return;
              }
              "Object" === typeName2 && (propKey = Object.getPrototypeOf(value)) && "function" === typeof propKey.constructor && (typeName2 = propKey.constructor.name);
              properties.push([
                prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
                "Object" === typeName2 ? 3 > indent ? "" : "\u2026" : typeName2
              ]);
              3 > indent && addObjectToProperties(value, properties, indent + 1, prefix2);
              return;
            }
          case "function":
            value = "" === value.name ? "() => {}" : value.name + "() {}";
            break;
          case "string":
            value = value === OMITTED_PROP_ERROR ? "\u2026" : JSON.stringify(value);
            break;
          case "undefined":
            value = "undefined";
            break;
          case "boolean":
            value = value ? "true" : "false";
            break;
          default:
            value = String(value);
        }
        properties.push([
          prefix2 + "\xA0\xA0".repeat(indent) + propertyName,
          value
        ]);
      }
      function addObjectDiffToProperties(prev, next, properties, indent) {
        var isDeeplyEqual = true;
        for (key in prev) key in next || (properties.push([
          REMOVED + "\xA0\xA0".repeat(indent) + key,
          "\u2026"
        ]), isDeeplyEqual = false);
        for (var _key in next) if (_key in prev) {
          var key = prev[_key];
          var nextValue = next[_key];
          if (key !== nextValue) {
            if (0 === indent && "children" === _key) isDeeplyEqual = "\xA0\xA0".repeat(indent) + _key, properties.push([
              REMOVED + isDeeplyEqual,
              "\u2026"
            ], [
              ADDED + isDeeplyEqual,
              "\u2026"
            ]);
            else {
              if (!(3 <= indent)) {
                if ("object" === typeof key && "object" === typeof nextValue && null !== key && null !== nextValue && key.$$typeof === nextValue.$$typeof) if (nextValue.$$typeof === REACT_ELEMENT_TYPE) {
                  if (key.type === nextValue.type && key.key === nextValue.key) {
                    key = getComponentNameFromType(nextValue.type) || "\u2026";
                    isDeeplyEqual = "\xA0\xA0".repeat(indent) + _key;
                    key = "<" + key + " \u2026 />";
                    properties.push([
                      REMOVED + isDeeplyEqual,
                      key
                    ], [
                      ADDED + isDeeplyEqual,
                      key
                    ]);
                    isDeeplyEqual = false;
                    continue;
                  }
                } else {
                  var prevKind = Object.prototype.toString.call(key), nextKind = Object.prototype.toString.call(nextValue);
                  if (prevKind === nextKind && ("[object Object]" === nextKind || "[object Array]" === nextKind)) {
                    prevKind = [
                      UNCHANGED + "\xA0\xA0".repeat(indent) + _key,
                      "[object Array]" === nextKind ? "Array" : ""
                    ];
                    properties.push(prevKind);
                    nextKind = properties.length;
                    addObjectDiffToProperties(key, nextValue, properties, indent + 1) ? nextKind === properties.length && (prevKind[1] = "Referentially unequal but deeply equal objects. Consider memoization.") : isDeeplyEqual = false;
                    continue;
                  }
                }
                else if ("function" === typeof key && "function" === typeof nextValue && key.name === nextValue.name && key.length === nextValue.length && (prevKind = Function.prototype.toString.call(key), nextKind = Function.prototype.toString.call(nextValue), prevKind === nextKind)) {
                  key = "" === nextValue.name ? "() => {}" : nextValue.name + "() {}";
                  properties.push([
                    UNCHANGED + "\xA0\xA0".repeat(indent) + _key,
                    key + " Referentially unequal function closure. Consider memoization."
                  ]);
                  continue;
                }
              }
              addValueToProperties(_key, key, properties, indent, REMOVED);
              addValueToProperties(_key, nextValue, properties, indent, ADDED);
            }
            isDeeplyEqual = false;
          }
        } else properties.push([
          ADDED + "\xA0\xA0".repeat(indent) + _key,
          "\u2026"
        ]), isDeeplyEqual = false;
        return isDeeplyEqual;
      }
      function setCurrentTrackFromLanes(lanes) {
        currentTrack = lanes & 63 ? "Blocking" : lanes & 64 ? "Gesture" : lanes & 4194176 ? "Transition" : lanes & 62914560 ? "Suspense" : lanes & 2080374784 ? "Idle" : "Other";
      }
      function logComponentTrigger(fiber, startTime, endTime, trigger) {
        supportsUserTiming && (reusableComponentOptions.start = startTime, reusableComponentOptions.end = endTime, reusableComponentDevToolDetails.color = "warning", reusableComponentDevToolDetails.tooltipText = trigger, reusableComponentDevToolDetails.properties = null, (fiber = fiber._debugTask) ? fiber.run(performance.measure.bind(performance, trigger, reusableComponentOptions)) : performance.measure(trigger, reusableComponentOptions));
      }
      function logComponentReappeared(fiber, startTime, endTime) {
        logComponentTrigger(fiber, startTime, endTime, "Reconnect");
      }
      function logComponentRender(fiber, startTime, endTime, wasHydrated, committedLanes) {
        var name = getComponentNameFromFiber(fiber);
        if (null !== name && supportsUserTiming) {
          var alternate = fiber.alternate, selfTime = fiber.actualDuration;
          if (null === alternate || alternate.child !== fiber.child) for (var child = fiber.child; null !== child; child = child.sibling) selfTime -= child.actualDuration;
          wasHydrated = 0.5 > selfTime ? wasHydrated ? "tertiary-light" : "primary-light" : 10 > selfTime ? wasHydrated ? "tertiary" : "primary" : 100 > selfTime ? wasHydrated ? "tertiary-dark" : "primary-dark" : "error";
          var props = fiber.memoizedProps;
          selfTime = fiber._debugTask;
          null !== props && null !== alternate && alternate.memoizedProps !== props ? (child = [
            resuableChangedPropsEntry
          ], props = addObjectDiffToProperties(alternate.memoizedProps, props, child, 0), 1 < child.length && (props && !alreadyWarnedForDeepEquality && 0 === (alternate.lanes & committedLanes) && 100 < fiber.actualDuration ? (alreadyWarnedForDeepEquality = true, child[0] = reusableDeeplyEqualPropsEntry, reusableComponentDevToolDetails.color = "warning", reusableComponentDevToolDetails.tooltipText = DEEP_EQUALITY_WARNING) : (reusableComponentDevToolDetails.color = wasHydrated, reusableComponentDevToolDetails.tooltipText = name), reusableComponentDevToolDetails.properties = child, reusableComponentOptions.start = startTime, reusableComponentOptions.end = endTime, null != selfTime ? selfTime.run(performance.measure.bind(performance, "\u200B" + name, reusableComponentOptions)) : performance.measure("\u200B" + name, reusableComponentOptions))) : null != selfTime ? selfTime.run(console.timeStamp.bind(console, name, startTime, endTime, COMPONENTS_TRACK, void 0, wasHydrated)) : console.timeStamp(name, startTime, endTime, COMPONENTS_TRACK, void 0, wasHydrated);
        }
      }
      function logComponentErrored(fiber, startTime, endTime, errors) {
        if (supportsUserTiming) {
          var name = getComponentNameFromFiber(fiber);
          if (null !== name) {
            for (var debugTask = null, properties = [], i = 0; i < errors.length; i++) {
              var capturedValue = errors[i];
              null == debugTask && null !== capturedValue.source && (debugTask = capturedValue.source._debugTask);
              capturedValue = capturedValue.value;
              properties.push([
                "Error",
                "object" === typeof capturedValue && null !== capturedValue && "string" === typeof capturedValue.message ? String(capturedValue.message) : String(capturedValue)
              ]);
            }
            null !== fiber.key && addValueToProperties("key", fiber.key, properties, 0, "");
            null !== fiber.memoizedProps && addObjectToProperties(fiber.memoizedProps, properties, 0, "");
            null == debugTask && (debugTask = fiber._debugTask);
            fiber = {
              start: startTime,
              end: endTime,
              detail: {
                devtools: {
                  color: "error",
                  track: COMPONENTS_TRACK,
                  tooltipText: 13 === fiber.tag ? "Hydration failed" : "Error boundary caught an error",
                  properties
                }
              }
            };
            debugTask ? debugTask.run(performance.measure.bind(performance, "\u200B" + name, fiber)) : performance.measure("\u200B" + name, fiber);
          }
        }
      }
      function logComponentEffect(fiber, startTime, endTime, selfTime, errors) {
        if (null !== errors) {
          if (supportsUserTiming) {
            var name = getComponentNameFromFiber(fiber);
            if (null !== name) {
              selfTime = [];
              for (var i = 0; i < errors.length; i++) {
                var error = errors[i].value;
                selfTime.push([
                  "Error",
                  "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error)
                ]);
              }
              null !== fiber.key && addValueToProperties("key", fiber.key, selfTime, 0, "");
              null !== fiber.memoizedProps && addObjectToProperties(fiber.memoizedProps, selfTime, 0, "");
              startTime = {
                start: startTime,
                end: endTime,
                detail: {
                  devtools: {
                    color: "error",
                    track: COMPONENTS_TRACK,
                    tooltipText: "A lifecycle or effect errored",
                    properties: selfTime
                  }
                }
              };
              (fiber = fiber._debugTask) ? fiber.run(performance.measure.bind(performance, "\u200B" + name, startTime)) : performance.measure("\u200B" + name, startTime);
            }
          }
        } else name = getComponentNameFromFiber(fiber), null !== name && supportsUserTiming && (errors = 1 > selfTime ? "secondary-light" : 100 > selfTime ? "secondary" : 500 > selfTime ? "secondary-dark" : "error", (fiber = fiber._debugTask) ? fiber.run(console.timeStamp.bind(console, name, startTime, endTime, COMPONENTS_TRACK, void 0, errors)) : console.timeStamp(name, startTime, endTime, COMPONENTS_TRACK, void 0, errors));
      }
      function logRenderPhase(startTime, endTime, lanes, debugTask) {
        if (supportsUserTiming && !(endTime <= startTime)) {
          var color = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark";
          lanes = (lanes & 536870912) === lanes ? "Prepared" : (lanes & 201326741) === lanes ? "Hydrated" : "Render";
          debugTask ? debugTask.run(console.timeStamp.bind(console, lanes, startTime, endTime, currentTrack, LANES_TRACK_GROUP, color)) : console.timeStamp(lanes, startTime, endTime, currentTrack, LANES_TRACK_GROUP, color);
        }
      }
      function logSuspendedRenderPhase(startTime, endTime, lanes, debugTask) {
        !supportsUserTiming || endTime <= startTime || (lanes = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark", debugTask ? debugTask.run(console.timeStamp.bind(console, "Prewarm", startTime, endTime, currentTrack, LANES_TRACK_GROUP, lanes)) : console.timeStamp("Prewarm", startTime, endTime, currentTrack, LANES_TRACK_GROUP, lanes));
      }
      function logSuspendedWithDelayPhase(startTime, endTime, lanes, debugTask) {
        !supportsUserTiming || endTime <= startTime || (lanes = (lanes & 738197653) === lanes ? "tertiary-dark" : "primary-dark", debugTask ? debugTask.run(console.timeStamp.bind(console, "Suspended", startTime, endTime, currentTrack, LANES_TRACK_GROUP, lanes)) : console.timeStamp("Suspended", startTime, endTime, currentTrack, LANES_TRACK_GROUP, lanes));
      }
      function logRecoveredRenderPhase(startTime, endTime, lanes, recoverableErrors, hydrationFailed, debugTask) {
        if (supportsUserTiming && !(endTime <= startTime)) {
          lanes = [];
          for (var i = 0; i < recoverableErrors.length; i++) {
            var error = recoverableErrors[i].value;
            lanes.push([
              "Recoverable Error",
              "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error)
            ]);
          }
          startTime = {
            start: startTime,
            end: endTime,
            detail: {
              devtools: {
                color: "primary-dark",
                track: currentTrack,
                trackGroup: LANES_TRACK_GROUP,
                tooltipText: hydrationFailed ? "Hydration Failed" : "Recovered after Error",
                properties: lanes
              }
            }
          };
          debugTask ? debugTask.run(performance.measure.bind(performance, "Recovered", startTime)) : performance.measure("Recovered", startTime);
        }
      }
      function logErroredRenderPhase(startTime, endTime, lanes, debugTask) {
        !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(console.timeStamp.bind(console, "Errored", startTime, endTime, currentTrack, LANES_TRACK_GROUP, "error")) : console.timeStamp("Errored", startTime, endTime, currentTrack, LANES_TRACK_GROUP, "error"));
      }
      function logSuspendedCommitPhase(startTime, endTime, reason, debugTask) {
        !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(console.timeStamp.bind(console, reason, startTime, endTime, currentTrack, LANES_TRACK_GROUP, "secondary-light")) : console.timeStamp(reason, startTime, endTime, currentTrack, LANES_TRACK_GROUP, "secondary-light"));
      }
      function logCommitErrored(startTime, endTime, errors, passive, debugTask) {
        if (supportsUserTiming && !(endTime <= startTime)) {
          for (var properties = [], i = 0; i < errors.length; i++) {
            var error = errors[i].value;
            properties.push([
              "Error",
              "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error)
            ]);
          }
          startTime = {
            start: startTime,
            end: endTime,
            detail: {
              devtools: {
                color: "error",
                track: currentTrack,
                trackGroup: LANES_TRACK_GROUP,
                tooltipText: passive ? "Remaining Effects Errored" : "Commit Errored",
                properties
              }
            }
          };
          debugTask ? debugTask.run(performance.measure.bind(performance, "Errored", startTime)) : performance.measure("Errored", startTime);
        }
      }
      function logAnimatingPhase(startTime, endTime, debugTask) {
        !supportsUserTiming || endTime <= startTime || (debugTask ? debugTask.run(console.timeStamp.bind(console, "Animating", startTime, endTime, currentTrack, LANES_TRACK_GROUP, "secondary-dark")) : console.timeStamp("Animating", startTime, endTime, currentTrack, LANES_TRACK_GROUP, "secondary-dark"));
      }
      function finishQueueingConcurrentUpdates() {
        for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex; ) {
          var fiber = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var queue = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var update = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var lane = concurrentQueues[i];
          concurrentQueues[i++] = null;
          if (null !== queue && null !== update) {
            var pending = queue.pending;
            null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
            queue.pending = update;
          }
          0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
      }
      function enqueueUpdate$1(fiber, queue, update, lane) {
        concurrentQueues[concurrentQueuesIndex++] = fiber;
        concurrentQueues[concurrentQueuesIndex++] = queue;
        concurrentQueues[concurrentQueuesIndex++] = update;
        concurrentQueues[concurrentQueuesIndex++] = lane;
        concurrentlyUpdatedLanes |= lane;
        fiber.lanes |= lane;
        fiber = fiber.alternate;
        null !== fiber && (fiber.lanes |= lane);
      }
      function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
        enqueueUpdate$1(fiber, queue, update, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function enqueueConcurrentRenderForLane(fiber, lane) {
        enqueueUpdate$1(fiber, null, null, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
        sourceFiber.lanes |= lane;
        var alternate = sourceFiber.alternate;
        null !== alternate && (alternate.lanes |= lane);
        for (var isHidden = false, parent = sourceFiber.return; null !== parent; ) parent.childLanes |= lane, alternate = parent.alternate, null !== alternate && (alternate.childLanes |= lane), 22 === parent.tag && (sourceFiber = parent.stateNode, null === sourceFiber || sourceFiber._visibility & OffscreenVisible || (isHidden = true)), sourceFiber = parent, parent = parent.return;
        return 3 === sourceFiber.tag ? (parent = sourceFiber.stateNode, isHidden && null !== update && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], null === alternate ? sourceFiber[isHidden] = [
          update
        ] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
      }
      function getRootForUpdatedFiber(sourceFiber) {
        if (nestedUpdateCount > NESTED_UPDATE_LIMIT) throw nestedPassiveUpdateCount = nestedUpdateCount = 0, rootWithPassiveNestedUpdates = rootWithNestedUpdates = null, Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
        nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT && (nestedPassiveUpdateCount = 0, rootWithPassiveNestedUpdates = null, console.error("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
        null === sourceFiber.alternate && 0 !== (sourceFiber.flags & 4098) && warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber);
        for (var node = sourceFiber, parent = node.return; null !== parent; ) null === node.alternate && 0 !== (node.flags & 4098) && warnAboutUpdateOnNotYetMountedFiberInDEV(sourceFiber), node = parent, parent = node.return;
        return 3 === node.tag ? node.stateNode : null;
      }
      function resolveFunctionForHotReloading(type) {
        if (null === resolveFamily) return type;
        var family = resolveFamily(type);
        return void 0 === family ? type : family.current;
      }
      function resolveForwardRefForHotReloading(type) {
        if (null === resolveFamily) return type;
        var family = resolveFamily(type);
        return void 0 === family ? null !== type && void 0 !== type && "function" === typeof type.render && (family = resolveFunctionForHotReloading(type.render), type.render !== family) ? (family = {
          $$typeof: REACT_FORWARD_REF_TYPE,
          render: family
        }, void 0 !== type.displayName && (family.displayName = type.displayName), family) : type : family.current;
      }
      function isCompatibleFamilyForHotReloading(fiber, element) {
        if (null === resolveFamily) return false;
        var prevType = fiber.elementType;
        element = element.type;
        var needsCompareFamilies = false, $$typeofNextType = "object" === typeof element && null !== element ? element.$$typeof : null;
        switch (fiber.tag) {
          case 1:
            "function" === typeof element && (needsCompareFamilies = true);
            break;
          case 0:
            "function" === typeof element ? needsCompareFamilies = true : $$typeofNextType === REACT_LAZY_TYPE && (needsCompareFamilies = true);
            break;
          case 11:
            $$typeofNextType === REACT_FORWARD_REF_TYPE ? needsCompareFamilies = true : $$typeofNextType === REACT_LAZY_TYPE && (needsCompareFamilies = true);
            break;
          case 14:
          case 15:
            $$typeofNextType === REACT_MEMO_TYPE ? needsCompareFamilies = true : $$typeofNextType === REACT_LAZY_TYPE && (needsCompareFamilies = true);
            break;
          default:
            return false;
        }
        return needsCompareFamilies && (fiber = resolveFamily(prevType), void 0 !== fiber && fiber === resolveFamily(element)) ? true : false;
      }
      function markFailedErrorBoundaryForHotReloading(fiber) {
        null !== resolveFamily && "function" === typeof WeakSet && (null === failedBoundaries && (failedBoundaries = /* @__PURE__ */ new WeakSet()), failedBoundaries.add(fiber));
      }
      function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {
        do {
          var _fiber = fiber, alternate = _fiber.alternate, child = _fiber.child, sibling = _fiber.sibling, tag = _fiber.tag;
          _fiber = _fiber.type;
          var candidateType = null;
          switch (tag) {
            case 0:
            case 15:
            case 1:
              candidateType = _fiber;
              break;
            case 11:
              candidateType = _fiber.render;
          }
          if (null === resolveFamily) throw Error("Expected resolveFamily to be set during hot reload.");
          var needsRender = false;
          _fiber = false;
          null !== candidateType && (candidateType = resolveFamily(candidateType), void 0 !== candidateType && (staleFamilies.has(candidateType) ? _fiber = true : updatedFamilies.has(candidateType) && (1 === tag ? _fiber = true : needsRender = true)));
          null !== failedBoundaries && (failedBoundaries.has(fiber) || null !== alternate && failedBoundaries.has(alternate)) && (_fiber = true);
          _fiber && (fiber._debugNeedsRemount = true);
          if (_fiber || needsRender) alternate = enqueueConcurrentRenderForLane(fiber, 2), null !== alternate && scheduleUpdateOnFiber(alternate, fiber, 2);
          null === child || _fiber || scheduleFibersWithFamiliesRecursively(child, updatedFamilies, staleFamilies);
          if (null === sibling) break;
          fiber = sibling;
        } while (1);
      }
      function FiberNode(tag, pendingProps, key, mode) {
        this.tag = tag;
        this.key = key;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.refCleanup = this.ref = null;
        this.pendingProps = pendingProps;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = mode;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
        this.actualDuration = -0;
        this.actualStartTime = -1.1;
        this.treeBaseDuration = this.selfBaseDuration = -0;
        this._debugTask = this._debugStack = this._debugOwner = this._debugInfo = null;
        this._debugNeedsRemount = false;
        this._debugHookTypes = null;
        hasBadMapPolyfill || "function" !== typeof Object.preventExtensions || Object.preventExtensions(this);
      }
      function shouldConstruct(Component) {
        Component = Component.prototype;
        return !(!Component || !Component.isReactComponent);
      }
      function createWorkInProgress(current2, pendingProps) {
        var workInProgress2 = current2.alternate;
        null === workInProgress2 ? (workInProgress2 = createFiber(current2.tag, pendingProps, current2.key, current2.mode), workInProgress2.elementType = current2.elementType, workInProgress2.type = current2.type, workInProgress2.stateNode = current2.stateNode, workInProgress2._debugOwner = current2._debugOwner, workInProgress2._debugStack = current2._debugStack, workInProgress2._debugTask = current2._debugTask, workInProgress2._debugHookTypes = current2._debugHookTypes, workInProgress2.alternate = current2, current2.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current2.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.actualDuration = -0, workInProgress2.actualStartTime = -1.1);
        workInProgress2.flags = current2.flags & 65011712;
        workInProgress2.childLanes = current2.childLanes;
        workInProgress2.lanes = current2.lanes;
        workInProgress2.child = current2.child;
        workInProgress2.memoizedProps = current2.memoizedProps;
        workInProgress2.memoizedState = current2.memoizedState;
        workInProgress2.updateQueue = current2.updateQueue;
        pendingProps = current2.dependencies;
        workInProgress2.dependencies = null === pendingProps ? null : {
          lanes: pendingProps.lanes,
          firstContext: pendingProps.firstContext,
          _debugThenableState: pendingProps._debugThenableState
        };
        workInProgress2.sibling = current2.sibling;
        workInProgress2.index = current2.index;
        workInProgress2.ref = current2.ref;
        workInProgress2.refCleanup = current2.refCleanup;
        workInProgress2.selfBaseDuration = current2.selfBaseDuration;
        workInProgress2.treeBaseDuration = current2.treeBaseDuration;
        workInProgress2._debugInfo = current2._debugInfo;
        workInProgress2._debugNeedsRemount = current2._debugNeedsRemount;
        switch (workInProgress2.tag) {
          case 0:
          case 15:
            workInProgress2.type = resolveFunctionForHotReloading(current2.type);
            break;
          case 1:
            workInProgress2.type = resolveFunctionForHotReloading(current2.type);
            break;
          case 11:
            workInProgress2.type = resolveForwardRefForHotReloading(current2.type);
        }
        return workInProgress2;
      }
      function resetWorkInProgress(workInProgress2, renderLanes2) {
        workInProgress2.flags &= 65011714;
        var current2 = workInProgress2.alternate;
        null === current2 ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null, workInProgress2.selfBaseDuration = 0, workInProgress2.treeBaseDuration = 0) : (workInProgress2.childLanes = current2.childLanes, workInProgress2.lanes = current2.lanes, workInProgress2.child = current2.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current2.memoizedProps, workInProgress2.memoizedState = current2.memoizedState, workInProgress2.updateQueue = current2.updateQueue, workInProgress2.type = current2.type, renderLanes2 = current2.dependencies, workInProgress2.dependencies = null === renderLanes2 ? null : {
          lanes: renderLanes2.lanes,
          firstContext: renderLanes2.firstContext,
          _debugThenableState: renderLanes2._debugThenableState
        }, workInProgress2.selfBaseDuration = current2.selfBaseDuration, workInProgress2.treeBaseDuration = current2.treeBaseDuration);
        return workInProgress2;
      }
      function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
        var fiberTag = 0, resolvedType = type;
        if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1), resolvedType = resolveFunctionForHotReloading(resolvedType);
        else if ("string" === typeof type) fiberTag = getHostContext(), fiberTag = isHostHoistableType(type, pendingProps, fiberTag) ? 26 : "html" === type || "head" === type || "body" === type ? 27 : 5;
        else a: switch (type) {
          case REACT_ACTIVITY_TYPE:
            return key = createFiber(31, pendingProps, key, mode), key.elementType = REACT_ACTIVITY_TYPE, key.lanes = lanes, key;
          case REACT_FRAGMENT_TYPE:
            return createFiberFromFragment(pendingProps.children, mode, lanes, key);
          case REACT_STRICT_MODE_TYPE:
            fiberTag = 8;
            mode |= StrictLegacyMode;
            mode |= StrictEffectsMode;
            break;
          case REACT_PROFILER_TYPE:
            return type = pendingProps, owner = mode, "string" !== typeof type.id && console.error('Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.', typeof type.id), key = createFiber(12, type, key, owner | ProfileMode), key.elementType = REACT_PROFILER_TYPE, key.lanes = lanes, key.stateNode = {
              effectDuration: 0,
              passiveEffectDuration: 0
            }, key;
          case REACT_SUSPENSE_TYPE:
            return key = createFiber(13, pendingProps, key, mode), key.elementType = REACT_SUSPENSE_TYPE, key.lanes = lanes, key;
          case REACT_SUSPENSE_LIST_TYPE:
            return key = createFiber(19, pendingProps, key, mode), key.elementType = REACT_SUSPENSE_LIST_TYPE, key.lanes = lanes, key;
          default:
            if ("object" === typeof type && null !== type) switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                fiberTag = 10;
                break a;
              case REACT_CONSUMER_TYPE:
                fiberTag = 9;
                break a;
              case REACT_FORWARD_REF_TYPE:
                fiberTag = 11;
                resolvedType = resolveForwardRefForHotReloading(resolvedType);
                break a;
              case REACT_MEMO_TYPE:
                fiberTag = 14;
                break a;
              case REACT_LAZY_TYPE:
                fiberTag = 16;
                resolvedType = null;
                break a;
            }
            resolvedType = "";
            if (void 0 === type || "object" === typeof type && null !== type && 0 === Object.keys(type).length) resolvedType += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            null === type ? pendingProps = "null" : isArrayImpl(type) ? pendingProps = "array" : void 0 !== type && type.$$typeof === REACT_ELEMENT_TYPE ? (pendingProps = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />", resolvedType = " Did you accidentally export a JSX literal instead of a component?") : pendingProps = typeof type;
            (fiberTag = owner ? getComponentNameFromOwner(owner) : null) && (resolvedType += "\n\nCheck the render method of `" + fiberTag + "`.");
            fiberTag = 29;
            pendingProps = Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + (pendingProps + "." + resolvedType));
            resolvedType = null;
        }
        key = createFiber(fiberTag, pendingProps, key, mode);
        key.elementType = type;
        key.type = resolvedType;
        key.lanes = lanes;
        key._debugOwner = owner;
        return key;
      }
      function createFiberFromElement(element, mode, lanes) {
        mode = createFiberFromTypeAndProps(element.type, element.key, element.props, element._owner, mode, lanes);
        mode._debugOwner = element._owner;
        mode._debugStack = element._debugStack;
        mode._debugTask = element._debugTask;
        return mode;
      }
      function createFiberFromFragment(elements, mode, lanes, key) {
        elements = createFiber(7, elements, key, mode);
        elements.lanes = lanes;
        return elements;
      }
      function createFiberFromText(content, mode, lanes) {
        content = createFiber(6, content, null, mode);
        content.lanes = lanes;
        return content;
      }
      function createFiberFromDehydratedFragment(dehydratedNode) {
        var fiber = createFiber(18, null, null, NoMode);
        fiber.stateNode = dehydratedNode;
        return fiber;
      }
      function createFiberFromPortal(portal, mode, lanes) {
        mode = createFiber(4, null !== portal.children ? portal.children : [], portal.key, mode);
        mode.lanes = lanes;
        mode.stateNode = {
          containerInfo: portal.containerInfo,
          pendingChildren: null,
          implementation: portal.implementation
        };
        return mode;
      }
      function createCapturedValueAtFiber(value, source) {
        if ("object" === typeof value && null !== value) {
          var existing = CapturedStacks.get(value);
          if (void 0 !== existing) return existing;
          source = {
            value,
            source,
            stack: getStackByFiberInDevAndProd(source)
          };
          CapturedStacks.set(value, source);
          return source;
        }
        return {
          value,
          source,
          stack: getStackByFiberInDevAndProd(source)
        };
      }
      function pushTreeFork(workInProgress2, totalChildren) {
        warnIfNotHydrating();
        forkStack[forkStackIndex++] = treeForkCount;
        forkStack[forkStackIndex++] = treeForkProvider;
        treeForkProvider = workInProgress2;
        treeForkCount = totalChildren;
      }
      function pushTreeId(workInProgress2, totalChildren, index) {
        warnIfNotHydrating();
        idStack[idStackIndex++] = treeContextId;
        idStack[idStackIndex++] = treeContextOverflow;
        idStack[idStackIndex++] = treeContextProvider;
        treeContextProvider = workInProgress2;
        var baseIdWithLeadingBit = treeContextId;
        workInProgress2 = treeContextOverflow;
        var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
        baseIdWithLeadingBit &= ~(1 << baseLength);
        index += 1;
        var length = 32 - clz32(totalChildren) + baseLength;
        if (30 < length) {
          var numberOfOverflowBits = baseLength - baseLength % 5;
          length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
          baseIdWithLeadingBit >>= numberOfOverflowBits;
          baseLength -= numberOfOverflowBits;
          treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index << baseLength | baseIdWithLeadingBit;
          treeContextOverflow = length + workInProgress2;
        } else treeContextId = 1 << length | index << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
      }
      function pushMaterializedTreeId(workInProgress2) {
        warnIfNotHydrating();
        null !== workInProgress2.return && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
      }
      function popTreeContext(workInProgress2) {
        for (; workInProgress2 === treeForkProvider; ) treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
        for (; workInProgress2 === treeContextProvider; ) treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
      }
      function getSuspendedTreeContext() {
        warnIfNotHydrating();
        return null !== treeContextProvider ? {
          id: treeContextId,
          overflow: treeContextOverflow
        } : null;
      }
      function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
        warnIfNotHydrating();
        idStack[idStackIndex++] = treeContextId;
        idStack[idStackIndex++] = treeContextOverflow;
        idStack[idStackIndex++] = treeContextProvider;
        treeContextId = suspendedContext.id;
        treeContextOverflow = suspendedContext.overflow;
        treeContextProvider = workInProgress2;
      }
      function warnIfNotHydrating() {
        isHydrating || console.error("Expected to be hydrating. This is a bug in React. Please file an issue.");
      }
      function buildHydrationDiffNode(fiber, distanceFromLeaf) {
        if (null === fiber.return) {
          if (null === hydrationDiffRootDEV) hydrationDiffRootDEV = {
            fiber,
            children: [],
            serverProps: void 0,
            serverTail: [],
            distanceFromLeaf
          };
          else {
            if (hydrationDiffRootDEV.fiber !== fiber) throw Error("Saw multiple hydration diff roots in a pass. This is a bug in React.");
            hydrationDiffRootDEV.distanceFromLeaf > distanceFromLeaf && (hydrationDiffRootDEV.distanceFromLeaf = distanceFromLeaf);
          }
          return hydrationDiffRootDEV;
        }
        var siblings = buildHydrationDiffNode(fiber.return, distanceFromLeaf + 1).children;
        if (0 < siblings.length && siblings[siblings.length - 1].fiber === fiber) return siblings = siblings[siblings.length - 1], siblings.distanceFromLeaf > distanceFromLeaf && (siblings.distanceFromLeaf = distanceFromLeaf), siblings;
        distanceFromLeaf = {
          fiber,
          children: [],
          serverProps: void 0,
          serverTail: [],
          distanceFromLeaf
        };
        siblings.push(distanceFromLeaf);
        return distanceFromLeaf;
      }
      function warnIfHydrating() {
        isHydrating && console.error("We should not be hydrating here. This is a bug in React. Please file a bug.");
      }
      function warnNonHydratedInstance(fiber, rejectedCandidate) {
        didSuspendOrErrorDEV || (fiber = buildHydrationDiffNode(fiber, 0), fiber.serverProps = null, null !== rejectedCandidate && (rejectedCandidate = describeHydratableInstanceForDevWarnings(rejectedCandidate), fiber.serverTail.push(rejectedCandidate)));
      }
      function throwOnHydrationMismatch(fiber) {
        var fromText = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : false, diff = "", diffRoot = hydrationDiffRootDEV;
        null !== diffRoot && (hydrationDiffRootDEV = null, diff = describeDiff(diffRoot));
        queueHydrationError(createCapturedValueAtFiber(Error("Hydration failed because the server rendered " + (fromText ? "text" : "HTML") + " didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\nhttps://react.dev/link/hydration-mismatch" + diff), fiber));
        throw HydrationMismatchException;
      }
      function prepareToHydrateHostInstance(fiber) {
        var didHydrate = fiber.stateNode;
        var type = fiber.type, props = fiber.memoizedProps;
        didHydrate[internalInstanceKey] = fiber;
        didHydrate[internalPropsKey] = props;
        validatePropertiesInDevelopment(type, props);
        switch (type) {
          case "dialog":
            listenToNonDelegatedEvent("cancel", didHydrate);
            listenToNonDelegatedEvent("close", didHydrate);
            break;
          case "iframe":
          case "object":
          case "embed":
            listenToNonDelegatedEvent("load", didHydrate);
            break;
          case "video":
          case "audio":
            for (type = 0; type < mediaEventTypes.length; type++) listenToNonDelegatedEvent(mediaEventTypes[type], didHydrate);
            break;
          case "source":
            listenToNonDelegatedEvent("error", didHydrate);
            break;
          case "img":
          case "image":
          case "link":
            listenToNonDelegatedEvent("error", didHydrate);
            listenToNonDelegatedEvent("load", didHydrate);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", didHydrate);
            break;
          case "input":
            checkControlledValueProps("input", props);
            listenToNonDelegatedEvent("invalid", didHydrate);
            validateInputProps(didHydrate, props);
            initInput(didHydrate, props.value, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name, true);
            break;
          case "option":
            validateOptionProps(didHydrate, props);
            break;
          case "select":
            checkControlledValueProps("select", props);
            listenToNonDelegatedEvent("invalid", didHydrate);
            validateSelectProps(didHydrate, props);
            break;
          case "textarea":
            checkControlledValueProps("textarea", props), listenToNonDelegatedEvent("invalid", didHydrate), validateTextareaProps(didHydrate, props), initTextarea(didHydrate, props.value, props.defaultValue, props.children);
        }
        type = props.children;
        "string" !== typeof type && "number" !== typeof type && "bigint" !== typeof type || didHydrate.textContent === "" + type || true === props.suppressHydrationWarning || checkForUnmatchedText(didHydrate.textContent, type) ? (null != props.popover && (listenToNonDelegatedEvent("beforetoggle", didHydrate), listenToNonDelegatedEvent("toggle", didHydrate)), null != props.onScroll && listenToNonDelegatedEvent("scroll", didHydrate), null != props.onScrollEnd && listenToNonDelegatedEvent("scrollend", didHydrate), null != props.onClick && (didHydrate.onclick = noop$1), didHydrate = true) : didHydrate = false;
        didHydrate || throwOnHydrationMismatch(fiber, true);
      }
      function popToNextHostParent(fiber) {
        for (hydrationParentFiber = fiber.return; hydrationParentFiber; ) switch (hydrationParentFiber.tag) {
          case 5:
          case 31:
          case 13:
            rootOrSingletonContext = false;
            return;
          case 27:
          case 3:
            rootOrSingletonContext = true;
            return;
          default:
            hydrationParentFiber = hydrationParentFiber.return;
        }
      }
      function popHydrationState(fiber) {
        if (fiber !== hydrationParentFiber) return false;
        if (!isHydrating) return popToNextHostParent(fiber), isHydrating = true, false;
        var tag = fiber.tag, JSCompiler_temp;
        if (JSCompiler_temp = 3 !== tag && 27 !== tag) {
          if (JSCompiler_temp = 5 === tag) JSCompiler_temp = fiber.type, JSCompiler_temp = !("form" !== JSCompiler_temp && "button" !== JSCompiler_temp) || shouldSetTextContent(fiber.type, fiber.memoizedProps);
          JSCompiler_temp = !JSCompiler_temp;
        }
        if (JSCompiler_temp && nextHydratableInstance) {
          for (JSCompiler_temp = nextHydratableInstance; JSCompiler_temp; ) {
            var diffNode = buildHydrationDiffNode(fiber, 0), description = describeHydratableInstanceForDevWarnings(JSCompiler_temp);
            diffNode.serverTail.push(description);
            JSCompiler_temp = "Suspense" === description.type ? getNextHydratableInstanceAfterHydrationBoundary(JSCompiler_temp) : getNextHydratable(JSCompiler_temp.nextSibling);
          }
          throwOnHydrationMismatch(fiber);
        }
        popToNextHostParent(fiber);
        if (13 === tag) {
          fiber = fiber.memoizedState;
          fiber = null !== fiber ? fiber.dehydrated : null;
          if (!fiber) throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else if (31 === tag) {
          fiber = fiber.memoizedState;
          fiber = null !== fiber ? fiber.dehydrated : null;
          if (!fiber) throw Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else 27 === tag ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
        return true;
      }
      function resetHydrationState() {
        nextHydratableInstance = hydrationParentFiber = null;
        didSuspendOrErrorDEV = isHydrating = false;
      }
      function upgradeHydrationErrorsToRecoverable() {
        var queuedErrors = hydrationErrors;
        null !== queuedErrors && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, queuedErrors), hydrationErrors = null);
        return queuedErrors;
      }
      function queueHydrationError(error) {
        null === hydrationErrors ? hydrationErrors = [
          error
        ] : hydrationErrors.push(error);
      }
      function emitPendingHydrationWarnings() {
        var diffRoot = hydrationDiffRootDEV;
        if (null !== diffRoot) {
          hydrationDiffRootDEV = null;
          for (var diff = describeDiff(diffRoot); 0 < diffRoot.children.length; ) diffRoot = diffRoot.children[0];
          runWithFiberInDEV(diffRoot.fiber, function() {
            console.error("A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:\n\n- A server/client branch `if (typeof window !== 'undefined')`.\n- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.\n- Date formatting in a user's locale which doesn't match the server.\n- External changing data without sending a snapshot of it along with the HTML.\n- Invalid HTML tag nesting.\n\nIt can also happen if the client has a browser extension installed which messes with the HTML before React loaded.\n\n%s%s", "https://react.dev/link/hydration-mismatch", diff);
          });
        }
      }
      function resetContextDependencies() {
        lastContextDependency = currentlyRenderingFiber$1 = null;
        isDisallowedContextReadInDEV = false;
      }
      function pushProvider(providerFiber, context, nextValue) {
        push(valueCursor, context._currentValue, providerFiber);
        context._currentValue = nextValue;
        push(rendererCursorDEV, context._currentRenderer, providerFiber);
        void 0 !== context._currentRenderer && null !== context._currentRenderer && context._currentRenderer !== rendererSigil && console.error("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported.");
        context._currentRenderer = rendererSigil;
      }
      function popProvider(context, providerFiber) {
        context._currentValue = valueCursor.current;
        var currentRenderer = rendererCursorDEV.current;
        pop(rendererCursorDEV, providerFiber);
        context._currentRenderer = currentRenderer;
        pop(valueCursor, providerFiber);
      }
      function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
        for (; null !== parent; ) {
          var alternate = parent.alternate;
          (parent.childLanes & renderLanes2) !== renderLanes2 ? (parent.childLanes |= renderLanes2, null !== alternate && (alternate.childLanes |= renderLanes2)) : null !== alternate && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2);
          if (parent === propagationRoot) break;
          parent = parent.return;
        }
        parent !== propagationRoot && console.error("Expected to find the propagation root when scheduling context work. This error is likely caused by a bug in React. Please file an issue.");
      }
      function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
        var fiber = workInProgress2.child;
        null !== fiber && (fiber.return = workInProgress2);
        for (; null !== fiber; ) {
          var list = fiber.dependencies;
          if (null !== list) {
            var nextFiber = fiber.child;
            list = list.firstContext;
            a: for (; null !== list; ) {
              var dependency = list;
              list = fiber;
              for (var i = 0; i < contexts.length; i++) if (dependency.context === contexts[i]) {
                list.lanes |= renderLanes2;
                dependency = list.alternate;
                null !== dependency && (dependency.lanes |= renderLanes2);
                scheduleContextWorkOnParentPath(list.return, renderLanes2, workInProgress2);
                forcePropagateEntireTree || (nextFiber = null);
                break a;
              }
              list = dependency.next;
            }
          } else if (18 === fiber.tag) {
            nextFiber = fiber.return;
            if (null === nextFiber) throw Error("We just came from a parent so we must have had a parent. This is a bug in React.");
            nextFiber.lanes |= renderLanes2;
            list = nextFiber.alternate;
            null !== list && (list.lanes |= renderLanes2);
            scheduleContextWorkOnParentPath(nextFiber, renderLanes2, workInProgress2);
            nextFiber = null;
          } else nextFiber = fiber.child;
          if (null !== nextFiber) nextFiber.return = fiber;
          else for (nextFiber = fiber; null !== nextFiber; ) {
            if (nextFiber === workInProgress2) {
              nextFiber = null;
              break;
            }
            fiber = nextFiber.sibling;
            if (null !== fiber) {
              fiber.return = nextFiber.return;
              nextFiber = fiber;
              break;
            }
            nextFiber = nextFiber.return;
          }
          fiber = nextFiber;
        }
      }
      function propagateParentContextChanges(current2, workInProgress2, renderLanes2, forcePropagateEntireTree) {
        current2 = null;
        for (var parent = workInProgress2, isInsidePropagationBailout = false; null !== parent; ) {
          if (!isInsidePropagationBailout) {
            if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = true;
            else if (0 !== (parent.flags & 262144)) break;
          }
          if (10 === parent.tag) {
            var currentParent = parent.alternate;
            if (null === currentParent) throw Error("Should have a current fiber. This is a bug in React.");
            currentParent = currentParent.memoizedProps;
            if (null !== currentParent) {
              var context = parent.type;
              objectIs(parent.pendingProps.value, currentParent.value) || (null !== current2 ? current2.push(context) : current2 = [
                context
              ]);
            }
          } else if (parent === hostTransitionProviderCursor.current) {
            currentParent = parent.alternate;
            if (null === currentParent) throw Error("Should have a current fiber. This is a bug in React.");
            currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (null !== current2 ? current2.push(HostTransitionContext) : current2 = [
              HostTransitionContext
            ]);
          }
          parent = parent.return;
        }
        null !== current2 && propagateContextChanges(workInProgress2, current2, renderLanes2, forcePropagateEntireTree);
        workInProgress2.flags |= 262144;
      }
      function checkIfContextChanged(currentDependencies) {
        for (currentDependencies = currentDependencies.firstContext; null !== currentDependencies; ) {
          if (!objectIs(currentDependencies.context._currentValue, currentDependencies.memoizedValue)) return true;
          currentDependencies = currentDependencies.next;
        }
        return false;
      }
      function prepareToReadContext(workInProgress2) {
        currentlyRenderingFiber$1 = workInProgress2;
        lastContextDependency = null;
        workInProgress2 = workInProgress2.dependencies;
        null !== workInProgress2 && (workInProgress2.firstContext = null);
      }
      function readContext(context) {
        isDisallowedContextReadInDEV && console.error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
        return readContextForConsumer(currentlyRenderingFiber$1, context);
      }
      function readContextDuringReconciliation(consumer, context) {
        null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
        return readContextForConsumer(consumer, context);
      }
      function readContextForConsumer(consumer, context) {
        var value = context._currentValue;
        context = {
          context,
          memoizedValue: value,
          next: null
        };
        if (null === lastContextDependency) {
          if (null === consumer) throw Error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
          lastContextDependency = context;
          consumer.dependencies = {
            lanes: 0,
            firstContext: context,
            _debugThenableState: null
          };
          consumer.flags |= 524288;
        } else lastContextDependency = lastContextDependency.next = context;
        return value;
      }
      function createCache() {
        return {
          controller: new AbortControllerLocal(),
          data: /* @__PURE__ */ new Map(),
          refCount: 0
        };
      }
      function retainCache(cache) {
        cache.controller.signal.aborted && console.warn("A cache instance was retained after it was already freed. This likely indicates a bug in React.");
        cache.refCount++;
      }
      function releaseCache(cache) {
        cache.refCount--;
        0 > cache.refCount && console.warn("A cache instance was released after it was already freed. This likely indicates a bug in React.");
        0 === cache.refCount && scheduleCallback$2(NormalPriority, function() {
          cache.controller.abort();
        });
      }
      function startUpdateTimerByLane(lane, method, fiber) {
        if (0 !== (lane & 127)) 0 > blockingUpdateTime && (blockingUpdateTime = now(), blockingUpdateTask = createTask(method), blockingUpdateMethodName = method, null != fiber && (blockingUpdateComponentName = getComponentNameFromFiber(fiber)), (executionContext & (RenderContext | CommitContext)) !== NoContext && (componentEffectSpawnedUpdate = true, blockingUpdateType = SPAWNED_UPDATE), lane = resolveEventTimeStamp(), method = resolveEventType(), lane !== blockingEventRepeatTime || method !== blockingEventType ? blockingEventRepeatTime = -1.1 : null !== method && (blockingUpdateType = SPAWNED_UPDATE), blockingEventTime = lane, blockingEventType = method);
        else if (0 !== (lane & 4194048) && 0 > transitionUpdateTime && (transitionUpdateTime = now(), transitionUpdateTask = createTask(method), transitionUpdateMethodName = method, null != fiber && (transitionUpdateComponentName = getComponentNameFromFiber(fiber)), 0 > transitionStartTime)) {
          lane = resolveEventTimeStamp();
          method = resolveEventType();
          if (lane !== transitionEventRepeatTime || method !== transitionEventType) transitionEventRepeatTime = -1.1;
          transitionEventTime = lane;
          transitionEventType = method;
        }
      }
      function startHostActionTimer(fiber) {
        if (0 > blockingUpdateTime) {
          blockingUpdateTime = now();
          blockingUpdateTask = null != fiber._debugTask ? fiber._debugTask : null;
          (executionContext & (RenderContext | CommitContext)) !== NoContext && (blockingUpdateType = SPAWNED_UPDATE);
          var newEventTime = resolveEventTimeStamp(), newEventType = resolveEventType();
          newEventTime !== blockingEventRepeatTime || newEventType !== blockingEventType ? blockingEventRepeatTime = -1.1 : null !== newEventType && (blockingUpdateType = SPAWNED_UPDATE);
          blockingEventTime = newEventTime;
          blockingEventType = newEventType;
        }
        if (0 > transitionUpdateTime && (transitionUpdateTime = now(), transitionUpdateTask = null != fiber._debugTask ? fiber._debugTask : null, 0 > transitionStartTime)) {
          fiber = resolveEventTimeStamp();
          newEventTime = resolveEventType();
          if (fiber !== transitionEventRepeatTime || newEventTime !== transitionEventType) transitionEventRepeatTime = -1.1;
          transitionEventTime = fiber;
          transitionEventType = newEventTime;
        }
      }
      function pushNestedEffectDurations() {
        var prevEffectDuration = profilerEffectDuration;
        profilerEffectDuration = 0;
        return prevEffectDuration;
      }
      function popNestedEffectDurations(prevEffectDuration) {
        var elapsedTime = profilerEffectDuration;
        profilerEffectDuration = prevEffectDuration;
        return elapsedTime;
      }
      function bubbleNestedEffectDurations(prevEffectDuration) {
        var elapsedTime = profilerEffectDuration;
        profilerEffectDuration += prevEffectDuration;
        return elapsedTime;
      }
      function resetComponentEffectTimers() {
        componentEffectEndTime = componentEffectStartTime = -1.1;
      }
      function pushComponentEffectStart() {
        var prevEffectStart = componentEffectStartTime;
        componentEffectStartTime = -1.1;
        return prevEffectStart;
      }
      function popComponentEffectStart(prevEffectStart) {
        0 <= prevEffectStart && (componentEffectStartTime = prevEffectStart);
      }
      function pushComponentEffectDuration() {
        var prevEffectDuration = componentEffectDuration;
        componentEffectDuration = -0;
        return prevEffectDuration;
      }
      function popComponentEffectDuration(prevEffectDuration) {
        0 <= prevEffectDuration && (componentEffectDuration = prevEffectDuration);
      }
      function pushComponentEffectErrors() {
        var prevErrors = componentEffectErrors;
        componentEffectErrors = null;
        return prevErrors;
      }
      function pushComponentEffectDidSpawnUpdate() {
        var prev = componentEffectSpawnedUpdate;
        componentEffectSpawnedUpdate = false;
        return prev;
      }
      function startProfilerTimer(fiber) {
        profilerStartTime = now();
        0 > fiber.actualStartTime && (fiber.actualStartTime = profilerStartTime);
      }
      function stopProfilerTimerIfRunningAndRecordDuration(fiber) {
        if (0 <= profilerStartTime) {
          var elapsedTime = now() - profilerStartTime;
          fiber.actualDuration += elapsedTime;
          fiber.selfBaseDuration = elapsedTime;
          profilerStartTime = -1;
        }
      }
      function stopProfilerTimerIfRunningAndRecordIncompleteDuration(fiber) {
        if (0 <= profilerStartTime) {
          var elapsedTime = now() - profilerStartTime;
          fiber.actualDuration += elapsedTime;
          profilerStartTime = -1;
        }
      }
      function recordEffectDuration() {
        if (0 <= profilerStartTime) {
          var endTime = now(), elapsedTime = endTime - profilerStartTime;
          profilerStartTime = -1;
          profilerEffectDuration += elapsedTime;
          componentEffectDuration += elapsedTime;
          componentEffectEndTime = endTime;
        }
      }
      function recordEffectError(errorInfo) {
        null === componentEffectErrors && (componentEffectErrors = []);
        componentEffectErrors.push(errorInfo);
        null === commitErrors && (commitErrors = []);
        commitErrors.push(errorInfo);
      }
      function startEffectTimer() {
        profilerStartTime = now();
        0 > componentEffectStartTime && (componentEffectStartTime = profilerStartTime);
      }
      function transferActualDuration(fiber) {
        for (var child = fiber.child; child; ) fiber.actualDuration += child.actualDuration, child = child.sibling;
      }
      function entangleAsyncAction(transition, thenable) {
        if (null === currentEntangledListeners) {
          var entangledListeners = currentEntangledListeners = [];
          currentEntangledPendingCount = 0;
          currentEntangledLane = requestTransitionLane();
          currentEntangledActionThenable = {
            status: "pending",
            value: void 0,
            then: function(resolve) {
              entangledListeners.push(resolve);
            }
          };
        }
        currentEntangledPendingCount++;
        thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
        return thenable;
      }
      function pingEngtangledActionScope() {
        if (0 === --currentEntangledPendingCount && (-1 < transitionUpdateTime || (transitionStartTime = -1.1), null !== currentEntangledListeners)) {
          null !== currentEntangledActionThenable && (currentEntangledActionThenable.status = "fulfilled");
          var listeners = currentEntangledListeners;
          currentEntangledListeners = null;
          currentEntangledLane = 0;
          currentEntangledActionThenable = null;
          for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
        }
      }
      function chainThenableValue(thenable, result) {
        var listeners = [], thenableWithOverride = {
          status: "pending",
          value: null,
          reason: null,
          then: function(resolve) {
            listeners.push(resolve);
          }
        };
        thenable.then(function() {
          thenableWithOverride.status = "fulfilled";
          thenableWithOverride.value = result;
          for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
        }, function(error) {
          thenableWithOverride.status = "rejected";
          thenableWithOverride.reason = error;
          for (error = 0; error < listeners.length; error++) (0, listeners[error])(void 0);
        });
        return thenableWithOverride;
      }
      function peekCacheFromPool() {
        var cacheResumedFromPreviousRender = resumedCache.current;
        return null !== cacheResumedFromPreviousRender ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
      }
      function pushTransition(offscreenWorkInProgress, prevCachePool) {
        null === prevCachePool ? push(resumedCache, resumedCache.current, offscreenWorkInProgress) : push(resumedCache, prevCachePool.pool, offscreenWorkInProgress);
      }
      function getSuspendedCache() {
        var cacheFromPool = peekCacheFromPool();
        return null === cacheFromPool ? null : {
          parent: CacheContext._currentValue,
          pool: cacheFromPool
        };
      }
      function createThenableState() {
        return {
          didWarnAboutUncachedPromise: false,
          thenables: []
        };
      }
      function isThenableResolved(thenable) {
        thenable = thenable.status;
        return "fulfilled" === thenable || "rejected" === thenable;
      }
      function trackUsedThenable(thenableState2, thenable, index) {
        null !== ReactSharedInternals.actQueue && (ReactSharedInternals.didUsePromise = true);
        var trackedThenables = thenableState2.thenables;
        index = trackedThenables[index];
        void 0 === index ? trackedThenables.push(thenable) : index !== thenable && (thenableState2.didWarnAboutUncachedPromise || (thenableState2.didWarnAboutUncachedPromise = true, console.error("A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework.")), thenable.then(noop$1, noop$1), thenable = index);
        if (void 0 === thenable._debugInfo) {
          thenableState2 = performance.now();
          trackedThenables = thenable.displayName;
          var ioInfo = {
            name: "string" === typeof trackedThenables ? trackedThenables : "Promise",
            start: thenableState2,
            end: thenableState2,
            value: thenable
          };
          thenable._debugInfo = [
            {
              awaited: ioInfo
            }
          ];
          "fulfilled" !== thenable.status && "rejected" !== thenable.status && (thenableState2 = function() {
            ioInfo.end = performance.now();
          }, thenable.then(thenableState2, thenableState2));
        }
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
          default:
            if ("string" === typeof thenable.status) thenable.then(noop$1, noop$1);
            else {
              thenableState2 = workInProgressRoot;
              if (null !== thenableState2 && 100 < thenableState2.shellSuspendCounter) throw Error("An unknown Component is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server.");
              thenableState2 = thenable;
              thenableState2.status = "pending";
              thenableState2.then(function(fulfilledValue) {
                if ("pending" === thenable.status) {
                  var fulfilledThenable = thenable;
                  fulfilledThenable.status = "fulfilled";
                  fulfilledThenable.value = fulfilledValue;
                }
              }, function(error) {
                if ("pending" === thenable.status) {
                  var re