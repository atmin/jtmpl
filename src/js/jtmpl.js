/**
 * jtmpl
 * @author Atanas Minev
 * MIT license
 */

/*jslint evil:true */// ]:)
function jtmpl(el, tpl, context) {
	var RE_TAG = '{{({)?(\\#|\\^|\\/)?([\\w\\.]+)(})?}}',
		self = this;

	self.re = new RegExp(RE_TAG, 'g');
	self.tpl = tpl;
	self.context = context;
	self.taglist = [];

	self._get = function(v, context) {
		context = context || self.context;
		return eval('context' + (v==='.' ? '' : '.' + v));
	};

	self._process = function (tpl, context, pos, tag) {
		var out = '', s, t, v, i, idx,
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

			// {{context.var}}
			if (!t[2]) {
				out += catchUp() + self._get(t[3], context);
				pos = self.re.lastIndex;
			}

			// {{#block_tag_begin}}
			if (t[2] === '#' || t[2] === '^') {

				v = self._get(t[3], context);

				// falsy value and {{^if_not_scalar}}
				if (!v && t[2] === '^') {
					out += catchUp() + self._process(tpl, context, self.re.lastIndex, t);
					pos = self.re.lastIndex;
				}

				// {{#if_scalar}} on true value
				else if (v && v.length === undefined && t[2] === '#') {
					out += catchUp() + self._process(tpl, v, self.re.lastIndex, t);
					pos = self.re.lastIndex;
				}

				// {{#enumerate_array}}
				else if (v && v.length > 0 && t[2] === '#') {
					out += catchUp();
					pos = self.re.lastIndex;
					for (i = 0; i < v.length; i++) {
						out += catchUp() + self._process(tpl, v[i], pos, t);
						if (i < v.length - 1) {
							self.re.lastIndex = pos;
						}
					}
				}

				// {{^enumerable_array}}
				else if (v && typeof v.length !== undefined && t[2] == '^') {
					pos = self.re.lastIndex;
					out += catchUp();
					s = self._process(tpl, context, pos, t);
					pos = self.re.lastIndex;
					out += v.length ? '' : s;
				}
			}

			t = self.re.exec(tpl);
		}

		if (tag) {
			throw 'Unclosed tag ' + tag[0];
		}

		return out + tpl.slice(pos);
	};

	self.html = self._process(tpl.match(/\#\w+/) ? 
		document.getElementById(tpl.substring(1)).innerHTML : tpl, context);

	document.getElementById(el.substring(1)).innerHTML = self.html;
}