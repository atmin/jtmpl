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
	re = /\{\{(\{)?(\#|\^|\/)?([\w\.]+)(\})?\}\}/g

	# Match last opening HTML tag
	hre = /<(\w+)(?:\s+([\w-]*)(?:(?:=)((?:"[^"]+")|[\w-]+|(?:'[^']+')))?)*(>)?$/g

	# Append arbitrary HTML to a DocumentFragment
	window.appendHTML = (frag, html) ->
		tmp = document.createElement('body')
		tmp.innerHTML = html
		while child = tmp.firstChild
			frag.appendChild(child)
		frag

	# Main recursive function
	build = (el, tpl, model, pos) ->
		frag = document.createDocumentFragment()
		emit = ->
			appendHTML(frag, tpl.slice(pos, re.lastIndex - (t and t[0] or 0)))

		# Match jtmpl tags
		while tag = re.exec(tpl)

			# `{{/block_tag_end}}`?
			if tag[2] == '/'
				;

			# `{{var}}`?
			if not tag[2]
				;

			# `{{#block_tag_begin}}` or `{{^not_block_tag_begin}}`?
			if tag[2] in ['#', '^']
				;

	# Build DOM
	el._jtmpl = build(el, tpl, model)
