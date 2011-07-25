
// Register exception handler
process.on('uncaughtException', function(err) {
    console.log('Exception was thrown ' + err);
    process.exit(1);
});

// Mandatory environment variables check.
var twitterId = process.env.TW_ID;
var twitterPass = process.env.TW_PASS;

if (!twitterId || !twitterPass) {
    console.log('This app requires environment variables TW_ID and TW_PASS to connect Twitter streaming API.');
    process.exit(1);
}

// Module dependencies
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var TwitterStreamingAPI = require('./lib/twitter.js').TwitterStreamingAPI;
var twitterStream = new TwitterStreamingAPI();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

io.configure(function(){
    io.set('log level', 1);
});

// Routes
app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

// Socket IO
var users = 0;
io.sockets.on('connection', function(socket) {
    if (users++ == 0) {
        twitterStream.listen(io, twitterId, twitterPass);
    }
    console.log('users = ' + users);
    socket.on('disconnect', function() {
        if (--users <= 0) {
            users = 0;
            twitterStream.stop();
        }
        console.log('users = ' + users);
        socket.emit('leave');
    });
});

// Main
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

