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
                    (i < len) && !matchEndBlock(rules[ri].block(match), node.innerHTML || '');
                    i++, node = childNodes[i]) {
                  block.appendChild(node.cloneNode(true));
                }

                if (i === len) {
                  throw 'jtmpl: Unclosed ' + rules[ri].block(match);
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
