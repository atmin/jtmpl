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
