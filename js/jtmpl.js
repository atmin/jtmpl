(function() {
  var RE_ANYTHING, RE_COLLECTION_TEMPLATE, RE_DATA_JT, RE_IDENTIFIER, RE_NODE_ID, RE_SPACE, addClass, ap, bindArrayToNodeChildren, createSectionItem, escapeHTML, escapeRE, hasClass, injectAttributes, injectTagBinding, isValidHTMLTag, jtmpl, lastOpenedHTMLTag, multiReplace, propChange, regexp, removeClass;

  jtmpl = (typeof exports !== "undefined" && exports !== null ? exports : this).jtmpl = function(target, template, model, options) {
    var delimiters, html, newTarget, _ref;
    if ((target === null || typeof target === 'string') && (template == null)) {
      if (typeof document === "undefined" || document === null) {
        throw new Error(':( this API is only available in a browser');
      }
      return ap.slice.call(document.querySelectorAll(target));
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
    options.compiledDelimiters = (options.compiledDelimiters || '#{ }#').split(' ');
    options.defaultSection = options.defaultSectionTag || 'div';
    options.defaultSectionItem = options.defaultSectionItem || 'div';
    options.defaultVar = options.defaultVar || 'span';
    options.defaultTargetTag = options.defaultTargetTag || 'div';
    delimiters = options.delimiters;
    template = ('' + template).replace(regexp("{{{ (" + RE_IDENTIFIER + ") }}}"), delimiters[0] + '&$1' + delimiters[1]).replace(regexp("<!-- " + RE_SPACE + " ({{ " + RE_ANYTHING + " }}) " + RE_SPACE + " -->", delimiters), '$1').replace(regexp("(" + RE_IDENTIFIER + ")='({{ " + RE_IDENTIFIER + " }})'", delimiters), '$1=$2').replace(regexp("(" + RE_IDENTIFIER + ")=\"({{ " + RE_IDENTIFIER + " }})\"", delimiters), '$1=$2').replace(regexp("\\n " + RE_SPACE + " ({{ " + RE_ANYTHING + " }}) " + RE_SPACE + " \\n", delimiters), '\n$1\n');
    html = jtmpl.compile(template, model, null, false, options).trim();
    if (!target) {
      return html;
    }
    if (target.nodeName === 'SCRIPT') {
      newTarget = document.createElement(options.defaultTargetTag);
      target.parentNode.replaceChild(newTarget, target);
      target = newTarget;
    }
    target.innerHTML = html;
    options.rootModel = model;
    return jtmpl.bind(target, model, options);
  };

  RE_IDENTIFIER = '[\\w\\.\\-]+';

  RE_NODE_ID = '^#[\\w\\.\\-]+$';

  RE_ANYTHING = '[\\s\\S]*?';

  RE_SPACE = '\\s*';

  RE_DATA_JT = '(?: ( \\s* data-jt = " [^"]* )" )?';

  RE_COLLECTION_TEMPLATE = /^(#|\^)\s([\s\S]*)$/;

  jtmpl.preprocessingRules = [
    {
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
      lastTag: function(model, section) {
        if (Array.isArray(model[section])) {
          return section;
        } else {
          return null;
        }
      },
      contents: function(template, model, section, options) {
        var val;
        val = model[section];
        if (Array.isArray(val)) {
          return [!val.length ? jtmpl(template, model) : '', [['data-jt-0', multiReplace(template.trim(), options.delimiters, options.compiledDelimiters)]]];
        } else {
          return [jtmpl(template, model), val ? [['style', 'display:none']] : []];
        }
      },
      bindingToken: function(section) {
        return "^" + section;
      }
    }, {
      pattern: "{{ \\# (" + RE_IDENTIFIER + ") }}$",
      lastTag: function(model, section) {
        if (Array.isArray(model[section])) {
          return section;
        } else {
          return null;
        }
      },
      wrapper: 'defaultSection',
      contents: function(template, model, section, options) {
        var item, val;
        val = model[section];
        if (Array.isArray(val)) {
          return [
            ((function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = val.length; _i < _len; _i++) {
                item = val[_i];
                _results.push(jtmpl(template, item, null, {
                  asArrayItem: true
                }));
              }
              return _results;
            })()).join(''), [['data-jt-1', multiReplace(template.trim(), options.delimiters, options.compiledDelimiters)]]
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

  jtmpl.bindRules = [
    {
      pattern: "(value | checked | selected) = (" + RE_IDENTIFIER + ")",
      bindTo: function(attr, prop) {
        return prop;
      },
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
      pattern: "on(" + RE_IDENTIFIER + ") = (" + RE_IDENTIFIER + ")",
      react: function(node, evnt, listener, model, options) {
        var handler, _ref;
        handler = (options != null ? (_ref = options.rootModel) != null ? _ref[listener] : void 0 : void 0) || model[listener];
        if (typeof handler === 'function') {
          node.addEventListener(evnt, handler.bind(model));
        } else {
          throw ":( " + listener + " is not a function, cannot attach event handler";
        }
        return null;
      }
    }, {
      pattern: "class = (" + RE_IDENTIFIER + ")",
      bindTo: function(prop) {
        return prop;
      },
      react: function(node, prop, model) {
        return function(val) {
          return (val && addClass || removeClass)(node, prop);
        };
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ") = " + RE_IDENTIFIER,
      bindTo: function(attr, prop) {
        return prop;
      },
      react: function(node, attr) {
        return function(val) {
          if (node[attr] !== val) {
            return node[attr] = val;
          }
        };
      }
    }, {
      pattern: "(# | \\^) (" + RE_IDENTIFIER + ")",
      bindTo: function(sectionType, prop) {
        return prop;
      },
      recurseContext: function(sectionType, attr, model) {
        var val;
        val = model[attr];
        if (Array.isArray(val)) {
          console.log('no recurseContext');
          return null;
        } else if (typeof val === 'object') {
          console.log('recurseContext: ' + attr);
          return val;
        } else {
          console.log('recurseContext: model');
          return model;
        }
      },
      react: function(node, sectionType, attr, model, options) {
        var child, i, val, _i, _len, _ref;
        val = model[attr];
        console.log("react sectionType=" + sectionType + " attr=" + attr + " val=" + val);
        if (Array.isArray(val) && sectionType === '#') {
          console.log('binding collection items');
          _ref = node.children;
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            child = _ref[i];
            jtmpl.bind(child, val[i], options);
          }
        }
        return function(val) {
          var item, _j, _len1, _results;
          if (Array.isArray(val)) {
            jtmpl.bindArrayToNodeChildren(val, node);
            node.innerHTML = !val.length ? jtmpl(multiReplace(node.getAttribute('data-jt-0') || '', options.compiledDelimiters, options.delimiters), {}) : '';
            _results = [];
            for (_j = 0, _len1 = val.length; _j < _len1; _j++) {
              item = val[_j];
              _results.push(node.appendChild(jtmpl.createSectionItem(node, item)));
            }
            return _results;
          } else if (typeof val === 'object') {
            node.innerHTML = jtmpl(multiReplace(node.getAttribute('data-jt-1') || '', options.compiledDelimiters, options.delimiters), val);
            return jtmpl(node, node.innerHTML, val, {
              rootModel: model
            });
          } else {
            return node.style.display = (!val !== (sectionType === '^')) && 'none' || '';
          }
        };
      }
    }, {
      pattern: "(" + RE_IDENTIFIER + ")",
      bindTo: function(prop) {
        return prop;
      },
      react: function(node) {
        return function(val) {
          return node.innerHTML = val;
        };
      }
    }
  ];

  jtmpl.compile = function(template, model, openTag, echoMode, options, asArrayItem) {
    var bindingToken, closing, contents, htagPos, lastSectionHTagPos, lastSectionTag, match, pos, replaceWith, result, rule, section, slice, tag, tmpl, token, tokenizer, wrapperAttrs, _i, _len, _ref, _ref1, _ref2;
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
                result += injectAttributes(injectTagBinding("<" + tag + ">" + replaceWith + "</" + tag + ">", bindingToken), wrapperAttrs);
              } else {
                result += replaceWith;
                result = result.slice(0, htagPos) + injectAttributes(injectTagBinding(result.slice(htagPos), bindingToken), wrapperAttrs);
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
              section = match[1];
              _ref2 = rule.contents(tmpl, model, section, options), contents = _ref2[0], wrapperAttrs = _ref2[1];
              if (htagPos === -1) {
                tag = options[rule.wrapper];
                if (section !== lastSectionTag) {
                  lastSectionHTagPos = result.length;
                  result += injectAttributes(injectTagBinding("<" + tag + ">" + contents + "</" + tag + ">", bindingToken), wrapperAttrs);
                } else {
                  result = result.slice(0, lastSectionHTagPos) + injectAttributes(injectTagBinding(result.slice(lastSectionHTagPos), bindingToken), wrapperAttrs, contents.trim());
                }
              } else {
                result = result.slice(0, htagPos) + injectAttributes(injectTagBinding(result.slice(htagPos), bindingToken), wrapperAttrs) + contents.trim();
                lastSectionHTagPos = htagPos;
              }
              lastSectionTag = (typeof rule.lastTag === "function" ? rule.lastTag(model, section) : void 0) || null;
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

  injectTagBinding = function(template, token) {
    var attrLen, match, pos;
    match = regexp("^ (" + RE_SPACE + " < " + RE_IDENTIFIER + ") (" + RE_ANYTHING + ") " + RE_DATA_JT).exec(template);
    attrLen = (match[3] || '').length;
    pos = match[1].length + match[2].length + attrLen;
    return template.slice(0, pos) + (attrLen ? (match[3].trim() === 'data-jt="' ? '' : ' ') + token : ' data-jt="' + token + '"') + template.slice(pos);
  };

  injectAttributes = function(template, attributes, contents) {
    var match, pair, pos;
    if (!attributes.length) {
      return template;
    }
    match = regexp("^ (" + RE_SPACE + " < " + RE_IDENTIFIER + " " + RE_ANYTHING + ")>").exec(template);
    pos = match[1].length;
    return template.slice(0, pos) + [
      (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = attributes.length; _i < _len; _i++) {
          pair = attributes[_i];
          _results.push(" " + pair[0] + "=\"" + (pair[1].replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;')) + "\"");
        }
        return _results;
      })()
    ].join('') + '>' + (contents || '') + template.slice(pos + 1);
  };

  lastOpenedHTMLTag = function(template) {
    return template.trimRight().search(regexp("< " + RE_IDENTIFIER + " [^>]*? >?$"));
  };

  isValidHTMLTag = function(contents) {
    return !!contents.trim().match(regexp("^<(" + RE_IDENTIFIER + ") " + RE_SPACE + "        [^>]*? > " + RE_ANYTHING + " </\\1>$ | < [^>]*? />$"));
  };

  jtmpl.bind = function(root, model, options) {
    var data_jt, jt, match, node, prop, reactor, recurseContext, rule, _i, _len, _ref, _results;
    _ref = root.children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if (data_jt = node.getAttribute('data-jt')) {
        _results.push((function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = data_jt.trim().split(' ');
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            jt = _ref1[_j];
            _results1.push((function() {
              var _k, _len2, _ref2, _results2;
              _ref2 = jtmpl.bindRules;
              _results2 = [];
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                rule = _ref2[_k];
                if (match = regexp(rule.pattern).exec(jt)) {
                  console.log(match[0]);
                  reactor = rule.react.apply(rule, [node].concat(match.slice(1), [model, options]));
                  prop = typeof rule.bindTo === "function" ? rule.bindTo.apply(rule, match.slice(1)) : void 0;
                  propChange(model, prop, reactor);
                  recurseContext = typeof rule.recurseContext === "function" ? rule.recurseContext.apply(rule, match.slice(1).concat([model])) : void 0;
                  if (recurseContext !== null) {
                    console.log('recurse');
                    jtmpl.bind(node, recurseContext || model, options);
                  }
                  break;
                } else {
                  _results2.push(void 0);
                }
              }
              return _results2;
            })());
          }
          return _results1;
        })());
      } else {
        console.log('recurse');
        _results.push(jtmpl.bind(node, model, options));
      }
    }
    return _results;
  };

  ap = Array.prototype;

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
      template = template.replace(regexp(escapeRE(find)), to[i]);
    }
    return template;
  };

  jtmpl.createSectionItem = createSectionItem = function(parent, context) {
    var element;
    element = document.createElement('body');
    element.innerHTML = jtmpl(multiReplace(node.getAttribute('data-jt-1') || '', options.compiledDelimiters, options.delimiters), context);
    element = element.children[0];
    jtmpl(element, element.innerHTML, context, {
      rootModel: model
    });
    return element;
  };

  jtmpl.hasClass = hasClass = function(el, name) {
    return new RegExp("(\\s|^)" + name + "(\\s|$)").test(el.className);
  };

  jtmpl.addClass = addClass = function(el, name) {
    if (!hasClass(el, name)) {
      return el.className += (el.className && ' ' || '') + name;
    }
  };

  jtmpl.removeClass = removeClass = function(el, name) {
    if (hasClass(el, name)) {
      return el.className = el.className.replace(new RegExp("(\\s|^)" + name + "(\\s|$)"), '').replace(/^\s+|\s+$/g, '');
    }
  };

  propChange = function(obj, prop, callback) {
    var oldDescriptor;
    if (!(obj && prop && callback)) {
      return;
    }
    oldDescriptor = Object.getOwnPropertyDescriptor(obj, prop) || Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop);
    return Object.defineProperty(obj, prop, {
      get: oldDescriptor.get || function() {
        return oldDescriptor.value;
      },
      set: (function(val) {
        (typeof oldDescriptor.set === "function" ? oldDescriptor.set(val) : void 0) || (oldDescriptor.value = val);
        return callback(val);
      }),
      configurable: true
    });
  };

  jtmpl.bindArrayToNodeChildren = bindArrayToNodeChildren = function(array, node) {
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
          return node.innerHTML = jtmpl(multiReplace(node.getAttribute('data-jt-0') || '', options.compiledDelimiters, options.delimiters), {});
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
        ap.pop.apply(this, arguments);
        ap.pop.apply(this.__values, arguments);
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
        ap.push.apply(this, arguments);
        len = this.__values.length;
        result = ap.push.apply(this.__values, arguments);
        bindProp(item, len);
        return result;
      };
      array.reverse = function() {
        var i, item, result, _i, _j, _len, _len1, _ref, _ref1;
        this.__removeEmpty();
        this.__garbageCollectNodes();
        result = ap.reverse.apply(this.__values, arguments);
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
        ap.shift.apply(this, arguments);
        result = ap.shift.apply(this.__values, arguments);
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
        _ref = ap.slice.call(arguments).reverse();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _ref1 = this.__nodes;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            node = _ref1[_j];
            node.insertBefore(createSectionItem(node, item), node.children[0]);
          }
        }
        ap.unshift.apply(this, arguments);
        result = ap.unshift.apply(this.__values, arguments);
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
        ap.sort.apply(this, arguments);
        result = ap.sort.apply(this.__values, arguments);
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
          _ref1 = ap.slice.call(arguments, 2);
          for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
            item = _ref1[_k];
            node.insertBefore(createSectionItem(node, item), node.children[index]);
            bindProp(item, index);
          }
        }
        ap.splice.apply(this, arguments);
        ap.splice.apply(this.__values, arguments);
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
