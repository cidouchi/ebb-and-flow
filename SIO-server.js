var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app).listen(3000);
var io = require('socket.io')(server);

//serve public pages
app.use(express.static('./public')); 

var totalUsers = 0;
var vidQueue = [];
var default_vid = 'https://www.youtube.com/embed/qELSSAspRDI';
var curr_video = default_vid;
var curr_time = 0;

io.on('connection', function(socket) {
    
    /* broadcast chat messages */
    socket.on('chat', function(message) {
        socket.broadcast.emit('message', message);
    });

    /* update online user count */
    socket.on('totalUsers', function(req, res){
        socket.emit('totalUsers', totalUsers.toString());
    });
    
    /* add to online user count */
    socket.on('userEntered', function(req) {
        totalUsers++;
        socket.emit('totalUsers', totalUsers.toString());
        socket.broadcast.emit('totalUsers', totalUsers.toString()); 
    });

    /* subtract from online user count */
    socket.on('disconnect', function(req) {
        totalUsers--;
        socket.broadcast.emit('totalUsers', totalUsers.toString()); 
    });

    /***********************/
    /* sync YouTube videos */
    /***********************/
    
    /* add client submissions to video queue */
    socket.on('addVideo', function(vid_url) {
        //if queue empty, play now
        if (vidQueue.length == 0) {
            curr_time = 0;
            curr_video = vid_url;
            socket.emit('playVideo', curr_video);
            socket.broadcast.emit('playVideo', curr_video);        
        } 
        //add to front of queue
        vidQueue.unshift(vid_url);
    });

    /* remove current video from queue when client finishes */
    socket.on('removeVideo', function(vid_url) {
        //check that video request to remove is actually at end of queue
        if (vidQueue[vidQueue.length-1] == vid_url) {
            vidQueue.pop();
        }
        //if queue empty, play default video
        if (vidQueue.length == 0) {
            curr_video = default_vid;
        } else {
            //get last video in queue
            curr_video = vidQueue[vidQueue.length-1];  
        }
        curr_time = 0;
        socket.emit('playVideo', curr_video);
        socket.broadcast.emit('playVideo', curr_video);   
    });

    /* sync video play across users */
    socket.on('currStatus', function(status) {
        if (status.vid !== curr_video) {
            socket.emit('playVideo', curr_video);
            socket.emit('seekVideo', curr_time);
        }
        else {
            if (status.time > curr_time) {
                curr_time = status.time;
            } else if (status.time < curr_time) {
                socket.emit('seekVideo', curr_time+0.523);
            }
        }
    });

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