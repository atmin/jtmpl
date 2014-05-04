/*

### extend(a, b)

Right-biased key-value concat of objects `a` and `b`

*/

    j.extend = function(a, b) {
      var o = {};
      var i;

      for (i in a) {
        if (a.hasOwnProperty(i)) {
          o[i] = a[i];
        }
      }

      for (i in b) {
        if (b.hasOwnProperty(i)) {
          o[i] = a[b];
        }
      }

      return o;
    };



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
