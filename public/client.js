
var socket = io();
var roomName;  
 // on connection to server, ask for user's name with an anonymous callback
  socket.on('connect', function(){
		// call the server-side function 'adduser' and send one parameter (value of prompt)
		socket.emit("pickUsername",prompt("Pick a username"));
	});
socket.on('disconnectedUser', function(info){
	alert(info);
})

socket.on('roomCreated', function(room){
	alert(room);
})

socket.on('updateScores', function(correct, incorrect){
	$('#scores').append('<div>' + correct + '</div>' + '<hr>');
	$('#scores').append('<div>' + incorrect + '</div>' + '<hr>');
})

socket.on('roomCreatedError', function(notice){
	alert(notice);
})

socket.on('allUsers', function(data){
	$('#users').empty();
		/*$.each(data, function(key, value) {
			$('#users').append('<div>' + value + '</div>');
		});*/
	
		$('#users').append('<div>' + data + '</div>');
	
})

socket.on('roomJoined', function(room){
	alert(room);
})

socket.on('newWord', function(word, room, originalWord){
	$('#wordsNew').append('<li>' + word + '</li>');
	//document.getElementById("wordsNew").innerHTML += "<br>" + word;
	 var elem = document.getElementById('allWords');
  	 elem.scrollTop = elem.scrollHeight;
	roomName = room;
	if (localStorage.getItem(room) == undefined) {
    	localStorage.setItem(room, originalWord);
    } else {
    	localStorage.removeItem(room);
    	localStorage.setItem(room, originalWord);
	}
})

socket.on('newWord2', function(word){
	$('#wordsNew').append('<li>' + word + '</li>');
	//document.getElementById("wordsNew").innerHTML += "<br>" + word;
	var elem = document.getElementById('allWords');
  	elem.scrollTop = elem.scrollHeight;
})

socket.on('sharedHint', function(hint){
	$('#wordsNew').append('<li>' + hint + '</li>');
	//document.getElementById("wordsNew").innerHTML += "<br>" + hint;
	var elem = document.getElementById('allWords');
  	elem.scrollTop = elem.scrollHeight;
})

function showCreateRoom() {
	$("#createRoomContainer").toggle();
}

function showJoinRoom() {
	$("#joinRoomContainer").toggle();
}

function createRoom() {
	var roomName = $("#createRoomName").val();
	socket.emit("createRoom", roomName);
}

function joinRoom() {
	var roomName = $("#joinRoomName").val();
	socket.emit("joinRoom", roomName);
}

function giveHint(){
	var hint = $("#myHint").val();
	document.getElementById("myHint").value = "";
	socket.emit("giveHint", hint);
}

function sendWord(){
	var word = $("#wordToShuffle").val();
	word = word.toLowerCase();
	document.getElementById("wordToShuffle").value = "";
	var shuffledWord = shuffleman(word);
	socket.emit("sendShuffledWord", shuffledWord, word);
}

function sendGuess(){
	var word = $("#myGuess").val();
	word = word.toLowerCase();
	document.getElementById("myGuess").value = "";
	if (localStorage.getItem(roomName) == undefined) {
   		alert("no word to guess");
	}else{
	var word2guess = localStorage.getItem(roomName);
   		if (word == word2guess) {
   			word = word + " " + "<img src='checkmark-png-22.png' height='30' width='30'>";
   			localStorage.removeItem(roomName);
   		} else {
   			word = word + " " + "<img src='cross.png' height='30' width='30'>";
   		}
	}
	//var shuffledWord = shuffleman(word);	
	socket.emit("sendMyGuess", word);
}

function shuffleman(word) {
	var newword;
	var newwordform = "";
	var shuffleword = word;
	var allnumbers = [];
	var wordsplit = shuffleword.split("");

    do{
        
      //  var shufflenumber = document.getElementById("shufflenumber");
               
        var randomnumber = Math.floor(Math.random() * shuffleword.length);
            
        if(allnumbers.indexOf(randomnumber) != -1){
        	var randomnumber = Math.floor(Math.random() * shuffleword.length);
        }else{
        	allnumbers.push(randomnumber);
        }
               
    }while(allnumbers.length != shuffleword.length);
       for (var x = 0; x < allnumbers.length; x++) {
       	var position = allnumbers[x];
    	 newword = wordsplit[position];
    	newwordform += newword;
	    
    }
    //set the real word empty
   // document.getElementById("shuffleword").value = "";

    //save word to localstorage
	  return newwordform;
   }

  /*  // on connection to server, ask for user's name with an anonymous callback
   socket.on('connect', function(){
		// call the server-side function 'adduser' and send one parameter (value of prompt)
		socket.emit('adduser', prompt("What's your name?"));
	});

	// listener, whenever the server emits 'updatechat', this updates the chat body
	socket.on('updatechat', function (username, data) {
		$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
	});

	// listener, whenever the server emits 'updaterooms', this updates the room the client is in
	socket.on('updaterooms', function(rooms, current_room) {
		$('#rooms').empty();
		$.each(rooms, function(key, value) {
			if(value == current_room){
				$('#rooms').append('<div>' + value + '</div>');
			}
			else {
				$('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
			}
		});
	});

	function switchRoom(room){
		socket.emit('switchRoom', room);
	}

	// on load of page
	$(function(){
		// when the client clicks SEND
		$('#datasend').click( function() {
			var message = $('#data').val();
			$('#data').val('');
			// tell server to execute 'sendchat' and send along one parameter
			socket.emit('sendchat', message);
		});

		// when the client hits ENTER on their keyboard
		$('#data').keypress(function(e) {
			if(e.which == 13) {
				$(this).blur();
				$('#datasend').focus().click();
			}
		});
	});*/
