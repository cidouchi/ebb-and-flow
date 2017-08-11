var socket = io('http://localhost:3000');

socket.on('connect', function() {
    socket.emit('userEntered', ''); //notify server to add to user total
    socket.emit('totalUsers', ''); //ask server for user count
   //??prompt popup required focused form asking for user tag
   //??add to online user count 
});

//update users online
socket.on('totalUsers', function(users) {
    $('div.users-online #text').text(users + ' users online');
});

//display other users' chat messages
socket.on('message', function(message) {
    printMessage(message);
});

//tab title
document.title = 'ebb & flow'

//import chat message sound
var msg_snd = new Audio('/chat.mp3');


$('#player').addClass('animated fadeInDown');


$('.fa-bars').click(function() {
    $('div.menu-container').show();
    if ( $('div.menu-container').hasClass('slideInLeft') ) {
        $('div.menu-container').removeClass('slideInLeft');
        $('div.menu-container').addClass('slideOutLeft');
    } else {
        $('div.menu-container').addClass('slideInLeft');
        if ($('div.menu-container').hasClass('slideOutLeft') ){ 
            $('div.menu-container').removeClass('slideOutLeft');
        }
}});


$('.fa-film').click(function(){
    $('#player').toggleClass('animated fadeInDown');
    $('#player').toggleClass('animated fadeOutUp');
});


$('.fa-lightbulb-o').click(function () {
    if ($('div.messages-container').css('color') !== 'rgb(255, 255, 255)'){
        $('div.messages-container').css('color', 'white');
        $('div.users-online #text').css('color','white');
        $('.fa').attr('style', 'color:white');
        $('.starry-night').addClass('animated fadeIn');
        $('.starry-night').fadeIn();
        $('input').attr('style', 'background-color: black; color:white; border: 1px solid grey;');
    } else {
        $('div.messages-container').css('color', 'rgb(0, 0, 0)');
        $('div.users-online #text').css('color','');
        $('.fa').attr('style', 'color:black');
        $('.starry-night').removeClass('animated fadeIn');
        $('.starry-night').fadeOut();
        $('input').attr('style', '');
    }
    
});


document.forms[0].onsubmit = function () {
    var input = document.querySelector('#message');
    printMessage(input.value);
    socket.emit('chat', input.value);
    input.value = '';
}

function deleteMessage(message) {
    $(message).addClass('fadeOutDown');
}

/* display message */
function printMessage(message) {
    var insert = document.createElement('p');
    insert.innerText = message;
    insert.setAttribute('id', 'chat-msg')
    
    // randomize position
    var top = Math.random() * 90;
    var left = Math.random() * 90;
    insert.style.top = top + '%';
    insert.style.left = left + '%';
    document.querySelector('div.messages-container').appendChild(insert);
    $(insert).addClass('animated fadeInUp');
    if (message !== '') msg_snd.play();

    //delete message
    window.setTimeout(function() {deleteMessage(insert)}, 6000);
}

// "https://www.youtube.com/embed/XGSy3_Czz8k?start=140&rel=0&showinfo=0&iv_load_policy=3&controls=0&autoplay=1"

// create youtube player
var player;
function onYouTubePlayerAPIReady() {
    player = new YT.Player('player', {
      width: '530',
      height: '395',
      playerVars: {'start': 0, 'autoplay':0, 'controls':1, 'rel':0, 'showinfo':0, 'iv_load_policy':3},
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
}

function makeEmbedded(link) {
    var start_index = link.search('=') + 1;
    var vid_id = link.slice(start_index);
    var res = "https://www.youtube.com/embed/" + vid_id;
    return res;
}


//called when video player ready
function onPlayerReady(event) {
    //play static vid initially
    player.loadVideoById('qELSSAspRDI', 20, 'default'); //default video
}

var vid_queue = []

// when video ends
function onPlayerStateChange(event) {        
    if (event.data === YT.PlayerState.ENDED) {     
        //queue not empty
        if ( vid_queue.length > 0 ){
            player.loadVideoByUrl({ mediaContentUrl : vid_queue[vid_queue.length-1]});
            vid_queue.pop();
        //empty queue, play default video
        } else { 
            player.loadVideoById('qELSSAspRDI', 20, 'default');            
        }
    }

    // if (event.data === YT.PlayerState.PLAYING) {

    // }
}

document.forms[1].onsubmit = function () {
    //?? add a check to determine whether input link is valid!!!! : D
    var input = document.querySelector('#link');
    var curr_url = makeEmbedded(input.value);
    if (vid_queue.length == 0) {
        vid_queue.push(curr_url);
        var dur = player.getDuration();
        player.seekTo(dur); //finish default video
    } else {
        vid_queue.push(curr_url);
    }
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



//polling every 2s
window.setInterval(function() {
    socket.emit('',)
}, 2000);

socket.on()




