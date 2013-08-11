/**
 * jtmpl
 * @author Atanas Minev
 * MIT license
 */


function jtmpl(el, tpl, context) {
	var RE_TAG = '{{({)?(\\#|\\^|\\/)?([\\w\\.]+)(})?}}';

	this.re = new RegExp(RE_TAG, 'g');
	this.tpl = tpl;
	this.context = context;
	this.taglist = [];

	this._process = function (tpl, context, pos, tag) {
		var out = '', s, t;

		pos = pos || 0;

		t = this.re.exec(tpl);
		while (t) {
			console.log(t);

			// emit {{context.var}}
			if (!t[2]) {
				out += tpl.slice(pos, this.re.lastIndex - t[0].length) + 
					context[t[3]];
				pos = this.re.lastIndex;
			}

			// {{#block_tag_begin}}
			if (t[2] === '#' || t[2] === '^') {
				out += tpl.slice(pos, this.re.lastIndex - t[0].length) + 
					this._process(tpl, context, this.re.lastIndex, t);
				pos = this.re.lastIndex;
			}

			// {{#block_tag_end}}
			if (t[2] === '/') {
				// end tag matches begin tag?
				if (tag && t[3] !== tag[3]) {
					throw 'Expected {{/' + tag[3] + '}}, got ' + t[0];
				}

				out += tpl.slice(pos, this.re.lastIndex - t[0].length);
				return out;
			}

			t = this.re.exec(tpl);
		}

		if (tag) {
			throw 'Unclosed tag ' + tag[0];
		}

		return out;
	};

	this.html = this._process(tpl, context);

	document.getElementById(el.substring(1)).innerHTML = this.html;
}