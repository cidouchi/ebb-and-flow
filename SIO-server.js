var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app).listen(3000);
var io = require('socket.io')(server);
const embedify = require('embedify');
const options = { parse: true };
const oEmbed = embedify.create(options);

//serve public pages
app.use(express.static('./public')); 

var totalUsers = 0;
var vidQueue = [];
var playlistInfo = [];
var default_vid = 'https://www.youtube.com/embed/qELSSAspRDI';
var curr_video = default_vid;
var curr_time = 0;

var lastTop = 0;
var lastLeft = 0;
var commOffset = 0.4;

io.on('connection', function(socket) {
    
    var userTag = '';

    /***********************************/
    /* initial set-up for each client  */
    /***********************************/

    /* set user tag */
    socket.on('setTag', function(tag) {
        userTag = tag;
    });


    /* broadcast chat messages */
    socket.on('chat', function(message) {
        //create message position
        var top = Math.random() * 80;
        var left = Math.random() * 80;

        while (Math.abs(lastTop - top) < 10) {
            top = Math.random() * 80;
        }
        while (Math.abs(lastLeft - left) < 10) {
            left = Math.random() * 80;
        }
        lastTop = top;
        lastLeft = left;

        socket.emit('message', {tag: userTag, message: message, top: top, left: left});
        socket.broadcast.emit('message', {tag: userTag, message: message, top: top, left: left});
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

    /* update playlist */
    socket.emit('updatePlaylist', playlistInfo);

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
        /* update client playlists */
        oEmbed.get(vid_url).then(function(res) {
                playlistInfo.push({title: res[0].title, image: res[0].image.url});
                socket.emit('updatePlaylist', playlistInfo);
                socket.broadcast.emit('updatePlaylist', playlistInfo);
            });
    });

    /* remove current video from queue when client finishes */
    socket.on('finishVideo', function(vid_url) {
        //check that video request to remove is actually at end of queue
        if (vidQueue[vidQueue.length-1] == vid_url) {
            vidQueue.pop();
            oEmbed.get(vid_url).then(function(res) {
                playlistInfo.shift();
                socket.emit('updatePlaylist', playlistInfo);
                socket.broadcast.emit('updatePlaylist', playlistInfo);
            });
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
            if (status.time-commOffset > curr_time) {
                curr_time = status.time;
            } else if (status.time+commOffset < curr_time) {
                socket.emit('seekVideo', curr_time+commOffset); 
            }
        }
    });

    /* update playlist */
    socket.on('deleteVideo', function(index){
        playlistInfo.splice(index, 1);
        var vidQueueIndex = vidQueue.length - 1 - index;
        vidQueue.splice(vidQueueIndex, 1);
        socket.emit('updatePlaylist', playlistInfo);
        socket.broadcast.emit('updatePlaylist', playlistInfo);

        //video to delete is playing now
        if (index == 0) {
            if (vidQueue.length == 0) curr_video = default_vid;
            else curr_video = vidQueue[vidQueue.length-1]; 

            //reset time
            curr_time = 0;
            socket.emit('playVideo', curr_video);
            socket.broadcast.emit('playVideo', curr_video);   
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