var http = require('http');
var querystring = require('querystring');
var fs = require('fs');

// Override so we don't decode spaces, and mess up the base64 encoding
querystring.unescape = function(s, decodeSpaces) {
    return s;
};

// Pad to follow the processing export format
function pad(num) {
    var s = "000" + num;
    return s.substr(s.length-4);
}

http.createServer(function (request, response) {
    request.content = '';
    request.addListener("data", function(data) {
        request.content += data;
    });

    request.addListener("end", function() {
        if (request.content.trim()) {
            request.content = querystring.parse(request.content);
            var data = request.content['data'];
            var frame = request.content['frame'];
            //console.log(data);
            //console.log('--------------------------------------------------------------------------------------------');
            // Remove data:image/png;base64,
            data = data.substr(data.indexOf(',') + 1);
            var buffer = new Buffer(data, 'base64');
            fs.writeFile('screen-' + pad(frame) + '.png',
                         buffer.toString('binary'), 'binary');
        }
    });
    response.writeHead(200, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Requested-With'
    });
    response.end();
}).listen(8080, "127.0.0.1");