var twitter = require("ntwitter"),
    fs = require('fs'),
    words = fs.readFileSync('words.txt').toString().split("\n");

var client = new twitter({
  consumer_key: "YOUR_CONSUMER_KEY",
  consumer_secret: "YOUR_CONSUMER_SECRET",
  access_token_key: "YOUR_ACCESS_TOKEN_KEY",
  access_token_secret: "YOUR_ACCESS_TOKEN_SECRET"
});
    
var accountName = "hangmanword";

function randomWord() {
  var word;
  do {
    word = words[Math.floor(Math.random()*words.length)];
  } while(!word.match(/^\w+$/) || word.length < 5) 
  return word;
}

var Hangman = function(accountName,client) {
  var self = this;

  this.gameNumber = 0;

  var hangman =  "__O-[-<";

  this.newWord = function() {
    this.word = randomWord();
    this.currentWord = this.word.split("");
    this.currentGuesses = [];
    this.guesses = [];
    this.lettersRemaining = this.currentWord.length;
    this.guessesRemaining = 5;
    this.gameNumber++;
    this.sendGameUpdate();
    console.log("\n");
    console.log("New Word:" + this.word);
  };


  this.sendTweet = function(status) {
    client.updateStatus(status,function(err,data) {
      if(!err) {
        console.log("Sent Tweet:" + status);
      } else {
        console.log("Error Sending Tweet:" + status + 
                    "\nError:" + err);
      }
    });
  };

  this.sendGameUpdate = function() {
    var status = "Game " + this.gameNumber + ": " + 
                 hangman.substring(0,hangman.length - this.guessesRemaining ) + 
                 " Word:";

    for(var i=0;i<this.currentWord.length;i++) {
      if(this.currentGuesses[i]) {
        status += " " + this.currentWord[i];
      } else {
        status += " _"
      }
    }
    this.sendTweet(status);
  };


  this.sendExistingGuess = function(tweeter,guess) {
    this.sendTweet("@" + tweeter + ' Sorry someone has already guessed "' + 
                   guess + '"');
  };

  this.sendIncorrect = function(tweeter,guess) {
    var extra = this.guessesRemaining <= 0 ? 
                " - Game Over (Word was " + this.word + ")" : ""
    this.sendTweet("@" + tweeter + ' sorry there are no ' + 
                   guess + "'s in game " + this.gameNumber + extra);
  };


  this.sendCorrect = function(tweeter,guess,correct) {
    var extra = this.lettersRemaining == 0 ? " - Congratulations you win!" : ""
    this.sendTweet("@" + tweeter + ' yes, ' + guess + " appears " + 
                   correct + (correct > 1 ? " times" : " time") + 
                   " in game " + this.gameNumber + extra);
  };

  this.handleGuess = function(tweet) {
    if(!tweet.text) return;

    var guess = tweet.text.replace(/[^a-z]/gi,""),
        tweeter = tweet.user.screen_name,
        correct = 0;

    try { 
      if(tweet.text.indexOf("@" + accountName) === 0) {
        guess = guess[guess.length-1].toLowerCase();

        if(this.guesses.indexOf(guess) != -1) {
          return this.sendExistingGuess(tweeter,guess);
        } 
        this.guesses.push(guess);

        for(var letter=0;letter < this.currentWord.length;letter++) {
          if(this.currentWord[letter].toLowerCase() == guess) {
            correct++;
            this.lettersRemaining--;
            this.currentGuesses[letter] = true;
          }
        }

        if(correct > 0) {
          this.sendCorrect(tweeter,guess,correct);
          if(this.lettersRemaining == 0) {
            this.newWord();
          } else {
            this.sendGameUpdate();
          }
        } else {
          this.guessesRemaining--;
          this.sendIncorrect(tweeter,guess);

          if(this.guessesRemaining > 0) {
            this.sendGameUpdate();
          } else {
            setTimeout(function() { self.newWord(); }, 2000);
          }
        }
      }
    } catch(e) {
      console.log("Error:" + e.toString());

    }
  };

  this.connect = function() {
    client.stream('user', { track:accountName ,replies:'all' }, function(stream) {
      stream.on('data', function (data) {
        setTimeout(function() {
          self.handleGuess(data);
        },1);
      });
      stream.on('end', function (response) {
        self.connect();
      });
      stream.on('error', function (response) {
        console.log("Error");
      });
      stream.on('destroy', function (response) {
        self.connect();
      });
    });
  };

  this.newWord();
  this.connect();
};

var hangman = new Hangman(accountName,client);
