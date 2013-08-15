/**
 * jtmpl
 * @author Atanas Minev
 * MIT license
 */
function jtmpl(el, tpl, model) {
	var target, self;

	self = {
		tpl: tpl,
		model: model,

		// Match jtmpl tag. http://gskinner.com/RegExr/ is a nice tool
		re: /\{\{(\{)?(\#|\^|\/)?([\w\.]+)(\})?\}\}/g,

		// Match opening HTML tag
		hre: /<(\w+)(?:\s+([\w-]*)(?:(=)"(?:\w+)")?)*(>)?/g,

		// jtmpl tags
		tags: [],
		
		// opening HTML tags
		htags: [],		

		_get: function(v, context) {
			/*jslint evil:true */// ]:)
			context = context || self.model;
			return eval('context' + (v==='.' ? '' : '.' + v));
		},

		_build: function (tpl, context, pos, tag) {
			var out = '', s, t, v, i, idx, collection,
				// emit `s` or markup between `pos` and current tag, if `s` empty
				emit = function(s) {
					var ht;
					s = s !== undefined ? s + '' : tpl.slice(pos, self.re.lastIndex - t[0].length);
					out += s;
					if (!tag) {
						ht = self.hre.exec(s);
						while (ht) {
							self.htags.push(ht);
							ht = self.hre.exec(s);
						}
					}
				},
				// detect HTML element index and property to bind model to, remember tag
				pushTag = function(t) {
					(tag ? self.tags[self.tags.length - 1].children : self.tags).push(t);
				};

			pos = pos || 0;

			t = self.re.exec(tpl);
			while (t) { 
				// {{/block_tag_end}} ?
				if (t[2] === '/') {

					// end tag matches begin tag?
					if (tag && t[3] !== tag[3]) {
						err = 'Expected {{/' + tag[3] + '}}, got ' + t[0];
						console.log(err);
						throw err;
					}

					// exit recursion
					emit();
					return out;
				}

				// {{var}} ?
				if (!t[2]) {
					emit();
					emit(self._get(t[3], context) || '');
					pos = self.re.lastIndex;
					pushTag({
						type: 'var',
						value: self._get(t[3], context)
					});
				}

				// {{#block_tag_begin}} or {{^not_block_tag_begin}} ?
				if (t[2] === '#' || t[2] === '^') {

					v = self._get(t[3], context);
					pushTag({
						type: 'block',
						neg: t[2] === '^',
						children: []
					});

					// falsy value?
					if (!v) {
						emit();
						s = self._build(tpl, v, self.re.lastIndex, t);					
						pos = self.re.lastIndex;
						emit(t[2] === '#' ?  '' : s);
					}

					// {{#context_block}} or {{#enumerate_array}} ?
					else if (v && t[2] === '#') {
						emit();

						// skip loop body?
						if (v.length === 0) {
							self._build(tpl, v[i], pos, t);
						}

						// emit loop body n times, n = 1 when type(model.block) is object,
						// n = array.length when type(model.block) is array
						collection = (Object.prototype.toString.call(v) !== '[object Array]') ? [v] : v; 
						pos = self.re.lastIndex;
						for (i = 0; i < collection.length; i++) {
							emit();
							emit(
								self._build(tpl, 
									// model.context_block is an object? pass as context
									// do not update htags
									typeof v === 'object' ? collection[i] : context, 
									pos, t, true 
								)
							);
							if (i < collection.length - 1) {
								self.re.lastIndex = pos;
							}
						}
						pos = self.re.lastIndex;
					}

					// {{^enumerable_array}}
					else if (v && typeof v.length !== undefined && t[2] == '^') {
						emit();
						pos = self.re.lastIndex;
						s = self._build(tpl, context, pos, t);
						pos = self.re.lastIndex;
						emit(v.length ? '' : s);
					}

					else {
						throw 'Internal error, tag ' + t[0];
					}
				}

				t = self.re.exec(tpl);
			}

			if (tag) {
				throw 'Unclosed tag ' + tag[0];
			}

			return out + tpl.slice(pos);
		},

		_attachEventHandlers: function() {

		},

		_modelObserver: function(changes) {
			changes.forEach(function(change) {
				console.log(change.name + " was " + change.type + " and is now " + change.object[change.name]);
			});
		}
	};

	// called like: jtmpl('#element') ?
	if (tpl === undefined) {
		// return bound jtmpl object
		return document.getElementById(el.substring(1))._jtmpl;
	}

	self.html = self._build(tpl.match(/\#\w+/) ? 
		document.getElementById(tpl.substring(1)).innerHTML : tpl, model);
	Object.observe(model, self._modelObserver);

	target = document.getElementById(el.substring(1));
	target._jtmpl = self;
	target.innerHTML = self.html;

	return self;
};
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