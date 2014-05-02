/*



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