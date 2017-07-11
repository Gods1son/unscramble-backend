  var express = require('express');
  var app = express();
var port = process.env.PORT || 7777;
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);

server.listen(port);
/*io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});*/

  app.get('/', function(req, res, next) {
  	res.sendFile(__dirname + '/public/index.html')
  });

  app.use(express.static('public'));

var usernamesList = [];

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];
var roomName2;
io.sockets.on('connection', function (socket) {
		
	//socket.allUsers = [];
	// when the client emits 'adduser', this listens and executes
	/*socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});*/
	//creating userName
	socket.on('pickUsername', function (username) {
		socket.username = username;
		socket.scores = 0;
		//socket.scores["correct"] = 0;
		//socket.scores["incorrect"] = 0;
		//usernames[username] = username;	
	});
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		//socket.emit('updaterooms', rooms, newroom);
	});
	
	socket.on('createRoom',function(roomName){
		if(rooms.indexOf(roomName) == -1){
		rooms.push(roomName);
		socket.room = roomName;
		socket.join(roomName);
		roomName2 = roomName + roomName;
		socket.emit('roomCreated',roomName + ' room has been created');
		//usernamesList[socket.room][socket.username] = socket.username;
		//usernamesList.roomName.(socket.username) = (socket.username);
		//socket.allUsers.push(socket.username);
		//socket.emit('allUsers', socket.allUsers);
		usernamesList[socket.room] = "";
		usernamesList[roomName2] = "";
		usernamesList[roomName2] += "<span id='" + socket.username + "'>" + socket.username + " score = " + socket.scores + "</span>" + "<hr>";
		usernamesList[socket.room] += socket.username + "<br>";
		
		io.sockets.in(socket.room).emit('allUsers', usernamesList[socket.room]);		
		io.sockets.in(socket.room).emit('startScores',usernamesList[roomName2]);
		}else{socket.emit('roomCreatedError',roomName + ' has already been chosen')}
	})

	socket.on('joinRoom',function(roomName){
		socket.room = roomName;
		socket.join(roomName);
		roomName2 = roomName + roomName;
		socket.emit('roomJoined',roomName + ' room has been joined');
		usernamesList[roomName2] += "<span id='" + socket.username + "'>" + socket.username + " score = " + socket.scores + "</span>" + "<hr>";
		//usernamesList[socket.room][socket.username] = socket.username;
		//socket.allUsers.push(socket.username);
		usernamesList[socket.room] += socket.username + "<br>";
		io.sockets.in(socket.room).emit('allUsers', usernamesList[socket.room]);
		io.sockets.in(socket.room).emit('startScores',usernamesList[roomName2]);
		//io.sockets.in(socket.room).emit('updateScores',socket.username + " correct" + " = " + socket.scores["correct"],socket.username + " incorrect" + " = " + socket.scores["incorrect"]);
	})
	
	socket.on('sendShuffledWord',function(newWord, originalWord){
		var d = new Date();
		var n = d.toLocaleTimeString();
		var theword = newWord;
		var player = "i just played";
		socket.emit('newWord3',socket.username + "'s QUESTION -- " + newWord + " " + n, socket.room, player);
		socket.broadcast.to(socket.room).emit('newWord',theword, socket.username + "'s QUESTION -- " + newWord + "  " + n, socket.room, originalWord);
		//socket.broadcast.to(roomName2).emit('newWord', newWord);
	})
	
	socket.on('sendMyGuess',function(newWord, result){
		var d = new Date();
		var n = d.toLocaleTimeString();
		//socket.emit('newWord', newWord);
		//socket.broadcast.to(roomName2).emit('newWord', newWord);
		io.sockets.in(socket.room).emit('newWord2',socket.username + "'s ANSWER => " + newWord + " " + n);
		if(result == "pass"){
		socket.scores += 1;
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
		//io.sockets.in(socket.room).emit('updateScoresCorrect',socket.username + " correct" + " = " + socket.scores["correct"]);
		}else if(result == "fail"){
		socket.scores -= 1;
		//io.sockets.in(socket.room).emit('updateScoresIncorrect',socket.username + " incorrect" + " = " + socket.scores["incorrect"]);
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
		}
		//io.sockets.in(socket.room).emit('updateScores',socket.username + " correct" + " = " + socket.scores["correct"],socket.username + " incorrect" + " = " + socket.scores["incorrect"]);
	})
	
	socket.on('giveHint', function(hint){
		var d = new Date();
		var n = d.toLocaleTimeString();
		io.sockets.in(socket.room).emit('sharedHint',socket.username + "'s HINT -- " + hint + " " + n);
	})
	
	//user passed
	socket.on('passed', function(pass){
		socket.scores -= 1;
		io.sockets.in(socket.room).emit('passing',socket.username + pass);
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
	})
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		if(socket.room != undefined || socket.room != null){
		socket.broadcast.to(socket.room).emit('disconnectedUser', socket.username + " has been disconnected");
		usernamesList[socket.room] = usernamesList[socket.room].replace(socket.username + "<br>", "");	
		io.sockets.in(socket.room).emit('allUsers', usernamesList[socket.room]);
		// remove the username from global usernames list
		/*delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room); */
		}
	});
});

