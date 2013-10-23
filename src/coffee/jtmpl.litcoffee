## Interface

### Compile:

String jtmpl(String template, AnyType model)

### Compile and bind (browser only):

void jtmpl(DOMElement target, String template, AnyType model)

`target` and `template` can be Strings in the format "#element-id".

### Main function



    jtmpl = (target, template, model, options) ->

      # Deprecated. `jtmpl(selector)`?
      if (target is null or typeof target is 'string') and not template?

        if not document?
          throw ':( this API is only available in a browser'

        return apslice.call(document.querySelectorAll(target))

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
      template =
        if template.match and template.match(RE_IDENTIFIER)
          document.getElementById(template.substring(1)).innerHTML 

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
      html = jtmpl.compile(template, model, null, false, options)

    this.jtmpl = jtmpl





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

Delimiters in `pattern`s are replaced with escaped options.delimiters, whitespace - stripped.

Inline tags implement `replaceWith`, section (block) tags implement `contents`.

Signatures:

[String, Array] `replaceWith` (String for each group in pattern, AnyType model)

[String, Array] `contents` (String template, AnyType model, String section)


    jtmpl.compileRules = [

      { # {{var}}
        pattern: "{{ (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultVar'
        replaceWith: (prop, model) -> [escapeHTML(model[prop]), []]
      }


      { # {{unescaped_var}}
        pattern: "{{ & (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultVar'
        replaceWith: (prop, model) -> [model[prop], []]
      }


      { # {{#section}}
        pattern: "{{ \\# (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultSection'
        contents: (template, model, section) ->
          val = model[section]
          # Sequence?
          if Array.isArray(val)
            [ # template as HTML comment
              "<!-- # #{ template } -->"
              +
              # Render body for each item
              (jtmpl(template, item) for item in val).join('')
              ,
              []
            ]

          # Context?
          else if typeof val is 'object'
            # Render body using context
            [ jtmpl(template, val),
              []
            ]

          else
            [ jtmpl(template, model),
              if not val then ['style', 'display:none'] else []
            ]
      }


      { # {{^block}}
        pattern: "{{ \\^ (#{ RE_IDENTIFIER }) }}"
        defaultWrapper: 'defaultSection'
        contents: (template, model, section) ->
          val = model[section]

          # Sequence?
          if Array.isArray(val)
            [ # template as HTML comment
              "<!-- # #{ template } -->"
              +
              # Render body if array empty
              if not val.length then jtmpl(template, model) else ''
              ,
              []
            ]

          else
            [ jtmpl(template, model),
              if val then ['style', 'display:none'] else []
            ]
      }


      { # class="...{{booleanVar}}
        pattern: "(class=\"? #{ RE_ANYTHING }) {{ (#{ RE_IDENTIFIER }) }}"
        replaceWith: (pre, prop, model) ->
          val = model[prop]
          [ # Emit match, and class name if true
            pre + (typeof val is 'boolean' and val and prop or '')
            ,
            []
          ]
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
          # attach DOM reactor

          # first select option?
          if node.nodeName is 'OPTION' and node.parentNode.querySelector('option') is node
            node.parentNode.addEventListener('change', ->
              idx = 0
              for option in node.parentNode.children
                if option.nodeName is 'OPTION'
                  model[prop] = option.selected
                  idx++
            )

          # radio group?
          if node.type is 'radio' and node.name
            node.addEventListener('change', ->
              if node[attr]
                for input in document.querySelectorAll("input[type=radio][name=#{ node.name }]")
                  if input isnt node
                    input.dispatchEvent(new Event('change'))
              model[prop] = node[attr]
            )

          # text input?
          if node.type is 'text'
            node.addEventListener('input', -> model[prop] = node[attr])

          # other inputs
          else
            node.addEventListener('change', -> model[prop] = node[attr])

          # return model reactor
          (val) -> if node[attr] isnt val then node[attr] = val
      }


    ]





## Compile rules processor

Tokenize template and apply each rule


    jtmpl.compile = (template, model, openTag, echoMode, options) ->

      tokenizer = regexp("{{ (#{ RE_ANYTHING }) }}", options)
      result = ''
      pos = 0

      return

      while (token = tokenizer.exec(template))

        slice = template.slice(pos, tokenizer.lastIndex)

        # Process rules in reverse order, most specific to least specific
        for rule in jtmpl.compileRules by -1

          match = slice.match(regexp(rule.pattern, options))
          result +=
            if match
              slice.slice(pos, tokenizer.lastIndex - match[0].length) +
              rule.replaceWith.apply(null, match.slice(1).concat([model, context]))
            else
              ''              





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




RegExp regexp(String src, Object options)

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





### Binding utilities

Bind an array to DOM node, 
so when array is modified, node children are updated accordingly


    bindArrayToNodeChildren = (array, node) ->
      # node not already augmented?
      if not array.__garbageCollectNodes
        # proxy mutable array operations
        array.__garbageCollectNodes = ->
          i = this.__nodes.length
          while --i
            if not this.__nodes[i].parentNode
              this.__nodes.splice(i, 1)

        array.__removeEmpty = ->
          if not this.length then node.innerHTML = ''

        array.__addEmpty = ->
          if not this.length then node.innerHTML = jtmpl(node.getAttribute('data-jt-0') or '', {})

        array.pop = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          node.removeChild(node.children[node.children.length - 1]) for node in this.__nodes
          AP.pop.apply(this, arguments)
          AP.pop.apply(this.__values, arguments)
          this.__addEmpty()

        array.push = (item) ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          node.appendChild(createSectionItem(node, item)) for node in this.__nodes
          AP.push.apply(this, arguments)
          len = this.__values.length
          result = AP.push.apply(this.__values, arguments)
          bindProp(item, len)
          result

        array.reverse = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          result = AP.reverse.apply(this.__values, arguments)
          for node in this.__nodes
            node.innerHTML = ''
            for item, i in this.__values
              node.appendChild(createSectionItem(node, item))
              bindProp(item, i)
          this.__addEmpty()
          result

        array.shift = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          AP.shift.apply(this, arguments)
          result = AP.shift.apply(this.__values, arguments)
          for node in this.__nodes
            node.removeChild(node.children[0])
          for item, i in this.__values
            bindProp(item, i)
          this.__addEmpty()
          result

        array.unshift = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          for item in AP.slice.call(arguments).reverse()
            for node in this.__nodes
              node.insertBefore(createSectionItem(node, item), node.children[0])
          AP.unshift.apply(this, arguments)
          result = AP.unshift.apply(this.__values, arguments)
          for item, i in this.__values
            bindProp(item, i)
          this.__addEmpty()
          result

        array.sort = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          AP.sort.apply(this, arguments)
          result = AP.sort.apply(this.__values, arguments)
          for node in this.__nodes
            node.innerHTML = ''
            for item, i in array
              node.appendChild(createSectionItem(node, item)) for node in this.__nodes
              bindProp(item, i)
          this.__addEmpty()
          result

        array.splice = (index, howMany) ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          for node in this.__nodes
            for i in [0...howMany]
              node.removeChild(node.children[index])
            for item in AP.slice.call(arguments, 2)
              node.insertBefore(createSectionItem(node, item), node.children[index])
              bindProp(item, index)
          AP.splice.apply(this, arguments)
          AP.splice.apply(this.__values, arguments)
          this.__addEmpty()

        bindProp = (item, i) ->
          array.__values[i] = item
          Object.defineProperty(array, i, 
            get: -> this.__values[i]
            set: (val) -> 
              this.__garbageCollectNodes()
              this.__values[i] = val
              node.replaceChild(createSectionItem(node, val), node.children[i]) for node in this.__nodes
          )

        # bound nodes
        Object.defineProperty(array, '__nodes',
          enumerable: false
          writable: true
          value: []
        )
        # onchange handlers for each item
        Object.defineProperty(array, '__values',
          enumerable: false
          writable: true
          value: []
        )
        for item, i in array
          bindProp(item, i)

      if array.__nodes.indexOf(node) is -1 then array.__nodes.push(node)
      array
