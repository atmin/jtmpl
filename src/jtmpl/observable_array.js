/*

Proxy mutable array methods

*/

    function ObservableArray(items, listener) {
      var _items, _listener;
      var method, mutableMethods = {
        pop: function() {
          var result = _items.pop();
          listener([{
            type: 'delete',
            name: _items.length,
            object: _items
          }]);
        },

        push: function(item) {

        }
      };

      function arr(i, val) {
        return (val === undefined) ?
          // Getter
          _items[i] :
          // Setter
          (_items[i] = val);
      }

      for (method in mutableMethods) {
        arr[method] = mutableMethods[method];
      }

      _items = items;
      return arr;
    }


    j.ObservableArray = ObservableArray;