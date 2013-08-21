# jtmpl
# @author Atanas Minev
# MIT license

window.jtmpl = (target, tpl, model) ->
	reId = /^\#[\w-]+$/


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

	# Match jtmpl tag
	re = ///
		\{\{(\{)?      # opening tag, maybe triple mustache (captured)
		(\#|\^|/)?     # var, open block or close block tag?
		([\w\.]+)      # tag name
		(\})?\}\}      # closing tag
	///g

	# Last opened opening HTML tag
	hre = ///
		<\s*([\w-]+)   # capture HTML tag name
		(?:	\s+		   # non-capturing group HTML attribute
			([\w-\{\}]*)      # capture attribute name
			(?: =             # capture optional attribute value
				(   (?:"[^"]*") |    # attribute value double quoted
					(?:'[^']*') |    # single quoted
					[\w-\{\}]+       # or unquoted 
				)
			)?
		)*
		\s*(>)?        # capture if it's closed
		\s*(<!--\s*)?  # capture HTML comment begin
	///

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


	# Return [tagType, tagName, fullTag] from regexp match
	parseTag = (tag) ->
		[switch tag[2]
			when '/' then 'end'
			when '#' then 'section'
			when '^' then 'inverted_section'
			when undefined then (if tag[1] is '{' then 'unescaped_var' else 'var')
			else throw ':( internal error, tag ' + tag[0]
		, tag[3], tag[0]]


	# Parse template, remove jtmpl tags, inject data-jtmpl attributes
	compile = (tpl, context, pos, openTagName) ->
		pos = pos or 0
		out = ''
		htag = null

		emit = (s) ->
			if s
				return out += s
			s = tpl.slice(pos, re.lastIndex - (fullTag or '').length)
			hre.lastIndex = 0
			htag = hre.exec(s)
			pos = re.lastIndex
			out += s

		# Match jtmpl tags
		while tag = re.exec(tpl)

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
					pos = re.lastIndex

					# falsy value or empty collection?
					if not val or isArray(val) and not val.length
						# discard section
						compile(tpl, context, pos, tagName)
						pos = re.lastIndex
					else
						# output section
						collection = isArray(val) and val or [val]
						for item, i in collection
							emit()
							emit(compile(tpl, item, pos, tagName))
							if i < collection.length - 1
								re.lastIndex = pos
						pos = re.lastIndex

				when 'inverted_section'
					val = context[tagName]
					pos = re.lastIndex

					# falsy value or empty collection?
					if not val or isArray(val) and not val.length
						# output section
						emit(compile(tpl, val, pos, tagName))
						pos = re.lastIndex
					else
						# discard section
						compile(tpl, val, pos, tagName)
						pos = re.lastIndex



		return out + tpl.slice(pos)


	# Compile template
	html = compile(tpl, model)

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