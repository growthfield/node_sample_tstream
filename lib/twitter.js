var http = require('http');

exports.TwitterStreamingAPI = TwitterStreamingAPI;

function TwitterStreamingAPI() {
}

TwitterStreamingAPI.prototype.listen = function(io, user, pass) {
    if (this._request) {
        return;
    }
    console.log('Start listening to twitter stream.');
    var auth = 'Basic ' + new Buffer(user + ':' + pass).toString('base64');
    var options = {
        method: 'GET',
        host: 'stream.twitter.com',
        path: '/1/statuses/sample.json',
        headers: {Authorization: auth}
    };
    this._request = http.request(options);
    this._request.on('response', function(res) {
        if (res.statusCode != 200) {
            throw new Error('Twitter streaming API returned status code ' + res.statusCode);
        }
        var buff = '';
        res.on('data', function(chunk) {
            buff += chunk;
            var lidx = buff.lastIndexOf('\r');
            if (lidx == -1) {
                return;
            }
            var tweets = buff.substring(0, lidx);
            tweets.split('\r').forEach(function(tweet) {
                if (io) {
                    io.sockets.emit('tweet', tweet);
                }
            });
            buff = buff.substring(lidx);
        });
        res.on('end', function() {
            console.log('stream end!!');
        });
    });
    this._request.on('error', function(e) {
        console.log('stream error!! ' + e);
        throw e;
    });
    this._request.end();
}

TwitterStreamingAPI.prototype.stop = function() {
    console.log('Stop listening to twitter stream');
    if (this._request) {
        this._request.abort(); 
        delete this._request;
    }
}
