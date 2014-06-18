/*

## Main function

Referred as `j`, exported as `jtmpl`.

*/

    function j() {
      var args = [].slice.call(arguments);
  
      // jtmpl('HTTP_METHOD', url[, parameters[, callback[, options]]])?
      if (['GET', 'POST'].indexOf(args[0]) > -1) {
        return j.xhr.apply(null, args);
      }

      // jtmpl(template, model[, options])?
      else if (
        typeof args[0] === 'string' && 
        typeof args[1] === 'object' &&
        ['object', 'undefined'].indexOf(typeof args[2]) > -1
      ) {
        return j.compile.apply(null, args);
      }

      // jtmpl(target, model[, options])?
      // else if (
      //   args[0] instanceof Node &&
      //   typeof args[1] === 'object'
      // ) {
      //   console.log('jtmpl(target, model[, options])');
      // }

      // jtmpl(target, template, model[, options])?
      else if (
        ( args[0] instanceof Node || 
          (typeof args[0] === 'string')
        ) &&

        ( args[1] instanceof Node || 
          args[1] instanceof DocumentFragment ||
          (typeof args[1] === 'string')
        ) &&

        typeof args[2] === 'object'

      ) {

        console.log('jtmpl(target, template, model[, options])');
      }
    }
