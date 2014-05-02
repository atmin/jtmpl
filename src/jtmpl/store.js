/*

### Store

Object-to-object map.

`store = new Store()`

#### get(object, proto)`

Returns associated object, initializes slot for `object`

`watchers = store.get(obj, { wathers: [] }).watchers`

#### release(object)

Releases the slot for `object` (if present).

`store.release(obj)`

*/

    function Store() {
      this.objs = [];
      this.store = [];
    }

    Store.prototype = {
      get: function(obj, proto) {
        var pos = this.objs.indexOf(obj);
        if (pos > -1) {
          return this.store[pos];
        }
        else {
          this.objs.push(obj);
          this.store.push(proto || {});
        }
      },

      release: function(obj) {
        var pos = this.objs.indexOf(obj);
        if (pos > -1) {
          this.objs.splice(pos, 1);
          this.store.splice(pos, 1);
        }
      }
    };