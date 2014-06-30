/*

### class="{{some-class}}"

Toggles class `some-class` in sync with boolean `model['some-class']`

*/

    module.exports = function(tag, node, attr, model, options) {
      var match = tag.match(RE_IDENTIFIER);
      var ec = require('element-class')(node);

      function change() {
        ec[!!model(tag) && 'add' || 'remove'](klass);
      }
      
      if (attr === 'class' && match) {
        // Remove tag from class list
        ec.remove(options.delimiters[0] + tag + options.delimiters[1]);

        model.on('change', prop, change);
        change();

        return {};
      }
    }
