var express = require('express');
var cors = require("cors");
var app = express();
app.use(cors()); 
var port = process.env.PORT || 3000;
//var server = require('http').createServer();
var pg = require('pg');
var thesaurus = require("thesaurus");
//var checkWord = require('check-word'),
// words = checkWord('en');


 


//server.listen(port);
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

function findOnline(userK){
    var user;
   Object.keys(usernamesList).forEach(function(key) {
      if(usernamesList[key].isPlaying == false && key != userK){
            user = key;
            return false;
        }
    });
    return user;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key]["id"] === value);
}

app.get("/joinGroup", function (req, res){
    var group = req.query.groupName;
    var url = "edjufununscramble://multiplayer.html?groupName=" + group;
    console.log(url);
    res.redirect(301, url);
})

//var server = app.listen(port);
//var io = require("socket.io").listen(server);

//server
var server = app.listen(port);
var io = require('socket.io').listen(server);

try {
    io.sockets.on('connection', function (socket) {
        //console.log("connect");
        /*socket.on("createNewUser", function(user){

        })

        socket.on('pickUsername', function (username) {
            socket.username = username;
            socket.emit('welcomeHere', username);		
        });

        socket.on('getSyn', function (word) {
            var words = moby.search(word);
            socket.emit('theSyns', words);		
        });

        socket.on("getAvailableplayers", function(){
            var play = [];
            allPlayers.forEach(function(player,index){
                if(player["isOnline"] == true && player["isPlaying"] == false){
                    play.push(player);
                }
            })
            socket.emit('availablePlayers', play);
        })*/
        var currentUser;
        //register user
        socket.on('pickUsername', function (username) {
            var success = true;
            if(usernamesList[username] == undefined){
                 socket.username = username;
                 var obj = {};
                 obj.online = true;
                         obj.isPlaying = false;
                 obj.id = socket.id;
                 usernamesList[username] = obj; 
                 socket.emit('welcomeHere', success, obj);
            }else{
                 success = false;
                 socket.emit('welcomeHere', success);
            }		
        });


        //Find online users
        socket.on('findOnlineUsers', function (data) {
              var foundUser = findOnline(socket.username);
              socket.emit('foundUsers', foundUser);
        });

        //send invitation
        socket.on('inviteUser', function (data) {
            // we tell the client to execute 'updatechat' with 2 parameters
            if(usernamesList[data]["isPlaying"] == false){
                    
                if(usernamesList[socket.username] == undefined){
                    socket.emit("userCurrentlyPlaying", "User cannot be found online");
                    return;
                }
                var socketId = usernamesList[data]["id"];
                    var roomName = socket.username + data;
                     socket.room = roomName;
                    socket.join(roomName);
                var currsocketId = usernamesList[socket.username]["id"];
               io.to(socketId).emit("sendInvitation", socket.username);
                io.to(currsocketId).emit("invitationSent", socket.username);
            }else{
                socket.emit('invitationError', false);
            }	
        });
        
        //invite friend
        socket.on('inviteFriend', function (data) {
            // we tell the client to execute 'updatechat' with 2 parameters
                    //var socketId = usernamesList[data]["id"];
            if(usernamesList[socket.username] == undefined){
                    socket.emit("userCurrentlyPlaying", "User cannot be found online");
                    return;
                }
                    var roomName = socket.username + "Created";
                     socket.room = roomName;
                    socket.join(roomName);
                    var currsocketId = usernamesList[socket.username]["id"];
                    usernamesList[socket.username]["roomName"] = roomName;
                    io.to(currsocketId).emit("roomCreated", socket.username);	
        });
        
        //Accept friend invitation
        socket.on('acceptFriendInvitation', function (dataOr) {
              
            //join users
            var info = {};
            if(dataOr.indexOf("Created") == -1){
                var socketId = usernamesList[socket.username]["id"];
                    io.to(socketId).emit("userCurrentlyPlaying", "Group cannot be found");
                    return;
            }
            
            var data = dataOr.replace("Created","");
            if(usernamesList[data] != undefined){
                if(usernamesList[data]["roomName"] == undefined){
                    var socketId = usernamesList[socket.username]["id"];
                    io.to(socketId).emit("userCurrentlyPlaying", "Group cannot be found");
                    return;
                }
            if(usernamesList[data]["isPlaying"] == true){
                    var socketId = usernamesList[socket.username]["id"];
                    io.to(socketId).emit("userCurrentlyPlaying", "User is playing a game now, try later");
                }else{
                    var roomName = dataOr;
                    socket.room = roomName;
                    socket.join(roomName);
                    info.player1 = data;
                    info.player1Score = 0;
                    info.player2 = socket.username;
                    info.player2Score = 0;
                    info.groupName = roomName;
                    usernamesList[data]["isPlaying"] = true;
                    usernamesList[socket.username]["isPlaying"] = true;
                      io.sockets.in(socket.room).emit('joinedGroup', info);
                } 
            }else{
                var socketId = usernamesList[socket.username]["id"];
                io.to(socketId).emit("userCurrentlyPlaying", "User is not online now");
            }
        });

         //Accept invitation
        socket.on('acceptInvitation', function (data) {
              var roomName = data + socket.username;
              socket.room = roomName;
              socket.join(roomName);
            //join users
            var info = {};
            info.groupName = roomName;
            info.player1 = data;
            info.player1Score = 0;
            info.player2 = socket.username;
            info.player2Score = 0;
            if(usernamesList[data] != undefined){
                usernamesList[data]["isPlaying"] = true;
                usernamesList[socket.username]["isPlaying"] = true;
                  io.sockets.in(socket.room).emit('joinedGroup', info);
            }
        });

        // check if word exists
        socket.on('checkWord', function(data){
                var prd = thesaurus.find(data);
                var res = prd.length > 0 ? true : false;
                if(res){
                    prd = prd.slice(0,4);
                }
                socket.emit('RescheckWord', res, prd);

        });

        //receive and send word
        socket.on("sendWord", function(data){
            var rec = data.receiver;
            if(usernamesList[rec] == undefined){
                    socket.emit("userCurrentlyPlaying", "User cannot be found online");
                    return;
                }
            var socketId = usernamesList[rec]["id"];
            io.sockets.in(socket.room).emit('receiveWord', data);
            //io.to(socketId).emit("receiveWord", data);
        })

        //send report card
        socket.on("markAnswer", function (data){
            io.sockets.in(socket.room).emit('reportCard', data);
        })

        // when the user disconnects.. perform this
        socket.on('disconnect', function(){
                //delete user from userlist
            
            io.of('/').in(socket.room).clients(function(error, clients) {
                if (clients.length > 0) {
                    socket.broadcast.to(socket.room).emit('leaveRoom', socket.username+' has left this room and room has been closed');
                   // console.log('clients in the room: \n');
                   // console.log(clients);
                    clients.forEach(function (socket_id) {
                        var username = getKeyByValue(usernamesList, socket_id);
                        usernamesList[username]["isPlaying"] = false;
                        io.sockets.sockets[socket_id].leave(socket.room);
                    });
                }
            });
                delete usernamesList[socket.username];

        });
        
        //send invitation rejection
        socket.on("rejectInvitation", function(data){
            var us = data.user;
            var socketId = usernamesList[us]["id"];
            io.to(socketId).emit("sendRejection", data);
        })
        
        //delete room and members
        socket.on("deleteRoom", function(data){
            /*if(socket.room != null || socket.room != undefined || socket.room != ""){
                socket.broadcast.to(socket.room).emit('leaveRoom', socket.username+' has left this room and room will be closed');
                var users = io.sockets.clients(socket.room);
                for(var i = 0; i < users.length; i++){
                    users[i].leave(socket.room);
                };
            }*/
            
            io.of('/').in(socket.room).clients(function(error, clients) {
                if (clients.length > 0) {
                    socket.broadcast.to(socket.room).emit('leaveRoom', socket.username+' has left this room and room will be closed');
                    //console.log('clients in the room: \n');
                    //console.log(clients);
                    clients.forEach(function (socket_id) {
                        var username = getKeyByValue(usernamesList, socket_id);
                        usernamesList[username]["isPlaying"] = false;
                        io.sockets.sockets[socket_id].leave(socket.room);
                    });
                }
            });
        })

    })
}catch(err){
    socket.emit("serverError", "System Error");
}
