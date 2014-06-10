/*

Get obj[prop] value

*/

    j.get = function(model, prop, trackDependencies, callback, formatter, mapping) {

      var getter = function(prop) {
        var result = model.__.values[prop];
        return formatter(
          typeof result === 'function' ?
            result.call(getter) : 
            result
        );
      };

      var dependencyTracker = function(propToReturn) {
        // Init dependents
        if (!model.__.dependents[propToReturn]) {
          model.__.dependents[propToReturn] = [];
        }
        // Update dependency tree
        if (model.__.dependents[propToReturn].indexOf(prop) === -1) {
          model.__.dependents[propToReturn].push(prop);
        }
        return getter(prop);
      };

      var val, result;

      formatter = formatter || j.identity;

      // {{.}}
      if (prop === '.') {
        return formatter(model);
      }

      val = model.__ ? model.__.values[prop] : model[prop];

      result = (typeof val === 'function') ?
        // Computed property
        val.call(trackDependencies ? dependencyTracker : getter) :
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


      /*
      var val = typeof accessor === 'object' ?
        accessor[prop] :
        accessor.values[prop];

      return (typeof val === 'function') ?
        // Computed property. Pass `callback` for async getters
        val.call(
          (typeof accessor === 'object') ? 
            function(prop) { return accessor.__ ? accessor.__(prop) : accessor[prop]; } :
            accessor(prop), 
          callback
        ) :
        // Static property (leaf in the dependency tree)
        val;
        */
    };


/*

Initializes `obj.__` (dunder) with factory function,
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

`this('childContext')('childProperty')`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    j.bind = function(obj, root, parent) {

      if (typeof obj !== 'object' || obj.__) return;

      var dunder = function(prop, arg, refresh) {
        var i, len, result;

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

          return j.get(obj, prop);//, true, arg);
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

          // Init dependents
          if (!dunder.dependents[prop]) {
            dunder.dependents[prop] = [];
          }

          // Alert dependents
          for (i = 0, len = dunder.dependents[prop].length; i < len; i++) {
            obj.__(dunder.dependents[prop][i], arg, true);
          }

          // Alert watchers
          if (dunder.watchers[prop]) {
            for (i = 0, len = dunder.watchers[prop].length; i < len; i++) {
              dunder.watchers[prop][i].call(obj.__, arg);
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
