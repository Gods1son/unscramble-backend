  var express = require('express');
  var app = express();
var port = process.env.PORT || 7777;
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
	//res.render('index'); 
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

var usernamesList = [];

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];
var roomName2;
io.sockets.on('connection', function (socket) {
	//register user
	socket.on('pickUsername', function (username) {
		var success = true;
		if(usernamesList.indexOf(username) == -1){
		     socket.emit('welcomeHere', success);
		     username = {};
		     username["online"] = true;
		     usernamesList.push(username);
		}else{
		     success = false;
		     socket.emit('welcomeHere', success);
		}		
	});
});

