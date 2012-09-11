
var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app);

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
});

app.listen(3000);

// Clear the board every 60 seconds
setInterval(function() {
  io.sockets.emit('clear');
},60000);

io.sockets.on('connection', function (socket) {
  socket.on('paint',function(data) {
    socket.broadcast.emit('paint', data);
  });

  socket.on('disconnect', function () {
   console.log("Someone disconnected");
  });
});


