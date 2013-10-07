
/* jtmpl, @author Atanas Minev, MIT license*/

(function() {
  var root;

  root = this;

  root.jtmpl = function(target, tpl, model, options) {
    var AP, addClass, addEvent, bind, compile, escapeHTML, hasClass, hre, html, matchHTMLTag, newTarget, parseTag, quoteRE, re, reId, removeClass, tagRe, triggerEvent, _ref;
    reId = /^\#[\w-]+$/;
    AP = Array.prototype;
    if ((target === null || typeof target === 'string') && (tpl == null)) {
      if (typeof document === "undefined" || document === null) {
        throw ':( this API is only available in a browser';
      }
      return AP.slice.call(document.querySelectorAll(target));
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
    hre = /(<\s*[\w-_]+)(?:\s+([\w-\{\}]*)(=)?("[^">]*"?)?)*?\s*(>)?\s*(?:<!--.*?-->\s*)*$/;
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
      var addSection, addSectionItem, discardSection, emitSectionTemplate, escaped, flush, fullTag, fullTagNoDelim, getPropString, htag, i, injectOuterTag, item, lastSectionTag, out, outpart, pos, section, tag, tagName, tagType, val, _i, _len, _ref1;
      pos = position || 0;
      out = outpart = '';
      tag = htag = lastSectionTag = null;
      tpl = tpl.replace(new RegExp("<!--\\s*(" + re.source + ")\\s*-->"), '$1');
      tpl = tpl.replace(new RegExp("([\\w-_]+)='(" + re.source + ")'", 'g'), '$1=$2');
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
          return out = "" + (out.slice(0, p)) + (m[2].length && ' ' || '') + t + (out.slice(p));
        } else {
          return out = "" + (out.slice(0, p)) + " data-jt=\"" + t + "\"" + (out.slice(p));
        }
      };
      emitSectionTemplate = function() {
        var section;
        section = tpl.slice(pos).match(new RegExp('([\\s\\S]*?)' + quoteRE(options.delimiters[0] + '/' + tagName + options.delimiters[1])));
        if (!section) {
          throw ":( unclosed section " + fullTag;
        }
        section = section[1].trim().replace(new RegExp(quoteRE(options.delimiters[0]), 'g'), options.compiledDelimiters[0]).replace(new RegExp(quoteRE(options.delimiters[1]), 'g'), options.compiledDelimiters[1]);
        return out += "<!-- " + tag[2] + " " + section + " -->";
      };
      addSectionItem = function(s) {
        var m, p;
        s = s.trim();
        m = s.match(matchHTMLTag);
        return out += !m ? "<" + options.defaultSectionItem + " data-jt=\".\">" + s + "</" + options.defaultSectionItem + ">" : (p = m[1].length + (m[3] && m[3].length || 0), "" + (s.slice(0, p)) + (!m[3] && ' data-jt="."' || ' .') + (s.slice(p)));
      };
      addSection = function(s, hidden) {
        var m, p;
        s = s.trim();
        m = s.match(matchHTMLTag);
        return out += !m ? "<" + options.defaultSection + " data-jt=\"" + fullTagNoDelim + "\"" + (hidden && ' style="display:none"' || '') + ">" + s + "</" + options.defaultSectionItem + ">" : (p = m[1].length, "" + (s.slice(0, p)) + " data-jt=\"" + fullTagNoDelim + "\"" + (hidden && ' style="display:none"' || '') + (s.slice(p)));
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
            val = context[tagName];
            if (typeof val !== 'object') {
              flush();
              section = compile(tpl, context, pos, tagName);
              addSection(section, !val);
              pos = re.lastIndex;
            } else if (!Array.isArray(val)) {
              flush();
              out += compile(tpl, val, pos, tagName);
              pos = re.lastIndex;
            } else {
              if (!htag) {
                if (tagName !== lastSectionTag) {
                  out += "<" + options.defaultSection + " data-jt=\"" + fullTagNoDelim + "\">";
                }
              } else {
                injectOuterTag();
              }
              emitSectionTemplate();
              if (!val.length) {
                discardSection();
                pos = re.lastIndex;
              } else {
                for (i = _i = 0, _len = val.length; _i < _len; i = ++_i) {
                  item = val[i];
                  flush();
                  addSectionItem(compile(tpl, (val && typeof val === 'object' ? item : context), pos, tagName));
                  if (i < val.length - 1) {
                    re.lastIndex = pos;
                  }
                }
                pos = re.lastIndex;
              }
              if (!htag && tagName !== lastSectionTag) {
                out += "</" + options.defaultSection + ">";
              }
              lastSectionTag = tagName;
            }
            break;
          case 'inverted_section':
            val = context[tagName];
            if (Array.isArray(val)) {
              if (!htag) {
                if (tagName !== lastSectionTag) {
                  out += "<" + options.defaultSection + " data-jt=\"" + fullTagNoDelim + "\">";
                }
              } else {
                injectOuterTag();
              }
              emitSectionTemplate();
              if (val.length) {
                discardSection();
              } else {
                out += compile(tpl, context, pos, tagName);
              }
              if (!htag && tagName !== lastSectionTag) {
                out += "</" + options.defaultSection + ">";
              }
              lastSectionTag = tagName;
            } else {
              addSection(compile(tpl, context, pos, tagName), val);
            }
            pos = re.lastIndex;
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
    bind = function(root, context) {
      var addBinding, addSectionBinding, bindArrayToNodeChildren, bindNode, changeHandler, createSectionItem, initBindings, itemIndex, node, nodeContext, optionHandler, radioHandler, section, _i, _len, _ref1;
      itemIndex = 0;
      nodeContext = null;
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
        var bindProp, i, item, _i, _len;
        if (!array.__values) {
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
            var _i, _len, _ref1;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            _ref1 = this.__nodes;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              node.removeChild(node.children[node.children.length - 1]);
            }
            AP.pop.apply(this, arguments);
            AP.pop.apply(this.__values, arguments);
            return this.__addEmpty();
          };
          array.push = function(item) {
            var len, result, _i, _len, _ref1;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            _ref1 = this.__nodes;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              node.appendChild(createSectionItem(node, item));
            }
            AP.push.apply(this, arguments);
            len = this.__values.length;
            result = AP.push.apply(this.__values, arguments);
            bindProp(item, len);
            return result;
          };
          array.reverse = function() {
            var i, item, result, _i, _j, _len, _len1, _ref1, _ref2;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            result = AP.reverse.apply(this.__values, arguments);
            _ref1 = this.__nodes;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              node.innerHTML = '';
              _ref2 = this.__values;
              for (i = _j = 0, _len1 = _ref2.length; _j < _len1; i = ++_j) {
                item = _ref2[i];
                node.appendChild(createSectionItem(node, item));
                bindProp(item, i);
              }
            }
            this.__addEmpty();
            return result;
          };
          array.shift = function() {
            var i, item, result, _i, _j, _len, _len1, _ref1, _ref2;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            AP.shift.apply(this, arguments);
            result = AP.shift.apply(this.__values, arguments);
            _ref1 = this.__nodes;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              node.removeChild(node.children[0]);
            }
            _ref2 = this.__values;
            for (i = _j = 0, _len1 = _ref2.length; _j < _len1; i = ++_j) {
              item = _ref2[i];
              bindProp(item, i);
            }
            this.__addEmpty();
            return result;
          };
          array.unshift = function() {
            var i, item, result, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            _ref1 = AP.slice.call(arguments).reverse();
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              item = _ref1[_i];
              _ref2 = this.__nodes;
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                node = _ref2[_j];
                node.insertBefore(createSectionItem(node, item), node.children[0]);
              }
            }
            AP.unshift.apply(this, arguments);
            result = AP.unshift.apply(this.__values, arguments);
            _ref3 = this.__values;
            for (i = _k = 0, _len2 = _ref3.length; _k < _len2; i = ++_k) {
              item = _ref3[i];
              bindProp(item, i);
            }
            this.__addEmpty();
            return result;
          };
          array.sort = function() {
            var i, item, result, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            AP.sort.apply(this, arguments);
            result = AP.sort.apply(this.__values, arguments);
            _ref1 = this.__nodes;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              node.innerHTML = '';
              for (i = _j = 0, _len1 = array.length; _j < _len1; i = ++_j) {
                item = array[i];
                _ref2 = this.__nodes;
                for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                  node = _ref2[_k];
                  node.appendChild(createSectionItem(node, item));
                }
                bindProp(item, i);
              }
            }
            this.__addEmpty();
            return result;
          };
          array.splice = function(index, howMany) {
            var i, item, _i, _j, _k, _len, _len1, _ref1, _ref2;
            this.__removeEmpty();
            this.__garbageCollectNodes();
            _ref1 = this.__nodes;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              node = _ref1[_i];
              for (i = _j = 0; 0 <= howMany ? _j < howMany : _j > howMany; i = 0 <= howMany ? ++_j : --_j) {
                node.removeChild(node.children[index]);
              }
              _ref2 = AP.slice.call(arguments, 2);
              for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
                item = _ref2[_k];
                node.insertBefore(createSectionItem(node, item), node.children[index]);
                bindProp(item, index);
              }
            }
            AP.splice.apply(this, arguments);
            AP.splice.apply(this.__values, arguments);
            return this.__addEmpty();
          };
          bindProp = function(item, i) {
            array.__values[i] = item;
            return Object.defineProperty(array, i, {
              get: function() {
                return this.__values[i];
              },
              set: function(val) {
                var _i, _len, _ref1, _results;
                this.__garbageCollectNodes();
                this.__values[i] = val;
                _ref1 = this.__nodes;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                  node = _ref1[_i];
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
                if (node[nodeProp] !== val) {
                  return node[nodeProp] = val;
                }
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
        return context["__" + prop + "_bindings"].push((function(context, node, prop, isNegative) {
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
              return node.style.display = !!val === isNegative && 'none' || '';
            }
          };
        })(context, node, prop, isNegative));
      };
      bindNode = function(node) {
        var attr, handler, jt, jtProps, k, section, sectionModifier, tmp, v, _i, _len, _ref1, _results;
        if (attr = node.getAttribute('data-jt')) {
          jtProps = attr.trim().split(' ').reverse();
          _results = [];
          for (_i = 0, _len = jtProps.length; _i < _len; _i++) {
            jt = jtProps[_i];
            sectionModifier = jt.slice(0, 1);
            if (sectionModifier === '#' || sectionModifier === '^') {
              section = jt.slice(1);
              nodeContext = nodeContext || context[section];
              if (Array.isArray(nodeContext)) {
                addSectionBinding(context, node, section, sectionModifier === '^');
                _results.push(bindArrayToNodeChildren(nodeContext, node));
              } else if (typeof nodeContext === 'object') {
                _results.push(addSectionBinding(nodeContext, node, section, sectionModifier === '^'));
              } else {
                _results.push(addSectionBinding(context, node, section, sectionModifier === '^'));
              }
            } else if (jt === '.') {
              _results.push(nodeContext = context[itemIndex++]);
            } else {
              _ref1 = jt.match(/(?:\/|#)?([\w-.]+)(?:\=([\w-.]+))?/), tmp = _ref1[0], k = _ref1[1], v = _ref1[2];
              if (k && k.indexOf('on') === 0) {
                handler = (options.rootModel != null) && options.rootModel[v] || model[v];
                if (typeof handler === 'function') {
                  _results.push(addEvent(k.slice(2), node, handler.bind(context)));
                } else {
                  throw ":( " + v + " is not a function, cannot attach event handler";
                }
              } else if (!v) {
                if (nodeContext && !Array.isArray(nodeContext)) {
                  _results.push(addBinding(nodeContext, node, k));
                } else {
                  _results.push(addBinding(context, node, k));
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
                  }
                  if (node.type === 'text') {
                    _results.push(addEvent('input', node, changeHandler(context, k, v).bind(node)));
                  } else {
                    _results.push(addEvent('change', node, changeHandler(context, k, v).bind(node)));
                  }
                } else {
                  _results.push(void 0);
                }
              }
            }
          }
          return _results;
        }
      };
      if (root === target) {
        bindNode(root, context);
      }
      _ref1 = root.childNodes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        node = _ref1[_i];
        switch (node.nodeType) {
          case node.ELEMENT_NODE:
            bindNode(node);
            bind(node, typeof nodeContext === 'object' && nodeContext || context);
            nodeContext = null;
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
