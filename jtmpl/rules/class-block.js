/*

### class="{{#ifCondition}}some-class{{/}}"

Toggles class `some-class` in sync with boolean `model.ifCondition`

*/

    module.exports = function(tag, node, attr, model, options) {
      var match = tag.match(new RegExp('#' + require('../consts').RE_SRC_IDENTIFIER));
      var prop = match && match[1];
      var klass;

      function change() {
        var val = model(prop);
        require('element-class')(node)
          [!!val && 'add' || 'remove'](klass);
      }
      
      if (attr === 'class' && match) {
        model.on('change', prop, change);
        change();

        return {
          block: prop,

          replace: function(tmpl) {
            klass = tmpl;
            return '';
          }
        };
      }
    }
