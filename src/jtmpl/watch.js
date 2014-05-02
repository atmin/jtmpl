/*

## watch(obj, prop, callback)

*/

    j.watch = function(obj, prop, callback) {
      var watchers;

      // All must be specified
      if (!(obj && prop && callback)) return;

      watchers = j.store.get(obj, bookkeepingProto).watchers;

      if (!watchers[prop]) {
        watchers[prop] = [];
      }

      if (watchers[prop].indexOf(callback) === -1) {
        watchers[prop].push(callback);
      }
    };
