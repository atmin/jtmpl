!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jtmpl=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

function freak(obj, root, parent, prop) {

  var listeners = {
    'change': {},
    'update': {},
    'insert': {},
    'delete': {}
  };
  var _dependentProps = {};
  var _dependentContexts = {};
  var cache = {};
  var children = {};

  // Assert condition
  function assert(cond, msg) {
    if (!cond) {
      throw msg || 'assertion failed';
    }
  }

  // Mix properties into target
  function mixin(target, properties) {
    for (var i = 0, props = Object.getOwnPropertyNames(properties), len = props.length;
        i < len; i++) {
      target[props[i]] = properties[props[i]];
    }
  }

  function deepEqual(x, y) {
    if (typeof x === "object" && x !== null &&
        typeof y === "object" && y !== null) {

      if (Object.keys(x).length !== Object.keys(y).length) {
        return false;
      }

      for (var prop in x) {
        if (x.hasOwnProperty(prop)) {
          if (y.hasOwnProperty(prop)) {
            if (!deepEqual(x[prop], y[prop])) {
              return false;
            }
          }
          else {
            return false;
          }
        }
      }

      return true;
    }
    else if (x !== y) {
      return false;
    }

    return true;
  }

  // Event functions
  function on() {
    var event = arguments[0];
    var prop = ['string', 'number'].indexOf(typeof arguments[1]) > -1 ?
      arguments[1] : null;
    var callback =
      typeof arguments[1] === 'function' ?
        arguments[1] :
        typeof arguments[2] === 'function' ?
          arguments[2] : null;

    // Args check
    assert(['change', 'update', 'insert', 'delete'].indexOf(event) > -1);
    assert(
      (['change'].indexOf(event) > -1 && prop !== null) ||
      (['insert', 'delete', 'update'].indexOf(event) > -1 && prop === null)
    );

    // Init listeners for prop
    if (!listeners[event][prop]) {
      listeners[event][prop] = [];
    }
    // Already registered?
    if (listeners[event][prop].indexOf(callback) === -1) {
      listeners[event][prop].push(callback);
    }
  }

  // Remove all or specified listeners given event and property
  function off() {
    var event = arguments[0];
    var prop = typeof arguments[1] === 'string' ? arguments[1] : null;
    var callback =
      typeof arguments[1] === 'function' ?
        arguments[1] :
        typeof arguments[2] === 'function' ?
          arguments[2] : null;
    var i;

    if (!listeners[event][prop]) return;

    // Remove all property watchers?
    if (!callback) {
      listeners[event][prop] = [];
    }
    else {
      // Remove specific callback
      i = listeners[event][prop].indexOf(callback);
      if (i > -1) {
        listeners[event][prop].splice(i, 1);
      }
    }

  }

  // trigger('change', prop)
  // trigger('update', prop)
  // trigger('insert' or 'delete', index, count)
  function trigger(event, a, b) {
    var handlers = (listeners[event][['change'].indexOf(event) > -1 ? a : null] || []);
    var i, len = handlers.length;
    for (i = 0; i < len; i++) {
      handlers[i].call(instance, a, b);
    };
  }

  // Export model to JSON string
  // NOT exported:
  // - properties starting with _ (Python private properties convention)
  // - computed properties (derived from normal properties)
  function toJSON() {
    function filter(obj) {
      var key, filtered = Array.isArray(obj) ? [] : {};
      for (key in obj) {
        if (typeof obj[key] === 'object') {
          filtered[key] = filter(obj[key]);
        }
        else if (typeof obj[key] !== 'function' && key[0] !== '_') {
          filtered[key] = obj[key];
        }
      }
      return filtered;
    }
    return JSON.stringify(filter(obj));
  }

  // Load model from JSON string or object
  function fromJSON(data) {
    var key;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    for (key in data) {
      instance(key, data[key]);
      trigger('update', key);
    }
    instance.len = obj.length;
  }

  // Update handler: recalculate dependent properties,
  // trigger change if necessary
  function update(prop) {
    if (!deepEqual(cache[prop], get(prop, function() {}, true))) {
      trigger('change', prop);
    }

    // Notify dependents
    for (var i = 0, dep = _dependentProps[prop] || [], len = dep.length;
        i < len; i++) {
      delete children[dep[i]];
      _dependentContexts[prop][i].trigger('update', dep[i]);
    }

    if (instance.parent) {
      // Notify computed properties, depending on parent object
      instance.parent.trigger('update', instance.prop);
    }
  }

  // Proxy the accessor function to record
  // all accessed properties
  function getDependencyTracker(prop) {
    function tracker(context) {
      return function(_prop, _arg) {
        if (!context._dependentProps[_prop]) {
          context._dependentProps[_prop] = [];
          context._dependentContexts[_prop] = [];
        }
        if (context._dependentProps[_prop].indexOf(prop) === -1) {
          context._dependentProps[_prop].push(prop);
          context._dependentContexts[_prop].push(instance);
        }
        return context(_prop, _arg, true);
      }
    }
    var result = tracker(instance);
    construct(result);
    if (parent) {
      result.parent = tracker(parent);
    }
    result.root = tracker(root || instance);
    return result;
  }

  // Shallow clone an object
  function shallowClone(obj) {
    var key, clone;
    if (obj && typeof obj === 'object') {
      clone = {};
      for (key in obj) {
        clone[key] = obj[key];
      }
    }
    else {
      clone = obj;
    }
    return clone;
  }

  // Getter for prop, if callback is given
  // can return async value
  function get(prop, callback, skipCaching) {
    var val = obj[prop];
    if (typeof val === 'function') {
      val = val.call(getDependencyTracker(prop), callback);
      if (!skipCaching) {
        cache[prop] = (val === undefined) ? val : shallowClone(val);
      }
    }
    else if (!skipCaching) {
      cache[prop] = val;
    }
    return val;
  }

  function getter(prop, callback, skipCaching) {
    var result = get(prop, callback, skipCaching);

    return result && typeof result === 'object' ?
      // Wrap object
      children[prop] ?
        children[prop] :
        children[prop] = freak(result, root || instance, instance, prop) :
      // Simple value
      result;
  }

  // Set prop to val
  function setter(prop, val) {
    var oldVal = get(prop);

    if (typeof obj[prop] === 'function') {
      // Computed property setter
      obj[prop].call(getDependencyTracker(prop), val);
    }
    else {
      // Simple property
      obj[prop] = val;
      if (val && typeof val === 'object') {
        delete cache[prop];
        delete children[prop];
      }
    }

    if (oldVal !== val) {
      trigger('update', prop);
    }
  }

  // Functional accessor, unify getter and setter
  function accessor(prop, arg, skipCaching) {
    return (
      (arg === undefined || typeof arg === 'function') ?
        getter : setter
    )(prop, arg, skipCaching);
  }

  // Attach instance members
  function construct(target) {
    mixin(target, {
      values: obj,
      parent: parent || null,
      root: root || target,
      prop: prop === undefined ? null : prop,
      // .on(event[, prop], callback)
      on: on,
      // .off(event[, prop][, callback])
      off: off,
      // .trigger(event[, prop])
      trigger: trigger,
      toJSON: toJSON,
      // Deprecated. It has always been broken, anyway
      // Will think how to implement properly
      fromJSON: fromJSON,
      // Internal: dependency tracking
      _dependentProps: _dependentProps,
      _dependentContexts: _dependentContexts
    });

    // Wrap mutating array method to update
    // state and notify listeners
    function wrapArrayMethod(method, func) {
      return function() {
        var result = [][method].apply(obj, arguments);
        this.len = this.values.length;
        cache = {};
        children = {};
        func.apply(this, arguments);
        target.parent.trigger('update', target.prop);
        return result;
      };
    }

    if (Array.isArray(obj)) {
      mixin(target, {
        // Function prototype already contains length
        // `len` specifies array length
        len: obj.length,

        pop: wrapArrayMethod('pop', function() {
          trigger('delete', this.len, 1);
        }),

        push: wrapArrayMethod('push', function() {
          trigger('insert', this.len - 1, 1);
        }),

        reverse: wrapArrayMethod('reverse', function() {
          trigger('delete', 0, this.len);
          trigger('insert', 0, this.len);
        }),

        shift: wrapArrayMethod('shift', function() {
          trigger('delete', 0, 1);
        }),

        unshift: wrapArrayMethod('unshift', function() {
          trigger('insert', 0, 1);
        }),

        sort: wrapArrayMethod('sort', function() {
          trigger('delete', 0, this.len);
          trigger('insert', 0, this.len);
        }),

        splice: wrapArrayMethod('splice', function() {
          if (arguments[1]) {
            trigger('delete', arguments[0], arguments[1]);
          }
          if (arguments.length > 2) {
            trigger('insert', arguments[0], arguments.length - 2);
          }
        })

      });
    }
  }

  on('update', update);

  // Create freak instance
  var instance = function() {
    return accessor.apply(null, arguments);
  };

  // Attach instance members
  construct(instance);

  return instance;
}

// CommonJS export
if (typeof module === 'object') module.exports = freak;

},{}],2:[function(_dereq_,module,exports){
var RE_DELIMITED_VAR = /^\{\{([\w\.\-]+)\}\}$/;


/*
 * Attribute rules
 *
 */
module.exports = [

  /**
   * value="{{var}}"
   */
  function(node, attr) {
    var match = node.getAttribute(attr).match(RE_DELIMITED_VAR);
    if (attr === 'value' && match) {

      return {

        prop: match[1],

        rule: function(node, attr, model, prop) {

          function change() {
            var val = jtmpl._get(model, prop);
            if (node[attr] !== val) {
              node[attr] = val || '';
            }
          }

          // text input?
          var eventType = ['text', 'password'].indexOf(node.type) > -1 ?
            'keyup' : 'change'; // IE9 incorectly reports it supports input event

          node.addEventListener(eventType, function() {
            model(prop, node[attr]);
          });

          model.on('change', prop, change);
          change();

        }
      };
    }
  },




  /**
   * selected="{{var}}"
   */
  function(node, attr) {
    var match = node.getAttribute(attr).match(RE_DELIMITED_VAR);
    if (attr === 'jtmpl-selected' && match) {

      return {

        prop: match[1],

        rule: function(node, attr, model, prop) {

          function change() {
            if (node.nodeName === 'OPTION') {
              var i = selects.indexOf(node.parentNode);
              if (selectsUpdating[i]) {
                return;
              }
              for (var j = 0, len = selectOptions[i].length; j < len; j++) {
                selectOptions[i][j].selected = selectOptionsContexts[i][j](prop);
              }
            }
            else {
              node.selected = model(prop);
            }
          }

          if (node.nodeName === 'OPTION') {

            // Process async, as parentNode is still documentFragment
            setTimeout(function() {
              var i = selects.indexOf(node.parentNode);
              if (i === -1) {
                // Add <select> to list
                i = selects.push(node.parentNode) - 1;
                // Init options
                selectOptions.push([]);
                // Init options contexts
                selectOptionsContexts.push([]);
                // Attach change listener
                node.parentNode.addEventListener('change', function() {
                  selectsUpdating[i] = true;
                  for (var oi = 0, olen = selectOptions[i].length; oi < olen; oi++) {
                    selectOptionsContexts[i][oi](prop, selectOptions[i][oi].selected);
                  }
                  selectsUpdating[i] = false;
                });
              }
              // Remember option and context
              selectOptions[i].push(node);
              selectOptionsContexts[i].push(model);
            }, 0);

          }
          else {
            node.addEventListener('change', function() {
              model(prop, this.selected);
            });
          }

          model.on('change', prop, change);
          setTimeout(change);
        }
      };
    }
  },




  /**
   * checked="{{var}}"
   */
  function(node, attr) {
    var match = node.getAttribute(attr).match(RE_DELIMITED_VAR);
    if (attr === 'jtmpl-checked' && match) {

      return {

        prop: match[1],

        rule: function(node, attr, model, prop) {

          function change() {
            if (node.name) {
              if (radioGroupsUpdating[node.name]) {
                return;
              }
              for (var i = 0, len = radioGroups[node.name][0].length; i < len; i++) {
                radioGroups[node.name][0][i].checked = radioGroups[node.name][1][i](prop);
              }
            }
            else {
              node.checked = model(prop);
            }
          }

          // radio group?
          if (node.type === 'radio' && node.name) {
            if (!radioGroups[node.name]) {
              // Init radio group ([0]: node, [1]: model)
              radioGroups[node.name] = [[], []];
            }
            // Add input to radio group
            radioGroups[node.name][0].push(node);
            // Add context to radio group
            radioGroups[node.name][1].push(model);
          }

          node.addEventListener('click', function() {
            if (node.type === 'radio' && node.name) {
              radioGroupsUpdating[node.name] = true;
              // Update all inputs from the group
              for (var i = 0, len = radioGroups[node.name][0].length; i < len; i++) {
                radioGroups[node.name][1][i](prop, radioGroups[node.name][0][i].checked);
              }
              radioGroupsUpdating[node.name] = false;
            }
            else {
              // Update current input only
              model(prop, node.checked);
            }
          });

          model.on('change', prop, change);
          setTimeout(change);
        }

      };
    }
  },




  /**
   * attribute="{{var}}"
   */
  function(node, attr) {
    var match = node.getAttribute(attr).match(RE_DELIMITED_VAR);
    if (match) {

      return {

        prop: match[1],

        rule: function(node, attr, model, prop) {

          function change() {
            var val = jtmpl._get(model, prop);
            return val ?
              node.setAttribute(attr, val) :
              node.removeAttribute(attr);
          }

          model.on('change', prop, change);
          change();
        }
      };
    }
  },




  /**
   * Fallback rule, process via @see utemplate
   * Strip jtmpl- prefix
   */
  function(node, attr) {
    return {
      prop: node.getAttribute(attr),
      rule: function(node, attr, model, prop) {
        var attrName = attr.replace('jtmpl-', '');
        function change() {
          node.setAttribute(
            attrName,
            jtmpl.utemplate(prop, model, change)
          );
        }
        change();
      }
    };
  }

];

},{}],3:[function(_dereq_,module,exports){
/*
 * Node rules
 *
 */
module.exports = [

  /* jshint evil: true */




  /**
   * {{var}}
   */
  function(node) {
    if (node.innerHTML.match(/^[\w\.\-]+$/)) {

      return {

        prop: node.innerHTML,

        rule: function(fragment, model, prop) {
          var textNode = document.createTextNode(jtmpl._get(model, prop) || '');
          fragment.appendChild(textNode);
          model.on('change', prop, function() {
            textNode.data = jtmpl._get(model, prop) || '';
          });
        }
      };
    }
  },




  /**
   * {{&var}}
   */
  function(node) {
    var match = node.innerHTML.match(/^&([\w\.\-]+)$/);
    if (match) {
      return {

        prop: match[1],

        rule: function(fragment, model, prop) {

          // Anchor node for keeping section location
          var anchor = document.createComment('');
          // Number of rendered nodes
          var length = 0;

          function change() {
            var frag = document.createDocumentFragment();
            var el = document.createElement('body');
            var i;

            // Delete old rendering
            while (length) {
              anchor.parentNode.removeChild(anchor.previousSibling);
              length--;
            }

            el.innerHTML = model(prop) || '';
            length = el.childNodes.length;
            for (i = 0; i < length; i++) {
              frag.appendChild(el.childNodes[0]);
            }
            anchor.parentNode.insertBefore(frag, anchor);
          }

          fragment.appendChild(anchor);
          model.on('change', prop, change);
          change();
        }

      };
    }
  },




  /**
   * {{>partial}}
   */
  function(node) {
    // match: [1]=var_name, [2]='single-quoted' [3]="double-quoted"
    var match = node.innerHTML.match(/>([\w\.\-]+)|'([^\']*)\'|"([^"]*)"/);

    if (match) {
      return {

        prop: match,

        rule: function(fragment, model, match) {

          var anchor = document.createComment('');
          var target;

          function loader() {
            if (!target) {
              target = anchor.parentNode;
            }
            jtmpl.loader(
              target,
              match[1] ?
                // Variable
                model(match[1]) :
                // Literal
                match[2] || match[3],
              model
            );
          }
          if (match[1]) {
            // Variable
            model.on('change', match[1], loader);
          }
          fragment.appendChild(anchor);
          // Load async
          setTimeout(loader);
        }
      };
    }
  },




  /**
   * {{#section}}
   */
  function(node) {
    var match = node.innerHTML.match(/^#([\w\.\-]+)$/);

    if (match) {

      return {

        block: match[1],

        rule: function(fragment, model, prop, template) {

          // Anchor node for keeping section location
          var anchor = document.createComment('');
          // Number of rendered nodes
          var length = 0;
          // How many childNodes in one section item
          var chunkSize;

          function update(i) {
            return function() {
              var parent = anchor.parentNode;
              var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
              var pos = anchorIndex - length + i * chunkSize;
              var size = chunkSize;
              var arr = prop === '.' ? model : model(prop);

              while (size--) {
                parent.removeChild(parent.childNodes[pos]);
              }
              parent.insertBefore(
                eval(template + '(arr(i))'),
                parent.childNodes[pos]
              );
            };
          }

          function insert(index, count) {
            var parent = anchor.parentNode;
            var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
            var pos = anchorIndex - length + index * chunkSize;
            var size = count * chunkSize;
            var i, fragment;
            var arr = prop === '.' ? model : model(prop);

            for (i = 0, fragment = document.createDocumentFragment();
                i < count; i++) {
              fragment.appendChild(eval(template + '(arr(index + i))'));
            }

            parent.insertBefore(fragment, parent.childNodes[pos]);
            length = length + size;
          }

          function del(index, count) {
            var parent = anchor.parentNode;
            var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
            var pos = anchorIndex - length + index * chunkSize;
            var size = count * chunkSize;

            length = length - size;

            while (size--) {
              parent.removeChild(parent.childNodes[pos]);
            }
          }

          function change() {
            var val = prop === '.' ? model : model(prop);
            var i, len, render;

            // Delete old rendering
            while (length) {
              anchor.parentNode.removeChild(anchor.previousSibling);
              length--;
            }

            // Array?
            if (typeof val === 'function' && val.len !== undefined) {
              val.on('insert', insert);
              val.on('delete', del);
              render = document.createDocumentFragment();

              //console.log('rendering ' + val.len + ' values');
              var func = eval(template);
              var child, childModel;
              for (i = 0, len = val.values.length; i < len; i++) {
                // TODO: implement event delegation for array indexes
                // Also, using val.values[i] instead of val[i]
                // saves A LOT of heap memory. Figure out how to do
                // on demand model creation.
                val.on('change', i, update(i));
                //render.appendChild(eval(template + '(val(i))'));
                //render.appendChild(func(val.values[i]));
                childModel = val(i);
                child = func(childModel);
                child.__jtmpl__ = childModel;
                render.appendChild(child);
              }

              length = render.childNodes.length;
              chunkSize = ~~(length / len);
              anchor.parentNode.insertBefore(render, anchor);
            }

            // Object?
            else if (typeof val === 'function' && val.len === undefined) {
              render = eval(template + '(val)');
              length = render.childNodes.length;
              chunkSize = length;
              anchor.parentNode.insertBefore(render, anchor);
              anchor.parentNode.__jtmpl__ = model;
            }

            // Cast to boolean
            else {
              if (!!val) {
                render = eval(template + '(model)');
                length = render.childNodes.length;
                chunkSize = length;
                anchor.parentNode.insertBefore(render, anchor);
              }
            }
          }

          fragment.appendChild(anchor);
          change();
          model.on('change', prop, change);
        }
      };
    }
  },





  /**
   * {{^inverted_section}}
   */
  function(node) {
    var match = node.innerHTML.match(/^\^([\w\.\-]+)$/);

    if (match) {

      return {

        block: match[1],

        rule: function(fragment, model, prop, template) {

          // Anchor node for keeping section location
          var anchor = document.createComment('');
          // Number of rendered nodes
          var length = 0;

          function change() {
            var val = prop === '.' ? model : model(prop);
            var i, len, render;

            // Delete old rendering
            while (length) {
              anchor.parentNode.removeChild(anchor.previousSibling);
              length--;
            }

            // Array?
            if (typeof val === 'function' && val.len !== undefined) {
              val.on('insert', change);
              val.on('delete', change);
              render = document.createDocumentFragment();

              if (val.len === 0) {
                render.appendChild(eval(template + '(val(i))'));
              }

              length = render.childNodes.length;
              anchor.parentNode.insertBefore(render, anchor);
            }
            // Cast to boolean
            else {
              if (!val) {
                render = eval(template + '(model)');
                length = render.childNodes.length;
                anchor.parentNode.insertBefore(render, anchor);
              }
            }
          }

          fragment.appendChild(anchor);
          change();
          model.on('change', prop, change);
        }


      };
    }
  },



  /*
   * Fallback rule, not recognized jtmpl tag
   */
  function(node) {
    return {
      rule: function(fragment) {
        fragment.appendChild(document.createTextNode('REMOVEMELATER'));
      }
    };
  }
];

},{}],4:[function(_dereq_,module,exports){
/**
 * Compile a template, parsed by @see parse
 *
 * @param {documentFragment} template
 * @param {string|undefined} sourceURL - include sourceURL to aid debugging
 *
 * @returns {string} - Function body, accepting Freak instance parameter, suitable for eval()
 */
function compile(template, sourceURL, depth) {

  var ri, rules, rlen;
  var match, block;

  // Generate dynamic function body
  var func = '(function(model) {\n' +
    'var frag = document.createDocumentFragment(), node;\n\n';

  if (!depth) {
    // Global bookkeeping
    func +=
      'var radioGroups = {};\n' +
      'var radioGroupsUpdating = {};\n' +
      'var selects = [];\n' +
      'var selectsUpdating = [];\n' +
      'var selectOptions = [];\n' +
      'var selectOptionsContexts = [];\n\n';
  }

  // Wrap model in a Freak instance, if necessary
  func += 'model = typeof model === "function" ?' +
    'model : ' +
    'typeof model === "object" ?' +
      'jtmpl(model) :' +
      'jtmpl({".": model});\n\n';

  // Iterate childNodes
  for (var i = 0, childNodes = template.childNodes, len = childNodes.length, node;
       i < len; i++) {

    node = childNodes[i];

    switch (node.nodeType) {

      // Element node
      case 1:

        // jtmpl tag?
        if (node.nodeName === 'SCRIPT' && node.type === 'text/jtmpl-tag') {

          for (ri = 0, rules = _dereq_('./compile-rules-node'), rlen = rules.length;
              ri < rlen; ri++) {

            match = rules[ri](node);

            // Rule found?
            if (match) {

              // Block tag?
              if (match.block) {

                // Fetch block template
                block = document.createDocumentFragment();
                for (i++;
                    (i < len) && !matchEndBlock(match.block, childNodes[i].innerHTML || '');
                    i++) {
                  block.appendChild(childNodes[i].cloneNode(true));
                }

                if (i === len) {
                  throw 'jtmpl: Unclosed ' + match.block;
                }
                else {
                  func += '(' + match.rule.toString() + ')' +
                    '(frag, model, ' +
                    JSON.stringify(match.block) + ', ' +   // prop
                    JSON.stringify(
                      // template
                      compile(
                        block,
                        sourceURL && (sourceURL + '-' + node.innerHTML + '[' + i + ']'),
                        (depth || 0) + 1
                      )
                    ) + ');';
                }

              }
              // Inline tag
              else {
                func += '(' + match.rule.toString() + ')' +
                  '(frag, model, ' + JSON.stringify(match.prop) + ');\n';
              }

              // Skip remaining rules
              break;
            }
          } // end iterating node rules
        }

        else {
          // Create element
          func += 'node = document.createElement("' + node.nodeName + '");\n';

          // Process attributes
          for (var ai = 0, attributes = node.attributes, alen = attributes.length;
               ai < alen; ai++) {

            for (ri = 0, rules = _dereq_('./compile-rules-attr'), rlen = rules.length;
                ri < rlen; ri++) {

              match = rules[ri](node, attributes[ai].name.toLowerCase());

              if (match) {

                // Match found, append rule to func
                func += '(' + match.rule.toString() + ')' +
                  '(node, ' +
                  JSON.stringify(attributes[ai].name) + // attr
                  ', model, ' +
                  JSON.stringify(match.prop) +          // prop
                  ');\n';

                // Skip other attribute rules
                break;
              }
            }
          }

          if (node.nodeName !== 'INPUT') {
            // Recursively compile
            func += 'node.appendChild(' +
              compile(
                node,
            sourceURL && (sourceURL + '-' + node.nodeName + '[' + i + ']'),
            (depth || 0) + 1
            ) + '(model));\n';
          }

          // Append to fragment
          func += 'frag.appendChild(node);\n';
        }

        break;


      // Text node
      case 3:
        func += 'frag.appendChild(document.createTextNode(' +
          JSON.stringify(node.data) + '));\n';
        break;


      // Comment node
      case 8:
        func += 'frag.appendChild(document.createComment(' +
          JSON.stringify(node.data) + '));\n';
        break;

    } // end switch
  } // end iterate childNodes

  func += 'return frag; })';
  func += sourceURL ?
    '\n//@ sourceURL=' + sourceURL + '\n//# sourceURL=' + sourceURL + '\n' :
    '';

  return func;
}




function matchEndBlock(block, str) {
  var match = str.match(/^\/([\w\.\-]+)?$/);
  return match ?
    block === '' || !match[1] || match[1] === block :
    false;
}




module.exports = compile;

},{"./compile-rules-attr":2,"./compile-rules-node":3}],5:[function(_dereq_,module,exports){
/*

Evaluate object from literal or CommonJS module

*/

    /* jshint evil:true */
    module.exports = function(target, src, model) {

      model = model || {};
      if (typeof model !== 'function') {
        model = jtmpl(model);
      }

      function mixin(target, properties) {
        for (var prop in properties) {
          if (// Plugin
              (prop.indexOf('__') === 0 &&
                prop.lastIndexOf('__') === prop.length - 2) ||
              // Computed property
              typeof properties[prop] === 'function'
             ) {
            if (target.values[prop] === undefined) {
              target.values[prop] = properties[prop];
            }
          }
          else {
            // Target doesn't already have prop?
            if (target(prop) === undefined) {
              target(prop, properties[prop]);
            }
          }
        }
      }

      function applyPlugins() {
        var prop, arg;
        for (prop in jtmpl.plugins) {
          plugin = jtmpl.plugins[prop];
          arg = model.values['__' + prop + '__'];
          if (typeof plugin === 'function' && arg !== undefined) {
            plugin.call(model, arg, target);
          }
        }
      }

      function evalObject(body, src) {
        var result, module = { exports: {} };
        src = src ?
          '\n//@ sourceURL=' + src +
          '\n//# sourceURL=' + src :
          '';
        if (body.match(/^\s*{[\S\s]*}\s*$/)) {
          // Literal
          return eval('result=' + body + src);
        }
        // CommonJS module
        eval(body + src);
        return module.exports;
      }

      function loadModel(src, template, doc) {
        var hashIndex;
        if (!src) {
          // No source
          jtmpl(target, template, model);
        }
        else if (src.match(jtmpl.RE_NODE_ID)) {
          // Element in this document
          var element = doc.querySelector(src);
          mixin(model, evalObject(element.innerHTML, src));
          applyPlugins();
          jtmpl(target, template, model);
        }
        else {
          hashIndex = src.indexOf('#');
          // Get model via XHR
          // Older IEs complain if URL contains hash
          jtmpl('GET', hashIndex > -1 ? src.substring(0, hashIndex) : src,
            function (resp) {
              var match = src.match(jtmpl.RE_ENDS_WITH_NODE_ID);
              var element = match && new DOMParser()
                .parseFromString(resp, 'text/html')
                .querySelector(match[1]);
              mixin(model, evalObject(match ? element.innerHTML : resp, src));
              applyPlugins();
              jtmpl(target, template, model);
            }
          );
        }
      }

      function loadTemplate() {
        var hashIndex;

        if (!src) return;

        if (src.match(jtmpl.RE_NODE_ID)) {
          // Template is the contents of element
          // belonging to this document
          var element = document.querySelector(src);
          loadModel(element.getAttribute('data-model'), element.innerHTML, document);
        }
        else {
          hashIndex = src.indexOf('#');
          // Get template via XHR
          jtmpl('GET', hashIndex > -1 ? src.substring(0, hashIndex) : src,
            function(resp) {
              var match = src.match(jtmpl.RE_ENDS_WITH_NODE_ID);
              var iframe, doc;
              if (match) {
                iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                doc = iframe.contentDocument;
                doc.writeln(resp);
                document.body.removeChild(iframe);
              }
              else {
                doc = document;
              }
              var element = match && doc.querySelector(match[1]);

              loadModel(
                match ? element.getAttribute('data-model') : '',
                match ? element.innerHTML : resp,
                doc
              );
            }
          );
        }
      }

      loadTemplate();
    };

},{}],6:[function(_dereq_,module,exports){
/*
 * Main function
 */
/* jshint evil: true */
function jtmpl() {
  var args = [].slice.call(arguments);
  var target, t, template, model;

  // jtmpl('HTTP_METHOD', url[, parameters[, callback[, options]]])?
  if (['GET', 'POST'].indexOf(args[0]) > -1) {
    return _dereq_('./xhr').apply(null, args);
  }

  // jtmpl(object)?
  else if (args.length === 1 && typeof args[0] === 'object') {
    // return Freak instance
    return _dereq_('freak')(args[0]);
  }

  // jtmpl(target)?
  else if (args.length === 1 && typeof args[0] === 'string') {
    // return model
    return document.querySelector(args[0]).__jtmpl__;
  }

  // jtmpl(target, template, model[, options])?
  else if (
    ( args[0] && args[0].nodeType ||
      (typeof args[0] === 'string')
    ) &&

    ( (args[1] && typeof args[1].appendChild === 'function') ||
      (typeof args[1] === 'string')
    ) &&

    args[2] !== undefined

  ) {

    target = args[0] && args[0].nodeType  ?
      args[0] :
      document.querySelector(args[0]);

    template = args[1].match(jtmpl.RE_NODE_ID) ?
      document.querySelector(args[1]).innerHTML :
      args[1];

    model =
      typeof args[2] === 'function' ?
        // already wrapped
        args[2] :
        // otherwise wrap
        jtmpl(
          typeof args[2] === 'object' ?
            // object
            args[2] :

            typeof args[2] === 'string' && args[2].match(jtmpl.RE_NODE_ID) ?
              // src, load it
              _dereq_('./loader')
                (document.querySelector(args[2]).innerHTML) :

              // simple value, box it
              {'.': args[2]}
        );

    if (target.nodeName === 'SCRIPT') {
      t = document.createElement('div');
      t.id = target.id;
      target.parentNode.replaceChild(t, target);
      target = t;
    }

    // Associate target and model
    target.__jtmpl__ = model;

    // Empty target
    target.innerHTML = '';

    // Assign compiled template
    //target.appendChild(require('./compiler')(template, model, args[3]));
    target.appendChild(
      eval(
        jtmpl.compile(
          jtmpl.parse(template),
          target.getAttribute('data-jtmpl')
        ) + '(model)'
      )
    );
  }
}



/*
 * On page ready, process jtmpl targets
 */

window.addEventListener('DOMContentLoaded', function() {
  var loader = _dereq_('./loader');
  var targets = document.querySelectorAll('[data-jtmpl]');

  for (var i = 0, len = targets.length; i < len; i++) {
    loader(targets[i], targets[i].getAttribute('data-jtmpl'));
  }
});


/*
 * Export stuff
 *
 * TODO: refactorme
 */
jtmpl.RE_NODE_ID = /^#[\w\.\-]+$/;
jtmpl.RE_ENDS_WITH_NODE_ID = /.+(#[\w\.\-]+)$/;

jtmpl.parse = _dereq_('./parse');
jtmpl.compile = _dereq_('./compile');
jtmpl.loader = _dereq_('./loader');
jtmpl.utemplate = _dereq_('./utemplate');
jtmpl._get = function(model, prop) {
  var val = model(prop);
  return (typeof val === 'function') ?
    JSON.stringify(val.values) :
    val;
};


/*
 * Plugins
 */
jtmpl.plugins = _dereq_('./plugins');


/*
 * Export
 */
module.exports = jtmpl;

},{"./compile":4,"./loader":5,"./parse":7,"./plugins":8,"./utemplate":12,"./xhr":13,"freak":1}],7:[function(_dereq_,module,exports){
/**
 * Parse a text template to DOM structure ready for compiling
 * @see compile
 *
 * @param {string} template
 *
 * @returns {Element}
 */
function parse(template) {

  var iframe, body;

  function preprocess(template) {

    // replace {{{tag}}} with {{&tag}}
    template = template.replace(/\{\{\{([\S\s]*?)\}\}\}/g, '{{&$1}}');

    // 1. wrap each non-attribute tag in <script type="text/jtmpl-tag">
    // 2. remove Mustache comments
    // TODO: handle tags in HTML comments
    template = template.replace(
      /\{\{([\S\s]*?)\}\}/g,
      function(match, match1, pos) {
        var head = template.slice(0, pos);
        var insideTag = !!head.match(/<[\w\-]+[^>]*?$/);
        var opening = head.match(/<(script|SCRIPT)/g);
        var closing = head.match(/<\/(script|SCRIPT)/g);
        var insideScript =
            (opening && opening.length || 0) > (closing && closing.length || 0);
        var insideComment = !!head.match(/<!--\s*$/);
        var isMustacheComment = match1.indexOf('!') === 0;

        return insideTag || insideComment ?
          isMustacheComment ?
            '' :
            match :
          insideScript ?
            match :
            '<script type="text/jtmpl-tag">' + match1.trim() + '\x3C/script>';
      }
    );
    // prefix 'selected' and 'checked' attributes with 'jtmpl-'
    // (to avoid "special" processing, oh IE8)
    template = template.replace(
      /(<(?:option|OPTION)[^>]*?)(?:selected|SELECTED)=/g,
      '$1jtmpl-selected=');

    template = template.replace(
      /(<(?:input|INPUT)[^>]*?)(?:checked|CHECKED)=/g,
      '$1jtmpl-checked=');

    return template;
  }

  template = preprocess(template);
  iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  iframe.contentDocument.writeln('<!doctype html>\n<html><body>' + template + '</body></html>');
  body = iframe.contentDocument.body;
  document.body.removeChild(iframe);

  return body;
}



module.exports = parse;

},{}],8:[function(_dereq_,module,exports){
module.exports = {
  init: _dereq_('./plugins/init'),
  on: _dereq_('./plugins/on'),
  routes: _dereq_('./plugins/routes')
};

},{"./plugins/init":9,"./plugins/on":10,"./plugins/routes":11}],9:[function(_dereq_,module,exports){
/*
 * Init plugin
 */
module.exports = function(arg) {
  if (typeof arg === 'function') {
    var that = this;
    // Call async, after jtmpl has constructed the DOM
    setTimeout(function() {
      arg.call(that);
    });
  }
};

},{}],10:[function(_dereq_,module,exports){
module.exports = function(events, target) {
  function addEvent(event) {
    target.addEventListener(
      event,
      function(ev) {
        for (var selector in events[event]) {
          if (ev.target.matches(selector)) {
            var node = ev.target;
            while (!node.__jtmpl__ && node.parentNode) {
              node = node.parentNode;
            }
            events[event][selector].call(node.__jtmpl__, ev);
          }
        }
      }
    );
  }

  for (var event in events) {
    addEvent(event);
  }
};

},{}],11:[function(_dereq_,module,exports){
module.exports = function(routes, target) {
};

},{}],12:[function(_dereq_,module,exports){
/**
 * utemplate
 *
 * @param {string} template
 * @param {function} model - data as Freak instance
 * @param {optional function} onChange - will be called whenever used model property changes
 *
 * @returns {string} - rendered template using model
 *
 * Basic template rendering.
 * Supported tags: {{variable}}, {{#section}}, {{^inverted_section}}
 * (short closing tags {{/}} supported)
 *
 * Does NOT support nested sections, so simple parsing via regex is possible.
 */
function utemplate(template, model, onChange) {
  return template
    // {{#section}} sectionBody {{/}}
    .replace(
      /\{\{#([\w\.\-]+)\}\}(.+?)\{\{\/([\w\.\-]*?)\}\}/g,
      function(match, openTag, body, closeTag, pos) {
        if (closeTag !== '' && closeTag !== openTag) {
          throw 'jtmpl: Unclosed ' + openTag;
        }
        if (typeof onChange === 'function') {
          model.on('change', openTag, onChange);
        }
        var val = openTag === '.' ? model : model(openTag);
        return (typeof val === 'function' && val.len !== undefined) ?
            // Array
            (val.len > 0) ?
              // Non-empty
              val.values
                .map(function(el, i) {
                  return utemplate(body.replace(/\{\{\.\}\}/g, '{{' + i + '}}'), val, onChange);
                })
                .join('') :
              // Empty
              '' :
            // Object or boolean?
            (typeof val === 'function' && val.len === undefined) ?
              // Object
              utemplate(body, val, onChange) :
              // Cast to boolean
              (!!val) ?
                utemplate(body, model, onChange) :
                '';
      }
    )
    // {{^inverted_section}} sectionBody {{/}}
    .replace(
      /\{\{\^([\w\.\-]+)\}\}(.+?)\{\{\/([\w\.\-]*?)\}\}/g,
      function(match, openTag, body, closeTag, pos) {
        if (closeTag !== '' && closeTag !== openTag) {
          throw 'jtmpl: Unclosed ' + openTag;
        }
        if (typeof onChange === 'function') {
          model.on('change', openTag, onChange);
        }
        var val = openTag === '.' ? model : model(openTag);
        return (typeof val === 'function' && val.len !== undefined) ?
            // Array
            (val.len === 0) ?
              // Empty
              utemplate(body, model, onChange) :
              // Non-empty
              '' :
            // Cast to boolean
            (!val) ?
              utemplate(body, model, onChange) :
              '';
      }
    )
    // {{variable}}
    .replace(
      /\{\{([\w\.\-]+)\}\}/g,
      function(match, variable, pos) {
        if (typeof onChange === 'function') {
          model.on('change', variable, onChange);
        }
        return model(variable) === undefined ? '' : model(variable) + '';
      }
    );
}



module.exports = utemplate;

},{}],13:[function(_dereq_,module,exports){
/*

Requests API

*/

    module.exports = function() {
      var i, len, prop, props, request;
      var args = [].slice.call(arguments);

      var xhr = new XMLHttpRequest();

      // Last function argument
      var callback = args.reduce(
        function (prev, curr) {
          return typeof curr === 'function' ? curr : prev;
        },
        null
      );

      var opts = args[args.length - 1];

      if (typeof opts !== 'object') {
        opts = {};
      }

      for (i = 0, props = Object.getOwnPropertyNames(opts), len = props.length;
          i < len; i++) {
        prop = props[i];
        xhr[prop] = opts[prop];
      }

      request =
        (typeof args[2] === 'string') ?

          // String parameters
          args[2] :

          (typeof args[2] === 'object') ?

            // Object parameters. Serialize to URI
            Object.keys(args[2]).map(
              function(x) {
                return x + '=' + encodeURIComponent(args[2][x]);
              }
            ).join('&') :

            // No parameters
            '';

      var onload = function(event) {
        var resp;

        if (callback) {
          try {
            resp = JSON.parse(this.responseText);
          }
          catch (e) {
            resp = this.responseText;
          }
          callback.call(this, resp, event);
        }
      };

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            onload.call(this, 'done');
          }
          else {
            console.log('jtmpl XHR error: ' + this.responseText);
          }
        }
      };

      xhr.open(args[0], args[1],
        (opts.async !== undefined ? opts.async : true),
        opts.user, opts.password);

      xhr.send(request);

      return xhr;

    };

},{}]},{},[6])
(6)
});