

var canvas = document.getElementById('game');
var ctx = canvas.getContext && canvas.getContext('2d');

if(!ctx) {
   // No 2d context available, let the user know
   alert('Please upgrade your browser');
} else {
  startGame();
}

function startGame() {
  SpriteSheet.load({
    ship: { sx: 0, sy: 0, w: 37, h: 42, frames: 1 }
  }, function() {
    
    SpriteSheet.draw(ctx,"ship",0,0);
    SpriteSheet.draw(ctx,"ship",100,50);
    SpriteSheet.draw(ctx,"ship",150,100);

  });
}

