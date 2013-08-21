# jtmpl
# @author Atanas Minev
# MIT license

window.jtmpl = (target, tpl, model) ->

	## Regular expressions

	reId = /^\#[\w-]+$/
	
	# Match jtmpl tag
	reJT = ///
		\{\{(\{)?      # opening tag, maybe triple mustache (captured)
		(\#|\^|/)?     # var, open block or close block tag?
		([\w\.]+)      # tag name
		(\})?\}\}      # closing tag
	///g

	# Prototype regexp, match incomplete opening HTML tag
	reHTproto = ///
		<\s*([\w-]+)   # capture HTML tag name
		(?:	\s+		   # non-capturing group HTML attribute
			([\w-]*)   # attribute name
			(?: =
				(
					(?:"[^"]+") |    # attribute value double quoted
					(?:'[^']+') |    # single quoted
					[\w-]+           # or unquoted 
				)
			)?
		)*
	///.source

	# Last opened opening HTML tag
	reHTopened = new RegExp reHTproto + '(>)?\\s*$'

	# Full opening HTML tag
	reHTopening = new RegExp reHTproto + '\\s*>'



	## Interface

	# `jtmpl(tpl, model)`?
	if typeof target is 'string' and typeof tpl is 'object' and model == undefined
		model = tpl
		tpl = target
		target = null		

	# `jtmpl('#element-id', ...)`?
	if typeof target == 'string' and target.match(reId)
		target = document.getElementById(target.substring(1))
	
	if not model or typeof model isnt 'object'
		throw ':( model should be object'

	# `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`
	tpl = document.getElementById(tpl.substring(1)).innerHTML if tpl.match and tpl.match(reId)



	## Implementation

	# Array?
	isArray = 
		Array.isArray or (val) -> {}.toString.call(val) is '[object Array]'


	# Existing object?
	isObject = (val) -> 
		val and typeof val is 'object'


	escapeHTML = (val) ->
		(val? and val or '')
			.toString()
			.replace /[&"<>\\]/g, (s) ->
				switch s
					when '&' then '&amp;'
					when '\\'then '\\\\'
					when '"' then '\"'
					when '<' then '&lt;'
					when '>' then '&gt;'
					else s


	# Return [tagType, tagName] from regexp match
	parseTag = (tag) ->
		[switch tag[2]
			when '/' then 'end'
			when '#' then 'section'
			when '^' then 'inverted_section'
			when undefined then (if tag[1] is '{' then 'unescaped_var' else 'var')
			else throw ':( internal error, tag ' + tag[0]
		, tag[3], tag[0]]


	# Parse template, remove jtmpl tags, inject data-jtmpl attributes
	parse = (tpl, context, pos, openTagName) ->
		out = ''
		htag = null

		emit = (s) ->
			if s
				return out += s
			s = tpl.slice(pos, reJT.lastIndex - (fullTag or '').length)
			reHTopened.lastIndex = 0
			htag = reHTopened.exec(s)
			pos = reJT.lastIndex
			out += s

		# Match jtmpl tags
		while tag = reJT.exec(tpl)

			[tagType, tagName, fullTag] = parseTag(tag)

			emit()

			switch tagType
				when 'end'
					if tagName isnt openTagName
						throw (if not openTagName then ':( unexpected {{/#{tagName}}}' else ':( expected {{/#{openTagName}}}, got #{fullTag}')
						
					# Exit recursion
					return out

				when 'var'
					emit(escapeHTML(if tagName is '.' then context else context[tagName]))

				when 'unescaped_var'
					emit(if tagName is '.' then context else context[tagName])

				when 'section'
					val = context[tagName]
					pos = reJT.lastIndex

					# falsy value or empty collection?
					if not val or isArray(val) and not val.length
						# discard section
						parse(tpl, context, pos, tagName)
						pos = reJT.lastIndex
					else
						# output section
						collection = isArray(val) and val or [val]
						for item, i in collection
							emit()
							emit(parse(tpl, item, pos, tagName))
							if i < collection.length - 1
								reJT.lastIndex = pos
						pos = reJT.lastIndex

				when 'inverted_section'
					val = context[tagName]
					pos = reJT.lastIndex

					# falsy value or empty collection?
					if not val or isArray(val) and not val.length
						# output section
						emit(parse(tpl, val, pos, tagName))
						pos = reJT.lastIndex
					else
						# discard section
						parse(tpl, val, pos, tagName)
						pos = reJT.lastIndex



		return out + tpl.slice(pos)


	# Parse template
	html = parse(tpl, model, 0)

	# temp
	if target
		target.innerHTML = html

	# Done?
	if not target
		return html


	# Bind event handlers
	bind = (root) ->
		;

# :)