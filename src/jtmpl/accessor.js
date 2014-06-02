/*

Initializes `obj.__these__` with factory function,
returning accessor functions for a given caller.

Accessor function is bound to `this` context when `obj` method is called.

Method can use the accessor function:


Get property value:

`this(prop)`


Get property value asynchonously:

`this(prop, function(value) {...})`


Set propety value:

`this(prop, newValue)`



Access parent context (returns accessor function):

`this('..')`


Access root context (returns accessor function):

`this('/')`


Get child context property:

`this(childContext)(childProperty)`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    j.bind = function(obj, root, parent) {

      if (obj.__these__) return;

      var accessor = function(caller) {

        var that = function (prop, arg, refresh) {
          var i, len, result;

          // Init dependents
          if (!accessor.dependents[prop]) {
            accessor.dependents[prop] = [];
          }

          // Getter?
          if (arg === undefined || typeof arg === 'function') {

            // Parent context?
            if (prop === '..') {
              return obj.__these__.parent;
            }

            // Root context?
            if (prop === '/') {
              return obj.__these__.root;
            }

            // Update dependency tree
            if (caller && caller !== prop && accessor.dependents[prop].indexOf(caller) === -1) {
              accessor.dependents[prop].push(caller);
            }

            result = (typeof accessor.values[prop] === 'function') ?
              // Computed property. `arg` is a callback for async getters
              accessor.values[prop].call(that, arg) :
              // Static property (leaf in the dependency tree)
              accessor.values[prop];

            return typeof result === 'object' ?
              // Child context, wrap it
              (j.bind(result, obj.__these__.root, obj), result.__these__(caller)) :
              // Simple value
              result;
          }

          else {

            // Setter?
            if (!refresh) {
              if (typeof accessor.values[prop] === 'function') {
                // Computed property
                accessor.values[prop].call(that, arg);
              }
              else {
                // Simple property. `arg` is the new value
                accessor.values[prop] = arg;
              }
            }

            // Alert dependents
            for (i = 0, len = accessor.dependents[prop].length; i < len; i++) {
              that(accessor.dependents[prop][i], undefined, true);
            }

            // Alert watchers
            if (accessor.watchers[prop]) {
              for (i = 0, len = accessor.watchers[prop].length; i < len; i++) {
                accessor.watchers[prop][i].call(that, arg);
              }
            }

          } // if getter

        }; // that function

        return that;
      };

      accessor.dependents = {};
      accessor.watchers = {};
      accessor.root = root || obj;
      accessor.parent = parent || null;
      accessor.values = {};

      // Proxy all properties with the accessor function
      Object.getOwnPropertyNames(obj).map(function(prop) {

        accessor.values[prop] = obj[prop];

        Object.defineProperty(obj, prop, {
          get: function() {
            return obj.__these__()(prop); 
          },
          set: function(val) {
            obj.__these__()(prop, val);
          }
        });

      });

      Object.defineProperty(obj, '__these__', { value: accessor });

    };
