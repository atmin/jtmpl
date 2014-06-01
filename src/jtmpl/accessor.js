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

    j.bind = function(obj, _root, _parent) {

      if (obj.__these__) return;

      var root = _root || obj;
      var parent = _parent || null;

      var accessor = function(caller) {

        var that = function (prop, arg, refresh) {
          var i, len, result;

          // Init dependents
          if (!accessor.dependents[prop]) {
            accessor.dependents[prop] = [];
          }

          // Getter?
          if (arg === undefined || typeof arg === 'function') {

            // Update dependency tree
            if (caller && accessor.dependents[prop].indexOf(caller) === -1) {
              accessor.dependents[prop].push(caller);
            }

            result = (typeof obj[prop] === 'function') ?
              // Computed property. `arg` is a callback for async getters
              obj[prop].call(that, arg) :
              // Static property (leaf in the dependency tree)
              obj[prop];

            return typeof result === 'object' ?
              // Child context, wrap it
              (j.bind(result, root, parent), result.__these__(caller)) :
              // Simple value
              result;
          }

          else {

            // Setter?
            if (!refresh) {
              if (typeof obj[prop] === 'function') {
                // Computed property
                obj[prop].call(that, arg);
              }
              else {
                // Simple property. `arg` is the new value
                obj[prop] = arg;
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

        that.root = null;

        return that;
      };

      accessor.dependents = {};
      accessor.watchers = {};


      Object.defineProperty(obj, '__these__', { value: accessor });

    };

