(function() {
  var RE_ANYTHING, RE_DATA_JT, RE_IDENTIFIER, RE_NODE_ID, RE_SPACE, ap, appop, appush, apreverse, apshift, apslice, apsort, apunshift, bindArrayToNodeChildren, bindRules, compose, createSectionItem, curry, escapeHTML, escapeRE, extend, initBindings, injectTagBinding, isValidHTMLTag, jtmpl, lastOpenedHTMLTag, multiReplace, regexp;

  jtmpl = (typeof exports !== "undefined" && exports !== null ? exports : this).jtmpl = function(target, template, model, options) {
    var delimiters, html, newTarget, _ref;
    if ((target === null || typeof target === 'string') && (template == null)) {
      if (typeof document === "undefined" || document === null) {
        throw new Error(':( this API is only available in a browser');
      }
      return apslice.call(document.querySelectorAll(target));
    }
    if (typeof target === 'string' && ((_ref = typeof template) === 'number' || _ref === 'string' || _ref === 'boolean' || _ref === 'object') && (model === void 0 || model === null)) {
      model = template;
      template = target;
      target = void 0;
    }
    if (typeof target === 'string' && target.match(RE_NODE_ID)) {
      target = document.getElementById(target.substring(1));
    }
    if (model == null) {
      throw new Error(':( no model');
    }
    if (template.match && template.match(RE_NODE_ID)) {
      template = document.getElementById(template.substring(1)).innerHTML;
    }
    options = options || {};
    options.delimiters = (options.delimiters || '{{ }}').split(' ');
    options.compiledDelimiters = (options.compiledDelimiters || '<<< >>>').split(' ');
    options.defaultSection = options.defaultSectionTag || 'div';
    options.defaultSectionItem = options.defaultSectionItem || 'div';
    options.defaultVar = options.defaultVar || 'span';
    options.defaultTargetTag = options.defaultTargetTag || 'div';
    delimiters = options.delimiters;
    template = ('' + template).replace(regexp("{{{ (" + RE_IDENTIFIER + ") }}}"), delimiters[0] + '&$1' + delimiters[1]).replace(regexp("<!-- " + RE_SPACE + " ({{ " + RE_ANYTHING + " }}) " + RE_SPACE + " -->", delimiters), '$1').replace(regexp("(" + RE_IDENTIFIER + ")='({{ " + RE_IDENTIFIER + " }})'", delimiters), '$1=$2').replace(regexp("(" + RE_IDENTIFIER + ")=\"({{ " + RE_IDENTIFIER + " }})\"", delimiters), '$1=$2').replace(regexp("\\n " + RE_SPACE + " ({{ " + RE_ANYTHING + " }}) " + RE_SPACE + " \\n", delimiters), '\n$1\n');
    html = jtmpl.compile(template, model, null, false, options);
    if (!target) {
      return html;
    }
    if (target.nodeName === 'SCRIPT') {
      newTarget = document.createElement(options.defaultTargetTag);
      target.parentNode.replaceChild(newTarget, target);
      target = newTarget;
    }
    target.innerHTML = html;
    return jtmpl.bind(target, model);
  };

  RE_IDENTIFIER = '[\\w\\.\\-]+';

  RE_NODE_ID = '^#[\\w\\.\\-]+$';

  RE_ANYTHING = '[\\s\\S]*?';

  RE_SPACE = '\\s*';

  RE_DATA_JT = '(?: ( \\s* data-jt = " [^"]* )" )?';

  jtmpl.preprocessingRules = [
    {
      pattern: "",
      replaceWith: ""
    }, {
      pattern: "",
      replaceWith: ""
    }, {
      pattern: "",
      replaceWith: ""
    }
  ];

  jtmpl.compileRules = [
    {
      pattern: "(class=\"? [\\w \\. \\- \\s {{}}]*) {{ (" + RE_IDENTIFIER + ") }}$",
      replaceWith: function(pre, prop, model) {
        var val;
        val = model[prop];
        return [(pre.search('{') === -1 && pre || ' ') + (typeof val === 'boolean' && val && prop || ''), []];
      },
      echoReplaceWith: function(pre, prop) {
        if (pre.search('{') > -1) {
          return " {{" + prop + "}}";
        } else {
          return null;
        }
      },
      bindingToken: function(pre, prop) {
        return "class=" + prop;
      }
    }, {
      pattern: "on(" + RE_IDENTIFIER + ") = {{ (" + RE_IDENTIFIER + ") }}$",
      replaceWith: function() {
        return ['', []];
      },
      bindingToken: function(event, handler) {
        return "on" + event + "=" + handler;
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") = {{ (" + RE_IDENTIFIER + ") }}$",
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
      },
      bindingToken: function(attr, prop) {
        return "" + attr + "=" + prop;
      }
    }, {
      pattern: "{{ \\^ (" + RE_IDENTIFIER + ") }}$",
      wrapper: 'defaultSection',
      contents: function(template, model, section, options) {
        var val;
        val = model[section];
        if (Array.isArray(val)) {
          return ["<!-- ^ " + (multiReplace(template, options.delimiters, options.compiledDelimiters)) + " -->", +(!val.length ? jtmpl(template, model) : ''), []];
        } else {
          return [jtmpl(template, model), val ? [['style', 'display:none']] : []];
        }
      },
      bindingToken: function(section) {
        return "^" + section;
      }
    }, {
      pattern: "{{ \\# (" + RE_IDENTIFIER + ") }}$",
      wrapper: 'defaultSection',
      contents: function(template, model, section, options) {
        var item, val;
        val = model[section];
        if (Array.isArray(val)) {
          return [
            ("<!-- # " + (multiReplace(template, options.delimiters, options.compiledDelimiters)) + " -->") + ((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = val.length; _i < _len; _i++) {
                item = val[_i];
                _results.push(jtmpl(template, item, null, {
                  asArrayItem: true
                }));
              }
              return _results;
            })()).join(''), []
          ];
        } else if (typeof val === 'object') {
          return [jtmpl(template, val), []];
        } else {
          return [jtmpl(template, model), !val ? [['style', 'display:none']] : []];
        }
      },
      bindingToken: function(section) {
        return "#" + section;
      }
    }, {
      pattern: "{{ & (" + RE_IDENTIFIER + ") }}$",
      wrapper: 'defaultVar',
      replaceWith: function(prop, model) {
        return [prop === '.' && model || model[prop], []];
      },
      bindingToken: function(prop) {
        return prop;
      }
    }, {
      pattern: "{{ (" + RE_IDENTIFIER + ") }}$",
      wrapper: 'defaultVar',
      replaceWith: function(prop, model) {
        return [escapeHTML(prop === '.' && model || model[prop]), []];
      },
      bindingToken: function(prop) {
        return prop;
      }
    }
  ];

  bindRules = [
    {
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
    }, {
      pattern: "class = (" + RE_IDENTIFIER + ")",
      react: function(node, prop, model) {
        return function(val) {
          return (val && addClass || removeClass)(node, prop);
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
      pattern: "" + RE_IDENTIFIER,
      react: function(node) {
        return function(val) {
          return node.innerHTML = val;
        };
      }
    }
  ];

  jtmpl.compile = function(template, model, openTag, echoMode, options, asArrayItem) {
    var bindingToken, closing, contents, htagPos, match, pos, replaceWith, result, rule, slice, tag, tmpl, token, tokenizer, wrapperAttrs, _i, _len, _ref, _ref1, _ref2;
    tokenizer = regexp("{{ (\/?) (" + RE_ANYTHING + ") }}", options.delimiters);
    result = '';
    pos = 0;
    while ((token = tokenizer.exec(template))) {
      if (token[1]) {
        if (token[2] !== openTag) {
          throw new Error(openTag && (":( expected {{/" + openTag + "}}, got {{" + token[2] + "}}") || (":( unexpected {{/" + token[2] + "}}"));
        }
        return result + template.slice(pos, tokenizer.lastIndex - token[0].length);
      }
      slice = template.slice(Math.max(0, pos - 128), tokenizer.lastIndex);
      _ref = jtmpl.compileRules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        match = regexp(rule.pattern, options.delimiters).exec(slice);
        if (match) {
          result += template.slice(pos, tokenizer.lastIndex - match[0].length);
          htagPos = lastOpenedHTMLTag(result);
          bindingToken = rule.bindingToken.apply(rule, match.slice(1));
          if (rule.replaceWith != null) {
            if (echoMode) {
              result += (typeof rule.echoReplaceWith === "function" ? rule.echoReplaceWith.apply(rule, match.slice(1)) : void 0) || match[0];
            } else {
              _ref1 = rule.replaceWith.apply(rule, match.slice(1).concat([model])), replaceWith = _ref1[0], wrapperAttrs = _ref1[1];
              if (htagPos === -1 && (rule.wrapper != null)) {
                tag = options[rule.wrapper];
                result += injectTagBinding("<" + tag + ">" + replaceWith + "</" + tag + ">", bindingToken, wrapperAttrs);
              } else {
                result += replaceWith;
                result = result.slice(0, htagPos) + injectTagBinding(result.slice(htagPos), bindingToken, wrapperAttrs);
              }
            }
            pos = tokenizer.lastIndex;
          } else {
            tmpl = jtmpl.compile(template.slice(tokenizer.lastIndex), model, match[1], true, options);
            tokenizer.lastIndex += tmpl.length;
            closing = tokenizer.exec(template);
            pos = tokenizer.lastIndex;
            if (echoMode) {
              result += token[0] + tmpl + closing[0];
            } else {
              _ref2 = rule.contents(tmpl, model, match[1], options), contents = _ref2[0], wrapperAttrs = _ref2[1];
              if (htagPos === -1) {
                tag = options[rule.wrapper];
                result += injectTagBinding("<" + tag + ">" + contents + "</" + tag + ">", bindingToken, wrapperAttrs);
              } else {
                result = result.slice(0, htagPos) + injectTagBinding(result.slice(htagPos), bindingToken, wrapperAttrs) + contents.trim();
              }
            }
          }
          break;
        }
      }
    }
    result += template.slice(pos);
    if (options.asArrayItem) {
      if (isValidHTMLTag(result)) {
        return result;
      } else {
        tag = options.defaultSectionItem;
        return "<" + tag + ">" + result + "</" + tag + ">";
      }
    } else {
      return result;
    }
  };

  injectTagBinding = function(template, token, wrapperAttrs) {
    var attrLen, match, pair, pos;
    match = regexp("^ (" + RE_SPACE + " < " + RE_IDENTIFIER + ") (" + RE_ANYTHING + ") " + RE_DATA_JT).exec(template);
    attrLen = (match[3] || '').length;
    pos = match[1].length + match[2].length + attrLen;
    return template.slice(0, pos) + (token ? (attrLen ? (match[3].trim() === 'data-jt="' ? '' : ' ') + token : ' data-jt="' + token + '"') : '') + ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = wrapperAttrs.length; _i < _len; _i++) {
        pair = wrapperAttrs[_i];
        _results.push(" " + pair[0] + "=\"" + pair[1] + "\"");
      }
      return _results;
    })()).join('') + template.slice(pos);
  };

  lastOpenedHTMLTag = function(template) {
    return template.trimRight().search(regexp("< " + RE_IDENTIFIER + " [^>]*? >?$"));
  };

  isValidHTMLTag = function(contents) {
    return !!contents.trim().match(regexp("^<(" + RE_IDENTIFIER + ") " + RE_SPACE + "        [^>]*? > " + RE_ANYTHING + " </\\1>$ | < [^>]*? />$"));
  };

  jtmpl.bind = function(root, model) {
    var itemIndex, node, nodeContext, _i, _len, _ref;
    itemIndex = 0;
    nodeContext = null;
    _ref = root.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      switch (node.nodeType) {
        case node.ELEMENT_NODE:
          break;
        case node.COMMENT_NODE:
      }
    }
    return node;
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

  extend = function(obj, props) {
    var k, v;
    for (k in props) {
      v = props[k];
      obj[k] = v;
    }
    return obj;
  };

  escapeRE = function(s) {
    return (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  };

  regexp = function(src, delimiters) {
    src = src.replace(/\s+/g, '');
    return new RegExp((delimiters ? src.replace('{{', escapeRE(delimiters[0])).replace('}}', escapeRE(delimiters[1])) : src), 'g');
  };

  escapeHTML = function(val) {
    return ((val != null) && val || '').toString().replace(/[&"<>\\]/g, function(s) {
      return {
        '&': '&amp;',
        '\\': '\\\\',
        '"': '\"',
        '<': '&lt;',
        '>': '&gt;'
      }[s];
    });
  };

  multiReplace = function(template, from, to) {
    var find, i, _i, _len;
    for (i = _i = 0, _len = from.length; _i < _len; i = ++_i) {
      find = from[i];
      template = template.replace(regexp(escapeRE(find)), escapeRE(to[i]));
    }
    return template;
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
