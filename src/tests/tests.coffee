$ = (s) -> Array.prototype.slice.call document.querySelectorAll s

test 'compile', ->
	equal jtmpl('tpl{{a}}xyz', { a: 'A'}), 
		'tpl<span data-jt="{{a}}">A</span>xyz',
		'var'

	equal jtmpl('{{#a}}{{.}}{{/a}}', { a: [1, 2]}), 
		'<div data-jt="{{#a}}"><span data-jt="{{.}}">1</span><span data-jt="{{.}}">2</span></div>', 
		'numeric array'

	equal jtmpl('{{#a}}{{.}}{{/a}}', { a: []}), 
		'<div data-jt="{{#a}}"><!-- <span data-jt="{{.}}"></span> --></div>', 
		'empty array'

	equal jtmpl('{{#a}}{{z}}{{/a}}', { a: [{z:1}]}),
		'<div data-jt="{{#a}}"><span data-jt="{{z}}">1</span></div>',
		'object array'

	equal jtmpl('{{^a}}{{z}}{{/a}}', { a: [{z:1}]}), 
		'<div data-jt="{{^a}}"><!-- <span data-jt="{{z}}"></span> --></div>', 
		'object array false'

	equal jtmpl('{{#a}}1{{/a}}', { a: true }),
		'<div data-jt="{{#a}}">1</div>',
		'positive condition'

	equal jtmpl('{{^a}}1{{/a}}', { a: true }), 
		'<div data-jt="{{^a}}"><!-- 1 --></div>',
		'negative condition'

	equal jtmpl('{{#a}}1{{/a}}', { a: false }), 
		'<div data-jt="{{#a}}"><!-- 1 --></div>', 
		'positive condition false'

	equal jtmpl('{{^a}}1{{/a}}', { a: false }),
		'<div data-jt="{{^a}}">1</div>',
		'negative condition false'
