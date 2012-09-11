(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
  



var Game = new function() {                                                                  
  var boards = [];

  // Game Initialization
  this.initialize = function(canvasElementId,sprite_data,callback) {

    var ctx = this.ctx = AppMobi.canvas.getContext("2d");


    //wrap in try/catch because XDK does not currently support this property
    try {
      ctx.HTML5CompatibilityMode = true;
    } catch(e){}
    this.ctx.width = 320;
    this.ctx.height = 480;

    this.playerOffset = 10;
    this.canvasMultiplier= 1;
    this.mobile = true;

    this.width = 320;
    this.height= 480;

    this.loop(); 

    if(this.mobile) {
      this.setBoard(4,new TouchControls());
    }

    SpriteSheet.load(sprite_data,callback);
  };
  
  this.setKeys = function(l,r,fire) {
    Game.keys['left'] = l;
    Game.keys['right'] = r;
    Game.keys['fire'] = fire;
  };

 
  var lastTime = new Date().getTime();
  var maxTime = 1/30;
  // Game Loop
  this.loop = function() { 
    var curTime = new Date().getTime();
    requestAnimationFrame(Game.loop);

    var dt = (curTime - lastTime)/1000;
    if(dt > maxTime) { dt = maxTime; }

    for(var i=0,len = boards.length;i<len;i++) {
      if(boards[i]) { 
        boards[i].step(dt);
        boards[i].draw(Game.ctx);
      }
    }
    Game.ctx.present();
    lastTime = curTime;
  };
  

  
  // Change an active game board
  this.setBoard = function(num,board) { boards[num] = board; };

  return this;
};


var SpriteSheet = new function() {
  this.map = { }; 

  this.load = function(spriteData,callback) { 
    this.map = spriteData;
    this.image = new Image();
    this.image.onload = callback;
    this.image.src = 'images/sprites.png';
  };

  this.draw = function(ctx,sprite,x,y,frame) {
    var s = this.map[sprite];
    if(!frame) frame = 0;
    ctx.drawImage(this.image,
                     s.sx + frame * s.w, 
                     s.sy, 
                     s.w, s.h, 
                     Math.floor(x), Math.floor(y), 
                     s.w, s.h);
  };
  return this;
};

var TitleScreen = function TitleScreen(title,subtitle,callback) {
  var up = false;
  this.step = function(dt) {
    if(!Game.keys['fire']) { up = true; }
    if(up && Game.keys['fire'] && callback) {
      Game.keys['fire'] = false;
      callback();
    }
  };

  this.draw = function(ctx) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";

    ctx.font = "bold 40px bangers";
    ctx.fillText(title,Game.width/2,Game.height/2);

    ctx.font = "bold 20px bangers";
    ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
  };

};


var GameBoard = function() {
  var board = this;

  // The current list of objects
  this.objects = [];
  this.cnt = {};

  // Add a new object to the object list
  this.add = function(obj) { 
    obj.board=this; 
    this.objects.push(obj); 
    this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
    return obj; 
  };

  // Mark an object for removal
  this.remove = function(obj) { 
    var idx = this.removed.indexOf(obj);
    if(idx == -1) {
      this.removed.push(obj); 
      return true;
    } else {
      return false;
    }
  };

  // Reset the list of removed objects
  this.resetRemoved = function() { this.removed = []; };

  // Removed an objects marked for removal from the list
  this.finalizeRemoved = function() {
    for(var i=0,len=this.removed.length;i<len;i++) {
      var idx = this.objects.indexOf(this.removed[i]);
      if(idx != -1) {
        this.cnt[this.removed[i].type]--;
        this.objects.splice(idx,1);
      }
    }
  };

  // Call the same method on all current objects 
  this.iterate = function(funcName) {
     var args = Array.prototype.slice.call(arguments,1);
     for(var i=0,len=this.objects.length;i<len;i++) {
       var obj = this.objects[i];
       obj[funcName].apply(obj,args);
     }
  };

  // Find the first object for which func is true
  this.detect = function(func) {
    for(var i = 0,val=null, len=this.objects.length; i < len; i++) {
      if(func.call(this.objects[i])) return this.objects[i];
    }
    return false;
  };

  // Call step on all objects and them delete
  // any object that have been marked for removal
  this.step = function(dt) { 
    this.resetRemoved();
    this.iterate('step',dt);
    this.finalizeRemoved();
  };

  // Draw all the objects
  this.draw= function(ctx) {
    this.iterate('draw',ctx);
  };

  // Check for a collision between the 
  // bounding rects of two objects
  this.overlap = function(o1,o2) {
    return !((o1.y+o1.h-1<o2.y) || (o1.y>o2.y+o2.h-1) ||
             (o1.x+o1.w-1<o2.x) || (o1.x>o2.x+o2.w-1));
  };

  // Find the first object that collides with obj
  // match against an optional type
  this.collide = function(obj,type) {
    return this.detect(function() {
      if(obj != this) {
       var col = (!type || this.type & type) && board.overlap(obj,this);
       return col ? this : false;
      }
    });
  };


};

var Sprite = function() { };

Sprite.prototype.setup = function(sprite,props) {
  this.sprite = sprite;
  this.merge(props);
  this.frame = this.frame || 0;
  this.w =  SpriteSheet.map[sprite].w;
  this.h =  SpriteSheet.map[sprite].h;
};

Sprite.prototype.merge = function(props) {
  if(props) {
    for (var prop in props) {
      this[prop] = props[prop];
    }
  }
};

Sprite.prototype.draw = function(ctx) {
  SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
};

Sprite.prototype.hit = function(damage) {
  this.board.remove(this);
};


var Level = function(levelData,callback) {
  this.levelData = [];
  for(var i =0; i<levelData.length; i++) {
    this.levelData.push(Object.create(levelData[i]));
  }
  this.t = 0;
  this.callback = callback;
};

Level.prototype.step = function(dt) {
  var idx = 0, remove = [], curShip = null;

  // Update the current time offset
  this.t += dt * 1000;

  //   Start, End,  Gap, Type,   Override
  // [ 0,     4000, 500, 'step', { x: 100 } ]
  while((curShip = this.levelData[idx]) && 
        (curShip[0] < this.t + 2000)) {
    // Check if we've passed the end time 
    if(this.t > curShip[1]) {
      remove.push(curShip);
    } else if(curShip[0] < this.t) {
      // Get the enemy definition blueprint
      var enemy = enemies[curShip[3]],
          override = curShip[4];

      // Add a new enemy with the blueprint and override
      this.board.add(new Enemy(enemy,override));

      // Increment the start time by the gap
      curShip[0] += curShip[2];
    }
    idx++;
  }

  // Remove any objects from the levelData that have passed
  for(var i=0,len=remove.length;i<len;i++) {
    var remIdx = this.levelData.indexOf(remove[i]);
    if(remIdx != -1) this.levelData.splice(remIdx,1);
  }

  // If there are no more enemies on the board or in 
  // levelData, this level is done
  if(this.levelData.length === 0 && this.board.cnt[OBJECT_ENEMY] === 0) {
    if(this.callback) this.callback();
  }

};

Level.prototype.draw = function(ctx) { };


var TouchControls = function() {

  var gutterWidth = 10;
  var unitWidth = Game.width/5;
  var blockWidth = unitWidth-gutterWidth;

  this.drawSquare = function(ctx,x,y,txt,on) {
    ctx.globalAlpha = on ? 0.9 : 0.6;
    ctx.fillStyle =  "#CCC";
    ctx.fillRect(x,y,blockWidth,blockWidth);

    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.globalAlpha = 1.0;
    ctx.font = "bold " + (3*unitWidth/4) + "px arial";

    ctx.fillText(txt, 
                 x+blockWidth/2,
                 y+3*blockWidth/4+5);
  };


  this.draw = function(ctx) {
    ctx.save();

    var yLoc = Game.height - unitWidth;
    this.drawSquare(ctx,gutterWidth,yLoc,"◀");
    this.drawSquare(ctx,unitWidth + gutterWidth,yLoc,"▶");
    this.drawSquare(ctx,4*unitWidth,yLoc,"A");

    ctx.restore();
  };

  this.step = function(dt) {
  };


  Game.playerOffset = unitWidth + 20;
};




var GamePoints = function() {
  Game.points = 0;

  var pointsLength = 8;

  this.draw = function(ctx) {
    ctx.save();
    ctx.font = "bold 18px arial";
    ctx.fillStyle= "#FFFFFF";

    var txt = "" + Game.points;
    var i = pointsLength - txt.length, zeros = "";
    while(i-- > 0) { zeros += "0"; }

    ctx.fillText(zeros + txt,10,20);
    ctx.restore();

  };

  this.step = function(dt) { };
};
