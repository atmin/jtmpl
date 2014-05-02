/*

### extend(a, b)

Right-biased key-value concat of objects `a` and `b`

*/

    function extend(a, b) {
      var o = {};
      var i;

      for (i in a) {
        o[i] = a[i];
      }

      for (i in b) {
        o[i] = b[i];
      }

      return o;
    }



/*

### hasClass, addClass, removeClass

Element class handling utilities.

*/

    j.hasClass = function(el, name) {
      return new RegExp('(\\s|^)' + name + '(\\s|$)').test(el.className);
    };

    j.addClass = function(el, name) { 
      if (!j.hasClass(el, name)) {
        el.className += (el.className && ' ' || '') + name;
      }
    };

    j.removeClass = function(el, name) {
      if (j.hasClass(el, name)) {
        el.className = el.className
          .replace(new RegExp('(\\s|^)' + name + '(\\s|$)'), '')
          .replace(/^\s+|\s+$/g, '');
      }
    };
