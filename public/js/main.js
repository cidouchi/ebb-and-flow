var socket = io('http://localhost:3000');
//default video
var default_vid = 'https://www.youtube.com/embed/qELSSAspRDI';
var curr_vid = default_vid;

socket.on('connect', function() {
    socket.emit('userEntered', ''); //notify server to add to user total
   $('div.login-screen').fadeIn();
   $('div.cover').fadeIn();
   $('#player').addClass('animated fadeInDown');
});

//update users online
socket.on('totalUsers', function(users) {
    $('div.users-online #text').text(users + ' users online');
});

//display other users' chat messages
socket.on('message', function(data) {
    var message = '<span id="tag">[' + data.tag + ']' + '</span><br/>' + data.message;
    printMessage(message, data.top, data.left);
});

//display updated playlist
socket.on('updatePlaylist', function(playlistInfo) {
    /* delete old list items */
    var parent = document.querySelector('div.menu-container');
    var child = document.querySelector('div.menu-container ol');
    parent.removeChild(child);
    /* create new list container */
    var list = document.createElement('ol');
    document.querySelector('div.menu-container').appendChild(list);
    /* create new list items */
    var index = 0;
    playlistInfo.forEach( function (vidInfo) {
        var playlistElem = document.createElement('li');
        $(playlistElem).attr('value', index.toString());
        playlistElem.innerHTML = 
                '<img src=' + vidInfo.image + '>' + 
                '<span id="text">' + vidInfo.title + '</span>' + 
                '<i class="fa fa-times-circle fa-lg" aria-hidden="true"></i>' ;

        document.querySelector('div.menu-container ol').appendChild(playlistElem);
        index++;
    });
    $('.fa-times-circle').click( function() {
       var index = this.parentElement.value;
       socket.emit('deleteVideo', index);
    });
});

//tab title
document.title = 'ebb & flow'

//import chat message sound
var msg_snd = new Audio('/chat.mp3');
var messageSoundOn = false;

/* playlist display button */
$('.fa-bars').click(function() {
    $('div.menu-container').show();

    if ( $('div.menu-container').hasClass('slideInLeft') ) {
        $('div.cover').fadeOut();
        $('div.menu-container').removeClass('animated slideInLeft');
        $('div.menu-container').addClass('animated slideOutLeft');
        
    } else {
        $('div.cover').fadeIn();
        $('div.menu-container').addClass('animated slideInLeft');
        if ($('div.menu-container').hasClass('slideOutLeft') ){ 
            $('div.menu-container').removeClass('slideOutLeft');
        }
    }
});

/* update display when film button clicked */
$('.fa-film').click(function (){
    $('#player').toggleClass('animated fadeInDown');
    $('#player').toggleClass('animated fadeOutUp');
    var half_width = $(window).width()/2;
    half_width = half_width.toString() + 'px';
    if ($('div.messages-container').css('width') == half_width) {
        $('div.messages-container').css('width','100%');
    } else {
        $('div.messages-container').css('width','50%');
    }
});

/* update display when lighbulb clicked */
$('.fa-lightbulb-o').click(function () {
    if ($('div.messages-container').css('color') !== 'rgb(255, 255, 255)'){
        $('div.messages-container').css('color', 'white');
        $('.fa:not(.fa-commenting, .fa-youtube-play, .menu-container .fa-bars, .fa-times-circle), div.users-online')
            .attr('style', 'color:white');
        $('.starry-night').addClass('animated fadeIn');
        $('.starry-night').fadeIn();
        $('input').attr('style', 'background-color: black; color:white; border: 1px solid grey; opacity: 0.5;');
    } else {
        $('div.messages-container').css('color', 'rgb(0, 0, 0)');
        $('.fa:not(.fa-commenting, .fa-youtube-play, .menu-container .fa-bars, .fa-times-circle), div.users-online')
            .attr('style', 'color: #4d4d4d');
        $('.starry-night').removeClass('animated fadeIn');
        $('.starry-night').fadeOut();
        $('input').attr('style', '');
    }
    
});

/* volume control */
$('.fa-volume-off').hide();
$('.fa-volume-up').click( function () {
    $('.fa-volume-up').hide();
    $('.fa-volume-off').show();
    player.mute();
    messageSoundOn = false;
});

 $('.fa-volume-off').click( function () {
    $('.fa-volume-off').hide();
    $('.fa-volume-up').show();
    player.unMute();
    messageSoundOn = true;
 });

/* chat message input */
document.forms['chat'].onsubmit = function () {
    var input = document.querySelector('#message');
    if (input.value.trim() !== '') {
        socket.emit('chat', input.value);
        input.value = '';
    }
}

function deleteMessage(message) {
    $(message).addClass('fadeOutDown');
    window.setTimeout(function() {$(message).remove()}, 500); 
}

/* display message */
function printMessage(message, top, left) {
    var insert = document.createElement('p');
    insert.innerHTML= message.trim();
    insert.setAttribute('id', 'chat-msg')
    insert.style.top = top + '%';
    insert.style.left = left + '%';
    document.querySelector('div.messages-container').appendChild(insert);
    $(insert).addClass('animated fadeInUp');
   
    //message sound
    if (messageSoundOn && message.trim() !== '') msg_snd.play();

    //delete message
    window.setTimeout(function() {deleteMessage(insert)}, 4000); 
}

/* create youtube player */
var player;
function onYouTubePlayerAPIReady() {
    player = new YT.Player('player', {
      width: '45%',
      height: '70%',
      playerVars: {'start': 0, 'autoplay':0, 'controls':0, 'rel':0, 'showinfo':0, 'iv_load_policy':3},
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
}

// returns true if YouTube link is valid, false otherwise 
function isLinkValid(link) {
    var mustInclude = 'youtube.com/watch?v=';
    var notInclude = '&';
    return (link.includes(mustInclude) && !link.includes(notInclude));
}

/* convert valid YouTube link to embedded link */
function makeEmbedded(link) {
    var start_index = link.search('=') + 1;
    var vid_id = link.slice(start_index);
    var res = "https://www.youtube.com/embed/" + vid_id;
    return res;
}

//called when video player ready
function onPlayerReady(event) {
    //play static vid initially
    player.mute();
    player.loadVideoByUrl({ mediaContentUrl : default_vid});
}

// when video ends
function onPlayerStateChange(event) {        
    if (event.data === YT.PlayerState.ENDED) {     
        socket.emit('finishVideo', curr_vid);
    }
}

/* youtube link input */
document.forms['link-input'].onsubmit = function () {
    var input = document.querySelector('#link');

    if (isLinkValid(input.value)) {
        var vid_url = makeEmbedded(input.value.trim());
        socket.emit('addVideo', vid_url);
        
        //toast animation
        $('#toast').addClass('show animated bounceIn');
        $('#toast').fadeIn();
        window.setTimeout(function(){
            $('#toast').fadeOut(1000);
            $('#toast').removeClass('animated bounceIn');
        } , 1000);

        //reset
        input.value = '';
    }
}

/* new user tag input */
document.forms['userInput'].onsubmit = function () {
    var input = document.querySelector('#userId');
    if (input.value.trim() !== '') {
        socket.emit('setTag', input.value.trim());
        $('div.login-screen').fadeOut();
        $('div.cover').fadeOut();
        player.unMute();
        messageSoundOn = true;
    }
    input.value='';
}

//load video
socket.on('playVideo', function(vid_url) {
    curr_vid = vid_url;
    player.loadVideoByUrl({ mediaContentUrl : curr_vid});
});

//skip time in video
socket.on('seekVideo', function(time) {
    player.seekTo(time);
});

/* polling to sync video streaming */
window.setInterval( function() {
    var curr_time = player.getCurrentTime();
    socket.emit('currStatus', {vid: curr_vid, time: curr_time});
}, 1000);




