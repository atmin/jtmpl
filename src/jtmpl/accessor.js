/*

Initialize `obj.__`.

Dunder function is bound to `this` context when `obj` method is called.

Uses of the dunder function:


Get property value:

`this(prop)`


Get property value asynchonously:

`this(prop, function(value) {...})`


Set propety value:

`this(prop, newValueNonFunction)`



Access current context (returns non-function value):

`this('.')`


Access parent context (returns dunder function):

`this('..')`


Access root context (returns dunder function):

`this('/')`


Get child context property:

`this('childContext')('childProperty')`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    j.bind = function(obj, root, parent) {

      if (typeof obj !== 'object' || obj.__) return;

      var dunder = function(prop, arg, refresh, formatter, mapping) {
        var i, len, result, val;

        var getter = function(prop) {
          var result = obj.__.values[prop];
          return formatter(
            typeof result === 'function' ?
              result.call(getter) : 
              result
          );
        };

        var dependencyTracker = function(propToReturn) {
          // Update dependency tree
          if (obj.__.dependents[propToReturn].indexOf(prop) === -1) {
            obj.__.dependents[propToReturn].push(prop);
          }
          return getter(propToReturn);
        };

        formatter = formatter || j.identity;

        // Init dependents
        if (!dunder.dependents[prop]) {
          dunder.dependents[prop] = [];
        }

        // Getter?
        if ((arg === undefined || typeof arg === 'function') && !refresh) {

          // {{.}}
          if (prop === '.') {
            return formatter(model);
          }

          // Parent context?
          if (prop === '..') {
            return obj.__.parent.__;
          }

          // Root context?
          if (prop === '/') {
            return obj.__.root.__;
          }

          val = obj.__.values[prop];

          result = (typeof val === 'function') ?
            // Computed property
            val.call(dependencyTracker) :
            // Static property (leaf in the dependency tree)
            val;

          return Array.isArray(result) ?
            // Collection
            typeof mapping === 'function' ?
              // Mapping provided, map, then filter not defined values
              result.map(mapping).filter(j.isDefined) :
              // No mapping
              result :

            // Single value
            formatter(result);          
        }

        else {

          // Setter?
          if (!refresh) {
            if (typeof dunder.values[prop] === 'function') {
              // Computed property
              dunder.values[prop].call(obj.__, arg);
            }
            else {
              // Simple property. `arg` is the new value
              dunder.values[prop] = arg;
            }
          }

          // Alert dependents
          for (i = 0, len = dunder.dependents[prop].length; i < len; i++) {
            obj.__(dunder.dependents[prop][i], arg, true);
          }

          // Alert watchers
          if (dunder.watchers[prop]) {
            for (i = 0, len = dunder.watchers[prop].length; i < len; i++) {
              dunder.watchers[prop][i](obj.__(prop));
            }
          }

        } // if getter
      };

      dunder.dependents = {};
      dunder.watchers = {};
      dunder.root = root || obj;
      dunder.parent = parent || null;
      dunder.values = {};
      dunder.bound = {};

      // Proxy all properties with the dunder function
      Object.getOwnPropertyNames(obj).map(function(prop) {

        dunder.values[prop] = obj[prop];

        Object.defineProperty(obj, prop, {
          get: function() {
            // return j.get(obj, prop);
            return obj.__(prop); 
          },
          set: function(val) {
            obj.__(prop, val);
          }
        });

      });

      Object.defineProperty(obj, '__', { value: dunder });

    };
