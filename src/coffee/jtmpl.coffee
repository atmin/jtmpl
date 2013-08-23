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
		(<\s*[\w-_]+)   # capture HTML tag opening and name `htag[1]`
		(?:\s+ 		    # non-capturing group HTML attribute
			([\w-\{\}]*)      # capture last attribute name `htag[2]`
			(=)?              # capture the = `htag[3]`
			(?:               # capture optional last attribute value
				(   (?: "[^">]*"?) |   # attribute value double quoted (allow unclosed)
					(?: '[^'>]*'?) |   # single quoted
					[^\s>]+            # or unquoted `htag[4]`
				)
			)?
		)*
		\s*(>)?        # capture if tag closed `htag[5]`
		\s*$           # whitespace, end of slice
	///


	# Array?
	isArray = Array.isArray or (val) -> 
		{}.toString.call(val) is '[object Array]'


	# Existing object?
	isObject = (val) -> 
		val and typeof val is 'object'


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


	# Parse template, remove jtmpl tags, inject data-jtmpl attributes
	compile = (tpl, context, position, openTagName) ->
		pos = position or 0
		out = ''
		tag = htag = htagSection = htagSectionVar = null

		## Template preprocessing
		# Strip HTML comments that enclose tags
		tpl = tpl.replace(new RegExp("<!--\\s*(#{ re.source })\\s*-->"), '$1')

		# Strip quotes around html element attributes associated with tags
		tpl = tpl.replace(new RegExp("([\\w-_]+)=\"(#{ re.source })\"", 'g'), '$1=$2')

		# If tags stand on their own line remove the line, keep the tag only
		tpl = tpl.replace(new RegExp("\\n\\s*(#{ re.source })\\s*\\n", 'g'), '\n$1')

		## Routines
		# Flush output
		flush = () ->
			out += tpl.slice(pos, re.lastIndex - (fullTag or '').length)
			pos = re.lastIndex

		# get prop=value string
		getPropString = (val, quote) ->
			quote = quote or ''
			htag[3] and not htag[5] and (htag[2] + htag[3] + quote + val + quote) or val

		# emit current section, possibly enclosed in a comment to serve as template
		emitSection = (context, commentProto) ->
			out += (if commentProto then "<!-- #{ commentProto } " else '') + 
					compile(tpl, context, pos, tagName) +
					(if commentProto then ' -->' else '')

		# inject data-jt attribute
		injectTag = () ->
			p = htag.index + htag[1].length
			t = "#{ getPropString(fullTagNoDelim) }"
			# attribute already injected?
			if m = out.match(new RegExp("[\\s\\S]{#{ p }}(\\sdata-jt=\"([^\"]*))\""))
				p = p + m[1].length
				out = "#{ out.slice(0, p) }#{ m[2].length and ' ' or '' }#{ t }#{ out.slice(p) }"
			else				
				out = "#{ out.slice(0, p) } data-jt=\"#{ t }\"#{ out.slice(p) }"

		## Main parsing loop
		while tag = re.exec(tpl)

			[tagType, tagName, fullTag, fullTagNoDelim] = parseTag(tag)

			flush()
			htag = out.match(hre) # .replace(/\n/g, '')

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
						out += "<span data-jt=\"#{ fullTagNoDelim }\">#{ escaped }</span>"
					else
						injectTag()
						if typeof val isnt 'function'
							# output HTML attr?
							if htag[3] and not htag[5]
								# output boolean HTML attr?
								if typeof val is 'boolean'
									# erase "attr=" part, output attr if needed
									out = out.replace(/[\w-_]+=$/, '') + (val and tagName or '')
								else
									out += '"' + val + '"'
							else
								out += val

				when 'section', 'inverted_section'
					val = context[tagName]
					if not htag and not htagSection and htagSectionVar isnt tagName
						emitEndDiv = true
						out += "<div data-jt=\"#{ fullTagNoDelim }\">"
					else
						if not htag then htag = htagSection
						[htagSection, htagSectionVar] = [htag, tagName]
						injectTag()

					if tagType == 'section'
						# section and (falsy value or empty collection)?
						if not val or isArray(val) and not val.length
							emitSection(val or context, '#')
							pos = re.lastIndex
						else
							# output section
							collection = isArray(val) and val or [val]
							for item, i in collection
								emitSection(if isObject(val) then item else context)
								if i < collection.length - 1
									re.lastIndex = pos
							pos = re.lastIndex
					else
						# falsy value or empty collection?
						if not val or isArray(val) and not val.length
							# output section
							emitSection(context)
							pos = re.lastIndex
						else
							# compile section recursively, enclose in HTML comment
							emitSection(context, '^')
							pos = re.lastIndex

					if emitEndDiv
						out += '</div>'

		return out + tpl.slice(pos)


	# Compile template
	html = compile(tpl, model)

	# Done?
	if not target
		return html

	# Construct DOM
	target.innerHTML = html


	# Bind event handlers
	bind = (root) ->
		;




# :)
