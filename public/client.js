 var socket = io();

 // on connection to server, ask for user's name with an anonymous callback
  socket.on('connect', function(){
		// call the server-side function 'adduser' and send one parameter (value of prompt)
		alert("You are connected");
	});
socket.on('roomCreated', function(room){
	alert(room);
})

socket.on('roomJoined', function(room){
	alert(room);
})

socket.on('newWord', function(room){
	document.getElementById("wordsNew").innerHTML += "<br>" + room;
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

function sendWord(){
	var word = $("#wordToShuffle").val();
	var shuffledWord = shuffleman(word);
	socket.emit("sendShuffledWord", shuffledWord);
}

function sendGuess(){
	var word = $("#myGuess").val();
	//var shuffledWord = shuffleman(word);
	socket.emit("sendMyGuess", word);
}
function shuffleman(word) {
	var newword;
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
    	//document.getElementById("numbers").innerHTML += newword;
	    
    }
    //set the real word empty
   // document.getElementById("shuffleword").value = "";

    //save word to localstorage
	  return newword;
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
