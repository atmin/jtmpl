_`{{`_ `jtmpl` _`}}`_
=====================

#### Humanistic JavaScript MVC framework



<br>
 _[Kitchensink](kitchensink.html) demo is working. First release coming very soon, after resolving a couple of bugs_


What
----

`jtmpl` is a DOM-aware templating engine. It renders a [Mustache](http://mustache.github.io) HTML template using a `model` object and infers bindings from template structure, so when `model` changes DOM is updated accordingly and vice versa. 

There's never need to touch the DOM directly, `model` is the [single source of truth](http://en.wikipedia.org/wiki/Single_Source_of_Truth)

Other JavaScript MV* frameworks require you either:

* explicitly specify (via code or DOM element attributes) how to do the binding

* build DOM via code :(

`jtmpl` provides you _live_ templates that just work.



Why
---

* embrace [KISS](http://en.wikipedia.org/wiki/Keep_it_simple) and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)

* write least amount of code possible

* ideas by humans, automation by computers



How
---

1. Compile template using a `model` object into a valid HTML string (with added metadata)

	`Stage1` can be processed server-side or browser-side

2. Using `Stage1` output generate DOM and bind elements properties to `model` properties 




Hello, world
------------

* `Stage1` is a template compiler
	

	$ jtmpl('Hello, {{who}}', { who: 'server' })

	Hello, <span data-jt="who">server</span>



* `Stage2` renders live DOM structure (think automatic [MVC](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)):

<!-- [Link to example](hello.html) -->


	$ hello.html

	<!doctype html>
	<html>
	<head>
		<script src="js/jtmpl.min.js"></script>
	</head>
	<body>
		<!-- View -->
		<script id="view" type="text/html">
			Hello, {{who}}
			<button onclick={{click}}>{{buttonText}}</button>
		</script>

		<!-- Model (View is controlled implicitly) -->
		<script>
			model = {
				who: 'browser',
				buttonText: 'Shout',
				click: function() {
					with (this) {
						if (who == 'browser') {
							who = 'BROWSER'; 
							buttonText = 'Keep quiet';
						}
						else {
							who = 'browser'; 
							buttonText = 'Shout again';
						} 
					}
				}
			}

			jtmpl("#view", "#view", model)
		</script>
	</body>
	</html>

<iframe src="hello.html"></iframe>





Specifications
--------------

* based on [Object.observe](http://updates.html5rocks.com/2012/11/Respond-to-change-with-Object-observe)

* no dependencies, [polyfill](https://github.com/jdarling/Object.observe) built-in

* less than 5KB minified and gzipped

* Firefox, Chrome, Opera, IE 9 (IE8 requires Array.isArray, Array.map, Function.bind and String.trim [polyfills](http://stackoverflow.com/questions/2790001/fixing-javascript-array-functions-in-internet-explorer-indexof-foreach-etc))




Downloads
---------

* browse [jtmpl.coffee](https://github.com/atmin/jtmpl/blob/dev/src/coffee/jtmpl.coffee)

* [jtmpl.js](js/jtmpl.js)

* [jtmpl.min.js](js/jtmpl.min.js)





Details
-------

### API

* `jtmpl('template or "#element-id"', model)`&mdash;compiles template string (or #element-id innerHTML) using `model`

* `jtmpl('#target-id' or domElement, 'template contents or "#template-id"', model)`&mdash;compiles a template using `model`, injects it into target and binds it to `model`. 
	* template contents can be already prerendered by server to save the client some processing and help for SEO
	* if target is a script tag (of type="text/html" or similar), then it is replaced with a div.

* _Deprecated_ `jtmpl(selector)`&mdash;returns an array, just a handy wrapper around `document.querySelectorAll`. Will remove this feature, as `jtmpl(string)` syntax will probably be used for something more consistent





### Template specifics

* limitation by design is the contents of each [section](http://mustache.github.io/mustache.5.html) must be valid structural HTML, you cannot freely mix Mustache and HTML tags

* variables are automatically enclosed in a `<span>` if they aren't HTML tag contents already

* similarly, sections are automatically enclosed in a `<div>` if needed

* and the same goes for section items

* `data-jt` attributes containing metadata for `Stage2` are injected in HTML elements

* `Stage1` also emits section structures (with changed delimiters) embedded in HTML comments

* partials are not currently supported, plans are to support id-based and URL-based partials



### Interpretation of patterns

* `<tag>{{var}}</tag>`&mdash;Whenever `var` changes, `tag.innerHTML` changes

* `<tag prop="{{var}}"`&mdash;If `var` is null property is absent, otherwise equals `var`

* `<tag prop="{{bool_var}}"`&mdash;If `bool_var` is true property is present, otherwise absent

* `<tag class="{{class-name}} other-classes">`&mdash;`class-name` is expected to be boolean indicating if `tag` currently has this class

* `<tag value="{{var}}">`&mdash;When `var` changes `tag.value` changes and vice versa

* `<tag><!-- {{var}} --></tag>`&mdash;HTML comment is stripped when it contains one Mustache tag. This allows you to build easily templates that are valid HTML

* `<tag onevent="{{handler}}">`&mdash;`on`-prefixed properties are event handlers. `handler` is expected to be a function, `this` is the `model`. No need to add `onchange` handlers, DOM element values and `model` are already synced.

* `<tag> {{#section}}...{{/section}} </tag>`&mdash;Whenever `section[i]` changes corresponding HTML element changes (you can insert or delete items via `Array.splice()` and only affected DOM elements are updated). There are no restrictions on the nesting level.





Kitchen Sink
------------

Showcase of all features, tests

[Link to example](kitchensink.html)

	$ kitchensink.html

	<!doctype html>
	<html>
	<head>
		<link rel="stylesheet" type="text/css" href="css/baseline.css">
		<link rel="stylesheet" type="text/css" href="css/qunit.css">
		<style>
			h2, h3 {margin-top: 64px}
			body {padding: 1% 7%; color:#586e75}
			.bound-class {
				color:red;
				-webkit-transition:color 0.5s ease-in;  
				-moz-transition:color 0.5s ease-in;  
				-o-transition:color 0.5s ease-in;  
				transition:color 0.5s ease-in;
			}
		</style>
		<script src="js/qunit.js"></script>
		<script src="js/jtmpl.js"></script>
	</head>

	<body>
		<script id="kitchensink" type="text/jtmpl">

			<h1>Kitchen Sync</h1>
			<h2>Feature explorer</h2>
			<a href=#qunit>Tests</a>
			<p>
				Feel free to modify <code>model</code> from JS console and observe changes.
			</p>

			<h3>Nested collections&mdash;<code>model.collection</code></h3>
			<ul class="dummy-class just for the_test">
				{{#collection}}
				<li>
					<h4><code>model.collection[i].inner</code></h4>
					<ul>
						{{#inner}}<li>{{.}}</li>{{/inner}}
						{{^inner}}<li>&lt; empty &gt;</li>{{/inner}}
					</ul>
					&nbsp;
					<button onclick={{innerPush}}>push</button>
					<button onclick="{{innerPop}}" disabled={{popDisabled}}>pop</button>
				</li>
				{{/collection}}
				{{^collection}}
				<li>&lt; empty &gt;</li>
				{{/collection}}
			</ul>
			<br>
			<button onclick={{push}}>push</button>
			<button onclick="{{pop}}" disabled={{popDisabled}}>pop</button>

			<h3>Toggle text&mdash;<code>model.text</code></h3>
			<a href="#" onclick='{{toggle}}'>Toggle</a>
			<p>
				{{text}}
			</p>

			<h3>innerHTML&mdash;<code>model.innerHTML</code></h3>
			<div><!-- {{{innerHTML}}} --></div>
			<!-- `jtmpl` accepts tags in HTML comments and automatically strips them -->

			<h3>Data binding&mdash;<code>model.field</code></h3>
			<label for="field">Enter something</label> <input id="field" value={{field}}>
			<p>
				{{#field}}
				Value entered "{{field}}"
				{{/field}}
				{{^field}}
				Nothing entered
				{{/field}}
			</p>

			<h3>Data binding, toggle class&mdash;<code>model['bound-class']</code></h3>
			<div>
				<a href=# class="try2confuse-the_parser {{bound-class}}" onclick="{{toggleClass}}">Toggle .bound-class on me</a>
			</div>

			<h3>Checkboxes&mdash;<code>model.checkboxes</code></h3>
			{{#checkboxes}}
				<label><input type="checkbox" checked={{fooCheck}}> check foo</label>
				<label><input type="checkbox" checked={{barCheck}}> check bar</label>
			{{/checkboxes}}

			<h3>Select&mdash;<code>model.options</code></h3>
			<select>
				{{#options}}
				<option selected={{checked}}>{{text}}</option>
				{{/options}}
			</select>

			<h3>Radio group&mdash;<code>model.options</code></h3>
			<div>
				{{#options}}
				<label><input type="radio" name="radio-group" checked={{checked}}>{{text}}</label>
				{{/options}}
			</div>
		</script>

		<script>
			model = {
				text: 'lowercase',

				collection: [
					{ popDisabled: false, inner: [1, 2, 3] },
					{ popDisabled: false, inner: [6, 7] },
					{ popDisabled: false, inner: [8, 9, 10, 11] }
				],

				popDisabled: false,

				field: '',

				'bound-class': true,

				toggleClass: function(e) {
					this['bound-class'] = !this['bound-class'];
					e.preventDefault();
				},

				innerHTML: '<p>Hi, how are you?</p>',

				options: [
					{
						checked: false,
						text: 'one' 
					},
					{
						checked: true,
						text: 'two'
					},
					{
						checked: false,
						text: 'three'
					}
				],

				checkboxes: {
					fooCheck: true,
					barCheck: false
				},


				// event handlers
				toggle: function(e) {
					this.text = this.text == 'lowercase' ?
						'UPPERCASE': 'lowercase';
					e.preventDefault();
				},
				push: function() {
					this.collection.push({
						popDisabled: true,
						inner: []
					});
					this.popDisabled = false;
				},
				pop: function() {
					this.collection.pop();
					this.popDisabled = this.collection.length == 0;
				},
				innerPush: function() {
					this.inner.push(parseInt(Math.random() * 100));
					this.popDisabled = false;
				},
				innerPop: function() {
					this.inner.pop();
					this.popDisabled = this.inner.length == 0;
				}
			};

			jtmpl('#kitchensink', '#kitchensink', model);
		</script>

		<h2>QUnit Blackbox Tests</h2>
		<div id="qunit"></div>
		<div id="qunit-fixture"></div>
		<script src="js/tests.js"></script>
	</body>
	</html>
