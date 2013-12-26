### What

`jtmpl` is a DOM-aware templating engine. It renders a [Mustache](http://mustache.github.io) HTML template using a `model` object and infers bindings from template structure, so when `model` changes DOM is updated accordingly and vice versa. 

There's never need to touch the DOM directly, `model` is the [single source of truth](http://en.wikipedia.org/wiki/Single_Source_of_Truth)



### Why

* embrace [KISS](http://en.wikipedia.org/wiki/Keep_it_simple) and [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)

* [write least amount of code possible](http://www.codinghorror.com/blog/2007/12/size-is-the-enemy.html), enjoy conceptual simplicity

* ideas by humans, automation by computers

* extend the concept of a templating engine with the most essential feature of [JavaScript MVC](http://www.infoq.com/research/top-javascript-mvc-frameworks) frameworks&mdash;[data-binding](http://en.wikipedia.org/wiki/Data_binding)

* do not require explicit hooks, boilerplate initialization code or invent a JavaScript-based [DSL](http://en.wikipedia.org/wiki/Domain-specific_language) to build the DOM&mdash;template already contains relations between model properties and HTML tags (which result in DOM nodes), so leverage this

`jtmpl` enables you to focus on structure and data and not worry about DOM synchronization. If you already know HTML, JavaScript and Mustache, the learning curve is non-existent. Check the [Kitchensink demo](kitchensink.html).




### How

1. Compile template using a `model` object into a valid HTML string (with added metadata)

    `Stage1` can be processed server-side or browser-side

2. Using `Stage1` output generate DOM and bind elements properties to `model` properties 




### Hello, world


`Stage1` is a template compiler:
    

    $ jtmpl('Hello, {{who}}', { who: 'server' })

    Hello, <span data-jt="who">server</span>


 
<br>

`Stage2` renders live DOM structure:

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





### Specifications

* no dependencies

* less than 5KB minified and gzipped

* Firefox, Chrome, Opera, IE 9+




### Downloads

* browse [jtmpl.coffee (master)](https://github.com/atmin/jtmpl/blob/master/src/coffee/jtmpl.coffee), [jtmpl.coffee (dev)](https://github.com/atmin/jtmpl/blob/dev/src/coffee/jtmpl.coffee)

* [jtmpl.js](js/jtmpl.js)

* [jtmpl.min.js](js/jtmpl.min.js)





### Details

#### API

* `jtmpl('template or "#element-id"', model)`&mdash;compiles template string (or #element-id innerHTML) using `model`

* `jtmpl('#target-id' or domElement, 'template contents or "#template-id"', model)`&mdash;compiles a template using `model`, injects it into target and binds it to `model`. 
    * template contents can be already prerendered by server to save the client some processing and help for SEO
    * if target is a script tag (of type="text/html" or similar), then it is replaced with a div. This makes possible directly converting a template, embedded in a clean way, into a DOM node

* _Deprecated_ `jtmpl(selector)`&mdash;returns an array, just a handy wrapper around `document.querySelectorAll`. Will remove this feature, as `jtmpl(string)` syntax will probably be used for something more consistent





#### Template specifics

* limitation by design is the contents of each [section](http://mustache.github.io/mustache.5.html) must be valid structural HTML, you cannot freely mix Mustache and HTML tags

* variables are automatically enclosed in a `<span>` if they aren't HTML tag contents already

* similarly, sections are automatically enclosed in a `<div>` if needed

* and the same goes for section items

* all default enclosing tags are configurable

* `data-jt` attributes containing metadata for `Stage2` are injected in HTML elements

* `Stage1` also emits section structures (with changed delimiters) embedded in HTML comments




#### Interpretation of patterns

* `<tag>{{var}}</tag>`&mdash;Whenever `var` changes, `tag.innerHTML` changes

* `<tag prop="{{var}}"`&mdash;If `var` is null property is absent, otherwise equals `var`

* `<tag prop="{{bool_var}}"`&mdash;If `bool_var` is true property is present, otherwise absent

* `<tag class="{{class-name}} other-classes">`&mdash;`class-name` is expected to be boolean indicating if `tag` currently has this class

* `<tag value="{{var}}">`&mdash;When `var` changes `tag.value` changes and vice versa

* `<tag><!-- {{var}} --></tag>`&mdash;HTML comment is stripped when it contains one Mustache tag. This enables wrapping template tags in HTML comments, if you are concerned about template code being valid HTML

* `<tag onevent="{{handler}}">`&mdash;`on`-prefixed properties are event handlers. `handler` is expected to be a function, `handler`'s `this` is the context in which the handler has been attached. No need to add `onchange` handlers, DOM element values and `model` are already synced.

 Currently, events are directly bound to elements for simplicity, plans are to use event delegation on section root node instead, for efficient handling of large collections. This will happen transparently and won't concern existing handlers semantics.

* `<tag> {{#section}}...{{/section}} </tag>`&mdash;Whenever `section` array changes `<tag>` children, that are affected (and only they) change. There are no restrictions on the nesting level.



#### Planned features

Check the [issue tracker](https://github.com/atmin/jtmpl/issues)