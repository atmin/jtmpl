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
