/**
 * jtmpl
 * @author Atanas Minev
 * MIT license
 */
function jtmpl(el, tpl, model) {
	var target, self;

	self = {
		tpl: tpl,
		model: model,

		// Match jtmpl tag. http://gskinner.com/RegExr/ is a nice tool
		re: /\{\{(\{)?(\#|\^|\/)?([\w\.]+)(\})?\}\}/g,

		// Match opening HTML tag
		hre: /<(\w+)(?:\s+([\w-]*)(?:(=)"(?:\w+)")?)*(>)?/g,

		// jtmpl tags
		tags: [],
		
		// opening HTML tags
		htags: [],		

		_get: function(v, context) {
			/*jslint evil:true */// ]:)
			context = context || self.model;
			return eval('context' + (v==='.' ? '' : '.' + v));
		},

		_build: function (tpl, context, pos, tag) {
			var out = '', s, t, v, i, idx, collection,
				// emit `s` or markup between `pos` and current tag, if `s` empty
				emit = function(s) {
					var ht;
					s = s !== undefined ? s + '' : tpl.slice(pos, self.re.lastIndex - t[0].length);
					out += s;
					if (!tag) {
						ht = self.hre.exec(s);
						while (ht) {
							self.htags.push(ht);
							ht = self.hre.exec(s);
						}
					}
				},
				// detect HTML element index and property to bind model to, remember tag
				pushTag = function(t) {
					(tag ? self.tags[self.tags.length - 1].children : self.tags).push(t);
				};

			pos = pos || 0;

			t = self.re.exec(tpl);
			while (t) { 
				// {{/block_tag_end}} ?
				if (t[2] === '/') {

					// end tag matches begin tag?
					if (tag && t[3] !== tag[3]) {
						err = 'Expected {{/' + tag[3] + '}}, got ' + t[0];
						console.log(err);
						throw err;
					}

					// exit recursion
					emit();
					return out;
				}

				// {{var}} ?
				if (!t[2]) {
					emit();
					emit(self._get(t[3], context) || '');
					pos = self.re.lastIndex;
					pushTag({
						type: 'var',
						value: self._get(t[3], context)
					});
				}

				// {{#block_tag_begin}} or {{^not_block_tag_begin}} ?
				if (t[2] === '#' || t[2] === '^') {

					v = self._get(t[3], context);
					pushTag({
						type: 'block',
						neg: t[2] === '^',
						children: []
					});

					// falsy value?
					if (!v) {
						emit();
						s = self._build(tpl, v, self.re.lastIndex, t);					
						pos = self.re.lastIndex;
						emit(t[2] === '#' ?  '' : s);
					}

					// {{#context_block}} or {{#enumerate_array}} ?
					else if (v && t[2] === '#') {
						emit();

						// skip loop body?
						if (v.length === 0) {
							self._build(tpl, v[i], pos, t);
						}

						// emit loop body n times, n = 1 when type(model.block) is object,
						// n = array.length when type(model.block) is array
						collection = (Object.prototype.toString.call(v) !== '[object Array]') ? [v] : v; 
						pos = self.re.lastIndex;
						for (i = 0; i < collection.length; i++) {
							emit();
							emit(
								self._build(tpl, 
									// model.context_block is an object? pass as context
									// do not update htags
									typeof v === 'object' ? collection[i] : context, 
									pos, t, true 
								)
							);
							if (i < collection.length - 1) {
								self.re.lastIndex = pos;
							}
						}
						pos = self.re.lastIndex;
					}

					// {{^enumerable_array}}
					else if (v && typeof v.length !== undefined && t[2] == '^') {
						emit();
						pos = self.re.lastIndex;
						s = self._build(tpl, context, pos, t);
						pos = self.re.lastIndex;
						emit(v.length ? '' : s);
					}

					else {
						throw 'Internal error, tag ' + t[0];
					}
				}

				t = self.re.exec(tpl);
			}

			if (tag) {
				throw 'Unclosed tag ' + tag[0];
			}

			return out + tpl.slice(pos);
		},

		_attachEventHandlers: function() {

		},

		_modelObserver: function(changes) {
			changes.forEach(function(change) {
				console.log(change.name + " was " + change.type + " and is now " + change.object[change.name]);
			});
		}
	};

	// called like: jtmpl('#element') ?
	if (tpl === undefined) {
		// return bound jtmpl object
		return document.getElementById(el.substring(1))._jtmpl;
	}

	self.html = self._build(tpl.match(/\#\w+/) ? 
		document.getElementById(tpl.substring(1)).innerHTML : tpl, model);
	Object.observe(model, self._modelObserver);

	target = document.getElementById(el.substring(1));
	target._jtmpl = self;
	target.innerHTML = self.html;

	return self;
}