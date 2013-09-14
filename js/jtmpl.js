
/* jtmpl, @author Atanas Minev, MIT license*/

(function() {
  var root;

  root = this;

  root.jtmpl = function(target, tpl, model, options) {
    var addClass, addEvent, bind, compile, escapeHTML, hasClass, hre, html, matchHTMLTag, parseTag, quoteRE, re, reId, removeClass, tagRe, triggerEvent, _ref;
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
                  if (val === null) {
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
    target.innerHTML = html;
    target.setAttribute('data-jt', '.');
    bind = function(root, context, depth) {
      var attr, attributeReact, bindProps, bindings, changeHandler, classReact, contextObserver, handler, initSlot, innerHTMLReact, itemIndex, jt, jtProps, k, node, nodeContext, optionHandler, propBindings, radioHandler, section, sectionReact, tmp, v, val, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
      initSlot = function(ctx, prop) {
        if (ctx._jt_bind == null) {
          ctx._jt_bind = {};
        }
        if (ctx._jt_bind[prop] == null) {
          ctx._jt_bind[prop] = [];
        }
        return ctx._jt_bind[prop];
      };
      bindProps = function(context) {
        var k, v, _results;
        if (context._jt_bind != null) {
          if (context._jt_bind['.'] && context._jt_bind['.'].length) {
            Object.observe(context, context._jt_bind['.'][0]);
          } else {
            Object.observe(context, contextObserver(context._jt_bind));
          }
          delete context._jt_bind;
        }
        _results = [];
        for (k in context) {
          v = context[k];
          if (typeof v === 'object') {
            _results.push(bindProps(v));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      contextObserver = function(bindings) {
        return function(changes) {
          var b, change, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = changes.length; _i < _len; _i++) {
            change = changes[_i];
            if (change.type === 'updated' && (bindings[change.name] != null)) {
              _results.push((function() {
                var _j, _len1, _ref1, _results1;
                _ref1 = bindings[change.name];
                _results1 = [];
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  b = _ref1[_j];
                  _results1.push(b(change));
                }
                return _results1;
              })());
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        };
      };
      innerHTMLReact = function(change) {
        return this.innerHTML = change.object[change.name];
      };
      classReact = function(change) {
        return (change.object[change.name] && addClass || removeClass)(this, change.name);
      };
      attributeReact = function(attr) {
        return function(change) {
          var newVal;
          newVal = change.object[change.name];
          if (attr === 'value' || attr === 'checked' || attr === 'selected') {
            return this[attr] = newVal;
          } else {
            if ((typeof newVal === 'boolean' && !newVal) || newVal === null) {
              return this.removeAttribute(attr);
            } else {
              return this.setAttribute(attr, newVal);
            }
          }
        };
      };
      sectionReact = function(oldVal) {
        return function(changes) {
          var deleted, element, i, idx, inserted, item, tmp, val, _i, _j, _k, _l, _len, _len1, _len2, _len3;
          if (Array.isArray(oldVal)) {
            val = changes[0].object;
            deleted = [];
            for (i = _i = 0, _len = oldVal.length; _i < _len; i = ++_i) {
              item = oldVal[i];
              if (val.indexOf(item) < 0) {
                deleted.push(i);
              }
            }
            inserted = [];
            for (i = _j = 0, _len1 = val.length; _j < _len1; i = ++_j) {
              item = val[i];
              if (oldVal.indexOf(item) < 0) {
                inserted.push(i);
              }
            }
            if (deleted.length || inserted.length) {
              console.log("old: " + oldVal + "\nnew: " + val + "\ndeleted: " + deleted + "\ninserted: " + inserted);
            }
            for (_k = 0, _len2 = deleted.length; _k < _len2; _k++) {
              idx = deleted[_k];
              element = this.children[idx];
              this.removeChild(element);
            }
            for (_l = 0, _len3 = inserted.length; _l < _len3; _l++) {
              idx = inserted[_l];
              tmp = document.createElement('div');
              tmp.innerHTML = jtmpl(this.getAttribute('data-jt-1'), val[idx]);
              element = tmp.children[0];
              jtmpl(element, element.innerHTML, val[idx], {
                rootModel: model
              });
              this.insertBefore(element, this.children[idx]);
            }
            return oldVal = val.slice() || oldVal;
          } else {
            val = changes.object[changes.name];
            jtmpl(this, this.getAttribute("data-jt-" + (val && 1 || 0)) || '', changes.object);
            return oldVal = val;
          }
        };
      };
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
        var changing;
        changing = false;
        return function() {
          var idx, option, _i, _len, _ref1;
          if (changing) {
            return;
          }
          changing = true;
          idx = 0;
          _ref1 = this.children;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            option = _ref1[_i];
            if (option.nodeName === 'OPTION') {
              context[idx][v] = option.selected;
              idx++;
            }
          }
          return changing = false;
        };
      };
      itemIndex = 0;
      nodeContext = null;
      bindings = {};
      depth = depth || 0;
      _ref1 = root.childNodes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        node = _ref1[_i];
        switch (node.nodeType) {
          case node.ELEMENT_NODE:
            if (attr = node.getAttribute('data-jt')) {
              jtProps = attr.trim().split(' ').sort();
              for (_j = 0, _len1 = jtProps.length; _j < _len1; _j++) {
                jt = jtProps[_j];
                if ((_ref2 = jt.slice(0, 1)) === '#' || _ref2 === '^') {
                  val = jt.slice(1);
                  nodeContext = context[val];
                  if (Array.isArray(nodeContext)) {
                    initSlot(nodeContext, '.').push(sectionReact(nodeContext.slice()).bind(node));
                  }
                  initSlot(context, val).push(sectionReact(nodeContext).bind(node));
                } else if (jt === '.') {
                  nodeContext = context[itemIndex++] || context;
                  if (typeof nodeContext !== 'object') {
                    nodeContext = null;
                  }
                } else {
                  _ref3 = jt.match(/(?:\/|#)?([\w-.]+)(?:\=([\w-.]+))?/), tmp = _ref3[0], k = _ref3[1], v = _ref3[2];
                  propBindings = initSlot((typeof nodeContext === 'object' && !Array.isArray(nodeContext)) && nodeContext || context, v || k);
                  if (k && k.indexOf('on') === 0) {
                    handler = (options.rootModel != null) && options.rootModel[v] || model[v];
                    if (typeof handler === 'function') {
                      addEvent(k.slice(2), node, handler.bind(context));
                    } else {
                      throw ":( " + v + " is not a function, cannot attach event handler";
                    }
                  } else if (!v) {
                    propBindings.push(innerHTMLReact.bind(node));
                  } else if (k === 'class') {
                    propBindings.push(classReact.bind(node));
                  } else {
                    propBindings.push(attributeReact(k).bind(node));
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
            bind(node, nodeContext || context, depth + 1);
            break;
          case node.TEXT_NODE:
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
            break;
          default:
            throw ":( unexpected nodeType " + node.nodeType;
        }
      }
      if (!depth) {
        return bindProps(context);
      }
    };
    return bind(target, model);
  };

}).call(this);








/*
  Tested against Chromium build with Object.observe and acts EXACTLY the same,
  though Chromium build is MUCH faster

  Trying to stay as close to the spec as possible,
  this is a work in progress, feel free to comment/update
  
  Specification:
    http://wiki.ecmascript.org/doku.php?id=harmony:observe

  Built using parts of:
    https://github.com/tvcutsem/harmony-reflect/blob/master/examples/observer.js

  Limits so far;
    Built using polling... Will update again with polling/getter&setters to make things better at some point
*/
"use strict";
if(!Object.observe){
  (function(extend, global){
    var isCallable = (function(toString){
        var s = toString.call(toString),
            u = typeof u;
        return typeof global.alert === "object" ?
          function(f){
            return s === toString.call(f) || (!!f && typeof f.toString == u && typeof f.valueOf == u && /^\s*\bfunction\b/.test("" + f));
          }:
          function(f){
            return s === toString.call(f);
          }
        ;
    })(extend.prototype.toString);
    var isNumeric=function(n){
      return !isNaN(parseFloat(n)) && isFinite(n);
    };
    var sameValue = function(x, y){
      if(x===y){
        return x !== 0 || 1 / x === 1 / y;
      }
      return x !== x && y !== y;
    };
    var isAccessorDescriptor = function(desc){
      if (typeof(desc) === 'undefined'){
        return false;
      }
      return ('get' in desc || 'set' in desc);
    };
    var isDataDescriptor = function(desc){
      if (typeof(desc) === 'undefined'){
        return false;
      }
      return ('value' in desc || 'writable' in desc);
    };
      
    var validateArguments = function(O, callback){
      if(typeof(O)!=='object'){
        // Throw Error
        throw new TypeError("Object.observeObject called on non-object");
      }
      if(isCallable(callback)===false){
        // Throw Error
        throw new TypeError("Object.observeObject: Expecting function");
      }
      if(Object.isFrozen(callback)===true){
        // Throw Error
        throw new TypeError("Object.observeObject: Expecting unfrozen function");
      }
    };

    var Observer = (function(){
      var wraped = [];
      var Observer = function(O, callback){
        validateArguments(O, callback);
        Object.getNotifier(O).addListener(callback);
        if(wraped.indexOf(O)===-1){
          wraped.push(O);
        }else{
          Object.getNotifier(O)._checkPropertyListing();
        }
      };
      
      Observer.prototype.deliverChangeRecords = function(O){
        Object.getNotifier(O).deliverChangeRecords();
      };
      
      wraped.lastScanned = 0;
      var f = (function(wrapped){
              return function(){
                var i = 0, l = wrapped.length, startTime = new Date(), takingTooLong=false;
                for(i=wrapped.lastScanned; (i<l)&&(!takingTooLong); i++){
                  Object.getNotifier(wrapped[i])._checkPropertyListing();
                  takingTooLong=((new Date())-startTime)>100; // make sure we don't take more than 100 milliseconds to scan all objects
                }
                wrapped.lastScanned=i<l?i:0; // reset wrapped so we can make sure that we pick things back up
                setTimeout(f, 100);
              };
            })(wraped);
      setTimeout(f, 100);
      
      return Observer;
    })();
    
    var Notifier = function(watching){
    var _listeners = [], _updates = [], _updater = false, properties = [], values = [];
      var self = this;
      Object.defineProperty(self, '_watching', {
                  get: (function(watched){
                    return function(){
                      return watched;
                    };
                  })(watching)
                });
      var wrapProperty = function(object, prop){
        var propType = typeof(object[prop]), descriptor = Object.getOwnPropertyDescriptor(object, prop);
        if((prop==='getNotifier')||isAccessorDescriptor(descriptor)||(!descriptor.enumerable)){
          return false;
        }
        if((object instanceof Array)&&isNumeric(prop)){
          var idx = properties.length;
          properties[idx] = prop;
          values[idx] = object[prop];
          return true;
        }
        (function(idx, prop){
          properties[idx] = prop;
          values[idx] = object[prop];
          Object.defineProperty(object, prop, {
            get: function(){
              return values[idx];
            },
            set: function(value){
              if(!sameValue(values[idx], value)){
                Object.getNotifier(object).queueUpdate(object, prop, 'updated', values[idx]);
                values[idx] = value;
              }
            }
          });
        })(properties.length, prop);
        return true;
      };
      self._checkPropertyListing = function(dontQueueUpdates){
        var object = self._watching, keys = Object.keys(object), i=0, l=keys.length;
        var newKeys = [], oldKeys = properties.slice(0), updates = [];
        var prop, queueUpdates = !dontQueueUpdates, propType, value, idx;
        
        for(i=0; i<l; i++){
          prop = keys[i];
          value = object[prop];
          propType = typeof(value);
          if((idx = properties.indexOf(prop))===-1){
            if(wrapProperty(object, prop)&&queueUpdates){
              self.queueUpdate(object, prop, 'new', null, object[prop]);
            }
          }else{
            if((object instanceof Array)&&(isNumeric(prop))){
              if(values[idx] !== value){
                if(queueUpdates){
                  self.queueUpdate(object, prop, 'updated', values[idx], value);
                }
                values[idx] = value;
              }
            }
            oldKeys.splice(oldKeys.indexOf(prop), 1);
          }
        }
        if(queueUpdates){
          l = oldKeys.length;
          for(i=0; i<l; i++){
            idx = properties.indexOf(oldKeys[i]);
            self.queueUpdate(object, oldKeys[i], 'deleted', values[idx]);
            properties.splice(idx,1);
            values.splice(idx,1);
          };
        }
      };
      self.addListener = function(callback){
        var idx = _listeners.indexOf(callback);
        if(idx===-1){
          _listeners.push(callback);
        }
      };
      self.removeListener = function(callback){
        var idx = _listeners.indexOf(callback);
        if(idx>-1){
          _listeners.splice(idx, 1);
        }
      };
      self.listeners = function(){
        return _listeners;
      };
      self.queueUpdate = function(what, prop, type, was){
        this.queueUpdates([{
          type: type,
          object: what,
          name: prop,
          oldValue: was
        }]);
      };
      self.queueUpdates = function(updates){
        var self = this, i = 0, l = updates.length||0, update;
        for(i=0; i<l; i++){
          update = updates[i];
          _updates.push(update);
        }
        if(_updater){
          clearTimeout(_updater);
        }
        _updater = setTimeout(function(){
          _updater = false;
          self.deliverChangeRecords();
        }, 100);
      };
      self.deliverChangeRecords = function(){
        var i = 0, l = _listeners.length, keepRunning = true;
        for(i=0; i<l&&keepRunning; i++){
          if(typeof(_listeners[i])==='function'){
            if(_listeners[i]===console.log){
              console.log(_updates);
            }else{
              keepRunning = !(_listeners[i](_updates));
            }
          }
        }
        _updates=[];
      };
      self._checkPropertyListing(true);
    };
    
    var _notifiers=[], _indexes=[];
    extend.getNotifier = function(O){
    var idx = _indexes.indexOf(O), notifier = idx>-1?_notifiers[idx]:false;
      if(!notifier){
        idx = _indexes.length;
        _indexes[idx] = O;
        notifier = _notifiers[idx] = new Notifier(O);
      }
      return notifier;
    };
    extend.observe = function(O, callback){
      return new Observer(O, callback);
    };
    extend.unobserve = function(O, callback){
      validateArguments(O, callback);
      extend.getNotifier(O).removeListener(callback);
    };
  })(Object, this);
}