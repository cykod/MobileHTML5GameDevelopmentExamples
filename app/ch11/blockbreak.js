$(function() {
  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes')
                     .setup();

  Q.input.keyboardControls();
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ] ]
          });

  Q.Paddle = Q.Sprite.extend({
    init: function() {
      this._super({
        sheet: 'paddle',
        speed: 200,
        x: 0
      });
      this.p.x = Q.width/2 - this.p.w/2;
      this.p.y = Q.height - this.p.h;
      if(Q.input.keypad.size) {
        this.p.y -= Q.input.keypad.size + this.p.h;
      }
    },

    step: function(dt) {
      if(Q.inputs['left']) { 
        this.p.x -= dt * this.p.speed;
      } else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
      }
      if(this.p.x < 0) { 
        this.p.x = 0;
      } else if(this.p.x > Q.width - this.p.w) { 
        this.p.x = Q.width - this.p.w;
      }
      this._super(dt);
    }
  });

  Q.Ball = Q.Sprite.extend({
    init: function() {
      this._super({
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
      });
      this.p.y = Q.height / 2 - this.p.h;
      this.p.x = Q.width / 2 + this.p.w / 2;
    },

    step: function(dt) {
     var p = this.p;
     var hit = Q.stage().collide(this);
     if(hit) {
       if(hit instanceof Q.Paddle) {
         p.dy = -1;
       } else {
         hit.trigger('collision',this);
       }
     }

      p.x += p.dx * p.speed * dt;
      p.y += p.dy * p.speed * dt;

      if(p.x < 0) { 
        p.x = 0;
        p.dx = 1;
      } else if(p.x > Q.width - p.w) { 
        p.dx = -1;
        p.x = Q.width - p.w;
      }

      if(p.y < 0) {
        p.y = 0;
        p.dy = 1;
      } else if(p.y > Q.height) { 
        Q.stageScene('game');
      }

      this._super(dt);
      
    }


  });

  Q.Block = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props).extend({ sheet: 'block'}));
      this.bind('collision',function(ball) {
        this.destroy();
        ball.p.dy *= -1;
        Q.stage().trigger('removeBlock');
      });
    }
  });


  Q.load(['blockbreak.png','blockbreak.json'], function() {
    Q.compileSheets('blockbreak.png','blockbreak.json');
    Q.scene('game',new Q.Scene(function(stage) {
      stage.insert(new Q.Paddle());
      stage.insert(new Q.Ball());

      var blockCount=0;
      for(var x=0;x<6;x++) {
        for(var y=0;y<5;y++) {
          stage.insert(new Q.Block({ x: x*50+10, y: y*30+10 }));
          blockCount++;
        }
      }
      stage.bind('removeBlock',function() {
        blockCount--;
        if(blockCount == 0) {
          Q.stageScene('game');
        }
      });

    }));
    Q.stageScene('game');
  });


});

