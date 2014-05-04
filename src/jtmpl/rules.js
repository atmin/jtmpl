/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return (all fields optional)

     {
       // Replace tag in generated content, default - ''
       replace: 'replacement'

       // Set new context, default - original model
       model: set_new_context_object

       // Parse until {{/tagName}} ...
       block: 'tagName'
       // ... then call this function with the extracted template
       callback: function continuation(template) ...
     }

*/

    j.rules = [


/*

### class="{{some-class}}"

Toggles class `some-class` in sync with boolean `model['some-class']`

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(RE_IDENTIFIER);
        
        if (attr === 'class' && match) {

          j.watch(model, tag, function(val) {
            (!!val && j.addClass || j.removeClass)(node, tag);
          });

          return {
            replace: !!model[tag] && tag || ''
          };
        }
      },


/*

### {{#section}}

Can be bound to text node

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(new RegExp('#' + RE_SRC_IDENTIFIER));
        
        if (match) {

          console.log(match);

          return {
            replace: document.createTextNode('.'),
            block: match[1],
            callback: function(template) {

            }
          };
        }
      },



/*

### {{var}}

Can be bound to text node data or attribute

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(RE_IDENTIFIER);
        
        if (match) {

          if (attr) {
            // Attribute
            j.watch(model, tag, function(val) {
              return val ?
                node.setAttribute(attr, val) :
                node.removeAttribute(attr);
            });
          }
          else {
            // Text node
            j.watch(model, tag, function(val) {
              node.data = val;
            });
          }

          return {
            replace: model[tag]
          };
        }
      }

    ];
