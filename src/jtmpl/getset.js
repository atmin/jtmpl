/*

*/

    var getsetFactory = j.getsetFactory = function(obj, caller) {

      function that(prop, arg, refresh) {
        var slot = j.store.get(obj, bookkeepingProto);
        var i, len;

        if (!slot.dependents[prop]) {
          // Init dependents
          slot.dependents[prop] = [];
        }

        // Getter?
        if (arg === undefined || typeof arg === 'function') {

          // Update dependency graph
          if (slot.dependents[prop].indexOf(caller) === -1) {
            slot.dependents[prop].push(caller);
          }

          return (typeof obj[prop] === 'function') ?
            // Computed property. `arg` is a callback for async getters
            obj[prop].call(that, arg) :
            // Simple property
            obj[prop];
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

      return that;
    };
