/*

## Rules

Each rule is a function, args passed (tag, node, attr, model, options)

It MUST return either:

* falsy value - no match

* object - match found, return (all fields optional)

     {
       // Replace tag in generated content, default - ''
       replace: 'replacement'

       // Transformed model, default - original model
       model: set_new_context_object

       // Parse until {{/tagName}} ...
       block: 'tagName'
       // ... then call this function with the extracted template
       callback: function continuation(template) ...
     }

*/

    j.rules = [


/*

### {{var}}

*/

      function (tag, node, attr, model, options) {
        var match = tag.match(RE_IDENTIFIER);
        
        if (match) return {
          replace: model[tag]
        };
      }

    ];
