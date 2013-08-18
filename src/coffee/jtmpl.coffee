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
	if typeof target == 'string' and typeof tpl == 'object' and model == undefined
		model = tpl
		tpl = target
		target = null		

	# `jtmpl('#element-id', ...)`?
	if typeof target == 'string' and target.match(reId)
		target = document.getElementById(target.substring(1))
	
	if not model or typeof model != 'object'
		throw 'model should be object'

	# `jtmpl('#template-id', ...)` or `jtmpl(element, '#template-id', ...)`
	tpl = document.getElementById(tpl.substring(1)).innerHTML if tpl.match and tpl.match(reId)



	## Implementation

	# Get value
	get = (v, context) ->
		context = context or self.model
		eval 'context' + (if v == '.' then '' else '.' + v)


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
			# `{{/block_tag_end}}`?
			if tag[2] == '/'
				if openTag and tag[3] != openTag[3]
					throw 'Expected {{/' + openTag[3] + '}}, got ' + tag[0]

				console.log '>>> end block'
				emit()
				# Exit recursion
				return out

			# `{{var}}`?
			if not tag[2]
				console.log 'var >>> ' + tag[0]
				emit()
				emit(get(tag[3], context))

			# `{{#block_tag_begin}}` or `{{^not_block_tag_begin}}`?
			if tag[2] in ['#', '^']
				console.log 'block >>> ' + tag[0]
				emit()

		return out + tpl.slice(pos)


	# Parse template
	html = parse(tpl, model, 0)

	# Done?
	if not target
		return html


	# Bind event handlers
	bind = (root) ->
		;

