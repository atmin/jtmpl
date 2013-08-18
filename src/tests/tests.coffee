$ = (s) -> Array.prototype.slice.call document.querySelectorAll s

test 'tests', ->
	equal jtmpl('tpl{{a}}', { a: 'A'}), 'tplA', 'var substitution OK'