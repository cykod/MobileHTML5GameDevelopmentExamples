
var express = require('express'),
    fs = require('fs'),
    _ = require('underscore');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// App

app.post('/save', function(req, res){
  var data = _(req.body.tiles).map(function(row) {
    return _(row).map(function(tile) { return Number(tile); });
  });
  fs.writeFile("public/data/" + req.body.level,
               JSON.stringify(data));
  res.send(201);
});



