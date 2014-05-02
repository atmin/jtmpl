/*

## watch(obj, prop, callback)

Notifies `callback` passing new value, when `obj[prop]` changes.

*/

    j.watch = function(obj, prop, callback) {
      var watchers;

      // All must be specified
      if (!(obj && prop && callback)) return;

      watchers = j.store.get(obj, bookkeepingProto).watchers;

      // Init watchers
      if (!watchers[prop]) {
        watchers[prop] = [];
      }

      // Already registered?
      if (watchers[prop].indexOf(callback) === -1) {
        watchers[prop].push(callback);
      }
    };
