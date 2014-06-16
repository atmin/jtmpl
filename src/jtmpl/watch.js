/*

## watch(obj, prop, callback)

Notifies `callback` passing new value, when `obj[prop]` changes.

*/

    j.watch = function(obj, prop, callback, arrayCallback, key) {
      var watchers, arrayWatchers;
    
      // Must be specified
      if (!(obj && prop && callback) ||
          typeof obj !== 'object') return;

      // Already bound?
      if (key && obj.__ && obj.__.bound[key]) return;

      j.bind(obj);

      // Mark bound
      if (key) {
        obj.__.bound[key] = true;
      }

      watchers = obj.__.watchers;

      // Init watchers
      if (!watchers[prop]) {
        watchers[prop] = [];
      }

      // Already registered?
      if (watchers[prop].indexOf(callback) === -1) {
        watchers[prop].push(callback);
      }

      //
      if (arrayCallback) {
        j.bind(obj[prop]);
        arrayWatchers = obj[prop].__.arrayWatchers;

        // Already registered?
        if (arrayWatchers.indexOf(arrayCallback) === -1) {
          arrayWatchers.push(arrayCallback);
        }
      }
    };
