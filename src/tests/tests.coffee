$ = (s) -> Array.prototype.slice.call document.querySelectorAll s




test 'compile', ->
	equal jtmpl('tpl{{a}}xyz', { a: 'A'}), 
		'tpl<span data-jt="a">A</span>xyz',
		'var'

	equal jtmpl('{{#a}}{{.}}{{/a}}', { a: [1, 2]}), 
		'<div data-jt="#a"><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span></div>', 
		'numeric array'

	equal jtmpl('{{#a}}{{.}}{{/a}}', { a: []}), 
		'<div data-jt="#a"><!-- # <<<.>>> --></div>', 
		'empty array'

	equal jtmpl('{{#a}}{{z}}{{/a}}', { a: [{z:1}]}),
		'<div data-jt="#a"><!-- # <<<z>>> --><span data-jt="z">1</span></div>',
		'object array'

	equal jtmpl('{{^a}}{{z}}{{/a}}', { a: [{z:1}]}), 
		'<div data-jt="^a"><!-- ^ <<<z>>> --></div>', 
		'object array false'

	equal jtmpl('{{#a}}1{{/a}}', { a: true }),
		'<div data-jt="#a"><!-- # 1 -->1</div>',
		'positive condition'

	equal jtmpl('{{^a}}1{{/a}}', { a: true }), 
		'<div data-jt="^a"><!-- ^ 1 --></div>',
		'negative condition'

	equal jtmpl('{{#a}}1{{/a}}', { a: false }), 
		'<div data-jt="#a"><!-- # 1 --></div>', 
		'positive condition false'

	equal jtmpl('{{^a}}1{{/a}}', { a: false }),
		'<div data-jt="^a"><!-- ^ 1 -->1</div>',
		'negative condition false'

	equal jtmpl('<p>{{a}}</p>', { a: 1}),
		'<p data-jt="a">1</p>',
		'inject var tag'

	equal jtmpl('<p data-jt="">{{a}}</p>', { a: 1}),
		'<p data-jt="a">1</p>',
		'inject var tag, existing `data-jt` attribute'

	equal jtmpl('<p attr="{{a}}"></p>', { a: 42 }),
		'<p data-jt="attr=a" attr="42"></p>',
		'var on attribute'

	equal jtmpl('<div>{{#outer}}<div>{{#inner}}{{.}}{{/inner}}</div>{{/outer}}</div>', 
			{ outer: [{ inner: [1, 2, 3] }, { inner: [1, 2] }, { inner: [1] }] }),
		'<div data-jt="#outer"><!-- # <div><<<#inner>>><<<.>>><<</inner>>></div> --><div data-jt="#inner"><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span><span data-jt=".">3</span></div><div data-jt="#inner"><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span></div><div data-jt="#inner"><!-- # <<<.>>> --><span data-jt=".">1</span></div></div>',
		'nested sections'

	equal jtmpl('{{#outer}}{{#inner}}{{.}}{{/inner}}{{/outer}}', 
			{ outer: [{ inner: [1, 2, 3] }, { inner: [1, 2] }, { inner: [1] }] }),
		'<div data-jt="#outer"><!-- # <<<#inner>>><<<.>>><<</inner>>> --><div data-jt="#inner"><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span><span data-jt=".">3</span></div><div data-jt="#inner"><!-- # <<<.>>> --><span data-jt=".">1</span><span data-jt=".">2</span></div><div data-jt="#inner"><!-- # <<<.>>> --><span data-jt=".">1</span></div></div>',
		'nested sections no divs'






test 'bind', ->
	equal jtmpl('tpl{{a}}xyz', { a: 'A'}), 
		'tpl<span data-jt="a">A</span>xyz',
		'var'	