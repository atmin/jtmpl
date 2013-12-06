<span>{<span>&rsaquo;</span></span> [jtmpl](/) <sup>0.2.0</sup>
===============================================================



## Interface



### Compile:

String jtmpl(String template, AnyType model)



### Compile and bind (browser only):

void jtmpl(DOMElement target, String template, AnyType model)

`target` and `template` can be Strings in the format "#element-id".




### Main function

Target NodeJS and browser

    jtmpl = (exports ? this).jtmpl = (target, template, model, options) ->

      # Deprecated. `jtmpl(selector)`?
      if (target is null or typeof target is 'string') and not template?

        if not document?
          throw new Error(':( this API is only available in a browser')

        return apslice.call(document.querySelectorAll(target))

      # `jtmpl(template, model)`?
      if typeof target is 'string' and
          typeof template in ['number', 'string', 'boolean', 'object'] and
          (model is undefined or model is null)

        model = template
        template = target
        target = undefined

      # `jtmpl('#element-id', ...)`?
      if typeof target is 'string' and target.match(RE_NODE_ID)
        target = document.getElementById(target.substring(1))
      
      if not model?
        throw new Error(':( no model')

      # `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`      
      if template.match and template.match(RE_NODE_ID)
        template = document.getElementById(template.substring(1)).innerHTML

      # options
      options = options or {}

      # string-separated opening and closing delimiter
      options.delimiters = (options.delimiters or '{{ }}').split(' ')
      # delimiters are changed in the generated HTML comment-enclosed section prototype
      # to avoid double-parsing
      options.compiledDelimiters = (options.compiledDelimiters or '#{ }#').split(' ')

      # sections not enclosed in HTML tag are automatically enclosed
      options.defaultSection = options.defaultSectionTag or 'div'
      # default for section items
      options.defaultSectionItem = options.defaultSectionItem or 'div'
      # default for section items
      options.defaultVar = options.defaultVar or 'span'

      # default target tag
      options.defaultTargetTag = options.defaultTargetTag or 'div'

      delimiters = options.delimiters

      ## Preprocess template
      template = ('' + template)
        # Convert triple mustache (output unescaped var) to alt form
        .replace(regexp("{{{ (#{ RE_IDENTIFIER }) }}}"), delimiters[0] + '&$1' + delimiters[1])
        # Strip HTML comments that enclose tokens
        .replace(regexp("<!-- #{ RE_SPACE } ({{ #{ RE_ANYTHING } }}) #{ RE_SPACE } -->", delimiters), '$1')
        # Strip single quotes around html element attributes associated with tokens
        .replace(regexp("(#{ RE_IDENTIFIER })='({{ #{ RE_IDENTIFIER } }})'", delimiters), '$1=$2')
        # Strip double quotes around html element attributes associated with tags
        .replace(regexp("(#{ RE_IDENTIFIER })=\"({{ #{ RE_IDENTIFIER } }})\"", delimiters), '$1=$2')
        # If tags stand on their own line remove the line, keep the tag only
        .replace(regexp("\\n #{ RE_SPACE } ({{ #{ RE_ANYTHING } }}) #{ RE_SPACE } \\n", delimiters), '\n$1\n')

      # Compile template
      html = jtmpl.compile(template, model, null, false, options).trim()

      # Done?
      if not target then return html

      if target.nodeName is 'SCRIPT'
        newTarget = document.createElement(options.defaultTargetTag)
        target.parentNode.replaceChild(newTarget, target)
        target = newTarget

      # Construct DOM
      target.innerHTML = html

      # Bind recursively using data-jt attributes
      options.rootModel = model
      # jtmpl.bind(target, model, options)






## Rules

jtmpl is a processor of rules. 

Rules in sequences are in increasing generality order. It's just like 
[Haskell pattern matching](http://learnyouahaskell.com/syntax-in-functions).

Compilation and binding stages can be extended with new rules,
put them at the beginning:

`jtmpl.compileRules.unshift({ new compile rule... })`  
`jtmpl.bindRules.unshift({ new binding rule... })`





### Regular expression atoms

Used in various matchers

    RE_IDENTIFIER = '[\\w\\.\\-]+'
    RE_NODE_ID = '^#[\\w\\.\\-]+$'
    RE_ANYTHING = '[\\s\\S]*?'
    RE_SPACE = '\\s*'
    RE_DATA_JT = '(?: ( \\s* data-jt = " [^"]* )" )?'
    RE_COLLECTION_TEMPLATE = /^(#|\^)\s([\s\S]*)$/




### Pre-processing rules

Transformations to clean up template for easier matching


    jtmpl.preprocessingRules = [

      { pattern: "", replaceWith: "" }

      { pattern: "", replaceWith: "" }

      { pattern: "", replaceWith: "" }
    ]




### Compile rules 

Delimiters in `pattern`s are replaced with escaped options.delimiters, whitespace - stripped.

Inline tags implement `replaceWith`, section (block) tags implement `contents`.

Signatures:

[String, Array] `replaceWith` (String for each group in pattern, AnyType model)

String `bindingToken` (String for each group in pattern)

[String, Array] `contents` (String template, AnyType model, String section, Object options)



    jtmpl.compileRules = [

      { # class="whatever, maybe other bindings... {{booleanVar}}
        pattern: "(class=\"? [\\w \\. \\- \\s {{}}]*) {{ (#{ RE_IDENTIFIER }) }}$"
        replaceWith: (pre, prop, model) ->
          val = model[prop]
          [ # Emit match, and class name if booleanVar
            (pre.search('{') is -1 and pre or ' ') +
            (typeof val is 'boolean' and val and prop or '')
            ,
            []
          ]
        echoReplaceWith: (pre, prop) ->
          if pre.search('{') > - 1 then " {{#{ prop }}}" else null
        bindingToken: (pre, prop) -> "class=#{ prop }"
      }


      { # onevent={{func}}
        pattern: "on(#{ RE_IDENTIFIER }) = {{ (#{ RE_IDENTIFIER }) }}$"
        replaceWith: -> ['', []]
        bindingToken: (event, handler) -> "on#{ event }=#{ handler }"
      }


      { # attr={{prop}}
        pattern: "(#{ RE_IDENTIFIER }) = {{ (#{ RE_IDENTIFIER }) }}$"
        replaceWith: (attr, prop, model) ->
          val = model[prop]
          # null?
          if not val? or val is null
            ['', []]
          # boolean?
          else if typeof val is 'boolean'
            [(if val then attr else ''), []]
          # quoted value
          else
            ["#{ attr }=\"#{ val }\"", []]
        bindingToken: (attr, prop) -> "#{ attr }=#{ prop }"
      }


      { # {{^inverted_section}}
        pattern: "{{ \\^ (#{ RE_IDENTIFIER }) }}$"
        wrapper: 'defaultSection'
        contents: (template, model, section, options) ->
          val = model[section]

          # Sequence?
          if Array.isArray(val)
            [
              # Render body if array empty
              if not val.length then jtmpl(template, model) else ''
              ,
              [
                [ # template as node data attribute
                  'data-jt-0',

                  multiReplace(template.trim(), options.delimiters, options.compiledDelimiters)
                ]
              ]
            ]

          else
            [ jtmpl(template, model),
              if val then [['style', 'display:none']] else []
            ]
        bindingToken: (section) -> "^#{ section }"
      }

      
      { # {{#section}}
        pattern: "{{ \\# (#{ RE_IDENTIFIER }) }}$"
        wrapper: 'defaultSection'
        contents: (template, model, section, options) ->
          val = model[section]
          # Sequence?
          if Array.isArray(val)
            [ # Render body for each item
              (jtmpl(template, item, null, { asArrayItem: true }) for item in val).join(''),
              [ # template as node data attribute
                [
                  'data-jt-1',

                  multiReplace(template.trim(), options.delimiters, options.compiledDelimiters)
                ]
              ]
            ]

          # Context?
          else if typeof val is 'object'
            # Render body using context
            [ jtmpl(template, val),
              []
            ]

          else
            [ jtmpl(template, model),
              if not val then [['style', 'display:none']] else []
            ]
        bindingToken: (section) -> "##{ section }"
      }


      { # {{&unescaped_var}}
        pattern: "{{ & (#{ RE_IDENTIFIER }) }}$"
        wrapper: 'defaultVar'
        replaceWith: (prop, model) -> [prop is '.' and model or model[prop], []]
        bindingToken: (prop) -> prop
      }


      { # {{var}}
        pattern: "{{ (#{ RE_IDENTIFIER }) }}$"
        wrapper: 'defaultVar'
        replaceWith: (prop, model) -> [escapeHTML(prop is '.' and model or model[prop]), []]
        bindingToken: (prop) -> prop
      }

    ]





### Bind rules

Matching is done on tokenized data-jt items

`react` signature:

Function void (AnyType val) `react`
(DOMElement node, String for each pattern group, AnyType model, Object options)



    jtmpl.bindRules = [

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


      { # onevent=var
        pattern: "on(#{ RE_IDENTIFIER }) = (#{ RE_IDENTIFIER })",
        react: (node, evnt, listener, model, options) ->
          handler = options?.rootModel?[listener] or model[listener]
          if typeof handler is 'function'
            node.addEventListener(evnt, handler.bind(model))
          else
            throw ":( #{ listener } is not a function, cannot attach event handler"

          # job done, no reactor to return
          null
      }


      { # class=var
        pattern: "class = (#{ RE_IDENTIFIER })",
        react: (node, prop, model) ->
          (val) -> (val and addClass or removeClass)(node, prop)
      }


      { # attr=var
        pattern: "(#{ RE_IDENTIFIER }) = #{ RE_IDENTIFIER }",
        react: (node, attr) ->
          (val) -> if node[attr] isnt val then node[attr] = val
      }


      { # section
        pattern: "(# | \\^) (#{ RE_IDENTIFIER })",

        # do not process children recursively during binding phase
        recurse: false,

        react: (node, sectionType, attr, model, options) ->
          val = model[attr]

          if Array.isArray(val) and sectionType is '#'
            # bind collection items to node children
            for child, i in node.children
              jtmpl.bind(child, val[i], options)

          else if typeof val is 'object'
            # bind context
            jtmpl.bind(node, val, options)

          # else
            # if section
            # jtmpl.bind(node, model, options)

          # Return reactor function
          (val) ->
            # collection?
            if Array.isArray(val)
              jtmpl.bindArrayToNodeChildren(val, node)

              node.innerHTML =
                if not val.length
                  jtmpl(node.getAttribute('data-jt-0') or '', {})
                else 
                  ''

              node.appendChild(jtmpl.createSectionItem(node, item)) for item in val

            # local context?
            else if typeof val is 'object'
              node.innerHTML = jtmpl(node.getAttribute('data-jt-1') or '', val)
              jtmpl(node, node.innerHTML, val, { rootModel: model })

            # if section
            else
              node.style.display = (!!val is (sectionType is '^')) and 'none' or ''

      }


      { # var
        pattern: "#{ RE_IDENTIFIER }",
        react: (node) ->
          (val) -> node.innerHTML = val
      }

    ]





## Compile rules processor

### Compile routine

Tokenize template and apply each rule on tokens.
Rules can be inline or recursive, end block is hardcoded as "{{/block}}".
Current delimiters are respected.

String  template
AnyType model
String  openTag
Boolean echoMode
Array   delimiters
Boolean asArrayItem


    jtmpl.compile = (template, model, openTag, echoMode, options, asArrayItem) ->

      tokenizer = regexp("{{ (\/?) (#{ RE_ANYTHING }) }}", options.delimiters)
      result = ''
      pos = 0

      while (token = tokenizer.exec(template))

        # End block?
        if token[1]
          if token[2] isnt openTag
            throw new Error(openTag and
              ":( expected {{/#{ openTag }}}, got {{#{ token[2] }}}" or
              ":( unexpected {{/#{ token[2] }}}")
              
          # Exit recursion
          return result + template.slice(pos, tokenizer.lastIndex - token[0].length)

        slice = template.slice(Math.max(0, pos - 128), tokenizer.lastIndex)

        # Process rules
        for rule in jtmpl.compileRules

          match = regexp(rule.pattern, options.delimiters).exec(slice)
          if match
            # accumulate output
            result += template.slice(pos, tokenizer.lastIndex - match[0].length)

            # inject token in data-jt attr
            htagPos = lastOpenedHTMLTag(result)
            bindingToken = rule.bindingToken(match.slice(1)...)

            # inline tag or section?
            if rule.replaceWith?
              if echoMode
                result += rule.echoReplaceWith?(match.slice(1)...) or match[0]
              else
                [replaceWith, wrapperAttrs] =
                  rule.replaceWith(match.slice(1).concat([model])...)

                if htagPos is -1 and rule.wrapper?
                  # wrapping needed
                  tag = options[rule.wrapper]
                  result += injectAttributes(
                    injectTagBinding("<#{ tag }>#{ replaceWith }</#{ tag }>", bindingToken),
                    wrapperAttrs
                  )
                else
                  result += replaceWith
                  result = result.slice(0, htagPos) + injectAttributes(
                    injectTagBinding(result.slice(htagPos), bindingToken),
                    wrapperAttrs
                  )

              pos = tokenizer.lastIndex

            else
              # Recursively get nested template (echoMode=on)
              tmpl = jtmpl.compile(
                template.slice(tokenizer.lastIndex), 
                model, match[1], true, options)

              # Skip block contents
              tokenizer.lastIndex += tmpl.length

              # Match close block token
              closing = tokenizer.exec(template)
              pos = tokenizer.lastIndex

              if echoMode
                result += token[0] + tmpl + closing[0]
              else
                section = match[1]
                [contents, wrapperAttrs] = rule.contents(tmpl, model, section, options)

                if htagPos is -1
                  tag = options[rule.wrapper]

                  if section isnt lastSectionTag
                    lastSectionHTagPos = result.length
                    result += injectAttributes(
                      injectTagBinding("<#{ tag }>#{ contents }</#{ tag }>", bindingToken),
                      wrapperAttrs
                    )
                  else
                    result = (
                      result.slice(0, lastSectionHTagPos) +
                      injectAttributes(
                        injectTagBinding(result.slice(lastSectionHTagPos), bindingToken),
                        wrapperAttrs,
                        contents.trim()
                      )
                    )

                else
                  result = (
                    result.slice(0, htagPos) + 
                    injectAttributes(
                      injectTagBinding(result.slice(htagPos), bindingToken),
                      wrapperAttrs
                    ) +
                    contents.trim()
                  )
                  lastSectionHTagPos = htagPos

                lastSectionTag = section


            # Match was found, skip other rules
            break

      result += template.slice(pos)

      # Return accumulated output
      if options.asArrayItem

        # enclose in defaultSectionItem HTML tag if needed
        if isValidHTMLTag(result)
          result 
        else
          tag = options.defaultSectionItem
          "<#{ tag }>#{ result }</#{ tag }>"

      else
        result




### Compiling stage supporting utilities

String addTagBinding(String, String)

Inject token in HTML element data-jt attribute.
Create attribute if not existent.
wrapperAttrs is array of pairs [attribute, value] to inject in element

    injectTagBinding = (template, token) ->
      # group 1: 'data-jt' inject position
      # group 2: token inject position, if attribute exists
      # group 3 (RE_DATA_JT): existing 'data-jt' value
      match = regexp("^ (#{ RE_SPACE } < #{ RE_IDENTIFIER }) (#{ RE_ANYTHING }) #{ RE_DATA_JT }").exec(template)
      attrLen = (match[3] or '').length
      pos = match[1].length + match[2].length + attrLen
      # inject, return result
      ( template.slice(0, pos) +
        ( if attrLen
            (if match[3].trim() is 'data-jt="' then '' else ' ') + token
          else
            ' data-jt="' + token + '"'
        ) +
        template.slice(pos)
      )

    injectAttributes = (template, attributes, contents) ->
      if not attributes.length then return template

      match = regexp("^ (#{ RE_SPACE } < #{ RE_IDENTIFIER } #{ RE_ANYTHING })>").exec(template)
      pos = match[1].length
      (
        template.slice(0, pos) + 
        [" #{ pair[0] }=\"#{ pair[1].replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;') }\"" for pair in attributes].join('') +
        '>' +
        (contents or '') +
        template.slice(pos + 1)
      )



Int lastOpenedHTMLTag(String)

Return index of the last opening, maybe opened (no close bracket), HTML tag
followed by end of string, or -1, if no such exists

    lastOpenedHTMLTag = (template) ->
      template.trimRight().search(regexp("< #{ RE_IDENTIFIER } [^>]*? >?$"))



Boolean isValidHTMLTag(String)

Check if contents is properly formatted closed HTML tag

    isValidHTMLTag = (contents) ->
      !!contents.trim().match(regexp("^<(#{ RE_IDENTIFIER }) #{ RE_SPACE }
        [^>]*? > #{ RE_ANYTHING } </\\1>$ | < [^>]*? />$")
      )






## Bind rules processor

void `bind` (DOMElement root, AnyType model)

Walk DOM and setup reactors on model and nodes.


    jtmpl.bind = (root, model, options) ->

      # Returns true, if recursion should continue
      bindNode = (node) ->
        if attr = node.getAttribute('data-jt')
          # iterate node bindings
          for jt in attr.trim().split(' ')
            # iterate binding rules
            for rule in jtmpl.bindRules
              # matching rule?
              if match = regexp(rule.pattern).exec(jt)

                propChange(model, rule.attr,
                  rule.react([node].concat(match.slice(1), [model, options])...)
                )
                # Missing rule.recurse attribute means continue recursion
                return rule.recurse? and rule.recurse or true

          # If no data-jt attribute, continue recursion
          return true

      bindNode(root)

      for node in root.children

          if bindNode(node)
            jtmpl.bind(node, model, options)

      # return node
      node






## Supporting code


### Array shortcuts

    ap = Array.prototype
    apslice = ap.slice
    appop = ap.pop
    appush = ap.push
    apreverse = ap.reverse
    apshift = ap.shift
    apunshift = ap.unshift
    apsort = ap.sort


    


### Regular expression utilities

String escapeRE(String s)

Escape regular expression characters

    escapeRE = (s) -> (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1')




RegExp regexp(String src, Object options)

Replace mustaches with given delimiters, strip whitespace, return RegExp

    regexp = (src, delimiters) ->
      # strip whitespace
      src = src.replace(/\s+/g, '')
      new RegExp((if delimiters then src
        .replace('{{',  escapeRE(delimiters[0]))
        .replace('}}',  escapeRE(delimiters[1]))
        else src)
      , 'g')




### String utilities

String escapeHTML(String val)

Replace HTML special characters

    escapeHTML = (val) ->
      (val? and val or '')
        .toString()
        .replace /[&"<>\\]/g, (s) -> { 
            '&': '&amp;'
            '\\': '\\\\'
            '"': '\"'
            '<': '&lt;'
            '>': '&gt;'
          }[s]




String multiReplace(String template, Array from, Array to)

Replace `from` literal strings with `to` strings in template

    multiReplace = (template, from, to) ->
      for find, i in from
        template = template.replace(regexp(escapeRE(find)), to[i])
      template






### DOM utilities

DOMElement createSectionItem (DOMElement parent, AnyType context)

    jtmpl.createSectionItem = createSectionItem = (parent, context) ->
      element = document.createElement('body')
      element.innerHTML = jtmpl(parent.getAttribute('data-jt-1') or '', context)
      element = element.children[0]
      jtmpl(element, element.innerHTML, context, { rootModel: model })
      element





### Binding utilities

void propChange(Object obj, String prop, Function callback)

Register a callback to handle object property change. 

    propChange = (obj, prop, callback) ->
      # All must be specified, don't fail if not
      if not (obj and prop and callback) then return

      oldDescriptor = (Object.getOwnPropertyDescriptor(obj, prop) or
        Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop))

      Object.defineProperty(obj, prop, {
        get: oldDescriptor.get or -> oldDescriptor.value,
        set: ((val) ->
          oldDescriptor.set?(val) or oldDescriptor.value = val
          callback(val)
        ),
        configurable: true
      })





void bindArrayToNodeChildren(Array array, DOMElement node)

Bind an array to DOM node, 
so when array is modified, node children are updated accordingly.

Array is augmented by attaching listeners on existing indices
and setting a proxy for each mutable operation. 
`createSectionItem` is used for creating new items.


    jtmpl.bindArrayToNodeChildren = bindArrayToNodeChildren = (array, node) ->

      # array already augmented?
      if not array.__garbageCollectNodes

        # it's possible for a referenced node to be destroyed. free the reference
        array.__garbageCollectNodes = ->
          i = this.__nodes.length
          while --i
            if not this.__nodes[i].parentNode
              this.__nodes.splice(i, 1)

        array.__removeEmpty = ->
          if not this.length then node.innerHTML = ''

        array.__addEmpty = ->
          if not this.length then node.innerHTML = jtmpl(node.getAttribute('data-jt-0') or '', {})

        # Mutable array operations

        array.pop = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          node.removeChild(node.children[node.children.length - 1]) for node in this.__nodes
          appop.apply(this, arguments)
          appop.apply(this.__values, arguments)
          this.__addEmpty()

        array.push = (item) ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          node.appendChild(createSectionItem(node, item)) for node in this.__nodes
          appush.apply(this, arguments)
          len = this.__values.length
          result = appush.apply(this.__values, arguments)
          bindProp(item, len)
          result

        array.reverse = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          result = apreverse.apply(this.__values, arguments)
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
          apshift.apply(this, arguments)
          result = apshift.apply(this.__values, arguments)
          for node in this.__nodes
            node.removeChild(node.children[0])
          for item, i in this.__values
            bindProp(item, i)
          this.__addEmpty()
          result

        array.unshift = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          for item in apslice.call(arguments).reverse()
            for node in this.__nodes
              node.insertBefore(createSectionItem(node, item), node.children[0])
          apunshift.apply(this, arguments)
          result = apunshift.apply(this.__values, arguments)
          for item, i in this.__values
            bindProp(item, i)
          this.__addEmpty()
          result

        array.sort = ->
          this.__removeEmpty()
          this.__garbageCollectNodes()
          apsort.apply(this, arguments)
          result = apsort.apply(this.__values, arguments)
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
            for item in apslice.call(arguments, 2)
              node.insertBefore(createSectionItem(node, item), node.children[index])
              bindProp(item, index)
          apsplice.apply(this, arguments)
          apsplice.apply(this.__values, arguments)
          this.__addEmpty()

        # Bind property
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
