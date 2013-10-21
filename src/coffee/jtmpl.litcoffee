## Interface

    root = this
    root.jtmpl = (target, template, model, options) ->
      reId = /^\#[\w-]+$/

      # Deprecated. `jtmpl(selector)`?
      if (target is null or typeof target is 'string') and not template?
        if not document?
          throw ':( this API is only available in a browser'
        return Array.prototype.slice.call(document.querySelectorAll(target))

      # `jtmpl(template, model)`?
      if typeof target is 'string' and typeof template in ['number', 'string', 'boolean', 'object'] and model is undefined
        options = model
        model = template
        template = target
        target = undefined    

      # `jtmpl('#element-id', ...)`?
      if typeof target is 'string' and target.match(reId)
        target = document.getElementById(target.substring(1))
      
      if not model?
        throw ':( no model'

      # `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`
      template = document.getElementById(template.substring(1)).innerHTML if template.match and template.match(reId)







## Rules

jtmpl is a processor of rules. There are two sequences,
one for each stage, compilation and binding.

Rules in each sequence are in increasing specificity order.

Both stages can be extended with new rules:
`jtmpl.compileRules.push({ ... })`, `jtmpl.bindRules.push({ ... })`




### Regular expression atoms

Used in various matchers

    RE_IDENTIFIER = '[\\w\\.\\-]+'
    RE_ANYTHING = '[\\s\\S]*?'





### Compile rules 

Delimiters in `pattern`s are replaced with escaped options.delimiters, whitespace - stripped

`replaceWith` signature
return: String
params: String for each group in pattern, AnyType model, Object context

    jtmpl.compileRules = [

      { # {{var}}
        pattern: "{{ (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultVar'
        replaceWith: (prop, model) -> model[prop]
      }


      { # {{#block}}
        pattern: "{{ \\# (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultSection'
        replaceWith: (prop, model, context) ->
          val = model[prop]

          # Sequence?
          if Array.isArray(val)
            # template as HTML comment
            "<!-- # #{ context.recurFunc(null, prop, true) } -->"
            +
            # Render body for each item
            (context.recurFunc(item, prop) for item in val).join('')            

          # Context?
          else if typeof val is 'object'
            # Render body using context
            context.recurFunc(val, prop)

          else
            # hide if falsy value
            if not val then context.setWrapperAttr('style', 'display:none')
            # Render body using model
            context.recurFunc(model, prop)
      }


      { # {{^block}}
        pattern: "{{ \\^ (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultSection'
        replaceWith: (prop, model, context) ->
          val = model[prop]

          # Sequence?
          if Array.isArray(val)
            # template as HTML comment
            "<!-- ^ #{ context.recurFunc(null, prop, true) } -->"
            +
            # Render body if array empty
            if not val.length then context.recurFunc(model, prop) else ''

          else
            # hide if truthy value
            if val then context.setWrapperAttr('style', 'display:none')
            # Render body using model
            context.recurFunc(model, prop)
      }


      { # class="...{{booleanVar}}
        pattern: "(class=\"? #{ RE_ANYTHING }) {{ (#{ RE_IDENTIFIER }) }}"
        replaceWith: (pre, prop, model) ->
          val = model[prop]
          # Emit match, and class name if true
          pre + (typeof val is 'boolean' and val and prop or '')
      }
    ]



### Bind rules

Matching is done on tokenized data-jt items

`react` signature
return: function (AnyType val), to be called on prop change
params: DOMElement node, String for each pattern group, AnyType model

    bindRules = [

      { # var
        pattern: "#{ RE_IDENTIFIER }",
        react: (node) ->
          (val) -> node.innerHTML = val
      }


      { # attr=var
        pattern: "(#{ RE_IDENTIFIER }) = #{ RE_IDENTIFIER }",
        react: (node, attr) ->
          (val) -> if node[attr] isnt val then node[attr] = val
      }


      { # class=var
        pattern: "class = (#{ RE_IDENTIFIER })",
        react: (node, prop, model) ->
          (val) -> (val and addClass or removeClass)(node, prop)
      }


      { # value/checked/selected=var
        pattern: "(value | checked | selected) = (#{ RE_IDENTIFIER })",
        react: (node, attr, prop, model) ->
          (val) -> if node[attr] isnt val then node[attr] = val
      }


    ]





## Compile rules processor

Tokenize template and apply each rule

    jtmpl.compile = (template, model, position, openTag, echoMode) ->

      tokenizer = jtmpl.regexp("{{ (#{ RE_ANYTHING }) }}")

      while (token = tokenizer.exec(template))

        slice = template.slice(0, tokenizer.lastIndex)

        # Process rules in reverse order, most specific to least specific
        for i in [jtmpl.compileRules.length - 1..0] by -1

          rule = jtmpl.compileRules[i]
          match = rule.pattern.match(slice)



## Utility functions

Replace mustaches with current delimiters, strip whitespace, return RegExp

    jtmpl.regexp = (re) ->