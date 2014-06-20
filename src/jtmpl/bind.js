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

      var notify, method, mutableMethods, values;

      // Guard
      if (typeof obj !== 'object' || obj.__) return;

      // The dunder function, `obj.__`
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

              // Object assignment?
              // if (
              //   typeof dunder.values[prop] === 'object' &&
              //   typeof arg === 'object' &&
              //   typeof dunder.values[prop].__ === 'function'
              // ) {
              //   // Attach dunder function to new value
              //   arg.__ = dunder.values[prop].__;
              // }
              if (typeof arg === 'object') {
                j.bind(arg);
              }

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
      }; // dunder

      dunder.dependents = {};
      dunder.watchers = {};
      dunder.arrayWatchers = [];
      dunder.root = root || obj;
      dunder.parent = parent || null;
      dunder.values = Array.isArray(obj) ? [] : {};
      dunder.bound = {};

      var bindProp = function(prop) {

        // Do not redefine Array.length
        if (prop === 'length' && Array.isArray(obj)) {
          return;
        }

        dunder.values[prop] = obj[prop];

        Object.defineProperty(obj, prop, {
          get: function() {
            return obj.__(prop); 
          },
          set: function(val) {
            obj.__(prop, val);
          }
        });

      };

      // Proxy all properties with the dunder function
      Object.getOwnPropertyNames(obj).map(bindProp);

      // Attach dunder function
      Object.defineProperty(obj, '__', { value: dunder });

      // More treatment for arrays?
      if (Array.isArray(obj)) {
        // Proxy mutable array methods

        // Notify subscribers
        // @param type: 'insert', 'delete' or 'update'
        // @param index: which element changed
        notify = function(type, index, count) {
          for (var i = 0, len = obj.__.arrayWatchers.length; i < len; i++) {
            obj.__.arrayWatchers[i](type, index, count);
          }
        };


        mutableMethods = {

          pop: function() {
            var result = [].pop.apply(this);
            notify('del', this.length, 1);
            return result;
          },

          push: function() {
            var result = [].push.apply(this, arguments);
            notify('ins', this.length - 1, 1);
            return result;
          },

          reverse: function() {
            var result = [].reverse.apply(this);
            notify('del', 0, this.length);
            notify('ins', 0, this.length);
            return result;
          },

          shift: function() {
            var result = [].shift.apply(this);
            notify('del', 0, 1);
            return result;
          },

          unshift: function() {
            var result = [].unshift.apply(this, arguments);
            notify('ins', 0, arguments.length);
            return result;
          },

          sort: function() {
            var result = [].sort.apply(this, arguments);
            notify('del', 0, this.length);
            notify('ins', 0, this.length);
            return result;
          },

          splice: function() {
            var length = this.length;
            var result;

            if (arguments[1]) {
              notify('del', arguments[0], arguments[1]);
            }
            
            if (arguments.length > 2) {
              notify('ins', arguments[0], arguments.length - 2);
            }

            result = [].splice.apply(this, arguments);
            
            while (length < this.length) {
              bindProp(length);
              length++;
            }

            while (length > this.length) {
              delete this[length];
              length--;
            }

            return result;
          }
        };

        for (method in mutableMethods) {
          dunder[method] = mutableMethods[method];
          obj[method] = mutableMethods[method];
        }
      }

    };
