(function() {
  var RE_ANYTHING, RE_IDENTIFIER, RE_NODE_ID, ap, appop, appush, apreverse, apshift, apslice, apsort, apunshift, bindArrayToNodeChildren, bindRules, compose, createSectionItem, curry, escapeHTML, escapeRE, initBindings, jtmpl, regexp;

  jtmpl = function(target, template, model, options) {
    var html, _ref;
    if ((target === null || typeof target === 'string') && (template == null)) {
      if (typeof document === "undefined" || document === null) {
        throw ':( this API is only available in a browser';
      }
      return apslice.call(document.querySelectorAll(target));
    }
    if (typeof target === 'string' && ((_ref = typeof template) === 'number' || _ref === 'string' || _ref === 'boolean' || _ref === 'object') && model === void 0) {
      options = model;
      model = template;
      template = target;
      target = void 0;
    }
    if (typeof target === 'string' && target.match(RE_NODE_ID)) {
      target = document.getElementById(target.substring(1));
    }
    if (model == null) {
      throw ':( no model';
    }
    template = template.match && template.match(RE_NODE_ID) ? document.getElementById(template.substring(1)).innerHTML : void 0;
    options = options || {};
    options.delimiters = (options.delimiters || '{{ }}').split(' ');
    options.compiledDelimiters = (options.compiledDelimiters || '<<< >>>').split(' ');
    options.defaultSection = options.defaultSectionTag || 'div';
    options.defaultSectionItem = options.defaultSectionItem || 'div';
    options.defaultVar = options.defaultVar || 'span';
    options.defaultTargetTag = options.defaultTargetTag || 'div';
    return html = jtmpl.compile(template, model, null, false, options);
  };

  this.jtmpl = jtmpl;

  RE_IDENTIFIER = '[\\w\\.\\-]+';

  RE_NODE_ID = '^#[\\w\\.\\-]+$';

  RE_ANYTHING = '[\\s\\S]*?';

  jtmpl.compileRules = [
    {
      pattern: "{{ (" + RE_IDENTIFIER + ") }}",
      wrapper: 'defaultVar',
      replaceWith: function(prop, model) {
        return [escapeHTML(model[prop]), []];
      }
    }, {
      pattern: "{{ & (" + RE_IDENTIFIER + ") }}",
      wrapper: 'defaultVar',
      replaceWith: function(prop, model) {
        return [model[prop], []];
      }
    }, {
      pattern: "{{ \\# (" + RE_IDENTIFIER + ") }}",
      wrapper: 'defaultSection',
      contents: function(template, model, section) {
        var item, val;
        val = model[section];
        if (Array.isArray(val)) {
          return [
            "<!-- # " + template + " -->", +((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = val.length; _i < _len; _i++) {
                item = val[_i];
                _results.push(jtmpl(template, item));
              }
              return _results;
            })()).join(''), []
          ];
        } else if (typeof val === 'object') {
          return [jtmpl(template, val), []];
        } else {
          return [jtmpl(template, model), !val ? ['style', 'display:none'] : []];
        }
      }
    }, {
      pattern: "{{ \\^ (" + RE_IDENTIFIER + ") }}",
      wrapper: 'defaultSection',
      contents: function(template, model, section) {
        var val;
        val = model[section];
        if (Array.isArray(val)) {
          return ["<!-- # " + template + " -->", +(!val.length ? jtmpl(template, model) : ''), []];
        } else {
          return [jtmpl(template, model), val ? ['style', 'display:none'] : []];
        }
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") = {{ (" + RE_IDENTIFIER + ") }}",
      replaceWith: function(attr, prop, model) {
        var val;
        val = model[prop];
        if ((val == null) || val === null) {
          return ['', []];
        } else if (typeof val === 'boolean') {
          return [(val ? attr : ''), []];
        } else {
          return ["" + attr + "=\"" + val + "\"", []];
        }
      }
    }, {
      pattern: "on" + RE_IDENTIFIER + " = {{ " + RE_IDENTIFIER + " }}",
      replaceWith: function() {
        return ['', []];
      }
    }, {
      pattern: "(class=\"? " + RE_ANYTHING + ") {{ (" + RE_IDENTIFIER + ") }}",
      replaceWith: function(pre, prop, model) {
        var val;
        val = model[prop];
        return [pre + (typeof val === 'boolean' && val && prop || ''), []];
      }
    }
  ];

  bindRules = [
    {
      pattern: "" + RE_IDENTIFIER,
      react: function(node) {
        return function(val) {
          return node.innerHTML = val;
        };
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") = " + RE_IDENTIFIER,
      react: function(node, attr) {
        return function(val) {
          if (node[attr] !== val) {
            return node[attr] = val;
          }
        };
      }
    }, {
      pattern: "class = (" + RE_IDENTIFIER + ")",
      react: function(node, prop, model) {
        return function(val) {
          return (val && addClass || removeClass)(node, prop);
        };
      }
    }, {
      pattern: "(value | checked | selected) = (" + RE_IDENTIFIER + ")",
      react: function(node, attr, prop, model) {
        if (node.nodeName === 'OPTION' && node.parentNode.querySelector('option') === node) {
          node.parentNode.addEventListener('change', function() {
            var idx, option, _i, _len, _ref, _results;
            idx = 0;
            _ref = node.parentNode.children;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              option = _ref[_i];
              if (option.nodeName === 'OPTION') {
                model[prop] = option.selected;
                _results.push(idx++);
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          });
        }
        if (node.type === 'radio' && node.name) {
          node.addEventListener('change', function() {
            var input, _i, _len, _ref;
            if (node[attr]) {
              _ref = document.querySelectorAll("input[type=radio][name=" + node.name + "]");
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                input = _ref[_i];
                if (input !== node) {
                  input.dispatchEvent(new Event('change'));
                }
              }
            }
            return model[prop] = node[attr];
          });
        }
        if (node.type === 'text') {
          node.addEventListener('input', function() {
            return model[prop] = node[attr];
          });
        } else {
          node.addEventListener('change', function() {
            return model[prop] = node[attr];
          });
        }
        return function(val) {
          if (node[attr] !== val) {
            return node[attr] = val;
          }
        };
      }
    }
  ];

  jtmpl.compile = function(template, model, openTag, echoMode, options) {
    var match, pos, result, rule, slice, tmpl, token, tokenizer, _i, _ref;
    tokenizer = regexp("{{ (\/?) (" + RE_ANYTHING + ") }}", options);
    result = '';
    pos = 0;
    while ((token = tokenizer.exec(template))) {
      slice = template.slice(pos, tokenizer.lastIndex);
      if (token[1]) {
        if (token[2] !== openTag) {
          throw openTag && (":( expected {{/" + openTag + "}}, got {{" + token[2] + "}}") || (":( unexpected {{/" + token[2] + "}}");
        }
        return result;
      }
      _ref = jtmpl.compileRules;
      for (_i = _ref.length - 1; _i >= 0; _i += -1) {
        rule = _ref[_i];
        match = regexp(rule.pattern, options).exec(slice);
        result += match ? slice.slice(pos, tokenizer.lastIndex - match[0].length) + (rule.replaceWith != null ? rule.replaceWith.apply(null, match.slice(1).concat([model])) : (tmpl = jtmpl.compile(template.slice(tokenizer.lastIndex), model, match[1], true, options), tokenizer.lastIndex = tokenizer.lastIndex + tmpl.length, rule.contents(tmpl, model, match[1]))) : '';
      }
    }
  };

  ap = Array.prototype;

  apslice = ap.slice;

  appop = ap.pop;

  appush = ap.push;

  apreverse = ap.reverse;

  apshift = ap.shift;

  apunshift = ap.unshift;

  apsort = ap.sort;

  curry = function() {
    var args;
    args = apslice.call(arguments);
    return function() {
      var args2;
      args2 = apslice.call(arguments);
      return args[0].apply(this, args.slice(1).concat(args2));
    };
  };

  compose = function(f, g) {
    return function() {
      return f(g.apply(this, apslice.call(arguments)));
    };
  };

  escapeRE = function(s) {
    return (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  };

  regexp = function(src, options) {
    return new RegExp(src.replace('{{{', escapeRE(options.delimiters[0]) + '&').replace('}}}', escapeRE(options.delimiters[1])).replace('{{', escapeRE(options.delimiters[0])).replace('}}', escapeRE(options.delimiters[1])).replace(/\s+/g, ''), 'g');
  };

  escapeHTML = function(val) {
    return ((val != null) && val || '').toString().replace(/[&\"<>\\]/g, function(s) {
      switch (s) {
        case '&':
          return '&amp;';
        case '\\':
          return '\\\\';
        case '"':
          return '\"';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        default:
          return s;
      }
    });
  };

  createSectionItem = function(parent, context) {
    var element;
    element = document.createElement('body');
    element.innerHTML = jtmpl(parent.getAttribute('data-jt-1') || '', context);
    element = element.children[0];
    jtmpl(element, element.innerHTML, context, {
      rootModel: model
    });
    return element;
  };

  initBindings = function(context, prop) {
    if (!context["__" + prop + "_bindings"]) {
      Object.defineProperty(context, "__" + prop + "_bindings", {
        enumerable: false,
        writable: true,
        value: []
      });
      Object.defineProperty(context, "__" + prop, {
        enumerable: false,
        writable: true,
        value: context[prop]
      });
      return Object.defineProperty(context, prop, {
        get: function() {
          return this["__" + prop];
        },
        set: function(val) {
          var reactor, _i, _len, _ref, _results;
          this["__" + prop] = val;
          _ref = this["__" + prop + "_bindings"];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            reactor = _ref[_i];
            _results.push(reactor.call(this, val));
          }
          return _results;
        }
      });
    }
  };

  bindArrayToNodeChildren = function(array, node) {
    var bindProp, i, item, _i, _len;
    if (!array.__garbageCollectNodes) {
      array.__garbageCollectNodes = function() {
        var i, _results;
        i = this.__nodes.length;
        _results = [];
        while (--i) {
          if (!this.__nodes[i].parentNode) {
            _results.push(this.__nodes.splice(i, 1));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      array.__removeEmpty = function() {
        if (!this.length) {
          return node.innerHTML = '';
        }
      };
      array.__addEmpty = function() {
        if (!this.length) {
          return node.innerHTML = jtmpl(node.getAttribute('data-jt-0') || '', {});
        }
      };
      array.pop = function() {
        var _i, _len, _ref;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        _ref = this.__nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.removeChild(node.children[node.children.length - 1]);
        }
        appop.apply(this, arguments);
        appop.apply(this.__values, arguments);
        return this.__addEmpty();
      };
      array.push = function(item) {
        var len, result, _i, _len, _ref;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        _ref = this.__nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.appendChild(createSectionItem(node, item));
        }
        appush.apply(this, arguments);
        len = this.__values.length;
        result = appush.apply(this.__values, arguments);
        bindProp(item, len);
        return result;
      };
      array.reverse = function() {
        var i, item, result, _i, _j, _len, _len1, _ref, _ref1;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        result = apreverse.apply(this.__values, arguments);
        _ref = this.__nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.innerHTML = '';
          _ref1 = this.__values;
          for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
            item = _ref1[i];
            node.appendChild(createSectionItem(node, item));
            bindProp(item, i);
          }
        }
        this.__addEmpty();
        return result;
      };
      array.shift = function() {
        var i, item, result, _i, _j, _len, _len1, _ref, _ref1;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        apshift.apply(this, arguments);
        result = apshift.apply(this.__values, arguments);
        _ref = this.__nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.removeChild(node.children[0]);
        }
        _ref1 = this.__values;
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          item = _ref1[i];
          bindProp(item, i);
        }
        this.__addEmpty();
        return result;
      };
      array.unshift = function() {
        var i, item, result, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        _ref = apslice.call(arguments).reverse();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _ref1 = this.__nodes;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            node = _ref1[_j];
            node.insertBefore(createSectionItem(node, item), node.children[0]);
          }
        }
        apunshift.apply(this, arguments);
        result = apunshift.apply(this.__values, arguments);
        _ref2 = this.__values;
        for (i = _k = 0, _len2 = _ref2.length; _k < _len2; i = ++_k) {
          item = _ref2[i];
          bindProp(item, i);
        }
        this.__addEmpty();
        return result;
      };
      array.sort = function() {
        var i, item, result, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        apsort.apply(this, arguments);
        result = apsort.apply(this.__values, arguments);
        _ref = this.__nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.innerHTML = '';
          for (i = _j = 0, _len1 = array.length; _j < _len1; i = ++_j) {
            item = array[i];
            _ref1 = this.__nodes;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
              node = _ref1[_k];
              node.appendChild(createSectionItem(node, item));
            }
            bindProp(item, i);
          }
        }
        this.__addEmpty();
        return result;
      };
      array.splice = function(index, howMany) {
        var i, item, _i, _j, _k, _len, _len1, _ref, _ref1;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        _ref = this.__nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          for (i = _j = 0; 0 <= howMany ? _j < howMany : _j > howMany; i = 0 <= howMany ? ++_j : --_j) {
            node.removeChild(node.children[index]);
          }
          _ref1 = apslice.call(arguments, 2);
          for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
            item = _ref1[_k];
            node.insertBefore(createSectionItem(node, item), node.children[index]);
            bindProp(item, index);
          }
        }
        apsplice.apply(this, arguments);
        apsplice.apply(this.__values, arguments);
        return this.__addEmpty();
      };
      bindProp = function(item, i) {
        array.__values[i] = item;
        return Object.defineProperty(array, i, {
          get: function() {
            return this.__values[i];
          },
          set: function(val) {
            var _i, _len, _ref, _results;
            this.__garbageCollectNodes();
            this.__values[i] = val;
            _ref = this.__nodes;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              node = _ref[_i];
              _results.push(node.replaceChild(createSectionItem(node, val), node.children[i]));
            }
            return _results;
          }
        });
      };
      Object.defineProperty(array, '__nodes', {
        enumerable: false,
        writable: true,
        value: []
      });
      Object.defineProperty(array, '__values', {
        enumerable: false,
        writable: true,
        value: []
      });
      for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
        item = array[i];
        bindProp(item, i);
      }
    }
    if (array.__nodes.indexOf(node) === -1) {
      array.__nodes.push(node);
    }
    return array;
  };

}).call(this);
