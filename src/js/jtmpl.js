/**
 * jtmpl
 * @author Atanas Minev
 * MIT license
 */

/*jslint evil:true */// ]:)
function jtmpl(el, tpl, context) {
	var target, self;

	self = {

		re: new RegExp('{{({)?(\\#|\\^|\\/)?([\\w\\.]+)(})?}}', 'g'),
		tpl: tpl,
		context: context,
		taglist: [],

		_get: function(v, context) {
			context = context || self.context;
			return eval('context' + (v==='.' ? '' : '.' + v));
		},

		_process: function (tpl, context, pos, tag) {
			var out = '', s, t, v, i, idx, collection,
				catchUp = function() {
					return tpl.slice(pos, self.re.lastIndex - t[0].length);
				};

			pos = pos || 0;

			t = self.re.exec(tpl);
			while (t) { 
				console.log(t[0]);

				// {{/block_tag_end}}
				if (t[2] === '/') {
					// end tag matches begin tag?
					if (tag && t[3] !== tag[3]) {
						err = 'Expected {{/' + tag[3] + '}}, got ' + t[0];
						console.log(err);
						throw err;
					}

					return out + catchUp();
				}

				// {{var}}
				if (!t[2]) {
					out += catchUp() + (self._get(t[3], context) || '');
					pos = self.re.lastIndex;
				}

				// {{#block_tag_begin}} or {{^not_block_tag_begin}}
				if (t[2] === '#' || t[2] === '^') {

					v = self._get(t[3], context);

					// falsy value
					if (!v) {
						out += catchUp();
						s = self._process(tpl, v, self.re.lastIndex, t);					
						pos = self.re.lastIndex;
						out += t[2] === '#' ?  '' : s;
					}

					// {{#context_block}} or {{#enumerate_array}}
					else if (v && t[2] === '#') {
						out += catchUp();
						// skip loop body
						if (v.length === 0) {
							self._process(tpl, v[i], pos, t);
						}
						collection = (Object.prototype.toString.call(v) !== '[object Array]') ? [v] : v; 
						pos = self.re.lastIndex;
						for (i = 0; i < collection.length; i++) {
							// model.context_block is an object? pass as context
							out += catchUp() + self._process(tpl, typeof v === 'object' ? 
																collection[i] : context, pos, t);
							if (i < collection.length - 1) {
								self.re.lastIndex = pos;
							}
						}
						pos = self.re.lastIndex;
					}

					// {{^enumerable_array}}
					else if (v && typeof v.length !== undefined && t[2] == '^') {
						out += catchUp();
						pos = self.re.lastIndex;
						s = self._process(tpl, context, pos, t);
						pos = self.re.lastIndex;
						out += v.length ? '' : s;
					}

					else {
						alert('oops');
					}
				}

				t = self.re.exec(tpl);
			}

			if (tag) {
				throw 'Unclosed tag ' + tag[0];
			}

			return out + tpl.slice(pos);
		}
	};

	self.html = self._process(tpl.match(/\#\w+/) ? 
		document.getElementById(tpl.substring(1)).innerHTML : tpl, context);

	target = document.getElementById(el.substring(1));
	target._jtmpl = self;
	target.innerHTML = self.html;
}