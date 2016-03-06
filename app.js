var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io')
    , Moniker = require('moniker')
    , moment = require('moment')
    , port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080
    , ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(port, function() {
    console.log('Listening at: http://' + ip + ':' + port);
});

var io = socketio.listen(server); 

io.sockets.on('connection', function (socket) {
  var client = addClient();
  socket.emit("welcome", client);

  socket.broadcast.emit('coming', {client:client.name});
  //socket.broadcast.emit('users', {users:clients});
  io.sockets.emit('users', {users:clients});
  socket.emit("load history", messages);
  
  socket.on('disconnect', function () {
    delClient(client);
    socket.broadcast.emit('users', {users:clients});
    socket.broadcast.emit('out', {client:client.name});
  });
  
  socket.on("message", function(msg) {
    msg['time'] = moment();
    msg['client'] =  client.name;
    msg['text'] =  addslashes(msg['text'].replace(/</g,"&lt;").replace(/>/g,"&gt;")).slice(0,200);;
    if(msg['text']) {
      console.log('Message Received: ', msg);
      messages.unshift(msg);
      while(messages.length > 20) {
        messages.pop();
      }
      socket.broadcast.emit('message', msg);
    }
  });   
  
  socket.on('ping', function (msg) {
        console.log('Message Received: ', msg);
        socket.emit("pong", msg);
  });
  socket.on('newName', function (data) {
        socket.broadcast.emit('rename', {name:data.name, oldname:client.name});
        client.name = data.name;
  });  
});

var clients = [];
var messages = [];

var addClient = function() {
    var client = {
        name: Moniker.choose()
    }
    clients.push(client);
    //updateUsers();
    return client;
}
var delClient = function(name) {
    for(var i=0; i<clients.length; i++) {
      if(clients[i] == name){
          clients.pop(name);
        return;
      }
    }

}
function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

/*io.on('connection', function (socket) {
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
});*/
