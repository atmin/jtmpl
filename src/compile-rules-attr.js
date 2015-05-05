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
