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


 const { Pool, Client } = require('pg');
//db con string


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
    ssl:true
})

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err) // your callback here
  process.exit(-1)
})


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
	  var connectionString = "";
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

function findOnline(userK, denied){
    var user;
   Object.keys(usernamesList).forEach(function(key) {
      if(usernamesList[key].isPlaying == false && key != userK && denied.indexOf(key) == -1){
            user = key;
            return false;
        }
    });
    return user;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key]["id"] === value);
}

//client.connect();
function AddUserCount(){
    
 pool.connect()
  .then(client => {
    return client.query('UPDATE "General" SET "Count" = "Count" + 1 WHERE "ID" = 1') // your query string here
      .then(res => {
        client.release()
        //console.log(res.rows[0]) // your callback here
      })
      .catch(e => {
        client.release()
       // console.log(err.stack) // your callback here
      })
  })
}

function LoginUser(username, socket){
 pool.connect()
  .then(client => {
    client.query('UPDATE "Users" SET "Logins" = "Logins" + 1 WHERE "Username" = $1', [username]) // your query string here
      .then(res => {
        client.release();
        console.log(username);
        if(usernamesList[username] == undefined){
                 socket.username = username;
                 var obj = {};
                 obj.online = true;
                 obj.isPlaying = false;
                 obj.id = socket.id;
                 obj.denied = [];
                 usernamesList[username] = obj; 
                 socket.emit("loggedIn");
            }
        
      })
      .catch(e => {
        client.release()
       // console.log(err.stack) // your callback here
      })
  })
}

function SentWordCount(username){
     pool.connect()
  .then(client => {
    client.query('UPDATE "Users" SET "SentWords" = "SentWords" + 1 WHERE "Username" = $1', [username]) // your query string here
      .then(res => {
            
        client.release()
        //console.log(res.rows[0]) // your callback here
      })
      .catch(e => {
        client.release()
       // console.log(err.stack) // your callback here
      })
  })
}

function CheckUsername(username, type, socket){
    
    var checkName = "";
    if(type == "createnew"){
        checkName = username;
    }
    if(type == "updateold"){
        checkName = username.newName;
    }
    
     pool.connect()
  .then(client => {
     client.query('Select * FROM "Users" Where "Username" = $1', [checkName]) // your query string here
      .then(res => {
            var rows = res.rows;
            console.log(rows);
            client.release();
            if(rows.length == 0){
                if(type == "createnew"){
                   CreateUsername(checkName, socket); 
                }
                if(type == "updateold"){
                   UpdateUserName(username, socket); 
                }
                
            }else{
                socket.emit("createUserResult", "Username already chosen, choose another", false);
            }
      })
      .catch(e => {
        client.release()
        console.log(e.stack); // your callback here
         socket.emit("createUserResult", "Error", false);
      })
  })
}

function UpdateUserName(username, socket){
    var oldName = username.oldName;
    var newName = username.newName;
 pool.connect()
  .then(client => {
    client.query('UPDATE "Users" SET "Username" = $1 WHERE "Username" = $2', [newName, oldName]) // your query string here
      .then(res => {
        client.release();
        //console.log("logging in");
        if(usernamesList[username.oldName] != undefined){
            usernamesList[username.newName] = usernamesList[username.oldName];    
            delete usernamesList[username.oldName];
                 socket.emit("usernameUpdatePass", username);
            }
        
      })
      .catch(e => {
       client.release()
        console.log(e.stack); // your callback here
         socket.emit("createUserResult", "Error", false);
      })
  })
}

function CreateUsername(username, socket){
     pool.connect()
  .then(client => {
    var que = 'INSERT INTO "Users" ("Connections", "Logins", "SentWords", "Username") VALUES($1, $2, $3, $4) RETURNING *';
    var val = [0, 1, 0, username];
     client.query(que, val) // your query string here
      .then(res => {
            var rows = res.rows;
            //client.release();
            //console.log(rows);
            
            if(rows.length > 0){
                if(usernamesList[username] == undefined){
                     socket.username = username;
                     var obj = {};
                     obj.online = true;
                     obj.isPlaying = false;
                     obj.id = socket.id;
                     obj.denied = [];
                     usernamesList[username] = obj; 
                     
                }
                var info = {};
                info.msg = "Username Created";
                info.name = username;
                socket.emit("createUserResult", info, true);
            }
            client.release();
        //console.log(res.rows[0]) // your callback here
      })
      .catch(e => {
        client.release()
        console.log(e.stack) // your callback here
        socket.emit("createUserResult", "Error", false);
      })
  })
}

function ConnectionCount(data1, data2){
     pool.connect()
  .then(client => {
    return client.query('UPDATE "Users" SET "Connections" = "Connections" + 1 WHERE "Username" = $1 OR "Username" = $2', [data1, data2]) // your query string here
      .then(res => {
        client.release()
        //console.log(res.rows[0]) // your callback here
      })
      .catch(e => {
        client.release()
       // console.log(err.stack) // your callback here
      })
  })
}

app.get("/joinGroup", function (req, res){
    var group = req.query.groupName;
    var url = "edjufununscramble://multiplayer.html?groupName=" + group;
    console.log(url);
    res.redirect(301, url);
})

//server
var server = app.listen(port, function(){
    console.log("server started on 3000");
})

//var io = new SocketServer({ server });
var io = require('socket.io').listen(server);

try {
    io.sockets.on('connection', function (socket) {
        //console.log("connect");
        
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
                 //AddUserCount();
                 socket.emit('welcomeHere', success, obj);
            }else{
                 success = false;
                 socket.emit('welcomeHere', success);
            }		
        });
        
        //log in
        socket.on("Login", function(data){
            LoginUser(data, socket);
        })
        
        //update username
        socket.on("updateUsername", function(data){
            CheckUsername(data, "updateold", socket);
        })


        //Find online users
        socket.on('findOnlineUsers', function (data) {
              var curUs = socket.username;
              var denied = usernamesList[curUs]["denied"];
              var foundUser = findOnline(curUs, denied);
              socket.emit('foundUsers', foundUser);
        });

        //send invitation
        socket.on('inviteUser', function (data) {
            // we tell the client to execute 'updatechat' with 2 parameters
            if(usernamesList[data] == undefined){
                    socket.emit("userCurrentlyPlaying", "User cannot be found online");
                    return;
                }
            
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
                    ConnectionCount(data, socket.username);
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
                ConnectionCount(data, socket.username);
                  io.sockets.in(socket.room).emit('joinedGroup', info);
            }
        });
        
        //create new user
        socket.on("createUsername", function(data){
            CheckUsername(data, "createnew", socket);
            //console.log(user);
        })

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
            SentWordCount(socket.username);
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
            var curUs = socket.username;
            if(usernamesList[us] == undefined){
                    socket.emit("userCurrentlyPlaying", us + " cannot be found online");
                    return;
                }
            usernamesList[us]["denied"].push(curUs);
            usernamesList[curUs]["denied"].push(us);
            var socketId = usernamesList[us]["id"];
            io.to(socketId).emit("sendRejection", data);
        })
        
        //update timer for opponent
        socket.on("opponentTimer", function(data){
            var us = data.receiver;
            if(usernamesList[us] == undefined){
                    socket.emit("userCurrentlyPlaying",  us + " cannot be found online");
                    return;
                }
            if(usernamesList[us] != undefined){
                var socketId = usernamesList[us]["id"];
                io.to(socketId).emit("opponentTimerRead", data);
            }
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
