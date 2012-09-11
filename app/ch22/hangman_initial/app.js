var twitter = require("ntwitter");

var client = new twitter({
  consumer_key: "YOUR_CONSUMER_KEY",
  consumer_secret: "YOUR_CONSUMER_SECRET",
  access_token_key: "YOUR_ACCESS_TOKEN_KEY",
  access_token_secret: "YOUR_ACCESS_TOKEN_SECRET"
});



client.verifyCredentials(function (err, data) {
  if(err) { 
    console.log("Unable to connect to twitter, please verify config"); 
  } else {
    client.updateStatus("Hello\n\nTwitter, what's up!", function (err, data) {
      if(!err) {
        console.log(data);
      } else {
        console.log(err);
      }
    });
  }
});

var accountName = 'hangmangame';

client.stream('user', { track:accountName ,replies:'all' }, function(stream) {
  stream.on('data', function (data) {
    console.log("****************");
    console.log(data);
    console.log("****************");
  });
  stream.on('end', function (response) {
    // Need to reconnect
  });
  stream.on('destroy', function (response) {
    // Need to reconnect
  });
});

