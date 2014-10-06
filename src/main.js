require('./polyfills/matches');

var jtmpl = require('jtmpl-core/src/main');

jtmpl.plugins.on = require('./plugins/on');
jtmpl.plugins.routes = require('./plugins/routes');

module.exports = jtmpl;
