
/* jtmpl, @author Atanas Minev, MIT license*/

(function() {
  var root;

  root = this;

  root.jtmpl = function(target, tpl, model, options) {
    var addClass, addEvent, bind, compile, escapeHTML, hasClass, hre, html, matchHTMLTag, newTarget, parseTag, quoteRE, re, reId, removeClass, tagRe, triggerEvent, _ref;
    reId = /^\#[\w-]+$/;
    if ((target === null || typeof target === 'string') && (tpl == null)) {
      if (typeof document === "undefined" || document === null) {
        throw ':( this API is only available in a browser';
      }
      return Array.prototype.slice.call(document.querySelectorAll(target));
    }
    if (typeof target === 'string' && ((_ref = typeof tpl) === 'number' || _ref === 'string' || _ref === 'boolean' || _ref === 'object') && model === void 0) {
      options = model;
      model = tpl;
      tpl = target;
      target = void 0;
    }
    if (typeof target === 'string' && target.match(reId)) {
      target = document.getElementById(target.substring(1));
    }
    if (model == null) {
      throw ':( no model';
    }
    if (tpl.match && tpl.match(reId)) {
      tpl = document.getElementById(tpl.substring(1)).innerHTML;
    }
    quoteRE = function(s) {
      return (s + '').replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    };
    options = options || {};
    options.delimiters = (options.delimiters || '{{ }}').split(' ');
    options.compiledDelimiters = (options.compiledDelimiters || '<<< >>>').split(' ');
    options.defaultSection = options.defaultSectionTag || 'div';
    options.defaultSectionItem = options.defaultSectionItem || 'div';
    options.defaultVar = options.defaultVar || 'span';
    options.defaultTargetTag = options.defaultTargetTag || 'div';
    tagRe = /(\{)?(\#|\^|\/)?([\w\.\-_]+)(\})?/;
    re = new RegExp(quoteRE(options.delimiters[0]) + tagRe.source + quoteRE(options.delimiters[1]), 'g');
    hre = /(<\s*[\w-_]+)(?:\s+([\w-\{\}]*)(=)?(?:((?:"[^">]*"?)|(?:'[^'>]*'?)|[^\s>]+))?)*?\s*(>)?\s*(?:<!--.*?-->\s*)*$/;
    matchHTMLTag = /^(\s*<([\w-_]+))(?:(\s*data-jt="[^"]*)")?[^>]*>[\s\S]*?<\/\2>\s*$/;
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
    parseTag = function(tag) {
      return [
        (function() {
          switch (tag[2]) {
            case '/':
              return 'end';
            case '#':
              return 'section';
            case '^':
              return 'inverted_section';
            case void 0:
              if (tag[1] === '{') {
                return 'unescaped_var';
              } else {
                return 'var';
              }
            default:
              throw ':( internal error, tag ' + tag[0];
          }
        })(), tag[3], tag[0], (tag[2] || '') + tag[3]
      ];
    };
    addEvent = function(evnt, elem, func) {
      if (elem.addEventListener) {
        return elem.addEventListener(evnt, func, false);
      } else if (elem.attachEvent) {
        return elem.attachEvent('on' + evnt, func);
      } else {
        return elem[evnt] = func;
      }
    };
    triggerEvent = function(evnt, elem) {
      var event;
      if (typeof Event !== "undefined" && Event !== null) {
        return elem.dispatchEvent(new Event(evnt));
      } else if (document.createEvent) {
        event = document.createEvent('Event');
        event.initEvent(evnt, true, true);
        return elem.dispatchEvent(event);
      } else {
        event = document.createEventObject();
        return elem.fireEvent('on' + evnt, event);
      }
    };
    hasClass = function(el, name) {
      return new RegExp("(\\s|^)" + name + "(\\s|$)").test(el.className);
    };
    addClass = function(el, name) {
      if (!hasClass(el, name)) {
        return el.className += (el.className && ' ' || '') + name;
      }
    };
    removeClass = function(el, name) {
      if (hasClass(el, name)) {
        return el.className = el.className.replace(new RegExp("(\\s|^)" + name + "(\\s|$)"), '').replace(/^\s+|\s+$/g, '');
      }
    };
    compile = function(tpl, context, position, openTagName) {
      var addSectionItem, collection, discardSection, escaped, flush, fullTag, fullTagNoDelim, getPropString, htag, i, injectOuterTag, item, lastSectionTag, out, outpart, pos, section, tag, tagName, tagType, val, _i, _len, _ref1;
      pos = position || 0;
      out = outpart = '';
      tag = htag = lastSectionTag = null;
      tpl = tpl.replace(new RegExp("<!--\\s*(" + re.source + ")\\s*-->"), '$1');
      tpl = tpl.replace(new RegExp("([\\w-_]+)=\"(" + re.source + ")\"", 'g'), '$1=$2');
      tpl = tpl.replace(new RegExp("\\n\\s*(" + re.source + ")\\s*\\n", 'g'), '\n$1\n');
      flush = function() {
        out += tpl.slice(pos, re.lastIndex - (fullTag || '').length);
        return pos = re.lastIndex;
      };
      getPropString = function(val, quote) {
        quote = quote || '';
        return (htag[3] && !htag[5]) && (htag[2] + htag[3] + quote + val + quote) || val;
      };
      discardSection = function() {
        return compile(tpl, context, pos, tagName);
      };
      injectOuterTag = function() {
        var m, p, t;
        p = htag.index + htag[1].length + (outpart !== out && out.length - outpart.length || 0);
        t = "" + (getPropString(fullTagNoDelim));
        if (m = out.match(new RegExp("[\\s\\S]{" + p + "}(\\sdata-jt=\"([^\"]*))\""))) {
          p = p + m[1].length;
          out = "" + (out.slice(0, p)) + (m[2].length && ' ' || '') + t + (out.slice(p));
        } else {
          out = "" + (out.slice(0, p)) + " data-jt=\"" + t + "\"" + (out.slice(p));
        }
        return '';
      };
      addSectionItem = function(s) {
        var m, p;
        s = s.trim();
        m = s.match(matchHTMLTag);
        return out += !m ? "<" + options.defaultSectionItem + " data-jt=\".\">" + s + "</" + options.defaultSectionItem + ">" : (p = m[1].length + (m[3] && m[3].length || 0), "" + (s.slice(0, p)) + (!m[3] && ' data-jt="."' || ' .') + (s.slice(p)));
      };
      while (tag = re.exec(tpl)) {
        _ref1 = parseTag(tag), tagType = _ref1[0], tagName = _ref1[1], fullTag = _ref1[2], fullTagNoDelim = _ref1[3];
        flush();
        outpart = out.length > 300 && out.slice(-300) || out;
        htag = outpart.match(hre);
        switch (tagType) {
          case 'end':
            if (tagName !== openTagName) {
              throw (!openTagName ? ":( unexpected {{/" + tagName + "}}" : ":( expected {{/" + openTagName + "}}, got " + fullTag);
            }
            return out;
          case 'var':
          case 'unescaped_var':
            val = tagName === '.' ? context : context[tagName];
            escaped = tagType === 'unescaped_var' && val || escapeHTML(val);
            if (!htag) {
              out += "<" + options.defaultVar + " data-jt=\"" + fullTagNoDelim + "\">" + escaped + "</" + options.defaultVar + ">";
            } else {
              injectOuterTag();
              if (typeof val === 'function') {
                out = out.replace(/[\w-_]+=$/, '');
              } else {
                if (htag[2] === 'class') {
                  if (typeof val !== 'boolean') {
                    throw "" + tagName + " is not boolean";
                  }
                  if (val) {
                    out += tagName;
                  }
                } else if (htag[3] && !htag[5]) {
                  if ((val == null) || val === null) {
                    out = out.replace(/[\w-_]+=$/, '');
                  } else if (typeof val === 'boolean') {
                    out = out.replace(/[\w-_]+=$/, '') + (val && htag[2] || '');
                  } else {
                    out += '"' + val + '"';
                  }
                } else {
                  out += val;
                }
              }
            }
            break;
          case 'section':
          case 'inverted_section':
            if (!htag) {
              if (tagName !== lastSectionTag) {
                out += "<" + options.defaultSection + " data-jt=\"" + fullTagNoDelim + "\">";
              }
            } else {
              injectOuterTag();
            }
            val = context[tagName];
            section = tpl.slice(pos).match(new RegExp('([\\s\\S]*?)' + quoteRE(options.delimiters[0] + '/' + tagName + options.delimiters[1])));
            if (!section) {
              throw ":( unclosed section " + fullTag;
            }
            section = section[1].trim().replace(new RegExp(quoteRE(options.delimiters[0]), 'g'), options.compiledDelimiters[0]).replace(new RegExp(quoteRE(options.delimiters[1]), 'g'), options.compiledDelimiters[1]);
            out += "<!-- " + tag[2] + " " + section + " -->";
            if (tagType === 'section') {
              if (!val || Array.isArray(val) && !val.length) {
                discardSection();
                pos = re.lastIndex;
              } else {
                collection = Array.isArray(val) && val || [val];
                for (i = _i = 0, _len = collection.length; _i < _len; i = ++_i) {
                  item = collection[i];
                  flush();
                  addSectionItem(compile(tpl, (val && typeof val === 'object' ? item : context), pos, tagName));
                  if (i < collection.length - 1) {
                    re.lastIndex = pos;
                  }
                }
                pos = re.lastIndex;
              }
            } else if (tagType === 'inverted_section') {
              if (!val || Array.isArray(val) && !val.length) {
                out += compile(tpl, context, pos, tagName);
                pos = re.lastIndex;
              } else {
                discardSection(context);
                pos = re.lastIndex;
              }
            } else {
              throw ':( internal error';
            }
            if (!htag && tagName !== lastSectionTag) {
              out += "</" + options.defaultSection + ">";
            }
            lastSectionTag = tagName;
        }
      }
      out += tpl.slice(pos);
      return out = out.replace(/data-jt="\.(\s\.)+"/g, 'data-jt="."');
    };
    html = compile(tpl, model);
    if (target == null) {
      return html;
    }
    if (target.nodeName === 'SCRIPT') {
      newTarget = document.createElement(options.defaultTargetTag);
      target.parentNode.replaceChild(newTarget, target);
      target = newTarget;
    }
    target.innerHTML = html;
    target.setAttribute('data-jt', '.');
    bind = function(root, context) {
      var addBinding, addSectionBinding, attr, bindArrayToNodeChildren, changeHandler, createSectionItem, handler, initBindings, itemIndex, jt, jtProps, k, node, nodeContext, optionHandler, radioHandler, section, sectionModifier, tmp, v, _i, _j, _len, _len1, _ref1, _ref2;
      changeHandler = function(context, k, v) {
        return function() {
          return context[v] = this[k];
        };
      };
      radioHandler = function(context, k, v) {
        return function() {
          var input, _i, _len, _ref1;
          if (this[k]) {
            _ref1 = jtmpl("input[type=radio][name=" + this.name + "]");
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              input = _ref1[_i];
              if (input !== this) {
                triggerEvent('change', input);
              }
            }
          }
          return context[v] = this[k];
        };
      };
      optionHandler = function(context, k, v) {
        return function() {
          var idx, option, _i, _len, _ref1, _results;
          idx = 0;
          _ref1 = this.children;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            option = _ref1[_i];
            if (option.nodeName === 'OPTION') {
              context[idx][v] = option.selected;
              _results.push(idx++);
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        };
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
              var reactor, _i, _len, _ref1, _results;
              this["__" + prop] = val;
              _ref1 = this["__" + prop + "_bindings"];
              _results = [];
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                reactor = _ref1[_i];
                _results.push(reactor.call(this, val));
              }
              return _results;
            }
          });
        }
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
      bindArrayToNodeChildren = function(array, node) {
        var i, item, _fn, _i, _len;
        array.pop = function() {
          return Array.prototype.pop.call(this, arguments);
        };
        array.push = function() {
          return Array.prototype.push.call(this, arguments);
        };
        array.reverse = function() {
          return Array.prototype.reverse.call(this, arguments);
        };
        array.shift = function() {
          return Array.prototype.shift.call(this, arguments);
        };
        array.unshift = function() {
          return Array.prototype.unshift.call(this, arguments);
        };
        array.sort = function() {
          return Array.prototype.sort.call(this, arguments);
        };
        array.splice = function() {
          return Array.prototype.splice.call(this, arguments);
        };
        _fn = function(item, i) {
          Object.defineProperty(array, "__" + i, {
            enumerable: false,
            writable: true,
            value: item
          });
          return Object.defineProperty(array, i, {
            get: function() {
              return this["__" + i];
            },
            set: function(val) {
              this["__" + i] = val;
              return node.replaceChild(createSectionItem(node, val), node.children[i]);
            }
          });
        };
        for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
          item = array[i];
          _fn(item, i);
        }
        return array;
      };
      addBinding = function(context, node, prop, nodeProp) {
        if (typeof context !== 'object') {
          return;
        }
        initBindings(context, prop);
        if (!nodeProp) {
          return context["__" + prop + "_bindings"].push((function(node) {
            return function(val) {
              return node.innerHTML = val;
            };
          })(node));
        } else if (nodeProp === 'class') {
          return context["__" + prop + "_bindings"].push((function(node, prop) {
            return function(val) {
              return (val && addClass || removeClass)(node, prop);
            };
          })(node, prop));
        } else {
          return context["__" + prop + "_bindings"].push((function(node, prop, nodeProp) {
            return function(val) {
              if (nodeProp === 'value' || nodeProp === 'checked' || nodeProp === 'selected') {
                return node[nodeProp] = val;
              } else {
                if ((typeof val === 'boolean' && !val) || val === null) {
                  return node.removeAttribute(nodeProp);
                } else {
                  return node.setAttribute(nodeProp, val);
                }
              }
            };
          })(node, prop, nodeProp));
        }
      };
      addSectionBinding = function(context, node, prop, isNegative) {
        initBindings(context, prop);
        return context["__" + prop + "_bindings"].push((function(node, prop, isNegative) {
          return function(val) {
            var i, item, _i, _len, _results;
            if (Array.isArray(val)) {
              bindArrayToNodeChildren(val, node);
              node.innerHTML = !val.length ? jtmpl(node.getAttribute('data-jt-0') || '', {}) : '';
              _results = [];
              for (i = _i = 0, _len = val.length; _i < _len; i = ++_i) {
                item = val[i];
                initBindings(val, i);
                _results.push(node.appendChild(createSectionItem(node, item)));
              }
              return _results;
            } else if (typeof val === 'object') {
              node.innerHTML = jtmpl(node.getAttribute('data-jt-1') || '', val);
              return jtmpl(node, node.innerHTML, val, {
                rootModel: model
              });
            } else {
              node.innerHTML = jtmpl(node.getAttribute(!!val ? 'data-jt-1' : 'data-jt-0') || '', this);
              return jtmpl(node, node.innerHTML, val, {
                rootModel: model
              });
            }
          };
        })(node, prop, isNegative));
      };
      itemIndex = 0;
      nodeContext = null;
      _ref1 = root.childNodes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        node = _ref1[_i];
        switch (node.nodeType) {
          case node.ELEMENT_NODE:
            if (attr = node.getAttribute('data-jt')) {
              jtProps = attr.trim().split(' ').sort();
              for (_j = 0, _len1 = jtProps.length; _j < _len1; _j++) {
                jt = jtProps[_j];
                sectionModifier = jt.slice(0, 1);
                if (sectionModifier === '#' || sectionModifier === '^') {
                  section = jt.slice(1);
                  nodeContext = context[section];
                  addSectionBinding(context, node, section, sectionModifier === '^');
                  if (Array.isArray(nodeContext)) {
                    bindArrayToNodeChildren(nodeContext, node);
                  }
                } else if (jt === '.') {
                  nodeContext = context[itemIndex++] || context;
                } else {
                  _ref2 = jt.match(/(?:\/|#)?([\w-.]+)(?:\=([\w-.]+))?/), tmp = _ref2[0], k = _ref2[1], v = _ref2[2];
                  if (k && k.indexOf('on') === 0) {
                    handler = (options.rootModel != null) && options.rootModel[v] || model[v];
                    if (typeof handler === 'function') {
                      addEvent(k.slice(2), node, handler.bind(context));
                    } else {
                      throw ":( " + v + " is not a function, cannot attach event handler";
                    }
                  } else if (!v) {
                    if (nodeContext && !Array.isArray(nodeContext)) {
                      addBinding(nodeContext, node, k);
                    } else {
                      addBinding(context, node, k);
                    }
                  } else {
                    if (nodeContext && !Array.isArray(nodeContext)) {
                      addBinding(nodeContext, node, v, k);
                    } else {
                      addBinding(context, node, v, k);
                    }
                    if (k === 'value' || k === 'checked' || k === 'selected') {
                      if (node.nodeName === 'OPTION' && node.parentNode.querySelectorAll('option')[0] === node) {
                        addEvent('change', node.parentNode, optionHandler(context, k, v).bind(node.parentNode));
                      }
                      if (node.type === 'radio' && node.name) {
                        addEvent('change', node, radioHandler(context, k, v).bind(node));
                      } else {
                        addEvent('change', node, changeHandler(context, k, v).bind(node));
                      }
                    }
                  }
                }
              }
            }
            bind(node, nodeContext || context);
            break;
          case node.COMMENT_NODE:
            if (section = node.nodeValue.trim().match(/^(#|\^)\s([\s\S]*)$/)) {
              section[2] = section[2].replace(new RegExp(quoteRE(options.compiledDelimiters[0]), 'g'), options.delimiters[0]).replace(new RegExp(quoteRE(options.compiledDelimiters[1]), 'g'), options.delimiters[1]);
              if (section[1] === '#') {
                root.setAttribute('data-jt-1', section[2]);
              } else {
                root.setAttribute('data-jt-0', section[2]);
              }
            }
        }
      }
      return node;
    };
    return bind(target, model);
  };

}).call(this);
