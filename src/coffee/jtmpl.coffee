### jtmpl, @author Atanas Minev, MIT license ###

root = this
root.jtmpl = (target, tpl, model, options) ->
	reId = /^\#[\w-]+$/



	## Interface

	# Deprecated. `jtmpl(selector)`?
	if (target is null or typeof target is 'string') and not tpl?
		if not document?
			throw ':( this API is only available in a browser'
		return Array.prototype.slice.call(document.querySelectorAll(target))

	# `jtmpl(tpl, model)`?
	if typeof target is 'string' and typeof tpl in ['number', 'string', 'boolean', 'object'] and model is undefined
		options = model
		model = tpl
		tpl = target
		target = undefined		

	# `jtmpl('#element-id', ...)`?
	if typeof target is 'string' and target.match(reId)
		target = document.getElementById(target.substring(1))
	
	if not model?
		throw ':( no model'

	# `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`
	tpl = document.getElementById(tpl.substring(1)).innerHTML if tpl.match and tpl.match(reId)




	## Implementation
	quoteRE = (s) -> (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1')

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


	# Match jtmpl tag
	tagRe = ///
		(\{)?      # opening tag, maybe triple mustache (captured)
		(\#|\^|/)?     # var, open block or close block tag?
		([\w\.\-_]+)   # tag name
		(\})?      # closing tag
	///
	re = new RegExp(quoteRE(options.delimiters[0]) + tagRe.source + quoteRE(options.delimiters[1]), 'g')

	# Last opened opening HTML tag
	hre = ///
		(< \s* [\w-_]+ )  # capture HTML tag opening and name \1
		(?: \s+ 		  # non-capturing group HTML attribute
			([\w-\{\}]*)      # capture last attribute name \2
			(=)?              # capture the = \3
			(?:               # capture optional last attribute value
				(   (?: "[^">]*"?) |   # attribute value double quoted (allow unclosed)
					(?: '[^'>]*'?) |   # single quoted
					[^\s>]+            # or unquoted \4
				)
			)?
		)*?
		\s* (>)?          # capture if tag closed \5
		\s* (?: <!--.*?-->\s*)* $      # whitespace, possibly HTML comments, end of slice
	///

	# Matches "<tag>....</tag>"?
	matchHTMLTag = ///
		^( \s* <([\w-_]+) )              # begin string; opening tag; capture data-jt position \1, tag name \2
			(?: (\s* data-jt="[^"]*)")?  # existing data-jt attribute? capture inject property position \3
			[^>]* >  
		[\s\S]*?                         # anything
		</ \2 > \s* $                    # closing tag, html comments, end string
	///



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

	# Return [tagType, tagName, fullTag, fullTagNoDelim] from regexp match
	parseTag = (tag) ->
		[switch tag[2]
			when '/' then 'end'
			when '#' then 'section'
			when '^' then 'inverted_section'
			when undefined then (if tag[1] is '{' then 'unescaped_var' else 'var')
			else throw ':( internal error, tag ' + tag[0]
		, tag[3], tag[0], (tag[2] or '') + tag[3]]

	# Cross-browser add event listener
	addEvent = (evnt, elem, func) ->
		if elem.addEventListener then elem.addEventListener(evnt, func, false)
		else if elem.attachEvent then elem.attachEvent('on' + evnt, func)
		else elem[evnt] = func

	# Cross-browser trigger event on node
	triggerEvent = (evnt, elem) ->
		if Event?
			elem.dispatchEvent(new Event(evnt))
		else if document.createEvent
			event = document.createEvent('Event')
			event.initEvent(evnt, true, true)
			elem.dispatchEvent(event)
		else
			event = document.createEventObject()
			elem.fireEvent('on' + evnt, event)

	# HTML element class manipulation (IE does not support classList)
	hasClass = (el, name) -> new RegExp("(\\s|^)#{ name }(\\s|$)").test(el.className)
	addClass = (el, name) -> 
		if not hasClass(el, name) then el.className += (el.className and ' ' or '') + name
	removeClass = (el, name) ->
		if hasClass(el, name) then el.className = el.className
			.replace(new RegExp("(\\s|^)#{name}(\\s|$)"), '')
			.replace(/^\s+|\s+$/g, '')


	# Parse template, remove jtmpl tags, add data-jt attrs and structure as HTML comments
	compile = (tpl, context, position, openTagName) ->
		pos = position or 0
		out = outpart = ''
		tag = htag = lastSectionTag = null

		## Template preprocessing
		# Strip HTML comments that enclose tags
		tpl = tpl.replace(new RegExp("<!--\\s*(#{ re.source })\\s*-->"), '$1')

		# Strip quotes around html element attributes associated with tags
		tpl = tpl.replace(new RegExp("([\\w-_]+)=\"(#{ re.source })\"", 'g'), '$1=$2')

		# If tags stand on their own line remove the line, keep the tag only
		tpl = tpl.replace(new RegExp("\\n\\s*(#{ re.source })\\s*\\n", 'g'), '\n$1\n')

		## Routines
		# Flush output
		flush = () ->
			out += tpl.slice(pos, re.lastIndex - (fullTag or '').length)
			pos = re.lastIndex

		# get "prop=value" string or "value" if default prop
		getPropString = (val, quote) ->
			quote = quote or ''
			(htag[3] and not htag[5]) and (htag[2] + htag[3] + quote + val + quote) or val

		# discard current section
		discardSection = () ->
			compile(tpl, context, pos, tagName)

		# inject data-jt attribute on section
		injectOuterTag = () ->
			p = htag.index + htag[1].length + (outpart isnt out and out.length - outpart.length or 0)
			t = "#{ getPropString(fullTagNoDelim) }"
			# attribute exists?
			# regex [\s\S]{N} matches N characters
			if m = out.match(new RegExp("[\\s\\S]{#{ p }}(\\sdata-jt=\"([^\"]*))\""))
				p = p + m[1].length
				out = "#{ out.slice(0, p) }#{ m[2].length and ' ' or '' }#{ t }#{ out.slice(p) }"
			else
				out = "#{ out.slice(0, p) } data-jt=\"#{ t }\"#{ out.slice(p) }"
			''

		# inject data-jt attribute on section item
		# expect compiled section as parameter, add to output
		addSectionItem = (s) ->
			s = s.trim()
			m = s.match(matchHTMLTag)
			out += if not m
				"<#{ options.defaultSectionItem } data-jt=\".\">#{ s }</#{ options.defaultSectionItem }>"
			else
				p = m[1].length + (m[3] and m[3].length or 0)
				"#{ s.slice(0, p) }#{ not m[3] and ' data-jt="."' or ' .' }#{ s.slice(p) }"

		## Main parsing loop
		while tag = re.exec(tpl)

			[tagType, tagName, fullTag, fullTagNoDelim] = parseTag(tag)

			flush()
			# Firefox sometimes doesn't match when it should, if input is too long
			# Matching should be faster on shorter input, too (if regexp engine does not count $ as a signal to match backwards)
			outpart = out.length > 300 and out.slice(-300) or out
			htag = outpart.match(hre)

			switch tagType
				when 'end'
					if tagName isnt openTagName
						throw (if not openTagName then ":( unexpected {{/#{ tagName }}}" else ":( expected {{/#{ openTagName }}}, got #{ fullTag }")
						
					# Exit recursion
					return out

				when 'var', 'unescaped_var'
					val = if tagName is '.' then context else context[tagName]
					escaped = tagType is 'unescaped_var' and val or escapeHTML(val)
					if not htag
						out += "<#{ options.defaultVar } data-jt=\"#{ fullTagNoDelim }\">#{ escaped }</#{ options.defaultVar }>"
					else
						injectOuterTag()
						if typeof val is 'function'
							# erase "attr=" part
							out = out.replace(/[\w-_]+=$/, '')
						else
							# HTML "class" attribute?
							if htag[2] is 'class'
								if typeof val isnt 'boolean'
									throw "#{ tagName } is not boolean"
								if val then out += tagName

							# output HTML attr?
							else if htag[3] and not htag[5]
								# null value?
								if not val? or val is null
									# erase "attr=" part
									out = out.replace(/[\w-_]+=$/, '')
								# output boolean HTML attr?
								else if typeof val is 'boolean'
									# erase "attr=" part, output attr if true
									out = out.replace(/[\w-_]+=$/, '') + (val and htag[2] or '')
								else
									out += '"' + val + '"'

							# output var
							else
								out += val

				when 'section', 'inverted_section'
					if not htag
						if tagName isnt lastSectionTag
							out += "<#{ options.defaultSection } data-jt=\"#{ fullTagNoDelim }\">"
					else
						injectOuterTag()

					# emit section template in a HTML comment
					val = context[tagName]
					# this is an oversimplification and will not work in all cases
					# breaking case: {{#collection}}{{#collection}}...{{/collection}}{{/collection}}
					# you cannot extract tree branch with a regular expression
					# this approximation will work for cases when nested branches are
					# named differently, than the section we're extracting
					section = tpl.slice(pos).match(
						new RegExp('([\\s\\S]*?)' + quoteRE(options.delimiters[0] + '/' + tagName + options.delimiters[1])))
					if not section
						throw ":( unclosed section #{ fullTag }"
					section = section[1].trim()
						.replace(new RegExp(quoteRE(options.delimiters[0]), 'g'), options.compiledDelimiters[0])
						.replace(new RegExp(quoteRE(options.delimiters[1]), 'g'), options.compiledDelimiters[1])
					out += "<!-- #{ tag[2] } #{ section } -->"

					if tagType is 'section'
						# falsy value or empty collection?
						if not val or Array.isArray(val) and not val.length
							discardSection()
							pos = re.lastIndex
						else
							# output section
							collection = Array.isArray(val) and val or [val]
							for item, i in collection
								flush()
								addSectionItem(compile(tpl, (if val and typeof val is 'object' then item else context), pos, tagName))
								if i < collection.length - 1
									re.lastIndex = pos
							pos = re.lastIndex

					else if tagType is 'inverted_section'
						# falsy value or empty collection?
						if not val or Array.isArray(val) and not val.length
							out += compile(tpl, context, pos, tagName)
							pos = re.lastIndex
						else
							discardSection(context)
							pos = re.lastIndex

					else
						throw ':( internal error'

					if not htag and tagName isnt lastSectionTag
						out += "</#{ options.defaultSection }>"

					lastSectionTag = tagName

		# Remainder
		out += tpl.slice(pos)

		## Template postprocessing
		out = out.replace(/data-jt="\.(\s\.)+"/g, 'data-jt="."')


	# Compile template
	html = compile(tpl, model)

	# Done?
	if not target?
		return html

	if target.nodeName is 'SCRIPT'
		newTarget = document.createElement(options.defaultTargetTag)
		target.parentNode.replaceChild(newTarget, target)
		target = newTarget

	# Construct DOM
	target.innerHTML = html
	target.setAttribute('data-jt', '.')



	# Bind event handlers
	bind = (root, context) ->
		# DOM event handler factories
		changeHandler = (context, k, v) -> -> context[v] = this[k]

		radioHandler = (context, k, v) -> ->
			if this[k]
				for input in jtmpl("input[type=radio][name=#{ this.name }]")
					if input isnt this
						triggerEvent('change', input)
			context[v] = this[k]

		optionHandler = (context, k, v) -> ->
			idx = 0
			for option in this.children
				if option.nodeName is 'OPTION'
					context[idx][v] = option.selected
					idx++

		# create slots for property value and change reactor functions
		# setter notifies all reactors
		initBindings = (context, prop) ->
			# if typeof context isnt 'object' then return

			if not context["__#{ prop }_bindings"]

				Object.defineProperty(context, "__#{ prop }_bindings",
					enumerable: false
					writable: true
					value: []
				)
				Object.defineProperty(context, "__#{ prop }",
					enumerable: false
					writable: true
					value: context[prop]
				)
				Object.defineProperty(context, prop, 
					get: -> this["__#{ prop }"]
					set: (val) -> 
						this["__#{ prop }"] = val
						reactor.call(this, val) for reactor in this["__#{ prop }_bindings"]
				)

		createSectionItem = (parent, context) ->
			element = document.createElement('body')
			element.innerHTML = jtmpl(parent.getAttribute('data-jt-1') or '', context)
			element = element.children[0]
			jtmpl(element, element.innerHTML, context, { rootModel: model })
			element

		bindArrayToNodeChildren = (array, node) ->
			# proxy mutable array operations
			array.pop = ->
				Array.prototype.pop.call(this, arguments)

			array.push = ->
				Array.prototype.push.call(this, arguments)

			array.reverse = ->
				Array.prototype.reverse.call(this, arguments)

			array.shift = ->
				Array.prototype.shift.call(this, arguments)

			array.unshift = ->
				Array.prototype.unshift.call(this, arguments)

			array.sort = ->
				Array.prototype.sort.call(this, arguments)

			array.splice = ->
				Array.prototype.splice.call(this, arguments)

			# onchange handlers for each item
			for item, i in array
				((item, i) ->
					Object.defineProperty(array, "__#{ i }",
						enumerable: false
						writable: true
						value: item
					)
					Object.defineProperty(array, i, 
						get: -> this["__#{ i }"]
						set: (val) -> 
							this["__#{ i }"] = val
							node.replaceChild(createSectionItem(node, val), node.children[i])
					)
				)(item, i)


			array

		addBinding = (context, node, prop, nodeProp) ->
			if typeof context isnt 'object' then return

			initBindings(context, prop)

			if not nodeProp
				# innerHTML reactor
				context["__#{ prop }_bindings"].push(
					((node) ->
						(val) -> node.innerHTML = val
					)(node)
				)
			else if nodeProp is 'class'
				# class reactor
				context["__#{ prop }_bindings"].push(
					((node, prop) ->
						(val) -> (val and addClass or removeClass)(node, prop)
					)(node, prop)
				)
			else
				# attribute reactor
				context["__#{ prop }_bindings"].push(
					((node, prop, nodeProp) -> 
						(val) ->
							if nodeProp in ['value', 'checked', 'selected']
								node[nodeProp] = val
							else
								if (typeof val is 'boolean' and not val) or val is null
									node.removeAttribute(nodeProp)
								else
									node.setAttribute(nodeProp, val)
					)(node, prop, nodeProp)
				)

		addSectionBinding = (context, node, prop, isNegative) ->
			initBindings(context, prop)

			context["__#{ prop }_bindings"].push(
				((node, prop, isNegative) ->
					(val) ->
						# collection?
						if Array.isArray(val)
							bindArrayToNodeChildren(val, node)

							node.innerHTML = 
								if not val.length
									jtmpl(node.getAttribute('data-jt-0') or '', {})
								else 
									''
							for item, i in val
								initBindings(val, i)
								node.appendChild(createSectionItem(node, item))

						# local context?
						else if typeof val is 'object'
							node.innerHTML = jtmpl(node.getAttribute('data-jt-1') or '', val)
							jtmpl(node, node.innerHTML, val, { rootModel: model })

						# if section
						else
							node.innerHTML = jtmpl(node.getAttribute(if !!val then 'data-jt-1' else 'data-jt-0') or '', this)
							jtmpl(node, node.innerHTML, val, { rootModel: model })

				)(node, prop, isNegative)
			)


		itemIndex = 0
		nodeContext = null

		# iterate children
		for node in root.childNodes

			switch node.nodeType

				when node.ELEMENT_NODE
					if attr = node.getAttribute('data-jt')

						# we want the dot first
						jtProps = attr.trim().split(' ').sort()

						# iterate bound template tags
						for jt in jtProps

							# section?
							sectionModifier = jt.slice(0, 1)
							if sectionModifier in ['#', '^']
								section = jt.slice(1)
								nodeContext = context[section]
								addSectionBinding(context, node, section, sectionModifier is '^')
								if Array.isArray(nodeContext)
									bindArrayToNodeChildren(nodeContext, node)

							# section item?
							else if jt is '.'
								nodeContext = context[itemIndex++] or context

							# var
							else
								[tmp, k, v] = jt.match(/(?:\/|#)?([\w-.]+)(?:\=([\w-.]+))?/)

								# attach event?
								if k and k.indexOf('on') is 0
									handler = options.rootModel? and options.rootModel[v] or model[v]
									if typeof handler is 'function'
										addEvent(k.slice(2), node, handler.bind(context))
									else
										throw ":( #{ v } is not a function, cannot attach event handler"

								# node.innerHTML?
								else if not v
									if nodeContext and not Array.isArray(nodeContext)
										addBinding(nodeContext, node, k)
									else
										addBinding(context, node, k)

								# attribute
								else
									if nodeContext and not Array.isArray(nodeContext)
										addBinding(nodeContext, node, v, k)
									else
										addBinding(context, node, v, k)

									# monitor DOM onchange event?
									if k in ['value', 'checked', 'selected']
										# first select option?
										if node.nodeName is 'OPTION' and node.parentNode.querySelectorAll('option')[0] is node
											addEvent('change', node.parentNode, optionHandler(context, k, v).bind(node.parentNode))

										# radio group?
										if node.type is 'radio' and node.name
											addEvent('change', node, radioHandler(context, k, v).bind(node))

										# other inputs
										else
											addEvent('change', node, changeHandler(context, k, v).bind(node))

					bind(node, nodeContext or context)

				when node.COMMENT_NODE
					# collection template?
					if section = node.nodeValue.trim().match(/^(#|\^)\s([\s\S]*)$/)
						# decompile delimiters
						section[2] = section[2]
							.replace(new RegExp(quoteRE(options.compiledDelimiters[0]), 'g'), options.delimiters[0])
							.replace(new RegExp(quoteRE(options.compiledDelimiters[1]), 'g'), options.delimiters[1])
						if section[1] is '#'
							# section
							root.setAttribute('data-jt-1', section[2])
						else
							# inverted section
							root.setAttribute('data-jt-0', section[2])

		node



	bind(target, model)









# :)
