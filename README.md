_`{{`_ `jtmpl` _`}}`_
=====================

### Live templates



What
----

`jtmpl` is a DOM-aware templating engine. It renders a [Mustache](http://mustache.github.io) HTML template using a `model` object and infers bindings from template structure, so when `model` changes DOM is updated accordingly and vice versa. 

There's never need to touch the DOM directly, `model` is the [single source of truth](http://en.wikipedia.org/wiki/Single_Source_of_Truth)



Why
---

* embrace [KISS](http://en.wikipedia.org/wiki/Keep_it_simple) and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)

* write least amount of code possible, enjoy conceptual simplicity

* ideas by humans, automation by computers

* extend the concept of a templating engine with the most essential feature of [JavaScript MVC](http://www.infoq.com/research/top-javascript-mvc-frameworks) frameworks&mdash;[data-binding](http://en.wikipedia.org/wiki/Data_binding)

* do not require explicit hooks, boilerplate initialization code or invent a [DSL](http://en.wikipedia.org/wiki/Domain-specific_language) to build the DOM&mdash;template already contains relations between model properties and HTML tags (which result in DOM nodes), so leverage this

`jtmpl` enables you to focus on structure and data and not worry about DOM synchronization. Assuming you already know HTML, JavaScript and Mustache, the learning curve is non-existent. Check the [Kitchensink demo](kitchensink.html).




How
---

1. Compile template using a `model` object into a valid HTML string (with added metadata)

	`Stage1` can be processed server-side or browser-side

2. Using `Stage1` output generate DOM and bind elements properties to `model` properties 




Hello, world
------------

#### `Stage1` is a template compiler:
	

	$ jtmpl('Hello, {{who}}', { who: 'server' })

	Hello, <span data-jt="who">server</span>


 
<br>

#### `Stage2` renders live DOM structure:

<iframe src="hello.html" style="border:0; border-left:1px dotted black; height:4em"></iframe>


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





Specifications
--------------

* no dependencies

* less than 5KB minified and gzipped

* Firefox, Chrome, Opera, IE 9+




Downloads
---------
_dev branch_

* browse [jtmpl.coffee](https://github.com/atmin/jtmpl/blob/dev/src/coffee/jtmpl.coffee)

* [jtmpl.js](js/jtmpl.js)

* [jtmpl.min.js](js/jtmpl.min.js)





Details
-------

### API

* `jtmpl('template or "#element-id"', model)`&mdash;compiles template string (or #element-id innerHTML) using `model`

* `jtmpl('#target-id' or domElement, 'template contents or "#template-id"', model)`&mdash;compiles a template using `model`, injects it into target and binds it to `model`. 
	* template contents can be already prerendered by server to save the client some processing and help for SEO
	* if target is a script tag (of type="text/html" or similar), then it is replaced with a div. This makes possible directly converting a template, embedded in a clean way, into a DOM node

* _Deprecated_ `jtmpl(selector)`&mdash;returns an array, just a handy wrapper around `document.querySelectorAll`. Will remove this feature, as `jtmpl(string)` syntax will probably be used for something more consistent





### Template specifics

* limitation by design is the contents of each [section](http://mustache.github.io/mustache.5.html) must be valid structural HTML, you cannot freely mix Mustache and HTML tags

* variables are automatically enclosed in a `<span>` if they aren't HTML tag contents already

* similarly, sections are automatically enclosed in a `<div>` if needed

* and the same goes for section items

* all default enclosing tags are configurable

* `data-jt` attributes containing metadata for `Stage2` are injected in HTML elements

* `Stage1` also emits section structures (with changed delimiters) embedded in HTML comments




### Interpretation of patterns

* `<tag>{{var}}</tag>`&mdash;Whenever `var` changes, `tag.innerHTML` changes

* `<tag prop="{{var}}"`&mdash;If `var` is null property is absent, otherwise equals `var`

* `<tag prop="{{bool_var}}"`&mdash;If `bool_var` is true property is present, otherwise absent

* `<tag class="{{class-name}} other-classes">`&mdash;`class-name` is expected to be boolean indicating if `tag` currently has this class

* `<tag value="{{var}}">`&mdash;When `var` changes `tag.value` changes and vice versa

* `<tag><!-- {{var}} --></tag>`&mdash;HTML comment is stripped when it contains one Mustache tag. This enables wrapping template tags in HTML comments, if you are concerned about template code being valid HTML

* `<tag onevent="{{handler}}">`&mdash;`on`-prefixed properties are event handlers. `handler` is expected to be a function, `handler`'s `this` is the context in which the handler has been attached. No need to add `onchange` handlers, DOM element values and `model` are already synced.

 Currently, events are directly bound to elements for simplicity, plans are to use event delegation on section root node instead, for efficient handling of large collections. This will happen transparently and won't concern existing handlers semantics.

* `<tag> {{#section}}...{{/section}} </tag>`&mdash;Whenever `section` array changes `<tag>` children, that are affected (and only they) change. There are no restrictions on the nesting level.



### Planned features

* comments

* partials (template include)
	
	* `{{>var_template_id_or_url}}`
	* `{{>"#template-id"}}`
	* `{{>"//xhr-fetch-template.url"}}`

	_"http:" or "https:" part [can be omitted](http://stackoverflow.com/a/550073/2713676), so it'll inherit current scheme_

	Included templates inherit their parent context.

* blocks and template inheritance akin to [Django template inheritance](https://docs.djangoproject.com/en/dev/topics/templates/#id1)

	```
	<script id="base" type="text/html">
		{{+primary_block}}
			Block contents is template code, of course
		{{/primary_block}}
		{{+secondary_block}}
			Some secondary content
		{{/secondary_block}}
	</script>

	<script id="descendant" type="text/html">
		{{<"#base"}}

		{{+primary_block}}
			Will override #base's primary_block content
		{{/primary_block}}
		{{+secondary_block}}
			If this block was non-existent, you would see "Some secondary content" from #base
		{{/secondary_block}}
	</script>
	```

	_Syntax inspired by [Dust](http://akdubya.github.io/dustjs/)_

* refactor in "everything is a plugin" style and figure out a plugin system


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

			<h3>Toggle text</h3>
			<a href="#" onclick='{{toggle}}'>Toggle <code>model.text</code></a>
			<p>
				{{text}}
			</p>

			<h3>Data binding</h3>
			<label for="field">Enter something</label> <input id="field" value={{field}}>
			<p>
				{{#field}}
				<code>model.field</code> = "{{field}}"
				{{/field}}
				{{^field}}
				<code>model.field</code> is empty
				{{/field}}
			</p>

			<h3>Data binding, toggle class</h3>
			<div>
				<label><input type="checkbox" checked="{{bound-class}}"> <code>model['bound-class']</code></label>
				<p class="{{bound-class}}">Lorem ipsum ...</p>
			</div>

			<h3>Checkboxes toggling "if" sections</h3>
			{{#checkboxes}}
				<label><input type="checkbox" checked={{fooCheck}}> check foo</label>
				<label><input type="checkbox" checked={{barCheck}}> check bar</label>
				{{#fooCheck}}
				<p><code>model.checkboxes.fooCheck</code> is checked<p>
				{{/fooCheck}}
				{{#barCheck}}
				<p><code>model.checkboxes.barCheck</code> is checked<p>
				{{/barCheck}}
			{{/checkboxes}}

			<h3>Select and radiogroup</h3>
			<h5><code>model.options</code></h5>
			<select>
				{{#options}}
				<option selected={{checked}}>{{text}}</option>
				{{/options}}
			</select>
			<h5><code>model.options</code> again</h5>
			<p>
				{{#options}}
				<label><input type="radio" name="radio-group" checked={{checked}}>{{text}}</label>
				{{/options}}
			</p>

			<h3><code>model.innerHTML</code></h3>
			<div><!-- {{{innerHTML}}} --></div>
			<!-- `jtmpl` accepts tags in HTML comments and automatically strips them -->

			<h3>Nested collections</h3>
			<ul class="dummy-class just for the_test">
				{{#collection}}
				<li>
					<h4><code>model.collection[i].inner</code> <button onclick={{deleteMe}} style="display:none">Delete me</button></h4>
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

		</script>

		<script>
			model = {
				text: 'lowercase',

				collection: [
					{ popDisabled: false, inner: [1, 2, 3, 4, 5] },
					{ popDisabled: false, inner: [6, 7] },
					{ popDisabled: false, inner: [8, 9, 10, 11] }
				],

				popDisabled: false,

				field: '',

				'bound-class': true,

				innerHTML: '<p>I am a paragraph, change me: <code><pre>model.innerHTML = "new HTML content"</pre></code></p>',

				options: [
					{ checked: true, text: 'one' },
					{ checked: false, text: 'two' },
					{ checked: false, text: 'three' }
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
				deleteMe: function(i) {
					this.splice(i, 1);
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
