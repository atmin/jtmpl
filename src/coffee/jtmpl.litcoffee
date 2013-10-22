## Interface

### Compile:

String jtmpl(String template, AnyType model)

### Compile and bind (browser only):

void jtmpl(DOMElement target, String template, AnyType model)

`target` and `template` can be Strings in the format "#element-id".



    root = this
    jtmpl = root.jtmpl = (target, template, model, options) ->

      # Deprecated. `jtmpl(selector)`?
      if (target is null or typeof target is 'string') and not template?

        if not document?
          throw ':( this API is only available in a browser'

        return Array.prototype.slice.call(document.querySelectorAll(target))

      # `jtmpl(template, model)`?
      if typeof target is 'string' and
        typeof template in ['number', 'string', 'boolean', 'object'] and
        model is undefined

        options = model
        model = template
        template = target
        target = undefined

      # `jtmpl('#element-id', ...)`?
      if typeof target is 'string' and target.match(RE_IDENTIFIER)
        target = document.getElementById(target.substring(1))
      
      if not model?
        throw ':( no model'

      # `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`
      template = document.getElementById(template.substring(1)).innerHTML 
        if template.match and template.match(RE_IDENTIFIER)

      # options
      options = options or {}

      # string-separated opening and closing delimiter
      options.delimiters = (options.delimiters or '{{ }}').split(' ')
      # delimiters are changed in the generated HTML comment-enclosed section prototype
      # to avoid double-parsing
      options.compiledDelimiters = (options.compiledDelimiters or '<<< >>>').split(' ')

      # sections not enclosed in HTML tag are automatically enclosed
      options.defaultSection = options.defaultSectionTag or 'div'
      # default for section items
      options.defaultSectionItem = options.defaultSectionItem or 'div'
      # default for section items
      options.defaultVar = options.defaultVar or 'span'

      # default target tag
      options.defaultTargetTag = options.defaultTargetTag or 'div'


      # Compile template
      html = jtmpl.compile(template, model, 0, null, false, options)






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

Signatures:

String `replaceWith` (String for each group in pattern, AnyType model, Object context)

String `context.recurFunc` (AnyType model, String property, Boolean echoMode)

void `context.setWrapperAttr` (String attrName, String attrValue)



    jtmpl.compileRules = [

      { # {{var}}
        pattern: "{{ (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultVar'
        replaceWith: (prop, model) -> escapeHTML(model[prop])
      }


      { # {{unescaped_var}}
        pattern: "{{ & (#{ RE_IDENTIFIER }) }}"
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

Signatures:

Function AnyType (AnyType val) `react`
(DOMElement node, String for each pattern group, AnyType model)



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


    jtmpl.compile = (template, model, position, openTag, echoMode, options) ->

      tokenizer = regexp("{{ (#{ RE_ANYTHING }) }}", options)

      while (token = tokenizer.exec(template))

        slice = template.slice(0, tokenizer.lastIndex)

        # Process rules in reverse order, most specific to least specific
        for rule in jtmpl.compileRules by -1

          match = regexp(rule.pattern).match(slice)
          if match
            return 





## Bind rules processor

Walk DOM and setup reactors between model and nodes.






## Supporting code


### Array shortcuts

    ap = Array.prototype
    apslice = -> ap.slice

    


### Functional utilities

Function curry(Function f, AnyType frozenArg1, AnyType frozenArg2, ...)

    curry = ->
      args = apslice.call(arguments)
      ->
        args2 = apslice.call(arguments)
        args[0].apply(@, args.slice(1).concat(args2))


Function compose(Function f, Function g)

    compose = (f, g) -> -> f(g.apply(@, apslice.call(arguments)))




### Regular expression utilities

String escapeRE(String s)

Escape regular expression characters

    escapeRE = (s) -> (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1')




RegExp regexp(String src)

Replace mustaches with current delimiters, strip whitespace, return RegExp

    regexp = (src, options) ->
      new RegExp(src
        # triple mustache to alt non-escaped var output
        .replace('{{{', escapeRE(options.delimiters[0]) + '&')
        .replace('}}}', escapeRE(options.delimiters[1]))
        .replace('{{',  escapeRE(options.delimiters[0]))
        .replace('}}',  escapeRE(options.delimiters[1]))
        .replace(/\s+/g, '')
      )



### String utilities

String escapeHTML(String val)

Replace HTML special characters

    escapeHTML = (val) ->
      (val? and val or '')
        .toString()
        .replace /[&\"<>\\]/g, (s) ->
          switch s
            when '&' then '&amp;'
            when '\\'then '\\\\'
            when '"' then '\"'
            when '<' then '&lt;'
            when '>' then '&gt;'
            else s
