/*

### onevent="{{handler}}"

Attach event listener for the 'event' event, remove the attribute

*/

    module.exports = function(tag, node, attr, model, options) {
      var consts = require('../consts');
      var tagmatch = tag.match(consts.RE_IDENTIFIER);
      var attrmatch = attr && attr.match(new RegExp('on' + consts.RE_SRC_IDENTIFIER));

      if (tagmatch && attrmatch) {
        // Remove 'onevent' attribute
        node.setAttribute(attr, null);
        // TODO: use event delegation
        // `model.values` is used, because we don't want to treat
        // event handler as computed property
        node.addEventListener(attrmatch[1], model.values[tag]);

        return {};
      }
    }
