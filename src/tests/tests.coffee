test 'compile', ->
	equal jtmpl('tpl{{a}}xyz', { a: 'A'}), 
		'tpl<span data-jt="a">A</span>xyz',
		'var'

	equal jtmpl('{{#a}}{{.}}{{/a}}', { a: [1, 2]}), 
		'<div data-jt="#a" data-jt-1="#{.}#"><span data-jt=".">1</span><span data-jt=".">2</span></div>', 
		'numeric array'

	equal jtmpl('{{#a}}{{.}}{{/a}}', { a: []}), 
		'<div data-jt="#a" data-jt-1="#{.}#"></div>', 
		'empty array'

	equal jtmpl('{{#a}}{{z}}{{/a}}', { a: [{z:1}]}),
		'<div data-jt="#a" data-jt-1="#{z}#"><span data-jt="z">1</span></div>',
		'object array'

	equal jtmpl('{{^a}}{{z}}{{/a}}', { a: [{z:1}]}), 
		'<div data-jt="^a" data-jt-0="#{z}#"></div>', 
		'object array false'

	equal jtmpl('{{#a}}1{{/a}}', { a: true }),
		'<div data-jt="#a">1</div>',
		'positive condition'

	equal jtmpl('{{^a}}1{{/a}}', { a: true }), 
		'<div data-jt="^a" style="display:none">1</div>',
		'negative condition'

	equal jtmpl('{{#a}}1{{/a}}', { a: false }), 
		'<div data-jt="#a" style="display:none">1</div>',
		'positive condition false'

	equal jtmpl('{{^a}}1{{/a}}', { a: false }),
		'<div data-jt="^a">1</div>',
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
		'<div data-jt="#outer" data-jt-1="&lt;div&gt;#{#inner}##{.}##{/inner}#&lt;/div&gt;"><div data-jt="#inner" data-jt-1="#{.}#"><span data-jt=".">1</span><span data-jt=".">2</span><span data-jt=".">3</span></div><div data-jt="#inner" data-jt-1="#{.}#"><span data-jt=".">1</span><span data-jt=".">2</span></div><div data-jt="#inner" data-jt-1="#{.}#"><span data-jt=".">1</span></div></div>',
		'nested sections'

	equal jtmpl('{{#outer}}{{#inner}}{{.}}{{/inner}}{{/outer}}', 
			{ outer: [{ inner: [1, 2, 3] }, { inner: [1, 2] }, { inner: [1] }] }),
		'<div data-jt="#outer" data-jt-1="#{#inner}##{.}##{/inner}#"><div data-jt="#inner" data-jt-1="#{.}#"><span data-jt=".">1</span><span data-jt=".">2</span><span data-jt=".">3</span></div><div data-jt="#inner" data-jt-1="#{.}#"><span data-jt=".">1</span><span data-jt=".">2</span></div><div data-jt="#inner" data-jt-1="#{.}#"><span data-jt=".">1</span></div></div>',
		'nested sections no divs'

	equal jtmpl('{{#collection}} {{.}} {{/collection}} {{^collection}} empty {{/collection}}', 
			{ collection: [1] }),
		'<div data-jt="#collection ^collection" data-jt-1="#{.}#" data-jt-0="empty"><span data-jt=".">1</span></div>',
		'collection with empty value'

	equal jtmpl('{{#collection}} {{.}} {{/collection}} {{^collection}} empty {{/collection}}', 
			{ collection: [] }),
		'<div data-jt="#collection ^collection" data-jt-1="#{.}#" data-jt-0="empty">empty</div>',
		'empty collection with empty value'

	equal jtmpl('<a class="some-class {{bound-class}}">', {'bound-class': true}),
		'<a data-jt="class=bound-class" class="some-class bound-class">',
		'class attribute true'

	equal jtmpl('<a class="some-class {{bound-class}}">', {'bound-class': false}),
		'<a data-jt="class=bound-class" class="some-class ">',
		'class attribute false'

	equal jtmpl('<a prop="{{prop}}">', {prop: null}),
		'<a data-jt="prop=prop" >',
		'output null attribute'

	equal jtmpl('<a prop="{{prop}}">', {prop: 1}),
		'<a data-jt="prop=prop" prop="1">',
		'output non-null attribute'

	equal jtmpl('{{#links}}<a href="{{href}}" class="{{selected}}">{{title}}</a>{{/links}}',
		{ links: [{ href: '/', selected: true, title: 'root'}]}),
		'<div data-jt="#links" data-jt-1="&lt;a href=#{href}# class=#{selected}#&gt;#{title}#&lt;/a&gt;"><a data-jt="href=href class=selected title" href="/" class=selected>root</a></div>',
		'array of links with many bound attributes'





test 'bind', ->
	collectionDOMText = -> 
		"#{ parseInt(node.innerHTML) for node in jtmpl('ul li ul')[0].children }"

	model.collection[0].inner[0] = 42
	equal jtmpl('ul li ul li')[0].innerHTML, 
		'42',
		'nested section item innerHTML'

	equal jtmpl('ul')[0].children.length, 
		model.collection.length,
		'collection.length equals li.length'

	model.field = 'qunit'
	equal jtmpl('p')[3].innerHTML, 
		'<code>model.field</code> = "<span data-jt="field">qunit</span>"',
		'positive if section'

	model.collection[0].inner.splice(4, 1)
	model.collection[0].inner[3] = 42
	equal jtmpl('ul li ul li')[3].innerHTML,
		'42',
		'collection.splice delete last element'

	model.collection[0].inner.pop()
	equal jtmpl('ul li ul')[0].children.length,
		model.collection[0].inner.length,
		'collection.pop'

	model.collection[0].inner = [4, 3, 2, 1]
	equal collectionDOMText(),
		'4,3,2,1',
		'collection = array_literal'

	model.collection[0].inner.reverse()
	equal collectionDOMText(),
		'1,2,3,4',
		'collection.reverse'

	model.collection[0].inner = [2, 2, 2, 3, 4]
	model.collection[0].inner.shift()
	model.collection[0].inner[0] = 1
	equal collectionDOMText(),
		'1,2,3,4',
		'collection.shift'

	model.collection[0].inner = [2, 3, 4]
	model.collection[0].inner.unshift(33)
	model.collection[0].inner[0] = 1
	equal collectionDOMText(),
		'1,2,3,4',
		'collection.unshift'

	model.collection[0].inner = [2, 4, 3, 1]
	model.collection[0].inner.sort()
	model.collection[0].inner[0] = 3
	model.collection[0].inner[2] = 1
	model.collection[0].inner.sort()
	equal collectionDOMText(),
		'1,2,3,4',
		'collection.sort'