(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jtmpl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var RE_DELIMITED_VAR = /^\{\{([\w\.\-]+)\}\}$/;


/*
 * Attribute rules
 *
 */
module.exports = [

  /**
   * value="{{var}}"
   */
  {
    id: 'var',
    match: function(node, attr) {
      return attr === 'value' && node.getAttribute(attr).match(RE_DELIMITED_VAR);
    },
    prop: function(match) {
      return match[1];
    },
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
  },




  /**
   * selected="{{var}}"
   */
  {
    id: 'selected_var',
    match: function(node, attr) {
      return attr === 'jtmpl-selected' && node.getAttribute(attr).match(RE_DELIMITED_VAR);
    },
    prop: function(match) {
      return match[1];
    },
    rule: function(node, attr, model, prop, globals) {

      function change() {
        if (node.nodeName === 'OPTION') {
          var i = globals.selects.indexOf(node.parentNode);
          if (globals.selectsUpdating[i]) {
            return;
          }
          for (var j = 0, len = globals.selectOptions[i].length; j < len; j++) {
            globals.selectOptions[i][j].selected = globals.selectOptionsContexts[i][j](prop);
          }
        }
        else {
          node.selected = model(prop);
        }
      }

      if (node.nodeName === 'OPTION') {

        // Process async, as parentNode is still documentFragment
        setTimeout(function() {
          var i = globals.selects.indexOf(node.parentNode);
          if (i === -1) {
            // Add <select> to list
            i = globals.selects.push(node.parentNode) - 1;
            // Init options
            globals.selectOptions.push([]);
            // Init options contexts
            globals.selectOptionsContexts.push([]);
            // Attach change listener
            node.parentNode.addEventListener('change', function() {
              globals.selectsUpdating[i] = true;
              for (var oi = 0, olen = globals.selectOptions[i].length; oi < olen; oi++) {
                globals.selectOptionsContexts[i][oi](prop, globals.selectOptions[i][oi].selected);
              }
              globals.selectsUpdating[i] = false;
            });
          }
          // Remember option and context
          globals.selectOptions[i].push(node);
          globals.selectOptionsContexts[i].push(model);
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
  },




  /**
   * checked="{{var}}"
   */
  {
    id: 'checked_var',
    match: function(node, attr) {
      return attr === 'jtmpl-checked' && node.getAttribute(attr).match(RE_DELIMITED_VAR);
    },
    prop: function(match) {
      return match[1];
    },
    rule: function(node, attr, model, prop, globals) {

      function change() {
        if (node.name) {
          if (globals.radioGroupsUpdating[node.name]) {
            return;
          }
          for (var i = 0, len = globals.radioGroups[node.name][0].length; i < len; i++) {
            globals.radioGroups[node.name][0][i].checked = globals.radioGroups[node.name][1][i](prop);
          }
        }
        else {
          node.checked = model(prop);
        }
      }

      function init() {
        // radio group?
        if (node.type === 'radio' && node.name) {
          if (!globals.radioGroups[node.name]) {
            // Init radio group ([0]: node, [1]: model)
            globals.radioGroups[node.name] = [[], []];
          }
          // Add input to radio group
          globals.radioGroups[node.name][0].push(node);
          // Add context to radio group
          globals.radioGroups[node.name][1].push(model);
        }

        node.addEventListener('click', function() {
          if (node.type === 'radio' && node.name) {
            globals.radioGroupsUpdating[node.name] = true;
            // Update all inputs from the group
            for (var i = 0, len = globals.radioGroups[node.name][0].length; i < len; i++) {
              globals.radioGroups[node.name][1][i](prop, globals.radioGroups[node.name][0][i].checked);
            }
            globals.radioGroupsUpdating[node.name] = false;
          }
          else {
            // Update current input only
            model(prop, node.checked);
          }
        });

        model.on('change', prop, change);
        setTimeout(change);
      }

      setTimeout(init);
    }
  },




  /**
   * attribute="{{var}}"
   */
  {
    id: 'attribute_var',
    match: function(node, attr) {
      return node.getAttribute(attr).match(RE_DELIMITED_VAR);
    },
    prop: function(match) {
      return match[1];
    },
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
  },




  /**
   * Fallback rule, process via @see utemplate
   * Strip jtmpl- prefix
   */
  {
    id: 'utemplate',
    match: function(node, attr) {
      return { template: node.getAttribute(attr) };
    },
    prop: function(match) {
      return match.template;
    },
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
  }

];

},{}],3:[function(require,module,exports){
/*
 * Node rules
 *
 */
var RE_BEGIN = /^\s*/.source;
var RE_END = /\s*$/.source;
var RE_IDENTIFIER = /([\w\.\-]+)/.source;
var RE_IDENTIFIER_PIPE = /([\w\.\-]+)\s*(?:\|(.*))?/.source;

module.exports = [
  /**
   * {{var}}
   */
  {
    id: 'var',
    match: function(node) {
      return node.innerHTML.match(RegExp(RE_BEGIN + RE_IDENTIFIER_PIPE + RE_END));
    },
    prop: function(match) {
      return match;
    },
    rule: function(fragment, model, prop) {
      var textNode = document.createTextNode(jtmpl._get(model, prop[1], prop[2]) || '');
      fragment.appendChild(textNode);
      model.on('change', prop[1], function() {
        textNode.data = jtmpl._get(model, prop[1], prop[2]) || '';
      });
    }
  },



  /**
   * {{&var}}
   */
  {
    id: 'not_var',
    match: function(node) {
      return node.innerHTML.match(RegExp(RE_BEGIN + '&' + RE_IDENTIFIER + RE_END));
    },
    prop: function(match) {
      return match;
    },
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

        el.innerHTML = jtmpl._get(model, prop[1], prop[2]) || '';
        length = el.childNodes.length;
        for (i = 0; i < length; i++) {
          frag.appendChild(el.childNodes[0]);
        }
        anchor.parentNode.insertBefore(frag, anchor);
      }

      fragment.appendChild(anchor);
      model.on('change', prop[1], change);
      change();
    }
  },



  /**
   * {{>partial}}
   */
  {
    id: 'partial',
    match: function(node) {
      // match: [1]=var_name, [2]='single-quoted' [3]="double-quoted"
      return node.innerHTML.match(/>([\w\.\-]+)|'([^\']*)\'|"([^"]*)"/);
    },
    prop: function(match) {
      return match;
    },
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
  },



  /**
   * {{#section}}
   */
  {
    id: 'section',
    match: function(node) {
      return node.innerHTML.match(RegExp(RE_BEGIN + '#' + RE_IDENTIFIER_PIPE + RE_END));
    },
    block: function(match) {
      return match;
    },
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
          var arr = prop[1] === '.' ? model : jtmpl._get(model, prop[1], prop[2]);

          while (size--) {
            parent.removeChild(parent.childNodes[pos]);
          }
          parent.insertBefore(
            template(arr(i)),
            parent.childNodes[pos]
          );
        };
      }

      function insert(index, count) {
        var parent = anchor.parentNode;
        var i, fragment, render;
        var arr = prop[1] === '.' ? model : model(prop[1]);//jtmpl._get(model, prop[1], prop[2]);

        for (i = 0, fragment = document.createDocumentFragment();
            i < count; i++) {
          render = template(arr(index + i));
          chunkSize = render.childNodes.length;
          fragment.appendChild(render);
        }

        var anchorIndex = [].indexOf.call(parent.childNodes, anchor);
        var pos = anchorIndex - length + index * chunkSize;
        var size = count * chunkSize;

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
        var val = prop[1] === '.' ? model : model(prop[1]); //jtmpl._get(model, prop[1], prop[2]);
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
          var child, childModel;
          for (i = 0, len = val.values.length; i < len; i++) {
            // TODO: implement event delegation for array indexes
            // Also, using val.values[i] instead of val[i]
            // saves A LOT of heap memory. Figure out how to do
            // on demand model creation.
            val.on('change', i, update(i));
            //render.appendChild(eval(template + '(val(i))'));
            //render.appendChild(template(val.values[i]));
            childModel = val(i);
            child = template(childModel);
            child.__jtmpl__ = childModel;
            render.appendChild(child);
          }

          length = render.childNodes.length;
          chunkSize = ~~(length / len);
          anchor.parentNode.insertBefore(render, anchor);
        }

        // Object?
        else if (typeof val === 'function' && val.len === undefined) {
          render = template(val);
          length = render.childNodes.length;
          chunkSize = length;
          anchor.parentNode.insertBefore(render, anchor);
          anchor.parentNode.__jtmpl__ = model;
        }

        // Cast to boolean
        else {
          if (!!val) {
            render = template(model);
            length = render.childNodes.length;
            chunkSize = length;
            anchor.parentNode.insertBefore(render, anchor);
          }
        }
      }

      fragment.appendChild(anchor);
      change();
      model.on('change', prop[1], change);
    }
  },



  /**
   * {{^inverted_section}}
   */
  {
    id: 'inverted_section',
    match: function(node) {
      return node.innerHTML.match(RE_BEGIN + '\\^' + RE_IDENTIFIER_PIPE + RE_END);
    },
    block: function(match) {
      return match;
    },
    rule: function(fragment, model, prop, template) {

      // Anchor node for keeping section location
      var anchor = document.createComment('');
      // Number of rendered nodes
      var length = 0;

      function change() {
        var val = prop[1] === '.' ? model : model(prop[1]); //jtmpl._get(model, prop[1], prop[2]);
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
            render.appendChild(template(val(i)));
          }

          length = render.childNodes.length;
          anchor.parentNode.insertBefore(render, anchor);
        }
        // Cast to boolean
        else {
          if (!val) {
            render = template(model);
            length = render.childNodes.length;
            anchor.parentNode.insertBefore(render, anchor);
          }
        }
      }

      fragment.appendChild(anchor);
      change();
      model.on('change', prop[1], change);
    }

  },


  /*
   * Fallback rule, not recognized jtmpl tag, emit verbatim
   */
  {
    id: 'emit_verbatim',
    match: function(node) {
      return node.innerHTML;
    },
    prop: function(match) {
      return match;
    },
    rule: function(fragment, model, match) {
      fragment.appendChild(document.createTextNode(match));
    }
  }
];

},{}],4:[function(require,module,exports){
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

  depth = (depth || 0) + 1;

  function indented(lines, fix) {
    fix = fix || 0;
    for (var i = 0, ind = ''; i < (depth || 0) + fix; i++) {
      ind += '  ';
    }
    return lines
      .map(function(line) {
        return ind + line;
      })
      .join('\n') + '\n';
  }

  // Generate dynamic function body
  var func = indented(['(function(model) {'], -1);
  func += indented(['var frag = document.createDocumentFragment(), node;']);

  if (depth === 1) {
    // Global bookkeeping
    func += indented([
      'var globals = {',
      '  radioGroups: {},',
      '  radioGroupsUpdating: {},',
      '  selects: [],',
      '  selectsUpdating: [],',
      '  selectOptions: [],',
      '  selectOptionsContexts: []',
      '};'
    ]);
  }

  // Wrap model in a Freak instance, if necessary
  func += indented(['model = jtmpl.normalizeModel(model);']);

  // Iterate childNodes
  for (var i = 0, childNodes = template.childNodes, len = childNodes.length, node;
       i < len; i++) {

    node = childNodes[i];

    switch (node.nodeType) {

      // Element node
      case 1:

        // jtmpl tag?
        if (node.nodeName === 'SCRIPT' && node.type === 'text/jtmpl-tag') {

          for (ri = 0, rules = require('./compile-rules-node'), rlen = rules.length;
              ri < rlen; ri++) {

            match = rules[ri].match(node);

            // Rule found?
            if (match) {

              // Block tag?
              if (rules[ri].block) {

                // Fetch block template
                block = document.createDocumentFragment();
                for (i++, node = childNodes[i];
                    (i < len) && !matchEndBlock(rules[ri].block(match[1]), node.innerHTML || '');
                    i++, node = childNodes[i]) {
                  block.appendChild(node.cloneNode(true));
                }

                if (i === len) {
                  throw 'jtmpl: Unclosed ' + rules[ri].block(match[1]);
                }
                else {
                  func += indented([
                    'jtmpl.rules.node.' + rules[ri].id + '(',
                    '  frag,',
                    '  model,',
                    '  ' + JSON.stringify(rules[ri].block(match)) + ',',   // prop
                  ]);
                  func +=
                    compile(
                      block,
                      '', //sourceURL && (sourceURL + '-' + node.innerHTML + '[' + i + ']'),
                      depth + 1
                    ) + ', ';
                  func += indented([
                    '  globals',
                    ');'
                  ]);
                }

              }
              // Inline tag
              else {
                func += indented(['jtmpl.rules.node.' + rules[ri].id +
                  '(frag, model, ' + JSON.stringify(rules[ri].prop(match)) + ');']);
              }

              // Skip remaining rules
              break;
            }
          } // end iterating node rules
        }

        else {
          // Create element
          func += indented([
            'node = document.createElement("' + node.nodeName + '");',
            'node.__jtmpl__ = model;'
          ]);

          // Process attributes
          for (var ai = 0, attributes = node.attributes, alen = attributes.length;
               ai < alen; ai++) {

            for (ri = 0, rules = require('./compile-rules-attr'), rlen = rules.length;
                ri < rlen; ri++) {

              match = rules[ri].match(node, attributes[ai].name.toLowerCase());

              if (match) {

                // Match found, append rule to func
                func += indented([
                  'jtmpl.rules.attr.' + rules[ri].id +
                  '(node, ' +
                  JSON.stringify(attributes[ai].name) + // attr
                  ', model, ' +
                  JSON.stringify(rules[ri].prop(match)) + // prop
                  ', globals);'
                ]);

                // Skip other attribute rules
                break;
              }
            }
          }

          if (node.nodeName !== 'INPUT') {
            // Recursively compile
            func += indented(['node.appendChild(']);
            func +=
              compile(
                node,
                '', //sourceURL && (sourceURL + '-' + node.nodeName + '[' + i + ']'),
                depth + 1
              );
            func += indented([
              '  (model)',
              ');'
            ]);
          }

          // Append to fragment
          func += indented(['frag.appendChild(node);']);
        }

        break;


      // Text node
      case 3:
        func += indented(['frag.appendChild(document.createTextNode(' +
          JSON.stringify(node.data) + '));']);
        break;


      // Comment node
      case 8:
        func += indented(['frag.appendChild(document.createComment(' +
          JSON.stringify(node.data) + '));']);
        break;

    } // end switch
  } // end iterate childNodes

  func += indented([
    '  return frag;',
    '})'
  ], -1);
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

},{"./compile-rules-attr":2,"./compile-rules-node":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
module.exports = {
  init: require('./plugins/init'),
  on: require('./plugins/on'),
  routes: require('./plugins/routes')
};

},{"./plugins/init":8,"./plugins/on":9,"./plugins/routes":10}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
module.exports = function(routes, target) {
};

},{}],11:[function(require,module,exports){
typeof Element !== 'undefined' && (function(ElementPrototype) {
  ElementPrototype.matches = ElementPrototype.matches ||
    ElementPrototype.mozMatchesSelector ||
    ElementPrototype.msMatchesSelector ||
    ElementPrototype.oMatchesSelector ||
    ElementPrototype.webkitMatchesSelector ||
    function (selector) {
      var node = this,
      nodes = (node.parentNode || node.document).querySelectorAll(selector),
      i = -1;
      while (nodes[++i] && nodes[i] != node);
      return !!nodes[i];
    };
})(Element.prototype);

},{}],12:[function(require,module,exports){
/*
 * Prepare runtime for jtmpl compiled functions
 */
module.exports = function() {
  var rules = {
    node: {},
    attr: {}
  };
  require('./compile-rules-node').forEach(function(rule) {
    rules.node[rule.id] = rule.rule;
  });
  require('./compile-rules-attr').forEach(function(rule) {
    rules.attr[rule.id] = rule.rule;
  });
  return rules;
};

},{"./compile-rules-attr":2,"./compile-rules-node":3}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
/*
 * Main function
 */
function jtmpl() {
  var args = [].slice.call(arguments);
  var target, t, template, model;

  // jtmpl('HTTP_METHOD', url[, parameters[, callback[, options]]])?
  if (['GET', 'POST'].indexOf(args[0]) > -1) {
    return require('./xhr').apply(null, args);
  }

  // jtmpl(object)?
  else if (args.length === 1 && typeof args[0] === 'object') {
    // return Freak instance
    return require('freak')(args[0]);
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
              require('./loader')
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
    /* jshint evil: true */
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
  var loader = require('./loader');
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

jtmpl.parse = require('./parse');
jtmpl.compile = require('./compile');
jtmpl.loader = require('./loader');
jtmpl.utemplate = require('./utemplate');
jtmpl._get = function(model, prop, pipe) {
  var val = model(prop);
  return (typeof val === 'function') ?
    JSON.stringify(val.values) :
    pipe ?
      jtmpl.applyPipe(val, pipe, model.root.values.__filters__) :
      val;
};
jtmpl.applyPipe = function(val, pipe, filters) {
  pipe = pipe.split('|');
  for (var i=0, len=pipe.length; i < len; i++) {
    val = filters[pipe[i].trim()](val);
  }
  return val;
};


/*
 * Init runtime
 */

jtmpl.rules = require('./prepare-runtime')();
jtmpl.normalizeModel = function(model) {
  return typeof model === 'function' ?
    model :
    typeof model === 'object' ?
      jtmpl(model) :
      jtmpl({'.': model});
};

/*
 * Polyfills
 */
require('./polyfills/matches');


/*
 * Plugins
 */
jtmpl.plugins = require('./plugins');


/*
 * Export
 */
module.exports = jtmpl;
if (typeof window !== 'undefined') window.jtmpl = jtmpl;
if (typeof define === 'function') define('jtmpl', [], jtmpl);

},{"./compile":4,"./loader":5,"./parse":6,"./plugins":7,"./polyfills/matches":11,"./prepare-runtime":12,"./utemplate":13,"./xhr":14,"freak":1}]},{},[15])(15)
});