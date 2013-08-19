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

	# `jtmpl()`? return utility functions
	if target == undefined
		return {
			a: (a) -> a
		}

	# `jtmpl(tpl, model)`?
	if typeof target is 'string' and typeof tpl is 'object' and model == undefined
		model = tpl
		tpl = target
		target = null		

	# `jtmpl('#element-id', ...)`?
	if typeof target == 'string' and target.match(reId)
		target = document.getElementById(target.substring(1))
	
	if not model or typeof model isnt 'object'
		throw 'model should be object'

	# `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`
	tpl = document.getElementById(tpl.substring(1)).innerHTML if tpl.match and tpl.match(reId)



	## Implementation

	# Check if object is array
	typeIsArray = 
		Array.isArray or (value) -> {}.toString.call(value) is '[object Array]'

	# Get value
	get = (v, context) ->
		context = context or self.model
		eval 'context' + (if v is '.' then '' else '.' + v)


	# Parse template, remove jtmpl tags, inject data-jtmpl attributes
	parse = (tpl, context, pos, openTag) ->
		out = ''
		emit = (s) ->
			if s
				return out += s
			s = tpl.slice(pos, reJT.lastIndex - (tag and tag[0] or '').length)
			reHTopened.lastIndex = 0
			htag = reHTopened.exec(s)
			pos = reJT.lastIndex
			out += s

		# Match jtmpl tags
		while tag = reJT.exec(tpl)
			console.log(tag[0])

			# `{{/block_tag_end}}`?
			if tag[2] is '/'
				if openTag and tag[3] isnt openTag[3]
					throw 'Expected {{/' + openTag[3] + '}}, got ' + tag[0]
				emit()

				# Exit recursion
				return out

			# `{{var}}`?
			if not tag[2]
				emit()
				emit(get(tag[3], context))

			# `{{#block_tag_begin}}` or `{{^not_block_tag_begin}}`?
			if tag[2] in ['#', '^']

				emit()
				val = get(tag[3], context)
				pos = reJT.lastIndex

				# falsy value?
				if not val
					s = parse(tpl, val, pos, tag)
					pos = reJT.lastIndex
					emit(if tag[2] is '#' then '' else s)

				# `{{#context_block}}` or `{{#enumerate_array}}`?
				else if val and tag[2] is '#'

					# skip loop body?
					if val.length is 0
						parse(tpl, val, pos, tag)

					# emit loop body n times, n = 1 when type(model.block) is object,
					# n = array.length when type(model.block) is array
					collection = if typeIsArray val then val else [val]
					for item, i in collection
						emit()
						emit(parse(tpl, item, pos, tag))
						if i < collection.length - 1
							reJT.lastIndex = pos

					pos = reJT.lastIndex

				# `{{^output_falsy_block_or_array}}`?
				else if val and tag[2] is '^'
					s = parse(tpl, val, pos, tag)
					pos = reJT.lastIndex
					emit(if val or val.length then '' else s)

				# oops
				else
					throw 'Internal error, tag ' + tag[0]


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

