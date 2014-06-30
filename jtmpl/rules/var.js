/*

### {{var}}

Can be bound to text node data or attribute

*/

    module.exports = function(tag, node, attr, model, options) {
      var react, target;
      
      if (tag.match(require('../consts').RE_IDENTIFIER)) {

        // Attribute?
        if (attr) {
          model.on('change', tag,
            function() {
              var val = model(tag);
              return val ?
                node.setAttribute(attr, val) :
                node.removeAttribute(attr);
            }
          );
        }
        // Text node
        else {
          target = document.createTextNode('');

          model.on('change', tag,
            function() {
              target.data = model(tag) || '';
            }
          );
        }

        // Trigger change
        model(tag, model(tag));

        // Match found
        return {};
      }
    }
