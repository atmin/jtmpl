/*

Proxy mutable array methods

*/

    function ObservableArray(array, listener) {
      var _items, _listener;
      var method, mutableMethods = {

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

      items = array;
      return arr;
    }


    j.ObservableArray = ObservableArray;