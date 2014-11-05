var static = require('node-static');

var fileServer = new static.Server('spec');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(parseInt(process.env.PORT));
