(function() {
  window.jtmpl = function(target, tpl, model) {
    var bind, compile, escapeHTML, hre, html, isArray, isObject, parseTag, re, reId;
    reId = /^\#[\w-]+$/;
    if (typeof target === 'string' && typeof tpl === 'object' && model === void 0) {
      model = tpl;
      tpl = target;
      target = null;
    }
    if (typeof target === 'string' && target.match(reId)) {
      target = document.getElementById(target.substring(1));
    }
    if (!model || typeof model !== 'object') {
      throw ':( model should be object';
    }
    if (tpl.match && tpl.match(reId)) {
      tpl = document.getElementById(tpl.substring(1)).innerHTML;
    }
    re = /\{\{(\{)?(\#|\^|\/)?([\w\.]+)(\})?\}\}/g;
    hre = /(<\s*[\w-_]+)(?:\s+([\w-\{\}]*)(=)?(?:((?:"[^">]*"?)|(?:'[^'>]*'?)|[^\s>]+))?)*\s*(>)?\s*$/;
    isArray = Array.isArray || function(val) {
      return {}.toString.call(val) === '[object Array]';
    };
    isObject = function(val) {
      return val && typeof val === 'object';
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
    compile = function(tpl, context, position, openTagName) {
      var collection, emitEndDiv, emitSection, escaped, flush, fullTag, fullTagNoDelim, getPropString, htag, htagSection, htagSectionVar, i, injectTag, item, out, pos, tag, tagName, tagType, val, _i, _len, _ref, _ref1;
      pos = position || 0;
      out = '';
      tag = htag = htagSection = htagSectionVar = null;
      tpl = tpl.replace(new RegExp("<!--\\s*(" + re.source + ")\\s*-->"), '$1');
      tpl = tpl.replace(new RegExp("([\\w-_]+)=\"(" + re.source + ")\"", 'g'), '$1=$2');
      tpl = tpl.replace(new RegExp("\\n\\s*(" + re.source + ")\\s*\\n", 'g'), '\n$1');
      flush = function() {
        out += tpl.slice(pos, re.lastIndex - (fullTag || '').length);
        return pos = re.lastIndex;
      };
      getPropString = function(val, quote) {
        quote = quote || '';
        return htag[3] && !htag[5] && (htag[2] + htag[3] + quote + val + quote) || val;
      };
      emitSection = function(context, commentProto) {
        return out += (commentProto ? "<!-- " + commentProto + " " : '') + compile(tpl, context, pos, tagName) + (commentProto ? ' -->' : '');
      };
      injectTag = function() {
        var m, p, t;
        p = htag.index + htag[1].length;
        t = "" + (getPropString(fullTagNoDelim));
        if (m = out.match(new RegExp("[\\s\\S]{" + p + "}(\\sdata-jt=\"([^\"]*))\""))) {
          p = p + m[1].length;
          return out = "" + (out.slice(0, p)) + (m[2].length && ' ' || '') + t + (out.slice(p));
        } else {
          return out = "" + (out.slice(0, p)) + " data-jt=\"" + t + "\"" + (out.slice(p));
        }
      };
      while (tag = re.exec(tpl)) {
        _ref = parseTag(tag), tagType = _ref[0], tagName = _ref[1], fullTag = _ref[2], fullTagNoDelim = _ref[3];
        flush();
        htag = out.match(hre);
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
              out += "<span data-jt=\"" + fullTagNoDelim + "\">" + escaped + "</span>";
            } else {
              injectTag();
              if (typeof val !== 'function') {
                if (htag[3] && !htag[5]) {
                  if (typeof val === 'boolean') {
                    out = out.replace(/[\w-_]+=$/, '') + (val && tagName || '');
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
            val = context[tagName];
            if (!htag && !htagSection && htagSectionVar !== tagName) {
              emitEndDiv = true;
              out += "<div data-jt=\"" + fullTagNoDelim + "\">";
            } else {
              if (!htag) {
                htag = htagSection;
              }
              _ref1 = [htag, tagName], htagSection = _ref1[0], htagSectionVar = _ref1[1];
              injectTag();
            }
            if (tagType === 'section') {
              if (!val || isArray(val) && !val.length) {
                emitSection(val || context, '#');
                pos = re.lastIndex;
              } else {
                collection = isArray(val) && val || [val];
                for (i = _i = 0, _len = collection.length; _i < _len; i = ++_i) {
                  item = collection[i];
                  emitSection(isObject(val) ? item : context);
                  if (i < collection.length - 1) {
                    re.lastIndex = pos;
                  }
                }
                pos = re.lastIndex;
              }
            } else {
              if (!val || isArray(val) && !val.length) {
                emitSection(context);
                pos = re.lastIndex;
              } else {
                emitSection(context, '^');
                pos = re.lastIndex;
              }
            }
            if (emitEndDiv) {
              out += '</div>';
            }
        }
      }
      return out + tpl.slice(pos);
    };
    html = compile(tpl, model);
    if (!target) {
      return html;
    }
    target.innerHTML = html;
    return bind = function(root) {};
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