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
