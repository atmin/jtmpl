# jtmpl
# @author Atanas Minev
# MIT license

window.jtmpl = (el, tpl, model) ->

	# `jtmpl('#element-id', ...)`?
	if typeof el == 'string' and el.match(/^\#\w+/)
		el = document.getElementById(el.substring(1))
	
	if not el or not el.nodeName
		throw '[Element object] or "#element-id" expected'

	# `jtmpl(element)`?
	if not tpl
		return el._jtmpl

	if not model or typeof model != 'object'
		throw 'model should be object'

	# `jtmpl(element, '#template-id', ...)`
	tpl = document.getElementById(tpl.substring(1)).innerHTML if tpl.match and tpl.match(/^\#\w+/)

	# Match jtmpl tag. http://gskinner.com/RegExr/ is a nice tool
	re = ///
		\{\{(\{)?      # opening tag, maybe triple mustache (captured)
		(\#|\^|/)?     # var, open block or close block tag?
		([\w\.]+)      # tag name
		(\})?\}\}      # closing tag
	///g

	# Match last opening HTML tag
	window.hre = ///
		<(\w+)         # HTML tag name
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
		(>)?\s*$
	///g

	# Append arbitrary HTML to a DocumentFragment
	appendHTML = (frag, html) ->
		tmp = document.createElement('body')
		tmp.innerHTML = html
		while child = tmp.firstChild
			frag.appendChild(child)
		frag

	# Main recursive function
	build = (el, tpl, model, pos, openTag) ->

		frag = document.createDocumentFragment()
		htag = null

		emit = ->
			s = tpl.slice(pos, re.lastIndex - (tag and tag[0] or '').length)
			hre.lastIndex = 0
			htag = hre.exec(s)
			pos = re.lastIndex
			# appendHTML(frag, s)
			console.log '\n>\n' + s + '\n:' + htag

		# Match jtmpl tags
		while tag = re.exec(tpl)

			# `{{/block_tag_end}}`?
			if tag[2] == '/'
				if openTag and tag[3] != openTag[3]
					throw 'Expected {{/' + openTag[3] + '}}, got ' + tag[0]

				console.log '>>> end block'
				emit()

			# `{{var}}`?
			if not tag[2]
				console.log 'var >>> ' + tag[0]
				emit()

			# `{{#block_tag_begin}}` or `{{^not_block_tag_begin}}`?
			if tag[2] in ['#', '^']
				console.log 'block >>> ' + tag[0]
				emit()


	# Build DOM
	el._jtmpl = build(el, tpl, model, 0)
