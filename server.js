  var express = require('express');
  var app = express();
var port = process.env.PORT || 3000;
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);
var pg = require('pg');


server.listen(port);
/*io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});*/
app.use(express.static('public'));

 app.get('/', function(req, res, next) {
	res.render('index'); 
 })

  app.get('/db', function(req, res, next) {
  	//res.sendFile(__dirname + '/public/index.html');
	  var connectionString = "postgres://lryxskpsonpzre:6a7d6daf5a228551cc7327ecde372056dd195bb661b27d61776e8fbd65c75cd6@ec2-174-129-209-212.compute-1.amazonaws.com:5432/d53j08lg7a1h6b";
	pg.connect(connectionString, function(err, client, done) {
	   client.query('SELECT * FROM users', function(err, result) {
	      if(err) return console.error(err);   
		done();
	      console.log(result.rows);
		   //res.json({ data: result.rows });
		   //socket.emit('welcomeHere', username, result.rows);
		//res.render('db', {data : result.rows});
	   });
	});
	  res.render('db');
  });

var usernamesList = {};

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];
var roomName2;
io.sockets.on('connection', function (socket) {
	var name;
	//register user
	socket.on('pickUsername', function (username) {
		var success = true;
		if(usernamesList[username] == undefined){
		     name = username;
		     var obj = {};
		     obj.online = true;
		     usernamesList[name] = obj; 
		     socket.emit('welcomeHere', success, username);
		}else{
		     success = false;
		     socket.emit('welcomeHere', success);
		}		
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
		usernamesList[roomName2] += "<span id='" + socket.username + "'>" + socket.username + " score = " + socket.scores + "</span>";
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
		usernamesList[roomName2] += "<span id='" + socket.username + "'>" + socket.username + " score = " + socket.scores + "</span>";
		//usernamesList[socket.room][socket.username] = socket.username;
		//socket.allUsers.push(socket.username);
		
		usernamesList[socket.room] += socket.username + "<br>";
		io.sockets.in(socket.room).emit('allUsers', usernamesList[socket.room]);
		socket.broadcast.to(socket.room).emit('requestScores');
		//io.sockets.in(socket.room).emit('startScores',usernamesList[roomName2]);
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
		//io.sockets.in(socket.room).emit('updateScores',socket.username + " correct" + " = " + socket.scores["correct"],socket.username + " incorrect" + " = " + socket.scores["incorrect"]);
	})
	
	//for sharing scores
	socket.on('shareScores',function(){
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
	})
	
	socket.on('sendShuffledWord',function(newWord, originalWord){
		var d = new Date();
		var n = d.toLocaleTimeString();
		var theword = newWord;
		var player = "i just played";
		socket.emit('newWord3',socket.username + "'s QUESTION is -- ",newWord, socket.room, player);
		socket.broadcast.to(socket.room).emit('newWord',theword, socket.username + "'s QUESTION is -- " , socket.room, originalWord);
		//socket.broadcast.to(roomName2).emit('newWord', newWord);
	})
	
	socket.on('sendMyGuess',function(newWord, result){
		var d = new Date();
		var n = d.toLocaleTimeString();
		//socket.emit('newWord', newWord);
		//socket.broadcast.to(roomName2).emit('newWord', newWord);
		io.sockets.in(socket.room).emit('newWord2',socket.username + "'s ANSWER => " + newWord + " ",result,socket.room);
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
		io.sockets.in(socket.room).emit('sharedHint',socket.username + "'s MSG -- " + hint + " ");
	})
	
	//user passed
	socket.on('passed', function(pass){
		socket.scores -= 1;
		io.sockets.in(socket.room).emit('passing',socket.username + pass);
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
	})
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		/*if(socket.room != undefined || socket.room != null){
		socket.broadcast.to(socket.room).emit('disconnectedUser', socket.username + " has been disconnected");
		usernamesList[socket.room] = usernamesList[socket.room].replace(socket.username + "<br>", "");	
		socket.scores += " (disconnected)";
		io.sockets.in(socket.room).emit('updateScores',socket.username,socket.username + " score = " + socket.scores);
		io.sockets.in(socket.room).emit('allUsers', usernamesList[socket.room]);
		}
		*/
		    //delete user from userlist
		    delete usernamesList[name];
		
	});
});

