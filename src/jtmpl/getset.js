/*

Returns a getter/setter function, which jtmpl binds to the `this` context.

Within a model handler, it's possible:


Get property value:

`this(prop)`


Get property value asynchonously:

`this(prop, function(value) {...})`


Set propety value:

`this(prop, newValue)`



Access parent context (returns getter/setter):

`this.parent`


Access root context (returns getter/setter):

`this.root`


Get child context property:

`this(childContext)(childProperty)`


If current context is an Array, all standard props/methods are there:

`this.length`, `this.sort`, `this.splice`, etc



*/

    var getsetFactory = j.getsetFactory = function(obj, caller) {
      var slot = register(obj);

      function that(prop, arg, refresh) {
        var i, len, result, root;

        if (!slot.dependents[prop]) {
          // Init dependents
          slot.dependents[prop] = [];
        }

        // Getter?
        if (arg === undefined || typeof arg === 'function') {

          // Update dependency tree
          if (caller && slot.dependents[prop].indexOf(caller) === -1) {
            slot.dependents[prop].push(caller);
          }

          result = (typeof obj[prop] === 'function') ?
            // Computed property. `arg` is a callback for async getters
            obj[prop].call(that, arg) :
            // Static property (leaf in the dependency tree)
            obj[prop];

          return typeof result === 'object' ?
            // Child context, wrap it
            getsetFactory(result) :
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
          for (i = 0, len = slot.dependents[prop].length; i < len; i++) {
            that(slot.dependents[prop][i], undefined, true);
          }

          // Alert watchers
          if (slot.watchers[prop]) {
            for (i = 0, len = slot.watchers[prop].length; i < len; i++) {
              slot.watchers[prop][i].call(that, arg);
            }
          }

        } // if getter

      } // that

      that.parent = slot.parent ? getsetFactory(slot.parent) : null;

      // Find root context
      root = that.parent;
      while (root) {
        that.root = root;
        root = root.parent;
      }

      return that;
    };



    function register(obj) {
      var slot = j.store.get(obj, bookkeepingProto);
      var prop, childSlot;

      // Register child contexts
      if (!slot.initialized) {
        slot.initialized = true;

        for (prop in obj) {
          if (obj.hasOwnProperty(prop) && typeof obj[prop] === 'object') {
            childSlot = j.store.get(obj[prop], bookkeepingProto);
            childSlot.parent = obj;
            register(obj[prop]);
          }
        }
      }

      return slot;
    }
