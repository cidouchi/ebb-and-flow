var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app).listen(3000);
var io = require('socket.io')(server);

//serve public pages
app.use(express.static('./public')); 

var totalUsers = 0;

io.on('connection', function(socket) {
    
    /* broadcast chat messages */
    socket.on('chat', function(message) {
        socket.broadcast.emit('message', message);
    });


    /* update online user count */
    socket.on('totalUsers', function(req, res){
        socket.emit('totalUsers', totalUsers.toString());
    });
    
    socket.on('userEntered', function(req) {
        totalUsers++;
        socket.broadcast.emit('totalUsers', totalUsers.toString()); 
    });

    socket.on('disconnect', function(req) {
        totalUsers--;
        socket.broadcast.emit('totalUsers', totalUsers.toString()); 
    });


    /* sync YouTube videos */

});


/* Event listener for HTTP server "listening" event */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

onListening();